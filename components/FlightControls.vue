<template>
  <div class="w-full bg-gray-900 text-white p-4">
    <!-- Flight Mode Display -->
    <div class="flex items-center space-x-4 mb-4">
      <span class="text-gray-400">Flight Mode:</span>
      <span class="font-mono">{{ flightMode }}</span>
    </div>

    <!-- Control Buttons -->
    <div class="flex items-center space-x-4">
      <!-- Mode Buttons -->
      <button 
        @click="setMode(2)" 
        class="px-3 py-1.5 text-sm bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        Position Mode
      </button>
      <button 
        @click="setMode(17)" 
        class="px-3 py-1.5 text-sm bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        Takeoff Mode
      </button>
      <button
        @click="toggleOffboardMode"
        class="px-3 py-1.5 text-sm rounded-lg"
        :class="isOffboardActive ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'"
      >
        {{ isOffboardActive ? 'Disable Offboard' : 'Offboard Mode' }}
      </button>

      <!-- Arm Button -->
      <button 
        @click="armDrone" 
        :disabled="isArmed"
        class="px-3 py-1.5 text-sm rounded-lg"
        :class="isArmed ? 'bg-green-600' : 'bg-red-600 hover:bg-red-700'"
      >
        {{ isArmed ? 'Armed' : 'Arm' }}
      </button>

      <!-- Move Forward Button -->
      <button 
        @click="moveForward" 
        :disabled="!isFlying"
        class="px-3 py-1.5 text-sm bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        Move Forward 3m
      </button>

      <!-- Land Button -->
      <button 
        @click="land" 
        :disabled="!isFlying"
        class="px-3 py-1.5 text-sm bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
      >
        Land
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineExpose } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'

const { getROSURL } = useROS()

// ROS connection
const ros = new ROSLIB.Ros({
  url: getROSURL()
})

// State
const flightMode = ref('Unknown')
const isArmed = ref(false)
const isFlying = ref(false)
const isOffboardActive = ref(false)

// Offboard target position (reactive so it can be updated by other components)
const offboardTargetPosition = ref({ x: 0, y: 0, z: -1.0, yaw: 0 })

// Topics
let vehicleStatusTopic: ROSLIB.Topic | null = null
let vehicleCommandTopic: ROSLIB.Topic | null = null
let positionSetpointTopic: ROSLIB.Topic | null = null
let offboardControlModeTopic: ROSLIB.Topic | null = null
let trajectorySetpointTopic: ROSLIB.Topic | null = null

// Offboard heartbeat timer
let offboardHeartbeatTimer: NodeJS.Timeout | null = null

// Flight mode mapping
const flightModes: { [key: number]: string } = {
  0: 'MANUAL',
  1: 'ALTITUDE',
  2: 'POSITION',
  3: 'MISSION',
  4: 'HOLD',
  5: 'RTL',
  6: 'SLOW',
  7: 'FREE5',
  8: 'FREE4',
  9: 'FREE3',
  10: 'ACRO',
  11: 'FREE2',
  12: 'DESCEND',
  13: 'TERMINATION',
  14: 'OFFBOARD',
  15: 'STABILIZED',
  16: 'FREE1',
  17: 'TAKEOFF',
  18: 'LAND',
  19: 'TARGET',
  20: 'PRECLAND',
  21: 'ORBIT',
  22: 'VTOL_TAKEOFF'
}

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
  // Subscribe to vehicle status
  vehicleStatusTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/fmu/out/vehicle_status',
    messageType: 'px4_msgs/msg/VehicleStatus'
  })

  vehicleStatusTopic.subscribe((message: any) => {
    // console.log('Vehicle Status:', {
    //   nav_state: message.nav_state,
    //   arming_state: message.arming_state,
    //   flight_mode: flightModes[message.nav_state] || 'Unknown',
    //   is_armed: message.arming_state === 2,
    //   is_flying: message.nav_state !== 18 && message.nav_state !== 13
    // })
    
    flightMode.value = flightModes[message.nav_state] || 'Unknown'
    isArmed.value = message.arming_state === 2 // 2 = ARMED
    isFlying.value = message.nav_state !== 18 && message.nav_state !== 13
  })

  // Initialize command publisher
  vehicleCommandTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/fmu/in/vehicle_command',
    messageType: 'px4_msgs/msg/VehicleCommand'
  })

  // Initialize position setpoint publisher
  positionSetpointTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/fmu/in/position_setpoint',
    messageType: 'px4_msgs/msg/PositionSetpoint'
  })

  // Initialize offboard control mode publisher
  offboardControlModeTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/fmu/in/offboard_control_mode',
    messageType: 'px4_msgs/msg/OffboardControlMode'
  })

  // Initialize trajectory setpoint publisher
  trajectorySetpointTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/fmu/in/trajectory_setpoint',
    messageType: 'px4_msgs/msg/TrajectorySetpoint'
  })
})

