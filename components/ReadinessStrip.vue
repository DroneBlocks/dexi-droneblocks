<script setup lang="ts">
// ReadinessStrip — slim, always-visible top bar showing FC + flight readiness.
// Two of its pills are now interactive control surfaces:
//   - Mode pill → opens a flight-mode dropdown (sends MAV_CMD_DO_SET_MODE)
//   - Arm pill → 3s confirm flow (sends MAV_CMD_COMPONENT_ARM_DISARM)
// Other pills remain read-only telemetry.

import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useTelemetry } from '~/composables/useTelemetry'
import { useMavlinkCommand } from '~/composables/useMavlinkCommand'
import { useStatusLog } from '~/composables/useStatusLog'
import { useRoute } from 'vue-router'

const route = useRoute()
const { telemetry, perCellVoltage, ageMs } = useTelemetry()
const { arm, disarm, setMode } = useMavlinkCommand()
const { totalCount: msgTotal, unseenCount: msgUnseen, latest: msgLatest, toggleLog } = useStatusLog()

const visible = computed(() => route.path !== '/' && route.path !== '/index')
const fmt = (n: number | null, d = 1) => (n == null || !Number.isFinite(n) ? '—' : n.toFixed(d))
const connectionAge = computed(() => (ageMs.value / 1000).toFixed(0))

type PillState = 'green' | 'amber' | 'red' | 'gray'

// ---- Flight modes ---------------------------------------------------------
// (main, sub) tuples for MAV_CMD_DO_SET_MODE. main=4 is AUTO with sub-modes.
interface FlightMode { label: string; main: number; sub: number; hint?: string }
const FLIGHT_MODES: FlightMode[] = [
  { label: 'Manual',     main: 1, sub: 0 },
  { label: 'Altitude',   main: 2, sub: 0 },
  { label: 'Position',   main: 3, sub: 0, hint: 'POSCTL' },
  { label: 'Stabilized', main: 7, sub: 0 },
  { label: 'Hold',       main: 4, sub: 3, hint: 'LOITER' },
  { label: 'Takeoff',    main: 4, sub: 2 },
  { label: 'Land',       main: 4, sub: 6 },
  { label: 'Return',     main: 4, sub: 5, hint: 'RTL' },
  { label: 'Mission',    main: 4, sub: 4 },
  { label: 'Offboard',   main: 6, sub: 0 },
]

const currentModeTuple = computed<{ main: number | null; sub: number | null }>(() => {
  const custom = telemetry.value.mode.custom
  if (custom == null) return { main: null, sub: null }
  return { main: (custom >> 16) & 0xff, sub: (custom >> 24) & 0xff }
})
const isCurrentMode = (m: FlightMode) => {
  const { main, sub } = currentModeTuple.value
  return main === m.main && sub === m.sub
}

// ---- Pill state derivations ----------------------------------------------
// MODE pill carries connection state too — when the FC link is down it shows
// "FC OFFLINE" / "FC LOST 12s" in red. That makes the standalone "FC live"
// pill redundant, so the strip drops it.
const mode = computed<{ state: PillState; label: string }>(() => {
  const t = telemetry.value
  if (!t.connected) {
    return {
      state: 'red',
      label: t.lastHeartbeatMs === 0 ? 'FC OFFLINE' : `FC LOST ${connectionAge.value}s`,
    }
  }
  const { main, sub } = currentModeTuple.value
  const m = FLIGHT_MODES.find((x) => x.main === main && x.sub === sub)
  return { state: 'green', label: m?.label.toUpperCase() ?? (t.mode.name ?? '—') }
})

const armPill = computed<{ state: PillState; label: string }>(() => {
  const t = telemetry.value
  if (!t.connected) return { state: 'gray', label: '—' }
  if (armPhase.value === 'confirming') return { state: 'amber', label: `confirm (${armCountdown.value}s)` }
  return t.armed ? { state: 'red', label: 'ARMED' } : { state: 'green', label: 'disarmed' }
})

