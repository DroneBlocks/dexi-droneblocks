<template>
  <div class="w-full bg-gray-900 text-white p-1.5 sm:p-2">
    <!-- Telemetry Display -->
    <div class="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-1.5 sm:mb-2 text-xs sm:text-sm">
      <!-- Flight Mode -->
      <div class="flex items-center space-x-1 sm:space-x-2">
        <FlightModeDisplay :ros="ros" class="font-mono" />
      </div>

      <!-- Battery -->
      <div class="flex items-center space-x-1 sm:space-x-2">
        <span class="text-gray-400 hidden sm:inline">Battery:</span>
        <span class="text-gray-400 sm:hidden">Bat:</span>
        <span class="font-mono" :class="batteryColorClass">{{ batteryDisplay }}</span>
      </div>

      <!-- Altitude -->
      <div class="flex items-center space-x-1 sm:space-x-2">
        <span class="text-gray-400">Alt:</span>
        <span class="font-mono text-green-400">{{ altitudeDisplay }}</span>
      </div>

      <!-- Ground Speed - hidden on very small screens -->
      <div class="hidden sm:flex items-center space-x-1 sm:space-x-2">
        <span class="text-gray-400">Speed:</span>
        <span class="font-mono text-yellow-400">{{ speedDisplay }}</span>
      </div>

      <!-- Heading - hidden on small screens -->
      <div class="hidden md:flex items-center space-x-1 sm:space-x-2">
        <span class="text-gray-400">Heading:</span>
        <span class="font-mono text-purple-400">{{ headingDisplay }}</span>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <!-- Mode Buttons -->
      <button
        @click="setMode(2)"
        class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        <span class="hidden sm:inline">Position Mode</span>
        <span class="sm:hidden">Pos</span>
      </button>
      <button
        @click="setMode(17)"
        class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm bg-blue-600 rounded-lg hover:bg-blue-700"
        style="display: none"
      >
        Takeoff Mode
      </button>
      <button
        @click="toggleOffboardMode"
        class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm rounded-lg"
        :class="isOffboardActive ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'"
        style="display: none"
      >
        {{ isOffboardActive ? 'Disable Offboard' : 'Offboard Mode' }}
      </button>

      <!-- Arm Button -->
      <button
        @click="armDrone"
        :disabled="isArmed"
        class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm rounded-lg"
        :class="isArmed ? 'bg-green-600' : 'bg-red-600 hover:bg-red-700'"
      >
        {{ isArmed ? 'Armed' : 'Arm' }}
      </button>

      <!-- Move Forward Button -->
      <button
        @click="moveForward"
        :disabled="!isFlying"
        class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        style="display: none"
      >
        Move Forward 3m
      </button>

      <!-- Land Button -->
      <button
        @click="land"
        :disabled="!isFlying"
        class="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs sm:text-sm bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
      >
        Land
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, defineExpose } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'

const { getROSURL } = useROS()

// ROS connection - make it reactive so FlightModeDisplay can properly subscribe
const ros = ref<ROSLIB.Ros | null>(null)

// State
const navState = ref('N/A')
const isArmed = ref(false)
const isFlying = ref(false)
const isOffboardActive = ref(false)
const batteryPercentage = ref<number | null>(null)

// Telemetry state
const gpsLat = ref<number | null>(null)
const gpsLon = ref<number | null>(null)
const altitude = ref<number | null>(null)
const groundSpeed = ref<number | null>(null)
const heading = ref<number | null>(null)

// Offboard target position (reactive so it can be updated by other components)
const offboardTargetPosition = ref({ x: 0, y: 0, z: -1.0, yaw: 0 })

// Computed properties for battery display
const batteryDisplay = computed(() => {
  if (batteryPercentage.value === null) return 'N/A'
  return `${Math.round(batteryPercentage.value)}%`
})

const batteryColorClass = computed(() => {
  if (batteryPercentage.value === null) return 'text-gray-400'
  if (batteryPercentage.value > 50) return 'text-green-400'
  if (batteryPercentage.value > 20) return 'text-yellow-400'
  return 'text-red-400'
})