onBeforeUnmount(() => {
  if (vehicleStatusTopic) {
    vehicleStatusTopic.unsubscribe()
  }
  // Stop offboard heartbeat if active
  stopOffboardHeartbeat()
})

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

const setMode = (mode: number) => {
  console.log('Setting mode:', mode, 'Current mode:', flightMode.value)
  
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
  sendCommand(21) // MAV_CMD_NAV_LAND
}

const moveForward = () => {
  if (!trajectorySetpointTopic) return

  const setpoint = {
    timestamp: Date.now() * 1000,
    position: [3.0, 0, -1.0], // Move 3 meters forward in NED frame (x=3, y=0, z=-1)
    velocity: [0, 0, 0],
    acceleration: [0, 0, 0],
    jerk: [0, 0, 0],
    yaw: 0
  }

  trajectorySetpointTopic.publish(setpoint)
  console.log('Sending move forward command using trajectory setpoint')
}

// Function to publish local coordinates to trajectory setpoint
const publishLocalPosition = (x: number, y: number, z: number = -1.0, yaw: number = 0) => {
  if (!trajectorySetpointTopic) return

  // Update the target position for the heartbeat
  offboardTargetPosition.value = { x, y, z, yaw }

  const setpoint = {
    timestamp: Date.now() * 1000,
    position: [x, y, z], // Local coordinates in NED frame
    velocity: [0, 0, 0],
    acceleration: [0, 0, 0],
    jerk: [0, 0, 0],
    yaw: yaw
  }

  trajectorySetpointTopic.publish(setpoint)
  console.log(`Sending trajectory setpoint: x=${x}m, y=${y}m, z=${z}m, yaw=${yaw}°`)
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

  console.log('Starting offboard mode')
  isOffboardActive.value = true

  // Start publishing offboard heartbeat first
  startOffboardHeartbeat()

  // Wait 1 second, then set flight mode to offboard
  setTimeout(() => {
    sendCommand(176, 1, 6) // MAV_CMD_DO_SET_MODE with custom mode enabled, offboard
    console.log('Switching to offboard mode after heartbeat delay')
  }, 1000)
}

const stopOffboardMode = () => {
  if (!isOffboardActive.value) return

  console.log('Stopping offboard heartbeat - PX4 will automatically exit offboard')
  stopOffboardHeartbeat()
}

const startOffboardHeartbeat = () => {
  if (!offboardControlModeTopic || !trajectorySetpointTopic) return

  // Publish initial offboard control mode message
  const offboardControlMode = {
    timestamp: Date.now() * 1000,
    position: true,
    velocity: false,
    acceleration: false,
    attitude: false,
    body_rate: false
  }

  // Publish initial trajectory setpoint (hold current position)
  const trajectorySetpoint = {
    timestamp: Date.now() * 1000,
    position: [offboardTargetPosition.value.x, offboardTargetPosition.value.y, offboardTargetPosition.value.z],
    velocity: [0, 0, 0],
    acceleration: [0, 0, 0],
    jerk: [0, 0, 0],
    yaw: offboardTargetPosition.value.yaw
  }

  offboardControlModeTopic.publish(offboardControlMode)
  trajectorySetpointTopic.publish(trajectorySetpoint)

  // Start heartbeat timer (publish every 50ms)
  offboardHeartbeatTimer = setInterval(() => {
    const timestamp = Date.now() * 1000
    
    // Publish offboard control mode heartbeat
    offboardControlModeTopic.publish({
      timestamp,
      position: true,
      velocity: false,
      acceleration: false,
      attitude: false,
      body_rate: false
    })

    // Publish trajectory setpoint heartbeat using current target position
    trajectorySetpointTopic.publish({
      timestamp,
      position: [offboardTargetPosition.value.x, offboardTargetPosition.value.y, offboardTargetPosition.value.z],
      velocity: [0, 0, 0],
      acceleration: [0, 0, 0],
      jerk: [0, 0, 0],
      yaw: offboardTargetPosition.value.yaw
    })
  }, 50) // 50ms = 20Hz

  console.log('Offboard heartbeat started')
}

const stopOffboardHeartbeat = () => {
  if (offboardHeartbeatTimer) {
    clearInterval(offboardHeartbeatTimer)
    offboardHeartbeatTimer = null
    isOffboardActive.value = false
    console.log('Offboard heartbeat stopped')
  }
}

// Expose functions and state for other components
defineExpose({
  publishLocalPosition,
  isOffboardActive,
  offboardTargetPosition
})
</script> 