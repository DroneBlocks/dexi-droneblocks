<template>
  <div class="apriltag-visualizer">
    <!-- Stability Indicator -->
    <div class="stability-section">
      <div
        class="stability-indicator"
        :class="stabilityClass"
      >
        {{ stabilityText }}
      </div>
      <div class="stability-description">{{ stabilityDescription }}</div>
      <div
        class="ready-banner"
        :class="readyBannerClass"
      >
        {{ readyBannerText }}
      </div>
    </div>

    <!-- Position Display -->
    <div class="data-section">
      <h3 class="section-title">Odometry Position (NED)</h3>
      <div class="data-grid">
        <div class="data-item">
          <span class="data-label">North (X)</span>
          <span class="data-value north">{{ posX }}</span>
          <span class="data-unit">m</span>
        </div>
        <div class="data-item">
          <span class="data-label">East (Y)</span>
          <span class="data-value east">{{ posY }}</span>
          <span class="data-unit">m</span>
        </div>
        <div class="data-item">
          <span class="data-label">Down (Z)</span>
          <span class="data-value down">{{ posZ }}</span>
          <span class="data-unit">m</span>
        </div>
      </div>
    </div>

    <!-- TF Transform Display -->
    <div class="data-section">
      <h3 class="section-title">TF Transform (camera frame)</h3>
      <div class="data-grid">
        <div class="data-item">
          <span class="data-label">TF X (right)</span>
          <span class="data-value tf-x">{{ tfX }}</span>
          <span class="data-unit">m</span>
        </div>
        <div class="data-item">
          <span class="data-label">TF Y (down)</span>
          <span class="data-value tf-y">{{ tfY }}</span>
          <span class="data-unit">m</span>
        </div>
        <div class="data-item">
          <span class="data-label">TF Z (depth)</span>
          <span class="data-value tf-z">{{ tfZ }}</span>
          <span class="data-unit">m</span>
        </div>
      </div>
    </div>

    <!-- Detection Quality -->
    <div class="data-section">
      <h3 class="section-title">Detection Quality</h3>
      <div class="quality-grid">
        <div class="quality-item">
          <span class="quality-label">Tag ID</span>
          <span class="quality-value">{{ tagId }}</span>
        </div>
        <div class="quality-item">
          <span class="quality-label">Family</span>
          <span class="quality-value">{{ tagFamily }}</span>
        </div>
        <div class="quality-item">
          <span class="quality-label">Decision Margin</span>
          <span class="quality-value" :class="marginClass">{{ decisionMargin }}</span>
        </div>
        <div class="quality-item">
          <span class="quality-label">Hamming</span>
          <span class="quality-value" :class="hammingClass">{{ hamming }}</span>
        </div>
        <div class="quality-item">
          <span class="quality-label">Detection Rate</span>
          <span class="quality-value" :class="rateClass">{{ detectionRate }}</span>
        </div>
        <div class="quality-item">
          <span class="quality-label">Position Variance</span>
          <span class="quality-value">{{ positionVariance }}</span>
        </div>
      </div>
      <div class="quality-bar">
        <div class="quality-fill" :style="{ width: qualityPercent + '%' }"></div>
      </div>
    </div>

    <!-- Position History Canvas -->
    <div class="data-section">
      <h3 class="section-title">Position History (10s)</h3>
      <canvas ref="historyCanvas" class="history-canvas"></canvas>
      <div class="legend">
        <span class="legend-item north">X (North)</span>
        <span class="legend-item east">Y (East)</span>
        <span class="legend-item down">Z (Down)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import ROSLIB from 'roslib'

const props = defineProps<{
  ros: ROSLIB.Ros | null
}>()

// Configuration
const TARGET_TAG_ID = 0
const TAG_FAMILY = '36h11'
const STABILITY_WINDOW_MS = 2000
const STABLE_THRESHOLD_M = 0.05
const MODERATE_THRESHOLD_M = 0.15
const HISTORY_LENGTH_MS = 10000

