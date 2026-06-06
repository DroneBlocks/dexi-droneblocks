// useTelemetry — module-level singleton state driven by mavlink2rest WebSocket.
//
// Why mavlink2rest instead of rosbridge for telemetry: PX4's micro-XRCE-DDS
// client doesn't always re-handshake cleanly after FC power-cycles, leaving
// `/fmu/out/*` topics with no publisher. mavlink-router + mavlink2rest is the
// more reliable transport — same data, much simpler bridge. ROS topics
// (cameras, AprilTag detections, custom DEXI nodes) continue to come via
// rosbridge through useROS().
//
// Single WebSocket connection shared across all consumers (subscribe count
// tracked; the socket tears down when the last consumer unmounts).

import { ref, computed, onUnmounted, readonly } from 'vue'

export interface Telemetry {
  /** true when we've heard a HEARTBEAT in the last HEARTBEAT_TIMEOUT_MS */
  connected: boolean
  /** ms timestamp of last HEARTBEAT */
  lastHeartbeatMs: number
  /** wall-clock now (so consumers can compute staleness in templates) */
  now: number

  battery: {
    voltage: number | null      // V (cell 0)
    remaining: number | null    // 0-100 %
    current: number | null      // A (BATTERY_STATUS.current_battery is in 0.01A units; -1 = unknown)
  }
  altitude: {
    msl: number | null          // m (from ALTITUDE)
    relative: number | null     // m above home (from VFR_HUD/ALTITUDE)
    terrain: number | null      // m above ground (from ALTITUDE.altitude_terrain)
  }
  speed: {
    ground: number | null       // m/s (VFR_HUD.groundspeed)
    vertical: number | null     // m/s (VFR_HUD.climb)
  }
  heading: number | null        // deg (VFR_HUD.heading, 0-359)
  attitude: {
    roll: number | null         // rad (ATTITUDE)
    pitch: number | null
    yaw: number | null
  }
  mode: {
    base: number | null         // base_mode bitmask (HEARTBEAT)
    custom: number | null       // custom_mode (HEARTBEAT)
    name: string | null         // best-effort decoded PX4 mode label
  }
  armed: boolean
  ekf: {
    flagsRaw: string | null     // "ATTITUDE | VELOCITY_HORIZ | …"
    flowFusing: boolean         // VEL_HORIZ + POS_HORIZ_REL both set
    posHorizAcc: number | null  // m
    posVertAcc: number | null   // m
  }
  range: {
    current: number | null      // m (DISTANCE_SENSOR.current_distance / 100)
    min: number | null
    max: number | null
  }
}

const HEARTBEAT_TIMEOUT_MS = 3000
const RECONNECT_DELAY_MS = 2000

// Slow-rate messages — mavlink2rest's WS streams them at ~0.1 Hz (PX4 rate
// limit), so we'd otherwise wait 10+ seconds for the pills to populate on
// page load. Poll the HTTP cache for these on top of the WS stream.
const SLOW_RATE_MESSAGES = [
  'BATTERY_STATUS',
  'SYS_STATUS',
  'ESTIMATOR_STATUS',
  'DISTANCE_SENSOR',
  'ALTITUDE',
] as const
const SLOW_POLL_INTERVAL_MS = 2000

function newTelemetry(): Telemetry {
  return {
    connected: false,
    lastHeartbeatMs: 0,
    now: Date.now(),
    battery: { voltage: null, remaining: null, current: null },
    altitude: { msl: null, relative: null, terrain: null },
    speed: { ground: null, vertical: null },
    heading: null,
    attitude: { roll: null, pitch: null, yaw: null },
    mode: { base: null, custom: null, name: null },
    armed: false,
    ekf: { flagsRaw: null, flowFusing: false, posHorizAcc: null, posVertAcc: null },
    range: { current: null, min: null, max: null },
  }
}

// ---- Module-level singletons ----
const telemetry = ref<Telemetry>(newTelemetry())
let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let nowTicker: number | null = null
let slowPollTimer: number | null = null
let consumerCount = 0

function getMavlinkBaseUrl(): { ws: string; http: string } {
  if (typeof window === 'undefined') return { ws: '', http: '' }
  const params = new URLSearchParams(window.location.search)
  const host = params.get('mavlinkHost') || window.location.hostname
  const isSecure = window.location.protocol === 'https:'
  const wsProtocol = isSecure ? 'wss:' : 'ws:'
  const httpProtocol = isSecure ? 'https:' : 'http:'
  return {
    ws: `${wsProtocol}//${host}:8088/ws/mavlink`,
    http: `${httpProtocol}//${host}:8088`,
  }
}

