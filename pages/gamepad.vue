<template>
  <div class="gamepad-container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <a href="/" class="logo-link">
          <span class="text-xl">🕹️</span>
        </a>
        <span class="header-title">Gamepad Control</span>
        <div class="connection-indicator" :class="{ connected: isConnected }">
          <span class="indicator-dot"></span>
          <span class="indicator-text">{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
      </div>

      <div class="header-center">
        <div class="telemetry-item">
          <span class="telemetry-label">Mode:</span>
          <span class="telemetry-value text-blue-400">{{ flightMode }}</span>
        </div>
        <div class="telemetry-item">
          <span class="telemetry-label">Armed:</span>
          <span class="telemetry-value" :class="isArmed ? 'text-green-400' : 'text-red-400'">
            {{ isArmed ? 'YES' : 'NO' }}
          </span>
        </div>
        <div class="telemetry-item hidden md:flex">
          <span class="telemetry-label">Alt:</span>
          <span class="telemetry-value text-green-400">{{ altitude.toFixed(1) }}m</span>
        </div>
        <div class="telemetry-item hidden lg:flex">
          <span class="telemetry-label">Hdg:</span>
          <span class="telemetry-value text-purple-400">{{ (heading * 180 / Math.PI).toFixed(0) }}°</span>
        </div>
      </div>

      <div class="header-right">
        <button
          @click="armDrone"
          :disabled="isArmed"
          class="control-btn"
          :class="isArmed ? 'btn-armed' : 'btn-arm'"
        >
          {{ isArmed ? 'Armed' : 'Arm' }}
        </button>
        <button
          @click="land"
          :disabled="!isFlying"
          class="control-btn btn-land"
        >
          Land
        </button>
        <button
          @click="toggleVelocityMode"
          class="control-btn"
          :class="velocityModeActive ? 'btn-active' : 'btn-velocity'"
        >
          {{ velocityModeActive ? 'Stop' : 'Start' }}
        </button>
      </div>
    </div>

    <!-- Split Container -->
    <div class="split-container">
      <!-- Left Panel - Gamepad Controls -->
      <div class="control-panel" :style="{ width: leftPanelWidth + '%' }">
        <div class="control-content">
          <!-- Sticks Row -->
          <div class="sticks-row">
            <!-- Left Stick -->
            <div class="stick-container">
              <h3 class="stick-title">Left Stick (WASD)</h3>
              <p class="stick-subtitle">Throttle / Yaw</p>

              <div class="stick-visual">
                <div class="stick-crosshair-h"></div>
                <div class="stick-crosshair-v"></div>
                <div
                  class="stick-indicator stick-blue"
                  :style="{
                    left: `${50 + (leftStick.x * 40)}%`,
                    top: `${50 - (leftStick.y * 40)}%`
                  }"
                ></div>
              </div>

              <div class="axis-values">
                <div class="axis-item">
                  <span class="axis-label">Yaw</span>
                  <span class="axis-percent" :class="leftStick.x !== 0 ? 'text-blue-400' : ''">
                    {{ (leftStick.x * 100).toFixed(0) }}%
                  </span>
                </div>
                <div class="axis-item">
                  <span class="axis-label">Throttle</span>
                  <span class="axis-percent" :class="leftStick.y !== 0 ? 'text-blue-400' : ''">
                    {{ (leftStick.y * 100).toFixed(0) }}%
                  </span>
                </div>
              </div>
            </div>

            <!-- Right Stick -->
            <div class="stick-container">
              <h3 class="stick-title">Right Stick (IJKL)</h3>
              <p class="stick-subtitle">Forward / Lateral</p>

              <div class="stick-visual">
                <div class="stick-crosshair-h"></div>
                <div class="stick-crosshair-v"></div>
                <div
                  class="stick-indicator stick-green"
                  :style="{
                    left: `${50 + (rightStick.x * 40)}%`,
                    top: `${50 - (rightStick.y * 40)}%`
                  }"
                ></div>
              </div>

              <div class="axis-values">
                <div class="axis-item">
                  <span class="axis-label">Lateral</span>
                  <span class="axis-percent" :class="rightStick.x !== 0 ? 'text-green-400' : ''">
                    {{ (rightStick.x * 100).toFixed(0) }}%
                  </span>
                </div>
                <div class="axis-item">
                  <span class="axis-label">Forward</span>
                  <span class="axis-percent" :class="rightStick.y !== 0 ? 'text-green-400' : ''">
                    {{ (rightStick.y * 100).toFixed(0) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Velocity Display -->
          <div class="velocity-panel">
            <h3 class="panel-title">Velocity Setpoint</h3>
            <div class="velocity-grid">
              <div class="velocity-item">
                <span class="velocity-label">Forward</span>
                <span class="velocity-value text-green-400">{{ currentVelocity.vx.toFixed(2) }} m/s</span>
              </div>
              <div class="velocity-item">
                <span class="velocity-label">Lateral</span>
                <span class="velocity-value text-yellow-400">{{ currentVelocity.vy.toFixed(2) }} m/s</span>
              </div>
              <div class="velocity-item">
                <span class="velocity-label">Vertical</span>
                <span class="velocity-value text-blue-400">{{ currentVelocity.vz.toFixed(2) }} m/s</span>
              </div>
              <div class="velocity-item">
                <span class="velocity-label">Yaw Rate</span>
                <span class="velocity-value text-purple-400">{{ currentVelocity.yawspeed.toFixed(2) }} rad/s</span>
              </div>
            </div>
          </div>

          <!-- Settings -->
          <div class="settings-panel">
            <h3 class="panel-title">Settings</h3>
            <div class="setting-item">
              <label>Max Horizontal: {{ maxHorizontalVelocity }} m/s</label>
              <input type="range" v-model.number="maxHorizontalVelocity" min="0.5" max="5" step="0.5" />
            </div>
            <div class="setting-item">
              <label>Max Vertical: {{ maxVerticalVelocity }} m/s</label>
              <input type="range" v-model.number="maxVerticalVelocity" min="0.5" max="3" step="0.5" />
            </div>
            <div class="setting-item">
              <label>Max Yaw Rate: {{ maxYawRate }} rad/s</label>
              <input type="range" v-model.number="maxYawRate" min="0.5" max="2" step="0.25" />
            </div>
          </div>

          <!-- Keyboard Help -->
          <div class="help-panel">
            <div class="help-grid">
              <div class="help-section">
                <div class="help-title">Left Stick</div>
                <div class="help-keys">
                  <span><kbd>W</kbd> Up</span>
                  <span><kbd>S</kbd> Down</span>
                  <span><kbd>A</kbd> Yaw L</span>
                  <span><kbd>D</kbd> Yaw R</span>
                </div>
              </div>
              <div class="help-section">
                <div class="help-title">Right Stick</div>
                <div class="help-keys">
                  <span><kbd>I</kbd> Fwd</span>
                  <span><kbd>K</kbd> Back</span>
                  <span><kbd>J</kbd> Left</span>
                  <span><kbd>L</kbd> Right</span>
                </div>
              </div>
              <div class="help-section">
                <div class="help-title">Actions</div>
                <div class="help-keys">
                  <span><kbd>Space</kbd> Center</span>
                  <span><kbd>Esc</kbd> Stop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider" @mousedown="startDragging" :class="{ dragging: isDragging }">
        <div class="divider-handle"></div>
      </div>

      <!-- Right Panel - Unity Simulator -->
      <div class="unity-panel" :style="{ width: (100 - leftPanelWidth) + '%' }">
        <iframe
          :src="unityUrl"
          class="unity-iframe"
          frameborder="0"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'

const { getROSURL } = useROS()

// Unity URL
const unityUrl = ref('')
if (process.client) {
  const hostname = window.location.hostname
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
  unityUrl.value = `${protocol}//${hostname}:1337`
}

// Split panel state
const leftPanelWidth = ref(35)
const isDragging = ref(false)

// ROS connection
const ros = ref<ROSLIB.Ros | null>(null)
const isConnected = ref(false)

// Publishers
let offboardModePub: ROSLIB.Topic | null = null
let trajectorySetpointPub: ROSLIB.Topic | null = null
let vehicleCommandPub: ROSLIB.Topic | null = null
let pauseSetpointsPub: ROSLIB.Topic | null = null
let offboardManagerPub: ROSLIB.Topic | null = null

// Subscribers
let vehicleStatusSub: ROSLIB.Topic | null = null
let localPositionSub: ROSLIB.Topic | null = null
let vehicleStatusFallbackTimer: NodeJS.Timeout | null = null
let hasReceivedVehicleStatus = false

// Flight state
const isArmed = ref(false)
const isFlying = ref(false)
const flightMode = ref('Unknown')
const velocityModeActive = ref(false)

// Telemetry
const altitude = ref(0)
const heading = ref(0)
const groundSpeed = ref(0)
const position = reactive({ x: 0, y: 0, z: 0 })

// Stick positions (-1 to 1)
const leftStick = reactive({ x: 0, y: 0 })
const rightStick = reactive({ x: 0, y: 0 })

// Velocity settings
const maxHorizontalVelocity = ref(2)
const maxVerticalVelocity = ref(1.5)
const maxYawRate = ref(1)

// Step size for keyboard input (5% = 0.05)
const stickStep = 0.05

// Current velocity command
const currentVelocity = computed(() => {
  return {
    vx: rightStick.y * maxHorizontalVelocity.value,
    vy: rightStick.x * maxHorizontalVelocity.value,
    vz: -leftStick.y * maxVerticalVelocity.value,
    yawspeed: leftStick.x * maxYawRate.value
  }
})

// Control loop interval
let controlLoopInterval: NodeJS.Timeout | null = null

// Dragging functions
const startDragging = () => {
  isDragging.value = true
}

const stopDragging = () => {
  isDragging.value = false
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return

  const containerWidth = window.innerWidth
  const newWidth = (e.clientX / containerWidth) * 100

  if (newWidth >= 20 && newWidth <= 60) {
    leftPanelWidth.value = newWidth
  }
}

// Initialize ROS connection
const initROS = () => {
  ros.value = new ROSLIB.Ros({
    url: getROSURL()
  })

  ros.value.on('connection', () => {
    console.log('Gamepad: Connected to ROS')
    isConnected.value = true
    initPublishers()
    initSubscribers()
  })

  ros.value.on('error', (error: any) => {
    console.error('Gamepad: ROS connection error:', error)
    isConnected.value = false
  })

  ros.value.on('close', () => {
    console.log('Gamepad: ROS connection closed')
    isConnected.value = false
  })
}

const initPublishers = () => {
  if (!ros.value) return

  offboardModePub = new ROSLIB.Topic({
    ros: ros.value,
    name: '/fmu/in/offboard_control_mode',
    messageType: 'px4_msgs/msg/OffboardControlMode'
  })

  trajectorySetpointPub = new ROSLIB.Topic({
    ros: ros.value,
    name: '/fmu/in/trajectory_setpoint',
    messageType: 'px4_msgs/msg/TrajectorySetpoint'
  })

  vehicleCommandPub = new ROSLIB.Topic({
    ros: ros.value,
    name: '/fmu/in/vehicle_command',
    messageType: 'px4_msgs/msg/VehicleCommand'
  })

  // Publisher to pause the offboard manager's setpoints
  pauseSetpointsPub = new ROSLIB.Topic({
    ros: ros.value,
    name: '/dexi/pause_setpoints',
    messageType: 'std_msgs/msg/Bool'
  })

  // Publisher for offboard manager commands
  offboardManagerPub = new ROSLIB.Topic({
    ros: ros.value,
    name: '/dexi/offboard_manager',
    messageType: 'dexi_interfaces/msg/OffboardNavCommand'
  })
}

// PX4 nav_state mapping (matches FlightModeDisplay component)
const modeMap: { [key: number]: string } = {
  0: 'MANUAL', 1: 'ALTITUDE', 2: 'POSITION', 3: 'MISSION',
  4: 'HOLD', 5: 'RTL', 6: 'SLOW', 10: 'ACRO', 12: 'DESCEND',
  13: 'TERMINATION', 14: 'OFFBOARD', 15: 'STABILIZED',
  17: 'TAKEOFF', 18: 'LAND', 19: 'TARGET', 20: 'PRECLAND'
}

const subscribeToVehicleStatus = (topicName: string) => {
  if (vehicleStatusSub) {
    vehicleStatusSub.unsubscribe()
  }

  if (!ros.value) return

  vehicleStatusSub = new ROSLIB.Topic({
    ros: ros.value,
    name: topicName,
    messageType: 'px4_msgs/msg/VehicleStatus'
  })

  vehicleStatusSub.subscribe((msg: any) => {
    hasReceivedVehicleStatus = true
    if (vehicleStatusFallbackTimer) {
      clearTimeout(vehicleStatusFallbackTimer)
      vehicleStatusFallbackTimer = null
    }

    isArmed.value = msg.arming_state === 2
    isFlying.value = msg.nav_state !== 18 && msg.nav_state !== 13
    flightMode.value = modeMap[msg.nav_state] || `Unknown (${msg.nav_state})`
  })
}

const initSubscribers = () => {
  if (!ros.value) return

  // Subscribe to vehicle status with fallback
  hasReceivedVehicleStatus = false
  subscribeToVehicleStatus('/fmu/out/vehicle_status')

  // Fallback to _v1 topic if no messages after 2 seconds
  vehicleStatusFallbackTimer = setTimeout(() => {
    if (!hasReceivedVehicleStatus) {
      console.log('Gamepad: Falling back to vehicle_status_v1')
      subscribeToVehicleStatus('/fmu/out/vehicle_status_v1')
    }
  }, 2000)

  localPositionSub = new ROSLIB.Topic({
    ros: ros.value,
    name: '/fmu/out/vehicle_local_position',
    messageType: 'px4_msgs/msg/VehicleLocalPosition'
  })

  localPositionSub.subscribe((msg: any) => {
    position.x = msg.x
    position.y = msg.y
    position.z = msg.z
    altitude.value = -msg.z
    heading.value = msg.heading
    groundSpeed.value = Math.sqrt(msg.vx * msg.vx + msg.vy * msg.vy)
  })
}

const sendVehicleCommand = (command: number, param1 = 0, param2 = 0, param3 = 0, param4 = 0, param5 = 0, param6 = 0, param7 = 0) => {
  if (!vehicleCommandPub) return

  const msg = new ROSLIB.Message({
    timestamp: Date.now() * 1000,
    param1, param2, param3, param4, param5, param6, param7,
    command,
    target_system: 1,
    target_component: 1,
    source_system: 255,
    source_component: 0,
    confirmation: 0,
    from_external: true
  })

  vehicleCommandPub.publish(msg)
}

const armDrone = () => {
  sendVehicleCommand(400, 1.0)
}

const disarmDrone = () => {
  sendVehicleCommand(400, 0.0, 21196.0)
}

const land = () => {
  if (velocityModeActive.value) {
    toggleVelocityMode()
  }
  sendVehicleCommand(21)
}

const toggleVelocityMode = () => {
  if (velocityModeActive.value) {
    stopVelocityMode()
  } else {
    startVelocityMode()
  }
}

const publishPauseSetpoints = (pause: boolean) => {
  if (!pauseSetpointsPub) {
    console.warn('Gamepad: pauseSetpointsPub not ready')
    return
  }

  const msg = new ROSLIB.Message({ data: pause })
  pauseSetpointsPub.publish(msg)
  console.log(`Gamepad: Published pause_setpoints = ${pause}`)
}

const sendOffboardCommand = (command: string) => {
  if (!offboardManagerPub) {
    console.warn('Gamepad: offboardManagerPub not ready')
    return
  }
  const msg = new ROSLIB.Message({ command: command, distance_or_degrees: 0 })
  offboardManagerPub.publish(msg)
  console.log(`Gamepad: Sent offboard command: ${command}`)
}

const startVelocityMode = () => {
  velocityModeActive.value = true

  // Initialize target position from current drone position
  targetPosition.x = position.x
  targetPosition.y = position.y
  targetPosition.z = position.z
  targetPosition.yaw = heading.value
  lastUpdateTime = Date.now()

  console.log(`Gamepad: Starting from position (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`)

  // Start publishing setpoints FIRST to avoid gap
  controlLoopInterval = setInterval(() => {
    publishOffboardControlMode()
    publishVelocitySetpoint()
  }, 50)

  // Then stop the offboard manager after a brief delay
  setTimeout(() => {
    publishPauseSetpoints(true)
    sendOffboardCommand('stop_offboard_heartbeat')
  }, 200)
}

const stopVelocityMode = () => {
  velocityModeActive.value = false

  if (controlLoopInterval) {
    clearInterval(controlLoopInterval)
    controlLoopInterval = null
  }

  leftStick.x = 0
  leftStick.y = 0
  rightStick.x = 0
  rightStick.y = 0

  // Resume the offboard manager's heartbeat
  publishPauseSetpoints(false)
  sendOffboardCommand('start_offboard_heartbeat')
}

// Target position for position-based velocity control
const targetPosition = reactive({ x: 0, y: 0, z: 0, yaw: 0 })
let lastUpdateTime = Date.now()

const publishOffboardControlMode = () => {
  if (!offboardModePub) return

  const msg = new ROSLIB.Message({
    timestamp: Date.now() * 1000,
    position: true,
    velocity: false,
    acceleration: false,
    attitude: false,
    body_rate: false,
    thrust_and_torque: false,
    direct_actuator: false
  })

  offboardModePub.publish(msg)
}

const publishVelocitySetpoint = () => {
  if (!trajectorySetpointPub) {
    console.warn('trajectorySetpointPub not ready')
    return
  }

  // Calculate dt
  const now = Date.now()
  const dt = (now - lastUpdateTime) / 1000  // seconds
  lastUpdateTime = now

  // Get body-frame velocities
  const vxBody = currentVelocity.value.vx
  const vyBody = currentVelocity.value.vy
  const vzNED = currentVelocity.value.vz  // Already in NED

  // Transform to NED frame
  const cosHeading = Math.cos(heading.value)
  const sinHeading = Math.sin(heading.value)
  const vxNED = vxBody * cosHeading - vyBody * sinHeading
  const vyNED = vxBody * sinHeading + vyBody * cosHeading

  // Update target position based on velocity
  targetPosition.x += vxNED * dt
  targetPosition.y += vyNED * dt
  targetPosition.z += vzNED * dt
  targetPosition.yaw += currentVelocity.value.yawspeed * dt

  const msg = new ROSLIB.Message({
    timestamp: now * 1000,
    position: [targetPosition.x, targetPosition.y, targetPosition.z],
    velocity: [0, 0, 0],
    acceleration: [0, 0, 0],
    jerk: [0, 0, 0],
    yaw: targetPosition.yaw,
    yawspeed: 0
  })

  trajectorySetpointPub.publish(msg)
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.repeat) return

  const key = event.key.toLowerCase()

  if (['w', 'a', 's', 'd', 'i', 'j', 'k', 'l', ' ', 'escape'].includes(key)) {
    event.preventDefault()
  }

  if (key === ' ') {
    leftStick.x = 0
    leftStick.y = 0
    rightStick.x = 0
    rightStick.y = 0
    return
  }

  if (key === 'escape') {
    if (velocityModeActive.value) {
      stopVelocityMode()
    }
    return
  }

  // Left stick (WASD)
  switch (key) {
    case 'w':
      leftStick.y = leftStick.y < 0 ? Math.min(0, leftStick.y + stickStep) : Math.min(1, leftStick.y + stickStep)
      break
    case 's':
      leftStick.y = leftStick.y > 0 ? Math.max(0, leftStick.y - stickStep) : Math.max(-1, leftStick.y - stickStep)
      break
    case 'a':
      leftStick.x = leftStick.x > 0 ? Math.max(0, leftStick.x - stickStep) : Math.max(-1, leftStick.x - stickStep)
      break
    case 'd':
      leftStick.x = leftStick.x < 0 ? Math.min(0, leftStick.x + stickStep) : Math.min(1, leftStick.x + stickStep)
      break
  }

  // Right stick (IJKL)
  switch (key) {
    case 'i':
      rightStick.y = rightStick.y < 0 ? Math.min(0, rightStick.y + stickStep) : Math.min(1, rightStick.y + stickStep)
      break
    case 'k':
      rightStick.y = rightStick.y > 0 ? Math.max(0, rightStick.y - stickStep) : Math.max(-1, rightStick.y - stickStep)
      break
    case 'j':
      rightStick.x = rightStick.x > 0 ? Math.max(0, rightStick.x - stickStep) : Math.max(-1, rightStick.x - stickStep)
      break
    case 'l':
      rightStick.x = rightStick.x < 0 ? Math.min(0, rightStick.x + stickStep) : Math.min(1, rightStick.x + stickStep)
      break
  }
}

onMounted(() => {
  initROS()
  window.addEventListener('keydown', handleKeyDown)
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDragging)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDragging)

  if (velocityModeActive.value) {
    stopVelocityMode()
  }

  if (vehicleStatusSub) vehicleStatusSub.unsubscribe()
  if (localPositionSub) localPositionSub.unsubscribe()
  if (vehicleStatusFallbackTimer) clearTimeout(vehicleStatusFallbackTimer)

  if (ros.value) {
    ros.value.close()
  }
})
</script>