// State
const posX = ref('--')
const posY = ref('--')
const posZ = ref('--')
const tfX = ref('--')
const tfY = ref('--')
const tfZ = ref('--')
const tagId = ref('--')
const tagFamily = ref('--')
const decisionMargin = ref('--')
const hamming = ref('--')
const detectionRate = ref('--')
const positionVariance = ref('--')
const qualityPercent = ref(0)

// Stability state
const stabilityLevel = ref<'no-tag' | 'unstable' | 'moderate' | 'stable'>('no-tag')
const stabilityReason = ref('')

// History tracking
const poseHistory: { time: number; x: number; y: number; z: number }[] = []
const detectionTimes: number[] = []
let lastTfTime = 0

// Canvas ref
const historyCanvas = ref<HTMLCanvasElement | null>(null)

// Subscribers
let tfSubscriber: ROSLIB.Topic | null = null
let detectionSubscriber: ROSLIB.Topic | null = null
let localPosSubscriber: ROSLIB.Topic | null = null
let updateInterval: number | null = null

// Heading and position from PX4 (for NED calculation)
let droneHeading = 0
let droneX = 0
let droneY = 0
let droneZ = 0
let headingValid = false
let originLocked = false
let offsetNorth = 0
let offsetEast = 0
let offsetDown = 0

// Computed classes
const stabilityClass = computed(() => `stability-${stabilityLevel.value}`)
const stabilityText = computed(() => {
  switch (stabilityLevel.value) {
    case 'stable': return 'STABLE'
    case 'moderate': return 'MODERATE'
    case 'unstable': return 'UNSTABLE'
    default: return 'NO TAG'
  }
})
const stabilityDescription = computed(() => stabilityReason.value || 'Waiting for AprilTag detection...')

const readyBannerClass = computed(() => {
  switch (stabilityLevel.value) {
    case 'stable': return 'ready'
    case 'moderate': return 'caution'
    default: return 'not-ready'
  }
})
const readyBannerText = computed(() => {
  switch (stabilityLevel.value) {
    case 'stable': return 'READY FOR POSITION HOLD'
    case 'moderate': return 'CAUTION - Estimates may drift'
    default: return 'NOT READY FOR POSITION HOLD'
  }
})

const marginClass = computed(() => {
  const val = parseFloat(decisionMargin.value)
  if (isNaN(val)) return ''
  return val < 30 ? 'error' : val < 50 ? 'warning' : ''
})

const hammingClass = computed(() => {
  const val = parseInt(hamming.value)
  if (isNaN(val)) return ''
  return val > 0 ? 'warning' : ''
})

const rateClass = computed(() => {
  const val = parseFloat(detectionRate.value)
  if (isNaN(val)) return ''
  return val < 2 ? 'error' : val < 5 ? 'warning' : ''
})

// Handle local position messages (for heading)
const handleLocalPositionMessage = (msg: any) => {
  droneHeading = msg.heading || 0
  droneX = msg.x || 0
  droneY = msg.y || 0
  droneZ = msg.z || 0
  headingValid = true
}

