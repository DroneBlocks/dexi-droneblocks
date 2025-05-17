<template>
  <div class="flex h-full">
    <!-- Left side - Controls and Grid -->
    <div class="w-1/2 flex flex-col">
      <!-- Controls Section -->
      <div class="bg-gray-900 text-white p-4">
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

      <!-- Drone Grid Section -->
      <div class="flex-1 bg-gray-800">
        <slot></slot>
      </div>
    </div>

    <!-- Right side - Unity Container -->
    <div class="w-1/2 bg-gray-800 p-4">
      <div class="h-full flex flex-col">
        <div class="text-white text-lg font-semibold mb-4">Unity Visualization</div>
        <div class="flex-1 bg-gray-700 rounded-lg flex items-center justify-center">
          <span class="text-gray-400">Unity WebGL content will be placed here</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
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

// Topics
let vehicleStatusTopic: ROSLIB.Topic | null = null
let vehicleCommandTopic: ROSLIB.Topic | null = null
let positionSetpointTopic: ROSLIB.Topic | null = null

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
})

onBeforeUnmount(() => {
  if (vehicleStatusTopic) {
    vehicleStatusTopic.unsubscribe()
  }
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
  if (!positionSetpointTopic) return

  const setpoint = {
    timestamp: Date.now() * 1000,
    valid: true,
    type: 0, // SETPOINT_TYPE_POSITION
    vx: 3.0, // Move 3 meters forward in NED frame
    vy: 0,
    vz: 0,
    lat: 0,
    lon: 0,
    alt: 0, // Maintain current altitude
    yaw: 0, // Maintain current yaw
    loiter_radius: 0,
    loiter_minor_radius: 0,
    loiter_direction_counter_clockwise: false,
    loiter_orientation: 0,
    loiter_pattern: 0,
    acceptance_radius: 0.3,
    cruising_speed: 0,
    gliding_enabled: false,
    cruising_throttle: 0
  }

  positionSetpointTopic.publish(setpoint)
  console.log('Sending move forward command')
}
</script> 