// Computed properties for telemetry display
const gpsDisplay = computed(() => {
  if (gpsLat.value === null || gpsLon.value === null) return 'No Fix'
  return `${gpsLat.value.toFixed(6)}, ${gpsLon.value.toFixed(6)}`
})

const altitudeDisplay = computed(() => {
  if (altitude.value === null) return 'N/A'
  return `${altitude.value.toFixed(1)}m`
})

const speedDisplay = computed(() => {
  if (groundSpeed.value === null) return 'N/A'
  return `${groundSpeed.value.toFixed(1)} m/s`
})

const headingDisplay = computed(() => {
  if (heading.value === null) return 'N/A'
  return `${heading.value.toFixed(0)}°`
})

// Topics
let vehicleStatusTopic: ROSLIB.Topic | null = null
let vehicleCommandTopic: ROSLIB.Topic | null = null
let offboardManagerTopic: ROSLIB.Topic | null = null
let batteryStatusTopic: ROSLIB.Topic | null = null
let gpsPositionTopic: ROSLIB.Topic | null = null
let localPositionTopic: ROSLIB.Topic | null = null
let attitudeTopic: ROSLIB.Topic | null = null

// Vehicle status topic fallback logic
let vehicleStatusFallbackTimer: NodeJS.Timeout | null = null
let hasReceivedVehicleStatus = false
let usingFallbackTopic = false

// Command interface
interface VehicleCommand {
  timestamp: number
  param1: number
  param2: number
  param3: number
  param4: number
  param5: number
  param6: number
  param7: number
  command: number
  target_system: number
  target_component: number
  source_system: number
  source_component: number
  confirmation: number
  from_external: boolean
}

onMounted(() => {
  // Create ROS connection
  ros.value = new ROSLIB.Ros({
    url: getROSURL()
  })

  ros.value.on('connection', () => {
    console.log('FlightControls: Connected to ROS')
  })

  ros.value.on('error', (error: any) => {
    console.error('FlightControls: ROS connection error:', error)
  })

  ros.value.on('close', () => {
    console.log('FlightControls: ROS connection closed')
  })

  // Start with primary vehicle status topic
  subscribeToVehicleStatus('/fmu/out/vehicle_status')

  // Set up fallback timer - if no messages received in 3 seconds, try fallback topic
  vehicleStatusFallbackTimer = setTimeout(() => {
    if (!hasReceivedVehicleStatus && !usingFallbackTopic) {
      console.log('No messages from /fmu/out/vehicle_status, trying /fmu/out/vehicle_status_v1')
      subscribeToVehicleStatus('/fmu/out/vehicle_status_v1', true)
    }
  }, 3000)

  // Initialize command publisher for direct PX4 commands
  vehicleCommandTopic = new ROSLIB.Topic({
    ros: ros.value as ROSLIB.Ros,
    name: '/fmu/in/vehicle_command',
    messageType: 'px4_msgs/msg/VehicleCommand'
  })

  // Initialize offboard manager command publisher
  offboardManagerTopic = new ROSLIB.Topic({
    ros: ros.value as ROSLIB.Ros,
    name: '/dexi/offboard_manager',
    messageType: 'dexi_interfaces/msg/OffboardNavCommand'
  })

  // Subscribe to battery status topic
  batteryStatusTopic = new ROSLIB.Topic({
    ros: ros.value as ROSLIB.Ros,
    name: '/fmu/out/battery_status',
    messageType: 'px4_msgs/msg/BatteryStatus'
  })

  batteryStatusTopic.subscribe((message: any) => {
    // PX4 battery_status message has 'remaining' field as float (0.0 to 1.0)
    if (message.remaining !== undefined) {
      batteryPercentage.value = message.remaining * 100
    }
  })

  // Subscribe to GPS position topic
  gpsPositionTopic = new ROSLIB.Topic({
    ros: ros.value as ROSLIB.Ros,
    name: '/fmu/out/vehicle_gps_position',
    messageType: 'px4_msgs/msg/VehicleGpsPosition'
  })

  gpsPositionTopic.subscribe((message: any) => {
    // GPS coordinates are already in degrees
    if (message.latitude_deg !== undefined && message.longitude_deg !== undefined) {
      gpsLat.value = message.latitude_deg
      gpsLon.value = message.longitude_deg
    }
  })

  // Subscribe to local position topic for velocity and altitude
  localPositionTopic = new ROSLIB.Topic({
    ros: ros.value as ROSLIB.Ros,
    name: '/fmu/out/vehicle_local_position',
    messageType: 'px4_msgs/msg/VehicleLocalPosition'
  })

  localPositionTopic.subscribe((message: any) => {
    // Calculate ground speed from vx and vy
    if (message.vx !== undefined && message.vy !== undefined) {
      groundSpeed.value = Math.sqrt(message.vx * message.vx + message.vy * message.vy)
    }
    // Altitude from z position (NED frame, so negate for positive up)
    if (message.z !== undefined) {
      altitude.value = -message.z
    }
  })

  // Subscribe to attitude topic for heading
  attitudeTopic = new ROSLIB.Topic({
    ros: ros.value as ROSLIB.Ros,
    name: '/fmu/out/vehicle_attitude',
    messageType: 'px4_msgs/msg/VehicleAttitude'
  })

  attitudeTopic.subscribe((message: any) => {
    // Convert quaternion to heading (yaw in degrees)
    if (message.q !== undefined && message.q.length >= 4) {
      const q = message.q
      // Calculate yaw from quaternion
      const yaw = Math.atan2(2.0 * (q[0] * q[3] + q[1] * q[2]), 1.0 - 2.0 * (q[2] * q[2] + q[3] * q[3]))
      // Convert to degrees and normalize to 0-360
      heading.value = ((yaw * 180.0 / Math.PI) + 360) % 360
    }
  })
})