// Handle TF messages and compute NED position
const handleTfMessage = (msg: any) => {
  if (!msg.transforms) return

  for (const transform of msg.transforms) {
    const childFrame = transform.child_frame_id
    if (childFrame && childFrame.includes(':')) {
      const [family, id] = childFrame.split(':')
      if (family.includes(TAG_FAMILY) && parseInt(id) === TARGET_TAG_ID) {
        const t = transform.transform.translation
        tfX.value = t.x.toFixed(3)
        tfY.value = t.y.toFixed(3)
        tfZ.value = t.z.toFixed(3)
        lastTfTime = Date.now()

        // Compute NED position (same logic as apriltag_odometry.py)
        if (headingValid) {
          // Transform from TF frame to body frame
          // TF X = altitude, TF Y = south, TF Z = west
          const bodyForward = -t.y
          const bodyRight = -t.z
          const bodyDown = -t.x

          // Body to NED transform using heading
          const cosH = Math.cos(droneHeading)
          const sinH = Math.sin(droneHeading)
          const tagRelNorth = bodyForward * cosH - bodyRight * sinH
          const tagRelEast = bodyForward * sinH + bodyRight * cosH

          // Lock origin on first detection
          if (!originLocked) {
            offsetNorth = droneX - tagRelNorth
            offsetEast = droneY - tagRelEast
            offsetDown = droneZ - bodyDown
            originLocked = true
          }

          // Apply offset to get NED position
          const north = tagRelNorth + offsetNorth
          const east = tagRelEast + offsetEast
          const down = bodyDown + offsetDown

          // Update display
          posX.value = north.toFixed(3)
          posY.value = east.toFixed(3)
          posZ.value = down.toFixed(3)

          // Add to history for stability calculation
          const now = Date.now()
          poseHistory.push({ time: now, x: north, y: east, z: down })

          // Remove old history
          while (poseHistory.length > 0 && poseHistory[0].time < now - HISTORY_LENGTH_MS) {
            poseHistory.shift()
          }

          updateStability()
          updateHistoryGraph()
        }
      }
    }
  }
}

// Handle detection messages
const handleDetectionMessage = (msg: any) => {
  if (!msg.detections || msg.detections.length === 0) return

  const now = Date.now()
  detectionTimes.push(now)

  // Keep only recent detection times
  while (detectionTimes.length > 0 && detectionTimes[0] < now - HISTORY_LENGTH_MS) {
    detectionTimes.shift()
  }

  for (const detection of msg.detections) {
    if (detection.id === TARGET_TAG_ID) {
      tagId.value = String(detection.id)
      tagFamily.value = detection.family || TAG_FAMILY
      decisionMargin.value = detection.decision_margin ? detection.decision_margin.toFixed(1) : '--'
      hamming.value = detection.hamming !== undefined ? String(detection.hamming) : '--'

      // Update quality bar
      const margin = detection.decision_margin || 0
      qualityPercent.value = Math.min(100, margin / 1.5)
    }
  }

  // Update detection rate
  const recentDetections = detectionTimes.filter(t => t > now - 1000).length
  detectionRate.value = `${recentDetections} Hz`
}

// Update stability calculation
const updateStability = () => {
  const now = Date.now()

  // Check if we have recent TF data
  const timeSinceLastTf = now - lastTfTime
  if (timeSinceLastTf > 500) {
    stabilityLevel.value = 'no-tag'
    stabilityReason.value = `Tag not visible for ${(timeSinceLastTf / 1000).toFixed(1)}s`
    return
  }

  // Need enough history
  const recentHistory = poseHistory.filter(p => p.time > now - STABILITY_WINDOW_MS)
  if (recentHistory.length < 5) {
    stabilityLevel.value = 'no-tag'
    stabilityReason.value = 'Collecting data...'
    return
  }

  // Calculate standard deviation
  const avgX = recentHistory.reduce((s, p) => s + p.x, 0) / recentHistory.length
  const avgY = recentHistory.reduce((s, p) => s + p.y, 0) / recentHistory.length
  const avgZ = recentHistory.reduce((s, p) => s + p.z, 0) / recentHistory.length

  const varX = Math.sqrt(recentHistory.reduce((s, p) => s + Math.pow(p.x - avgX, 2), 0) / recentHistory.length)
  const varY = Math.sqrt(recentHistory.reduce((s, p) => s + Math.pow(p.y - avgY, 2), 0) / recentHistory.length)
  const varZ = Math.sqrt(recentHistory.reduce((s, p) => s + Math.pow(p.z - avgZ, 2), 0) / recentHistory.length)

  const totalVar = Math.sqrt(varX * varX + varY * varY + varZ * varZ)
  positionVariance.value = `${(totalVar * 100).toFixed(1)} cm`

  // Check detection rate
  const recentDetections = detectionTimes.filter(t => t > now - 1000).length
  const detectionRateOk = recentDetections >= 3

  // Determine stability level
  if (totalVar <= STABLE_THRESHOLD_M && detectionRateOk) {
    stabilityLevel.value = 'stable'
    stabilityReason.value = `Position variance: ${(totalVar * 100).toFixed(1)} cm`
  } else if (totalVar <= MODERATE_THRESHOLD_M && detectionRateOk) {
    stabilityLevel.value = 'moderate'
    stabilityReason.value = `Position variance: ${(totalVar * 100).toFixed(1)} cm (high)`
  } else {
    stabilityLevel.value = 'unstable'
    const reason = !detectionRateOk ? 'Low detection rate' : 'High position variance'
    stabilityReason.value = `${reason}: ${(totalVar * 100).toFixed(1)} cm`
  }
}

