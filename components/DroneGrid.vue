<template>
  <div class="relative w-full h-full bg-gray-800 p-4 flex-1">
    <!-- Position Display Widget -->
    <div class="absolute top-4 right-4 bg-gray-900/80 text-white p-3 rounded-lg shadow-lg z-10">
      <div class="text-sm font-mono space-y-1">
        <div class="flex justify-between">
          <span class="text-gray-400">X:</span>
          <span>{{ formatNumber(dronePosition.x) }}m</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Y:</span>
          <span>{{ formatNumber(dronePosition.y) }}m</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Z:</span>
          <span>{{ formatNumber(dronePosition.z) }}m</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Yaw:</span>
          <span>{{ formatNumber(droneOrientation) }}°</span>
        </div>
      </div>
    </div>

    <!-- Grid Container -->
    <div class="relative w-full h-full border border-gray-600" @click="handleGridClick">
      <!-- Grid Lines -->
      <div class="absolute inset-0 grid grid-cols-10 grid-rows-10">
        <div v-for="i in 100" :key="i" class="border border-gray-700"></div>
      </div>
      
      <!-- Scale Labels -->
      <div class="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-400">
        <span>-5m</span>
        <span>0m</span>
        <span>5m</span>
      </div>
      <div class="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-2 text-xs text-gray-400">
        <span>5m</span>
        <span>0m</span>
        <span>-5m</span>
      </div>

      <!-- Drone Representation -->
      <div 
        class="absolute w-4 h-4 rounded-full bg-red-500"
        :style="{
          left: `${(dronePosition.y + 5) * 10}%`,
          bottom: `${(dronePosition.x + 5) * 10}%`,
          transform: `translate(-50%, -50%) rotate(${droneOrientation}deg)`
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, inject, defineExpose } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'

interface OdometryMessage {
  position: [number, number, number]
  q: [number, number, number, number]
}

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

const { getROSURL } = useROS()

// Initialize ROS connection
const ros = new ROSLIB.Ros({
  url: getROSURL()
})

// Helper function to safely format numbers
const formatNumber = (value: number | undefined): string => {
  if (value === undefined) return '0.00'
  return value.toFixed(2)
}

// Drone state with proper initialization
const dronePosition = ref({ x: 0, y: 0, z: 0 })
const droneOrientation = ref(0)

// Odometry topic subscription
let odometryTopic: ROSLIB.Topic | null = null

// Add command publisher
let commandTopic: ROSLIB.Topic | null = null

// Get reference to FlightControls component (will be provided by parent)
const flightControlsRef = ref()

onMounted(() => {
  // Subscribe to odometry topic
  odometryTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/fmu/out/vehicle_odometry',
    messageType: 'px4_msgs/msg/VehicleOdometry'
  })

  odometryTopic.subscribe((message: OdometryMessage) => {
    // Update drone position (convert from NED to grid coordinates)
    if (message && Array.isArray(message.position) && message.position.length === 3) {
      dronePosition.value = {
        x: message.position[0],  // East position
        y: -message.position[1], // North position (inverted for grid)
        z: -message.position[2]  // Down position (inverted for up)
      }
      
      // Update orientation (convert from quaternion to degrees)
      if (message.q && Array.isArray(message.q) && message.q.length === 4) {
        const q = message.q
        droneOrientation.value = Math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * (180 / Math.PI)
      }
    } else {
      console.warn('Invalid odometry message format:', message)
    }
  })

  // Initialize command publisher
  commandTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/fmu/in/vehicle_command',
    messageType: 'px4_msgs/msg/VehicleCommand'
  })
})

onBeforeUnmount(() => {
  if (odometryTopic) {
    odometryTopic.unsubscribe()
  }
})

const handleGridClick = (event: MouseEvent) => {
  // Get the grid container element
  const gridContainer = event.currentTarget as HTMLElement
  const rect = gridContainer.getBoundingClientRect()
  
  // Calculate relative position within the grid (0 to 1)
  const relativeX = (event.clientX - rect.left) / rect.width
  const relativeY = (rect.bottom - event.clientY) / rect.height
  
  // Convert to grid coordinates (-5 to 5 meters)
  // Fix: Use X mouse position for X coordinate (East) and Y mouse position for Y coordinate (North)
  const gridX = (relativeX * 10) - 5  // X mouse → X coordinate (East)
  const gridY = (relativeY * 10) - 5  // Y mouse → Y coordinate (North)
  
  // Convert to NED frame for PX4:
  // - gridX (East) maps to NED X (East) - no change needed
  // - gridY (North) maps to NED Y (North) - no change needed
  // - Z is already in NED frame (-1.0 = 1m above ground)
  const nedX = gridX
  const nedY = gridY
  
  // Use FlightControls component's publishLocalPosition function if available
  if (flightControlsRef.value && flightControlsRef.value.publishLocalPosition) {
    flightControlsRef.value.publishLocalPosition(nedX, nedY, -1.0, 0)
    console.log(`Using FlightControls to send drone to local position: x=${nedX.toFixed(2)}m, y=${nedY.toFixed(2)}m, z=-1.0m`)
  } else {
    console.warn('FlightControls component not available, cannot send trajectory setpoint')
  }
}

// Expose the ref for parent components to set
defineExpose({
  flightControlsRef
})
</script>

<style scoped>
.grid-container {
  aspect-ratio: 1;
}
</style> 