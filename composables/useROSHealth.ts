// useROSHealth — module-level singleton that probes the ROS 2 graph via
// rosbridge to diagnose uXRCE-DDS health *independent of mavlink2rest*.
//
// What it tells you:
//   - Whether rosbridge itself is reachable (proves the Pi's ROS stack is up)
//   - Count of advertised topics (proves DDS discovery is happening at all)
//   - Count of /fmu/* topics (proves the micro_ros_agent registered the PX4
//     types)
//   - Whether key PX4 topics actually have data flowing (proves the FC's
//     uXRCE-DDS client is publishing, not just advertised)
//
// The failure modes this lets users diagnose:
//   - rosbridge down → connected=false → "ROS stack offline"
//   - rosbridge up, no /fmu topics → agent not running → "µROS agent missing"
//   - /fmu topics advertised, no probes flowing → handshake incomplete →
//     "FC not publishing — try systemctl restart dexi"
//   - Everything flowing → green

import { ref, onUnmounted, readonly } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from './useROS'

export interface TopicProbe {
  name: string
  /** Hz observed during the last probe window; null = probe pending */
  rate: number | null
  /** observed messages > 0 within the window */
  alive: boolean
}

export interface ROSHealth {
  connected: boolean
  lastErrorAt: number | null
  /** total advertised topics (rosbridge rosapi/topics) */
  totalTopics: number | null
  /** /fmu/* topics (uXRCE-DDS registered) */
  fmuTopics: number | null
  /** /dexi/* topics (custom DEXI nodes) */
  dexiTopics: number | null
  /** rate of the per-topic probes */
  probes: TopicProbe[]
  /** wall-clock for staleness */
  now: number
}

// PX4 topics we probe to determine if data is actually flowing (not just
// advertised). Choose high-rate topics so a 2 s window is enough signal.
const PROBE_TOPICS = [
  '/fmu/out/vehicle_attitude',
  '/fmu/out/battery_status_v1',
  '/fmu/out/vehicle_local_position_v1',
  '/fmu/out/estimator_status_flags',
] as const

const PROBE_WINDOW_MS = 2000
const REFRESH_INTERVAL_MS = 5000

// ---- Module-level singletons ----
const health = ref<ROSHealth>({
  connected: false,
  lastErrorAt: null,
  totalTopics: null,
  fmuTopics: null,
  dexiTopics: null,
  probes: PROBE_TOPICS.map((name) => ({ name, rate: null, alive: false })),
  now: Date.now(),
})

let ros: ROSLIB.Ros | null = null
let consumerCount = 0
let refreshTimer: number | null = null
let nowTicker: number | null = null
let activeProbeSubs: ROSLIB.Topic[] = []

function setupConnection() {
  if (ros) return
  const { getROSURL } = useROS()
  try {
    ros = new ROSLIB.Ros({ url: getROSURL() })
  } catch {
    return
  }
  ros.on('connection', () => {
    health.value.connected = true
  })
  ros.on('error', () => {
    health.value.lastErrorAt = Date.now()
    // close handler will reset connected
  })
  ros.on('close', () => {
    health.value.connected = false
  })
}

function refreshTopicList() {
  if (!ros) return
  ros.getTopics(
    (result: any) => {
      const topics: string[] = Array.isArray(result?.topics) ? result.topics : []
      health.value.totalTopics = topics.length
      health.value.fmuTopics = topics.filter((t) => t.startsWith('/fmu/')).length
      health.value.dexiTopics = topics.filter((t) => t.startsWith('/dexi/')).length
    },
    () => {
      health.value.lastErrorAt = Date.now()
    }
  )
}

async function getTopicType(topic: string): Promise<string | null> {
  if (!ros) return null
  return new Promise((resolve) => {
    ros!.getTopicType(
      topic,
      (type: string) => resolve(type || null),
      () => resolve(null)
    )
  })
}

async function runProbes() {
  if (!ros || !health.value.connected) return
  // Tear down any prior subs
  activeProbeSubs.forEach((t) => {
    try { t.unsubscribe() } catch {}
  })
  activeProbeSubs = []

  // Resolve types in parallel; subscribe only to ones we can type
  const counts: Record<string, number> = {}
  const subs: ROSLIB.Topic[] = []
  await Promise.all(
    PROBE_TOPICS.map(async (name) => {
      const type = await getTopicType(name)
      if (!type) return
      const t = new ROSLIB.Topic({ ros: ros!, name, messageType: type, throttle_rate: 0 })
      counts[name] = 0
      t.subscribe(() => {
        counts[name] = (counts[name] ?? 0) + 1
      })
      subs.push(t)
    })
  )
  activeProbeSubs = subs

  const start = Date.now()
  setTimeout(() => {
    const elapsedSec = (Date.now() - start) / 1000
    health.value.probes = PROBE_TOPICS.map((name) => {
      const c = counts[name] ?? 0
      return {
        name,
        rate: counts[name] == null ? null : c / elapsedSec, // null if we couldn't type it
        alive: c > 0,
      }
    })
    // Cleanup
    subs.forEach((t) => {
      try { t.unsubscribe() } catch {}
    })
    activeProbeSubs = []
  }, PROBE_WINDOW_MS)
}

function startTicking() {
  if (refreshTimer) return
  // First pass immediately so the card populates fast
  refreshTopicList()
  runProbes()
  refreshTimer = window.setInterval(() => {
    refreshTopicList()
    runProbes()
  }, REFRESH_INTERVAL_MS)
}

function startNowTicker() {
  if (nowTicker) return
  nowTicker = window.setInterval(() => {
    health.value.now = Date.now()
  }, 500)
}

function stopAll() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
  if (nowTicker) { clearInterval(nowTicker); nowTicker = null }
  activeProbeSubs.forEach((t) => { try { t.unsubscribe() } catch {} })
  activeProbeSubs = []
  if (ros) { try { ros.close() } catch {} ros = null }
}

export function useROSHealth() {
  if (typeof window === 'undefined') return { health: readonly(health) }
  consumerCount++
  setupConnection()
  startTicking()
  startNowTicker()
  onUnmounted(() => {
    consumerCount--
    if (consumerCount <= 0) stopAll()
  })
  return { health: readonly(health) }
}