const battery = computed<{ state: PillState; label: string }>(() => {
  const t = telemetry.value
  if (!t.connected || t.battery.voltage == null) return { state: 'gray', label: '—' }
  const pct = t.battery.remaining
  const v = t.battery.voltage
  const cell = perCellVoltage.value
  let state: PillState = 'green'
  if (cell != null && cell < 3.3) state = 'amber'
  if (cell != null && cell < 3.1) state = 'red'
  const pctLabel = pct != null ? `${Math.round(pct)}%` : ''
  const vLabel = `${v.toFixed(2)}V`
  return { state, label: pctLabel ? `${pctLabel} · ${vLabel}` : vLabel }
})

const ekf = computed<{ state: PillState; label: string }>(() => {
  const t = telemetry.value
  if (!t.connected || !t.ekf.flagsRaw) return { state: 'gray', label: '—' }
  if (t.ekf.flowFusing) return { state: 'green', label: 'fusing' }
  const acc = t.ekf.posHorizAcc
  if (acc != null && acc < 5) return { state: 'amber', label: 'const pos' }
  return { state: 'red', label: 'no aiding' }
})

const range = computed<{ state: PillState; label: string }>(() => {
  const t = telemetry.value
  if (!t.connected || t.range.current == null) return { state: 'gray', label: '—' }
  return { state: 'green', label: `${fmt(t.range.current, 2)}m` }
})

const altitude = computed<{ state: PillState; label: string }>(() => {
  const t = telemetry.value
  if (!t.connected || t.altitude.relative == null) return { state: 'gray', label: '—' }
  return { state: 'green', label: `${fmt(t.altitude.relative, 1)}m` }
})

const speed = computed<{ state: PillState; label: string }>(() => {
  const t = telemetry.value
  if (!t.connected || t.speed.ground == null) return { state: 'gray', label: '—' }
  return { state: 'green', label: `${fmt(t.speed.ground, 1)}m/s` }
})

const heading = computed<{ state: PillState; label: string }>(() => {
  const t = telemetry.value
  if (!t.connected || t.heading == null) return { state: 'gray', label: '—' }
  return { state: 'green', label: `${Math.round(t.heading)}°` }
})

// Messages pill — severity of latest message drives the color, unseen count
// drives the value. Click toggles the log panel.
const msgPill = computed<{ state: PillState; label: string }>(() => {
  if (msgTotal.value === 0) return { state: 'gray', label: '0' }
  const sev = msgLatest.value?.severity ?? 6
  let state: PillState = 'gray'
  if (sev <= 3) state = 'red'
  else if (sev === 4) state = 'amber'
  else if (sev === 5) state = 'green'
  else state = 'gray'
  const label = msgUnseen.value > 0 ? `${msgUnseen.value} new` : String(msgTotal.value)
  return { state, label }
})

// ---- Mode dropdown --------------------------------------------------------
const modeMenuOpen = ref(false)
const modeMenuEl = ref<HTMLElement | null>(null)
const toggleModeMenu = () => {
  modeMenuOpen.value = !modeMenuOpen.value
  if (modeMenuOpen.value) cancelArmConfirm()
}
const selectMode = async (m: FlightMode) => {
  modeMenuOpen.value = false
  await setMode(m.main, m.sub)
  console.log(`setMode → ${m.label} (main=${m.main} sub=${m.sub})`)
}

// ---- Two-step Arm ---------------------------------------------------------
const ARM_CONFIRM_MS = 3000
const armPhase = ref<'idle' | 'confirming'>('idle')
const armCountdown = ref(0)
let armConfirmTimer: ReturnType<typeof setTimeout> | null = null
let armCountdownTimer: ReturnType<typeof setInterval> | null = null

const cancelArmConfirm = () => {
  if (armConfirmTimer) { clearTimeout(armConfirmTimer); armConfirmTimer = null }
  if (armCountdownTimer) { clearInterval(armCountdownTimer); armCountdownTimer = null }
  armPhase.value = 'idle'
  armCountdown.value = 0
}

