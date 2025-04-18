<template>
  <div class="relative w-full h-full bg-gray-800 p-4">
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'

interface OdometryMessage {
  x: number
  y: number
  z: number
  q: [number, number, number, number]  // Quaternion [w, x, y, z]
}

const { getROSURL } = useROS()

// Initialize ROS connection
const ros = new ROSLIB.Ros({
  url: getROSURL()
})

// Drone state
const dronePosition = ref({ x: 0, y: 0 })
const droneOrientation = ref(0)

// Odometry topic subscription
let odometryTopic: ROSLIB.Topic | null = null

onMounted(() => {
  // Subscribe to odometry topic
  odometryTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/fmu/out/vehicle_odometry',
    messageType: 'px4_msgs/msg/VehicleOdometry'
  })

  odometryTopic.subscribe((message: OdometryMessage) => {
    // Update drone position (convert from NED to grid coordinates)
    dronePosition.value = {
      x: message.x,  // East position
      y: -message.y  // North position (inverted for grid)
    }
    
    // Update orientation (convert from quaternion to degrees)
    const q = message.q
    droneOrientation.value = Math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * (180 / Math.PI)
  })
})

onBeforeUnmount(() => {
  if (odometryTopic) {
    odometryTopic.unsubscribe()
  }
})

const handleGridClick = (event: MouseEvent) => {
  // Get the grid container element (the one with the click handler)
  const gridContainer = event.currentTarget as HTMLElement
  const rect = gridContainer.getBoundingClientRect()
  
  // Calculate relative position within the grid (0 to 1)
  const relativeX = (event.clientX - rect.left) / rect.width
  const relativeY = (rect.bottom - event.clientY) / rect.height
  
  // Convert to grid coordinates (-5 to 5 meters)
  // X is vertical (up/down), Y is horizontal (left/right)
  const gridX = (relativeY * 10) - 5  // Convert to -5 to 5 range
  const gridY = (relativeX * 10) - 5  // Convert to -5 to 5 range
  
  console.log(`Grid click at: x=${gridX.toFixed(2)}m, y=${gridY.toFixed(2)}m`)
}
</script>

<style scoped>
.grid-container {
  aspect-ratio: 1;
}
</style> 