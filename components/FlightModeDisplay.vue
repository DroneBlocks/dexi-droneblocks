<template>
  <div class="flight-mode-display">
    <span class="mode-label">Flight Mode:</span>
    <span class="mode-value">{{ flightMode }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import ROSLIB from 'roslib'

interface Props {
  ros: ROSLIB.Ros | null
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  className: ''
})

const flightMode = ref('Unknown')

// Flight mode mapping (comprehensive PX4 nav_state values)
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

let vehicleStatusTopic: ROSLIB.Topic | null = null
let vehicleStatusFallbackTimer: NodeJS.Timeout | null = null
let hasReceivedVehicleStatus = false
let usingFallbackTopic = false

const subscribeToVehicleStatus = (topicName: string, isFallback: boolean = false) => {
  // Unsubscribe from existing topic if any
  if (vehicleStatusTopic) {
    vehicleStatusTopic.unsubscribe()
  }

  if (!props.ros) {
    console.log(`FlightModeDisplay: Cannot subscribe to ${topicName} - ROS not connected`)
    return
  }

  console.log(`FlightModeDisplay: Subscribing to ${topicName}`)

  vehicleStatusTopic = new ROSLIB.Topic({
    ros: props.ros,
    name: topicName,
    messageType: 'px4_msgs/msg/VehicleStatus'
  })

  vehicleStatusTopic.subscribe((message: any) => {
    hasReceivedVehicleStatus = true
    if (isFallback) {
      usingFallbackTopic = true
    }

    if (vehicleStatusFallbackTimer) {
      clearTimeout(vehicleStatusFallbackTimer)
      vehicleStatusFallbackTimer = null
    }

    flightMode.value = flightModes[message.nav_state] || `Unknown (${message.nav_state})`
  })
}

const setupSubscriptions = () => {
  // Reset state
  hasReceivedVehicleStatus = false
  usingFallbackTopic = false

  if (vehicleStatusFallbackTimer) {
    clearTimeout(vehicleStatusFallbackTimer)
    vehicleStatusFallbackTimer = null
  }

  // Start with primary vehicle status topic
  subscribeToVehicleStatus('/fmu/out/vehicle_status')

  // Set up fallback timer - if no messages received in 3 seconds, try fallback topic
  vehicleStatusFallbackTimer = setTimeout(() => {
    if (!hasReceivedVehicleStatus && !usingFallbackTopic) {
      console.log('FlightModeDisplay: No messages from /fmu/out/vehicle_status, trying /fmu/out/vehicle_status_v1')
      subscribeToVehicleStatus('/fmu/out/vehicle_status_v1', true)
    }
  }, 3000)
}

// Watch for ROS connection changes
watch(() => props.ros, (newRos) => {
  if (newRos) {
    console.log('FlightModeDisplay: ROS connection available, subscribing...')
    setupSubscriptions()
  } else {
    flightMode.value = 'Unknown'
  }
}, { immediate: true })

onMounted(() => {
  if (props.ros) {
    setupSubscriptions()
  }
})

onBeforeUnmount(() => {
  if (vehicleStatusTopic) {
    vehicleStatusTopic.unsubscribe()
  }
  if (vehicleStatusFallbackTimer) {
    clearTimeout(vehicleStatusFallbackTimer)
  }
})

// Expose flight mode for parent components if needed
defineExpose({ flightMode })
</script>

<style scoped>
.flight-mode-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  background: rgba(42, 157, 143, 0.15);
  border-radius: 6px;
  border: 1px solid rgba(42, 157, 143, 0.3);
}

.mode-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.mode-value {
  color: #4ade80;
  font-weight: 600;
}
</style>