// Best-effort PX4 mode name from custom_mode (high byte = main mode).
// PX4 packs: custom_mode = (main_mode << 16) | (sub_mode << 24)
function decodePx4ModeName(custom: number | null): string | null {
  if (custom == null) return null
  const main = (custom >> 16) & 0xff
  const sub = (custom >> 24) & 0xff
  const mainNames: Record<number, string> = {
    1: 'MANUAL', 2: 'ALTCTL', 3: 'POSCTL', 4: 'AUTO',
    5: 'ACRO', 6: 'OFFBOARD', 7: 'STABILIZED', 8: 'RATTITUDE',
  }
  const autoSubNames: Record<number, string> = {
    1: 'READY', 2: 'TAKEOFF', 3: 'LOITER', 4: 'MISSION',
    5: 'RTL', 6: 'LAND', 7: 'RTGS', 8: 'FOLLOW_TARGET', 9: 'PRECLAND', 10: 'VTOL_TAKEOFF',
  }
  if (main === 4) return `AUTO.${autoSubNames[sub] ?? 'UNKNOWN'}`
  return mainNames[main] ?? `UNKNOWN(${main})`
}

function handleMavlinkMessage(envelope: any) {
  const m = envelope?.message
  if (!m?.type) return
  const t: string = m.type
  const T = telemetry.value
  switch (t) {
    case 'HEARTBEAT': {
      T.lastHeartbeatMs = Date.now()
      T.connected = true
      const base = Number(m.base_mode ?? 0)
      T.mode.base = base
      T.armed = (base & 0x80) !== 0  // MAV_MODE_FLAG_SAFETY_ARMED
      T.mode.custom = Number(m.custom_mode ?? 0)
      T.mode.name = decodePx4ModeName(T.mode.custom)
      break
    }
    case 'BATTERY_STATUS': {
      const voltages = Array.isArray(m.voltages) ? m.voltages.filter((v: number) => v !== 65535) : []
      T.battery.voltage = voltages.length > 0 ? voltages[0] / 1000 : T.battery.voltage
      T.battery.remaining = Number.isFinite(m.battery_remaining) && m.battery_remaining >= 0 ? m.battery_remaining : T.battery.remaining
      // current_battery is in cA (centi-Amps); -1 = unknown
      const ca = Number(m.current_battery)
      T.battery.current = Number.isFinite(ca) && ca >= 0 ? ca / 100 : T.battery.current
      break
    }
    case 'SYS_STATUS': {
      // SYS_STATUS provides voltage/current too; only fill if BATTERY_STATUS hasn't yet.
      if (T.battery.voltage == null && Number.isFinite(m.voltage_battery)) {
        T.battery.voltage = m.voltage_battery / 1000
      }
      if (T.battery.current == null && Number.isFinite(m.current_battery) && m.current_battery >= 0) {
        T.battery.current = m.current_battery / 100
      }
      if (T.battery.remaining == null && Number.isFinite(m.battery_remaining) && m.battery_remaining >= 0) {
        T.battery.remaining = m.battery_remaining
      }
      break
    }
    case 'VFR_HUD': {
      T.altitude.relative = Number.isFinite(m.alt) ? m.alt : T.altitude.relative
      T.speed.ground = Number.isFinite(m.groundspeed) ? m.groundspeed : T.speed.ground
      T.speed.vertical = Number.isFinite(m.climb) ? m.climb : T.speed.vertical
      T.heading = Number.isFinite(m.heading) ? m.heading : T.heading
      break
    }
    case 'ATTITUDE': {
      T.attitude.roll = Number.isFinite(m.roll) ? m.roll : T.attitude.roll
      T.attitude.pitch = Number.isFinite(m.pitch) ? m.pitch : T.attitude.pitch
      T.attitude.yaw = Number.isFinite(m.yaw) ? m.yaw : T.attitude.yaw
      break
    }
    case 'ESTIMATOR_STATUS': {
      const flags = typeof m.flags === 'string' ? m.flags : null
      T.ekf.flagsRaw = flags
      T.ekf.flowFusing = !!flags && flags.includes('VELOCITY_HORIZ') && flags.includes('POS_HORIZ_REL')
      T.ekf.posHorizAcc = Number.isFinite(m.pos_horiz_accuracy) ? m.pos_horiz_accuracy : T.ekf.posHorizAcc
      T.ekf.posVertAcc = Number.isFinite(m.pos_vert_accuracy) ? m.pos_vert_accuracy : T.ekf.posVertAcc
      break
    }
    case 'DISTANCE_SENSOR': {
      // current_distance is cm (per MAVLink spec)
      T.range.current = Number.isFinite(m.current_distance) ? m.current_distance / 100 : T.range.current
      T.range.min = Number.isFinite(m.min_distance) ? m.min_distance / 100 : T.range.min
      T.range.max = Number.isFinite(m.max_distance) ? m.max_distance / 100 : T.range.max
      break
    }
    case 'ALTITUDE': {
      T.altitude.msl = Number.isFinite(m.altitude_amsl) ? m.altitude_amsl : T.altitude.msl
      T.altitude.relative = Number.isFinite(m.altitude_relative) ? m.altitude_relative : T.altitude.relative
      T.altitude.terrain = Number.isFinite(m.altitude_terrain) ? m.altitude_terrain : T.altitude.terrain
      break
    }
  }
}