// Update history graph
const updateHistoryGraph = () => {
  const canvas = historyCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Set canvas size
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * window.devicePixelRatio
  canvas.height = rect.height * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const width = rect.width
  const height = rect.height

  // Clear
  ctx.fillStyle = '#1f2937'
  ctx.fillRect(0, 0, width, height)

  if (poseHistory.length < 2) return

  const now = Date.now()
  const startTime = now - HISTORY_LENGTH_MS

  // Find data range
  let minVal = Infinity, maxVal = -Infinity
  for (const p of poseHistory) {
    minVal = Math.min(minVal, p.x, p.y, p.z)
    maxVal = Math.max(maxVal, p.x, p.y, p.z)
  }

  // Add padding
  const range = maxVal - minVal || 1
  minVal -= range * 0.1
  maxVal += range * 0.1

  // Draw grid
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = height * i / 4
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Draw zero line if in range
  if (minVal < 0 && maxVal > 0) {
    const zeroY = height * (1 - (0 - minVal) / (maxVal - minVal))
    ctx.strokeStyle = '#4b5563'
    ctx.beginPath()
    ctx.moveTo(0, zeroY)
    ctx.lineTo(width, zeroY)
    ctx.stroke()
  }

  // Helper to draw line
  const drawLine = (getValue: (p: typeof poseHistory[0]) => number, color: string) => {
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    let started = false

    for (const p of poseHistory) {
      const x = width * (p.time - startTime) / HISTORY_LENGTH_MS
      const val = getValue(p)
      const y = height * (1 - (val - minVal) / (maxVal - minVal))

      if (!started) {
        ctx.moveTo(x, y)
        started = true
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }

  // Draw X, Y, Z lines
  drawLine(p => p.x, '#ef4444')  // Red for X (North)
  drawLine(p => p.y, '#22c55e')  // Green for Y (East)
  drawLine(p => p.z, '#3b82f6')  // Blue for Z (Down)
}

// Setup subscriptions when ROS is available
const setupSubscriptions = () => {
  if (!props.ros) return

  // Subscribe to TF
  tfSubscriber = new ROSLIB.Topic({
    ros: props.ros,
    name: '/tf',
    messageType: 'tf2_msgs/msg/TFMessage'
  })
  tfSubscriber.subscribe(handleTfMessage)

  // Subscribe to AprilTag detections
  detectionSubscriber = new ROSLIB.Topic({
    ros: props.ros,
    name: '/apriltag_detections',
    messageType: 'apriltag_msgs/msg/AprilTagDetectionArray'
  })
  detectionSubscriber.subscribe(handleDetectionMessage)

  // Subscribe to vehicle local position (for heading to compute NED)
  localPosSubscriber = new ROSLIB.Topic({
    ros: props.ros,
    name: '/fmu/out/vehicle_local_position',
    messageType: 'px4_msgs/msg/VehicleLocalPosition'
  })
  localPosSubscriber.subscribe(handleLocalPositionMessage)

  console.log('AprilTagVisualizer: Subscribed to /tf, /apriltag_detections, /fmu/out/vehicle_local_position')
}

// Watch for ROS connection changes
watch(() => props.ros, (newRos) => {
  if (newRos) {
    setupSubscriptions()
  }
}, { immediate: true })

onMounted(() => {
  // Periodic stability update
  updateInterval = window.setInterval(() => {
    updateStability()
  }, 200)
})

onBeforeUnmount(() => {
  if (tfSubscriber) tfSubscriber.unsubscribe()
  if (detectionSubscriber) detectionSubscriber.unsubscribe()
  if (localPosSubscriber) localPosSubscriber.unsubscribe()
  if (updateInterval) clearInterval(updateInterval)
})
</script>

<style scoped>
.apriltag-visualizer {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  background: #111827;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.stability-section {
  text-align: center;
  padding: 1.5rem;
  background: #1f2937;
  border-radius: 0.5rem;
}

.stability-indicator {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
}

.stability-no-tag {
  background: #374151;
  border: 3px solid #4b5563;
  color: #9ca3af;
}

.stability-unstable {
  background: rgba(239, 68, 68, 0.2);
  border: 3px solid #ef4444;
  color: #ef4444;
}

.stability-moderate {
  background: rgba(245, 158, 11, 0.2);
  border: 3px solid #f59e0b;
  color: #f59e0b;
}

.stability-stable {
  background: rgba(34, 197, 94, 0.2);
  border: 3px solid #22c55e;
  color: #22c55e;
}

.stability-description {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.ready-banner {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-weight: bold;
  font-size: 0.875rem;
}

.ready-banner.not-ready {
  background: rgba(239, 68, 68, 0.2);
  border: 2px solid #ef4444;
  color: #ef4444;
}

.ready-banner.caution {
  background: rgba(245, 158, 11, 0.2);
  border: 2px solid #f59e0b;
  color: #f59e0b;
}

.ready-banner.ready {
  background: rgba(34, 197, 94, 0.2);
  border: 2px solid #22c55e;
  color: #22c55e;
}

.data-section {
  background: #1f2937;
  border-radius: 0.5rem;
  padding: 1rem;
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 1rem;
  border-bottom: 1px solid #374151;
  padding-bottom: 0.5rem;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.data-item {
  text-align: center;
  background: #374151;
  padding: 0.75rem;
  border-radius: 0.375rem;
}

.data-label {
  display: block;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
}

.data-value {
  display: block;
  font-size: 1.25rem;
  font-weight: bold;
  font-family: 'SF Mono', Monaco, monospace;
}

.data-value.north { color: #ef4444; }
.data-value.east { color: #22c55e; }
.data-value.down { color: #3b82f6; }
.data-value.tf-x { color: #f59e0b; }
.data-value.tf-y { color: #a855f7; }
.data-value.tf-z { color: #06b6d4; }

.data-unit {
  font-size: 0.75rem;
  color: #6b7280;
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.quality-item {
  background: #374151;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
}

.quality-label {
  display: block;
  font-size: 0.6875rem;
  color: #9ca3af;
}

.quality-value {
  display: block;
  font-size: 1rem;
  font-weight: bold;
  color: #22c55e;
}

.quality-value.warning { color: #f59e0b; }
.quality-value.error { color: #ef4444; }

.quality-bar {
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
}

.quality-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #f59e0b, #22c55e);
  transition: width 0.3s;
}

.history-canvas {
  width: 100%;
  height: 120px;
  background: #1f2937;
  border-radius: 0.375rem;
}

.legend {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.legend-item::before {
  content: '';
  width: 12px;
  height: 3px;
  border-radius: 2px;
}

.legend-item.north::before { background: #ef4444; }
.legend-item.east::before { background: #22c55e; }
.legend-item.down::before { background: #3b82f6; }
</style>