onBeforeUnmount(() => {
  if (vehicleStatusTopic) {
    vehicleStatusTopic.unsubscribe()
  }
  if (batteryStatusTopic) {
    batteryStatusTopic.unsubscribe()
  }
  if (gpsPositionTopic) {
    gpsPositionTopic.unsubscribe()
  }
  if (localPositionTopic) {
    localPositionTopic.unsubscribe()
  }
  if (attitudeTopic) {
    attitudeTopic.unsubscribe()
  }
  if (vehicleStatusFallbackTimer) {
    clearTimeout(vehicleStatusFallbackTimer)
  }
  // Stop offboard heartbeat via ROS node if active
  if (isOffboardActive.value) {
    sendOffboardManagerCommand('stop_offboard_heartbeat')
  }
  // Close ROS connection
  if (ros.value) {
    ros.value.close()
  }
})

// Vehicle status subscription function with fallback logic
const subscribeToVehicleStatus = (topicName: string, isFallback: boolean = false) => {
  // Unsubscribe from existing topic if any
  if (vehicleStatusTopic) {
    vehicleStatusTopic.unsubscribe()
  }

  if (!ros.value) {
    console.error('Cannot subscribe to vehicle status: ROS not connected')
    return
  }

  console.log(`Subscribing to vehicle status topic: ${topicName}`)

  vehicleStatusTopic = new ROSLIB.Topic({
    ros: ros.value as ROSLIB.Ros,
    name: topicName,
    messageType: 'px4_msgs/msg/VehicleStatus'
  })

  vehicleStatusTopic.subscribe((message: any) => {
    // Mark that we've received a message
    hasReceivedVehicleStatus = true
    if (isFallback) {
      usingFallbackTopic = true
    }

    // Clear fallback timer since we're receiving messages
    if (vehicleStatusFallbackTimer) {
      clearTimeout(vehicleStatusFallbackTimer)
      vehicleStatusFallbackTimer = null
    }

    // Process the vehicle status message
    navState.value = message.nav_state
    isArmed.value = message.arming_state === 2 // 2 = ARMED
    isFlying.value = message.nav_state !== 18 && message.nav_state !== 13
  })
}