const onArmPillClick = async () => {
  // Disarming is the safer action — single click commits.
  if (telemetry.value.armed) {
    cancelArmConfirm()
    await disarm()
    console.log('arm → DISARM')
    return
  }
  // Arming → two-step confirmation
  if (armPhase.value === 'confirming') {
    cancelArmConfirm()
    await arm()
    console.log('arm → ARM (confirmed)')
    return
  }
  armPhase.value = 'confirming'
  armCountdown.value = Math.ceil(ARM_CONFIRM_MS / 1000)
  armCountdownTimer = setInterval(() => {
    armCountdown.value = Math.max(0, armCountdown.value - 1)
  }, 1000)
  armConfirmTimer = setTimeout(cancelArmConfirm, ARM_CONFIRM_MS)
}

// ---- Close menu / arm-confirm on outside click ----------------------------
const onDocClick = (e: MouseEvent) => {
  if (modeMenuOpen.value && modeMenuEl.value && !modeMenuEl.value.contains(e.target as Node)) {
    modeMenuOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  cancelArmConfirm()
})
</script>

<template>
  <div v-if="visible" class="readiness-strip">
    <div class="rs-inner">
      <!-- Messages pill (left of MODE) -->
      <Pill
        label="MSG"
        :state="msgPill.state"
        :value="msgPill.label"
        clickable
        @click="toggleLog"
      />

      <!-- Mode pill + dropdown (also reflects FC link state when offline) -->
      <div ref="modeMenuEl" class="rs-anchor">
        <Pill
          label="Mode"
          :state="mode.state"
          :value="mode.label"
          clickable
          :active="modeMenuOpen"
          @click="toggleModeMenu"
        />
        <div v-if="modeMenuOpen" class="rs-popover">
          <button
            v-for="m in FLIGHT_MODES"
            :key="m.label"
            class="rs-popover-item"
            :class="{ 'rs-popover-item-current': isCurrentMode(m) }"
            @click="selectMode(m)"
          >
            <span>{{ m.label }}</span>
            <span v-if="m.hint" class="rs-popover-hint">{{ m.hint }}</span>
          </button>
        </div>
      </div>

      <!-- Arm pill with two-step confirm -->
      <Pill
        :state="armPill.state"
        :value="armPill.label"
        clickable
        :active="armPhase === 'confirming'"
        @click="onArmPillClick"
      />

      <Pill label="Battery" :state="battery.state" :value="battery.label" />
      <Pill label="EKF" :state="ekf.state" :value="ekf.label" />
      <Pill label="Range" :state="range.state" :value="range.label" />
      <Pill label="Alt" :state="altitude.state" :value="altitude.label" />
      <Pill label="Spd" :state="speed.state" :value="speed.label" />
      <Pill label="Hdg" :state="heading.state" :value="heading.label" />
    </div>
  </div>
</template>

<style scoped>
.readiness-strip {
  background: rgb(15 23 42);
  border-bottom: 1px solid rgb(30 41 59);
  color: rgb(241 245 249);
  padding: 0.6rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 30;
  font-size: 0.8rem;
}
.rs-inner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  max-width: 1600px;
  margin: 0 auto;
}
.rs-anchor {
  position: relative;
  display: inline-flex;
}
.rs-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 180px;
  background: rgb(30 41 59);
  border: 1px solid rgb(51 65 85);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  padding: 0.25rem;
  z-index: 50;
  display: flex;
  flex-direction: column;
}
.rs-popover-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.4rem 0.65rem;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: rgb(241 245 249);
  font-family: ui-monospace, monospace;
  font-size: 0.78rem;
  cursor: pointer;
  text-align: left;
}
.rs-popover-item:hover { background: rgb(51 65 85); }
.rs-popover-item-current { background: rgba(59, 130, 246, 0.25); }
.rs-popover-hint {
  color: rgb(148 163 184);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
