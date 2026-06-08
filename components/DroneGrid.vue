<template>
  <div class="relative w-full h-full bg-gray-800 p-4 flex-1 flex gap-3">
    <!-- Map (square area) -->
    <div class="relative flex-1 min-w-0">
      <!-- Telemetry widget (top-right) -->
      <div class="absolute top-2 right-2 bg-gray-900/80 text-white px-3 py-2 rounded-lg shadow-lg z-10">
        <div class="text-sm font-mono space-y-1">
          <div class="flex justify-between gap-3"><span class="text-gray-400">X:</span><span>{{ fmt(dronePosition.x) }}m</span></div>
          <div class="flex justify-between gap-3"><span class="text-gray-400">Y:</span><span>{{ fmt(dronePosition.y) }}m</span></div>
          <div class="flex justify-between gap-3"><span class="text-gray-400">Z:</span><span>{{ fmt(dronePosition.z) }}m</span></div>
          <div class="flex justify-between gap-3"><span class="text-gray-400">Hdg:</span><span>{{ fmt(droneOrientation, 0) }}°</span></div>
        </div>
        <button
          class="mt-2 text-xs text-blue-300 hover:text-blue-200 hover:underline"
          @click.stop="clearTrail"
          title="Clear breadcrumb trail"
        >
          Clear trail
        </button>
      </div>

      <!-- Grid container — kept square via aspect-ratio -->
      <div ref="gridEl" class="grid-square relative border border-gray-600 mx-auto" @click="handleGridClick">
        <!-- Grid lines -->
        <div class="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none">
          <div v-for="i in 100" :key="i" class="border border-gray-700/60"></div>
        </div>

        <!-- Center crosshair -->
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute left-1/2 top-0 bottom-0 border-l border-gray-500/70" />
          <div class="absolute top-1/2 left-0 right-0 border-t border-gray-500/70" />
          <div class="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 border border-amber-400 rounded-full" />
        </div>

        <!-- Breadcrumb trail (SVG overlay) -->
        <svg
          v-if="trailPoints.length > 1"
          class="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            :points="trailSvg"
            fill="none"
            stroke="rgb(34 197 94)"
            stroke-width="0.35"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.85"
          />
        </svg>

        <!-- Drone marker (heading arrow) -->
        <div
          class="absolute pointer-events-none"
          :style="{
            left: `${markerLeftPct}%`,
            top: `${markerTopPct}%`,
            transform: `translate(-50%, -50%) rotate(${droneOrientation}deg)`,
          }"
        >
          <svg viewBox="-12 -12 24 24" class="w-6 h-6 drop-shadow">
            <!-- Heading triangle: tip points "up" in marker frame; CSS rotates by yaw -->
            <polygon
              points="0,-9 6,7 0,4 -6,7"
              fill="rgb(239 68 68)"
              stroke="white"
              stroke-width="1.2"
              stroke-linejoin="round"
            />
            <!-- Inner circle for visibility -->
            <circle cx="0" cy="0" r="1.4" fill="white" />
          </svg>
        </div>

        <!-- Scale labels (X axis bottom, Y axis left) -->
        <div class="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[10px] text-gray-400 pointer-events-none">
          <span>-5m</span><span>0</span><span>5m</span>
        </div>
        <div class="absolute top-0 bottom-0 left-0 flex flex-col justify-between py-1 text-[10px] text-gray-400 pointer-events-none">
          <span>5m</span><span>0</span><span>-5m</span>
        </div>
      </div>
    </div>

    <!-- Altitude tape (right side) -->
    <div class="alt-tape relative w-14 flex-shrink-0 bg-gray-900/60 rounded-lg border border-gray-700 overflow-hidden">
      <div class="absolute inset-0 flex flex-col-reverse">
        <div
          v-for="t in altTicks"
          :key="t.m"
          class="alt-tick"
          :style="{ bottom: `${altPct(t.m)}%` }"
        >
          <span class="alt-tick-label">{{ t.m }}m</span>
        </div>
      </div>

      <!-- Altitude marker -->
      <div
        class="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
        :style="{ bottom: `${altPct(dronePosition.z)}%` }"
      >
        <span class="absolute -top-3 right-1 text-[10px] font-mono text-emerald-300">{{ fmt(dronePosition.z, 1) }}m</span>
      </div>

      <div class="absolute top-1 left-1 text-[9px] uppercase tracking-wider text-gray-400">Alt</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'

interface OdometryMessage {
  position: [number, number, number]
  q: [number, number, number, number]
}

const { getROSURL } = useROS()
const ros = new ROSLIB.Ros({ url: getROSURL() })

// Drone state
const dronePosition = ref({ x: 0, y: 0, z: 0 })
const droneOrientation = ref(0)