async function pollSlowRateMessages() {
  const { http } = getMavlinkBaseUrl()
  if (!http) return
  await Promise.all(
    SLOW_RATE_MESSAGES.map(async (msgType) => {
      try {
        const res = await fetch(`${http}/mavlink/vehicles/1/components/1/messages/${msgType}`, {
          signal: AbortSignal.timeout(1500),
        })
        if (!res.ok) return
        const envelope = await res.json()
        if (envelope?.message) handleMavlinkMessage(envelope)
      } catch {
        // ignore — slow-rate; we'll try again on next tick
      }
    })
  )
}

function startSlowPoll() {
  if (slowPollTimer) return
  // Fire immediately so cards populate on first load, then keep ticking.
  pollSlowRateMessages()
  slowPollTimer = window.setInterval(pollSlowRateMessages, SLOW_POLL_INTERVAL_MS)
}

function ensureConnection() {
  if (typeof window === 'undefined') return
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return
  const { ws: url } = getMavlinkBaseUrl()
  if (!url) return
  try {
    ws = new WebSocket(url)
  } catch {
    scheduleReconnect()
    return
  }
  ws.onopen = () => {
    // nothing extra; mavlink2rest streams all messages by default
  }
  ws.onmessage = (ev) => {
    try {
      handleMavlinkMessage(JSON.parse(ev.data))
    } catch {
      // ignore malformed frames
    }
  }
  ws.onclose = () => {
    ws = null
    telemetry.value.connected = false
    scheduleReconnect()
  }
  ws.onerror = () => {
    // onclose will follow; let it handle reconnect
  }
}

function scheduleReconnect() {
  if (consumerCount <= 0) return
  if (reconnectTimer) return
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    ensureConnection()
  }, RECONNECT_DELAY_MS)
}

function startNowTicker() {
  if (nowTicker) return
  nowTicker = window.setInterval(() => {
    telemetry.value.now = Date.now()
    // Drop connection flag if heartbeat has been silent too long
    if (telemetry.value.lastHeartbeatMs > 0 && Date.now() - telemetry.value.lastHeartbeatMs > HEARTBEAT_TIMEOUT_MS) {
      telemetry.value.connected = false
    }
  }, 500)
}

function stopAll() {
  if (ws) { try { ws.close() } catch {} ws = null }
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  if (nowTicker) { clearInterval(nowTicker); nowTicker = null }
  if (slowPollTimer) { clearInterval(slowPollTimer); slowPollTimer = null }
}

/**
 * useTelemetry — call from any component. Shares one WebSocket across all
 * callers. Tears down when the last caller unmounts.
 */
export function useTelemetry() {
  consumerCount++
  ensureConnection()
  startNowTicker()
  startSlowPoll()

  onUnmounted(() => {
    consumerCount--
    if (consumerCount <= 0) {
      stopAll()
    }
  })

  // Derived helpers (cheap)
  const cells = computed(() => {
    // PX4 doesn't expose cell count over MAVLink directly; conservative default = 3 (DEXI-3 ships 3S).
    // Consumers wanting more accuracy can read BAT1_N_CELLS via /api/params later.
    return 3
  })
  const perCellVoltage = computed(() => {
    const v = telemetry.value.battery.voltage
    return v != null ? v / cells.value : null
  })
  const ageMs = computed(() => {
    const last = telemetry.value.lastHeartbeatMs
    return last > 0 ? telemetry.value.now - last : Infinity
  })

  return {
    telemetry: readonly(telemetry),
    perCellVoltage,
    ageMs,
  }
}