<style scoped>
.gamepad-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1a2e;
  color: white;
  overflow: hidden;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-link {
  text-decoration: none;
}

.header-title {
  font-weight: 600;
  font-size: 1rem;
}

.connection-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.connection-indicator.connected .indicator-dot {
  background: #22c55e;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.telemetry-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.telemetry-label {
  color: #94a3b8;
}

.telemetry-value {
  font-family: monospace;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-arm {
  background: #ef4444;
  color: white;
}

.btn-arm:hover:not(:disabled) {
  background: #dc2626;
}

.btn-armed {
  background: #22c55e;
  color: white;
}

.btn-land {
  background: #eab308;
  color: black;
}

.btn-land:hover:not(:disabled) {
  background: #ca8a04;
}

.btn-velocity {
  background: #8b5cf6;
  color: white;
}

.btn-velocity:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-active {
  background: #22c55e;
  color: white;
}

/* Split Container */
.split-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.control-panel {
  height: 100%;
  background: #1a1a2e;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.control-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Sticks */
.sticks-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stick-container {
  background: #16213e;
  border-radius: 0.5rem;
  padding: 0.75rem;
  text-align: center;
}

.stick-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.stick-subtitle {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.stick-visual {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
  background: #0f3460;
  border-radius: 50%;
  border: 2px solid #1e3a5f;
}

.stick-crosshair-h,
.stick-crosshair-v {
  position: absolute;
  background: #1e3a5f;
}

.stick-crosshair-h {
  width: 100%;
  height: 1px;
  top: 50%;
  left: 0;
}

.stick-crosshair-v {
  width: 1px;
  height: 100%;
  top: 0;
  left: 50%;
}

.stick-indicator {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.05s ease-out;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.stick-blue {
  background: #3b82f6;
  border: 2px solid #60a5fa;
}

.stick-green {
  background: #22c55e;
  border: 2px solid #4ade80;
}

.axis-values {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.axis-item {
  text-align: center;
}

.axis-label {
  display: block;
  font-size: 0.625rem;
  color: #64748b;
  text-transform: uppercase;
}

.axis-percent {
  font-family: monospace;
  font-size: 0.875rem;
  color: #94a3b8;
}

/* Velocity Panel */
.velocity-panel,
.settings-panel,
.help-panel {
  background: #16213e;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.panel-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.velocity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.velocity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #0f3460;
  padding: 0.375rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.velocity-label {
  color: #64748b;
}

.velocity-value {
  font-family: monospace;
  font-weight: 500;
}

/* Settings */
.setting-item {
  margin-bottom: 0.5rem;
}

.setting-item label {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 0.25rem;
}

.setting-item input[type="range"] {
  width: 100%;
  height: 4px;
  background: #0f3460;
  border-radius: 2px;
  cursor: pointer;
}

/* Help Panel */
.help-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
}

.help-section {
  font-size: 0.625rem;
}

.help-title {
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 0.25rem;
}

.help-keys {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  color: #64748b;
}

.help-keys kbd {
  display: inline-block;
  background: #0f3460;
  padding: 0.125rem 0.25rem;
  border-radius: 0.125rem;
  font-family: monospace;
  font-size: 0.625rem;
  margin-right: 0.25rem;
}

/* Divider */
.divider {
  width: 6px;
  height: 100%;
  background: #0f3460;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}

.divider:hover,
.divider.dragging {
  background: #3b82f6;
}

.divider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
}

/* Unity Panel */
.unity-panel {
  height: 100%;
  background: #000;
  position: relative;
  overflow: hidden;
}

.unity-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* Responsive */
@media (max-width: 768px) {
  .sticks-row {
    grid-template-columns: 1fr;
  }

  .velocity-grid {
    grid-template-columns: 1fr;
  }

  .help-grid {
    grid-template-columns: 1fr;
  }

  .header-center {
    display: none;
  }
}
</style>