// Command functions
const sendCommand = (command: number, param1: number = 0, param2: number = 0, param3: number = 0, param4: number = 0, param5: number = 0, param6: number = 0, param7: number = 0) => {
  if (!vehicleCommandTopic) return

  const cmd: VehicleCommand = {
    timestamp: Date.now() * 1000,
    param1,
    param2,
    param3,
    param4,
    param5,
    param6,
    param7,
    command,
    target_system: 1,
    target_component: 1,
    source_system: 1,
    source_component: 1,
    confirmation: 0,
    from_external: true
  }

  vehicleCommandTopic.publish(cmd)
}

// Send command to offboard manager node
const sendOffboardManagerCommand = (command: string, distance_or_degrees: number = 0.0) => {
  if (!offboardManagerTopic) return

  const message = new ROSLIB.Message({
    command: command,
    distance_or_degrees: distance_or_degrees
  })

  offboardManagerTopic.publish(message)
  console.log(`Sent offboard manager command: ${command}`)
}

const setMode = (mode: number) => {
  console.log('Setting mode:', mode)
  
  // For position mode, we need to set both the base mode and custom mode
  if (mode === 2) { // POSITION mode
    // MAV_CMD_DO_SET_MODE with:
    // param1: MAV_MODE_FLAG_CUSTOM_MODE_ENABLED (1)
    // param2: PX4_CUSTOM_MAIN_MODE_POSCTL (3)
    sendCommand(176, 1, 3)
    console.log('Setting position mode with custom mode enabled')
  } 
  // For takeoff mode, we need to set the altitude
  else if (mode === 17) { // TAKEOFF mode
    sendCommand(22, 0, 0, 0, 0, 0, 0, 3.0) // MAV_CMD_NAV_TAKEOFF with 3m altitude
  } else {
    sendCommand(176, 0, mode) // MAV_CMD_DO_SET_MODE
  }
}

const armDrone = () => {
  sendCommand(400, 1) // MAV_CMD_COMPONENT_ARM_DISARM with param1=1 to arm
}

const land = () => {
  // Send land command to offboard manager - it will handle stopping heartbeat and landing
  sendOffboardManagerCommand('land')
  isOffboardActive.value = false
}

const moveForward = () => {
  // Send move forward command to offboard manager
  sendOffboardManagerCommand('fly_forward', 3.0)
}

// Function to publish local coordinates - not used with ROS node architecture
// The ROS node tracks position and movements internally
const publishLocalPosition = (x: number, y: number, z: number = -1.0, yaw: number = 0) => {
  // Update the target position for reference
  offboardTargetPosition.value = { x, y, z, yaw }
  console.log(`Target position updated: x=${x}m, y=${y}m, z=${z}m, yaw=${yaw}°`)
  console.log('Note: Direct position publishing not supported with ROS node architecture')
}

// Offboard mode functions
const toggleOffboardMode = () => {
  if (isOffboardActive.value) {
    stopOffboardMode()
  } else {
    startOffboardMode()
  }
}

const startOffboardMode = () => {
  if (isOffboardActive.value) return

  console.log('Starting offboard mode via ROS node')
  isOffboardActive.value = true

  // Send command to ROS node to start offboard heartbeat
  sendOffboardManagerCommand('start_offboard_heartbeat')
}

const stopOffboardMode = () => {
  if (!isOffboardActive.value) return

  console.log('Stopping offboard mode via ROS node')

  // Send command to ROS node to stop offboard heartbeat
  sendOffboardManagerCommand('stop_offboard_heartbeat')
  isOffboardActive.value = false
}

// Expose functions and state for other components
defineExpose({
  publishLocalPosition,
  isOffboardActive,
  offboardTargetPosition
})
</script> 