// Breadcrumb trail — last N positions in grid frame (x, y in meters).
// Sampled at 5 Hz to keep the SVG cheap on long flights.
const TRAIL_MAX = 200
const TRAIL_SAMPLE_INTERVAL_MS = 200
const trailPoints = ref<{ x: number; y: number }[]>([])
let lastTrailTs = 0

// Altitude tape config — tape spans 0 → ALT_MAX m
const ALT_MAX = 5
const altTicks = [{ m: 0 }, { m: 1 }, { m: 2 }, { m: 3 }, { m: 4 }, { m: 5 }]
const altPct = (alt: number) => Math.max(0, Math.min(100, (alt / ALT_MAX) * 100))

// Marker position in pct of grid box (grid covers -5..+5 m in both axes)
// dronePosition.y here is "northing" (already inverted on receive); dronePosition.x is "easting".
const markerLeftPct = computed(() => {
  const x = Math.max(-5, Math.min(5, dronePosition.value.x))
  return ((x + 5) / 10) * 100
})
const markerTopPct = computed(() => {
  const y = Math.max(-5, Math.min(5, dronePosition.value.y))
  // y positive → north → towards top, so subtract from 100
  return 100 - ((y + 5) / 10) * 100
})

// SVG points string for the breadcrumb trail in viewBox(0..100, 0..100).
const trailSvg = computed(() => trailPoints.value.map((p) => {
  const lx = ((Math.max(-5, Math.min(5, p.x)) + 5) / 10) * 100
  const ly = 100 - ((Math.max(-5, Math.min(5, p.y)) + 5) / 10) * 100
  return `${lx.toFixed(2)},${ly.toFixed(2)}`
}).join(' '))

const fmt = (v: number | undefined, d = 2): string => {
  if (v === undefined || !Number.isFinite(v)) return '0.00'
  return v.toFixed(d)
}
const clearTrail = () => { trailPoints.value = [] }

// ROS plumbing
let odometryTopic: ROSLIB.Topic | null = null

defineProps({
  flightControlsRef: { required: true },
})

onMounted(() => {
  odometryTopic = new ROSLIB.Topic({
    ros,
    name: '/fmu/out/vehicle_odometry',
    messageType: 'px4_msgs/msg/VehicleOdometry',
    throttle_rate: 50,
    queue_length: 1,
  })

  odometryTopic.subscribe((message: OdometryMessage) => {
    if (!message || !Array.isArray(message.position) || message.position.length !== 3) return
    const x = message.position[0]
    const yRaw = message.position[1]
    const z = -message.position[2]
    dronePosition.value = {
      x,                // East
      y: -yRaw,         // North (inverted for grid orientation)
      z,                // Up (positive)
    }
    if (Array.isArray(message.q) && message.q.length === 4) {
      const q = message.q
      droneOrientation.value =
        Math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * (180 / Math.PI)
    }

    // Push to trail at most every TRAIL_SAMPLE_INTERVAL_MS, skip duplicate-on-stand-still
    const now = Date.now()
    if (now - lastTrailTs >= TRAIL_SAMPLE_INTERVAL_MS) {
      const last = trailPoints.value[trailPoints.value.length - 1]
      const sameSpot = last && Math.abs(last.x - x) < 0.02 && Math.abs(last.y - (-yRaw)) < 0.02
      if (!sameSpot) {
        trailPoints.value.push({ x, y: -yRaw })
        if (trailPoints.value.length > TRAIL_MAX) trailPoints.value.shift()
      }
      lastTrailTs = now
    }
  })
})

onBeforeUnmount(() => {
  if (odometryTopic) odometryTopic.unsubscribe()
  try { ros.close() } catch {}
})

const gridEl = ref<HTMLElement | null>(null)

const handleGridClick = (event: MouseEvent) => {
  if (!gridEl.value) return
  const rect = gridEl.value.getBoundingClientRect()
  const relativeX = (event.clientX - rect.left) / rect.width
  const relativeY = (rect.bottom - event.clientY) / rect.height
  const gridX = (relativeX * 10) - 5
  const gridY = (relativeY * 10) - 5
  console.log(`Map clicked at: x=${gridX.toFixed(2)}m, y=${gridY.toFixed(2)}m (commands disabled)`)
}
</script>

<style scoped>
.grid-square {
  aspect-ratio: 1 / 1;
  width: min(100%, calc(100vh - 9rem));
  max-height: 100%;
}

.alt-tape {
  min-height: 200px;
  height: min(100%, calc(100vh - 9rem));
}
.alt-tick {
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  border-top: 1px dashed rgba(148, 163, 184, 0.35);
}
.alt-tick-label {
  position: absolute;
  right: 4px;
  top: -7px;
  font-size: 9px;
  color: rgb(148 163 184);
  font-family: ui-monospace, monospace;
}

.drop-shadow { filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5)); }
</style>
