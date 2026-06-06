<script setup lang="ts">
// ReadinessStrip — slim, always-visible top bar that shows live FC + flight
// readiness at a glance. Sources telemetry from mavlink2rest (via
// useTelemetry()). Hidden on the index/landing page; visible on every other
// route so users always know vehicle state.
//
// Pills (left → right):
//   FC          connection + age
//   Mode        flight mode + armed/disarmed
//   Battery     % + V/cell
//   EKF         fusion state (flow + range fusing?)
//   Range       laser range (m)
//   Alt         relative altitude (m)
//   Speed       ground + climb (m/s)
//   Heading     deg
//
// Each pill: color-coded green/amber/red/gray depending on its own health.

import { computed } from 'vue'
import { useTelemetry } from '~/composables/useTelemetry'
import { useRoute } from 'vue-router'

const route = useRoute()
const { telemetry, perCellVoltage, ageMs } = useTelemetry()

// Hide on the landing page so it doesn't get in the way of the home grid.
const visible = computed(() => route.path !== '/' && route.path !== '/index')

const fmt = (n: number | null, d = 1) => (n == null || !Number.isFinite(n) ? '—' : n.toFixed(d))

// ---- Pill state derivations ----
type PillState = 'green' | 'amber' | 'red' | 'gray'

const fc = computed<{ state: PillState; label: string }>(() => {
  const t = telemetry.value
  if (!t.connected) return { state: 'red', label: t.lastHeartbeatMs === 0 ? 'no link' : `lost ${(ageMs.value / 1000).toFixed(0)}s` }
  return { state: 'green', label: 'live' }
})

const mode = computed<{ state: PillState; label: string }>(() => {
  const t = telemetry.value
  if (!t.connected) return { state: 'gray', label: '—' }
  return { state: 'green', label: t.mode.name ?? '—' }
})

const armed = computed<{ state: PillState; label: string }>(() => {
  const t = telemetry.value
  if (!t.connected) return { state: 'gray', label: '—' }
  return t.armed ? { state: 'red', label: 'ARMED' } : { state: 'green', label: 'disarmed' }
})

const battery = computed<{ state: PillState; label: string }>(() => {
  const t = telemetry.value
  if (!t.connected || t.battery.voltage == null) return { state: 'gray', label: '—' }
  const pct = t.battery.remaining
  const v = t.battery.voltage
  const cell = perCellVoltage.value
  // Color by per-cell voltage primarily — remaining% sometimes lags
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
</script>

<template>
  <div v-if="visible" class="readiness-strip">
    <div class="rs-inner">
      <Pill label="FC" :state="fc.state" :value="fc.label" />
      <Pill label="Mode" :state="mode.state" :value="mode.label" />
      <Pill :state="armed.state" :value="armed.label" />
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
  background: rgb(15 23 42); /* slate-900 */
  border-bottom: 1px solid rgb(30 41 59); /* slate-800 */
  color: rgb(241 245 249); /* slate-100 */
  padding: 0.4rem 1rem;
  position: sticky;
  top: 0;
  z-index: 30;
  font-size: 0.8rem;
}
.rs-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
