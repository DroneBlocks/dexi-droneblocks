<template>
  <!-- Draggable Widget -->
  <div
    v-if="isOpen"
    ref="widgetRef"
    class="fixed z-50 bg-gray-800 text-white rounded-lg shadow-lg border border-gray-600 select-none"
    :style="{ left: position.x + 'px', top: position.y + 'px', width: widgetWidth + 'px' }"
    @mousedown="startDrag"
  >
    <!-- Header with drag handle -->
    <div class="flex justify-between items-center p-3 bg-gray-700 rounded-t-lg cursor-move">
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 rounded-full" :class="isConnected ? 'bg-green-500' : 'bg-red-500'"></div>
        <span class="text-sm font-medium">Keyboard Control</span>
        <span class="px-2 py-0.5 rounded text-xs font-medium"
              :class="isActive ? 'bg-green-600' : 'bg-gray-600'">
          {{ isActive ? 'ON' : 'OFF' }}
        </span>
      </div>
      <button
        @click="close"
        class="p-1 hover:bg-gray-600 rounded"
        @mousedown.stop
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Compact Controls -->
    <div class="p-3 space-y-2">
      <!-- Control Toggle -->
      <div class="flex">
        <button
          @click="toggleControl"
          class="w-full px-3 py-2 text-sm rounded font-medium transition-colors"
          :class="isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'"
          @mousedown.stop
        >
          {{ isActive ? 'Stop Control' : 'Start Control' }}
        </button>
      </div>

      <!-- Last Command (if active) -->
      <div v-if="isActive && lastCommand" class="text-xs bg-gray-700 p-2 rounded">
        <span class="text-gray-400">Last:</span>
        <span class="ml-1 font-mono">{{ lastCommand.command }}</span>
        <span v-if="lastCommand.distance_or_degrees" class="text-gray-400">
          ({{ lastCommand.distance_or_degrees }}{{ lastCommand.command.includes('yaw') ? '°' : 'm' }})
        </span>
      </div>

      <!-- Controls -->
      <div class="mt-3 space-y-3">
        <!-- Quick Key Reference -->
        <div class="text-xs">
          <div class="font-medium mb-2">Controls:</div>
          <div class="grid grid-cols-2 gap-[50px]">
            <!-- Left Column: T W S A D -->
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">T</span>
                <span class="text-gray-300">Takeoff</span>
              </div>
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">W</span>
                <span class="text-gray-300">Fly Up</span>
              </div>
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">S</span>
                <span class="text-gray-300">Fly Down</span>
              </div>
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">A</span>
                <span class="text-gray-300">Yaw Left</span>
              </div>
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">D</span>
                <span class="text-gray-300">Yaw Right</span>
              </div>
            </div>

            <!-- Right Column: L and Arrows -->
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">L</span>
                <span class="text-gray-300">Land</span>
              </div>
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">↑</span>
                <span class="text-gray-300">Forward</span>
              </div>
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">↓</span>
                <span class="text-gray-300">Backward</span>
              </div>
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">←</span>
                <span class="text-gray-300">Fly Left</span>
              </div>
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">→</span>
                <span class="text-gray-300">Fly Right</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div class="text-xs">
          <div class="flex justify-between">
            <span>ROS:</span>
            <span :class="isConnected ? 'text-green-400' : 'text-red-400'">
              {{ isConnected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const { getROSURL } = useROS()

// ROS connection and publisher
const ros = ref(null)
const cmdPublisher = ref(null)
const isConnected = ref(false)
const isActive = ref(false)
const lastCommand = ref(null)

// Widget state
const widgetRef = ref(null)
const widgetWidth = 240
const position = ref({ x: 20, y: 80 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// Key mapping based on dexi_offboard implementation
const keyMappings = {
  // Left stick - Throttle/Yaw (WASD)
  'w': { command: 'fly_up', distance_or_degrees: 1.0 },
  'W': { command: 'fly_up', distance_or_degrees: 1.0 },
  's': { command: 'fly_down', distance_or_degrees: 1.0 },
  'S': { command: 'fly_down', distance_or_degrees: 1.0 },
  'a': { command: 'yaw_left', distance_or_degrees: 90.0 },
  'A': { command: 'yaw_left', distance_or_degrees: 90.0 },
  'd': { command: 'yaw_right', distance_or_degrees: 90.0 },
  'D': { command: 'yaw_right', distance_or_degrees: 90.0 },

  // Right stick - Pitch/Roll (Arrow keys)
  'ArrowUp': { command: 'fly_forward', distance_or_degrees: 1.0 },
  'ArrowDown': { command: 'fly_backward', distance_or_degrees: 1.0 },
  'ArrowLeft': { command: 'fly_left', distance_or_degrees: 1.0 },
  'ArrowRight': { command: 'fly_right', distance_or_degrees: 1.0 },

  // Takeoff and Land
  't': { command: 'fly_up', distance_or_degrees: 1.0 },
  'T': { command: 'fly_up', distance_or_degrees: 1.0 },
  'l': { command: 'land', distance_or_degrees: 0.0 },
  'L': { command: 'land', distance_or_degrees: 0.0 }
}

const initializeROS = () => {
  try {
    ros.value = new ROSLIB.Ros({
      url: getROSURL()
    })

    ros.value.on('connection', () => {
      console.log('ROS connected for keyboard control')
      isConnected.value = true

      // Create publisher for offboard commands
      cmdPublisher.value = new ROSLIB.Topic({
        ros: ros.value,
        name: '/dexi/offboard_manager',
        messageType: 'dexi_interfaces/msg/OffboardNavCommand'
      })
    })

    ros.value.on('error', (error) => {
      console.log('ROS connection error:', error)
      isConnected.value = false
    })

    ros.value.on('close', () => {
      console.log('ROS connection closed')
      isConnected.value = false
    })
  } catch (error) {
    console.error('Failed to initialize ROS:', error)
  }
}

const sendCommand = (command, distance_or_degrees = 0.0) => {
  if (!isConnected.value || !cmdPublisher.value) {
    console.warn('ROS not connected, cannot send command')
    return
  }

  const message = new ROSLIB.Message({
    command: command,
    distance_or_degrees: distance_or_degrees
  })

  cmdPublisher.value.publish(message)
  lastCommand.value = { command, distance_or_degrees }
  console.log(`Sent command: ${command} (${distance_or_degrees})`)
}

const handleKeyPress = (event) => {
  if (!isActive.value || !props.isOpen) return

  const key = event.key
  const mapping = keyMappings[key]

  if (mapping) {
    event.preventDefault()

    // Special handling for land command - stop heartbeat first
    if (key === 'l' || key === 'L') {
      sendCommand('stop_offboard_heartbeat')
      console.log('Stopping offboard heartbeat before landing')
      isActive.value = false
    }

    sendCommand(mapping.command, mapping.distance_or_degrees)
  }
}

const toggleControl = () => {
  if (!isActive.value) {
    // Starting keyboard control - enable offboard mode
    sendCommand('start_offboard_heartbeat')
    console.log('Starting offboard heartbeat for keyboard control')
    isActive.value = true
  } else {
    // Stopping keyboard control - disable offboard mode
    sendCommand('stop_offboard_heartbeat')
    console.log('Stopping offboard heartbeat')
    isActive.value = false
  }
}


// Drag functionality
const startDrag = (event) => {
  if (event.target.closest('button')) return // Don't drag when clicking buttons

  isDragging.value = true
  const rect = widgetRef.value.getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  event.preventDefault()
}

const onDrag = (event) => {
  if (!isDragging.value) return

  const x = event.clientX - dragOffset.value.x
  const y = event.clientY - dragOffset.value.y

  // Keep widget within viewport bounds
  const maxX = window.innerWidth - widgetWidth
  const maxY = window.innerHeight - 100

  position.value = {
    x: Math.max(0, Math.min(x, maxX)),
    y: Math.max(0, Math.min(y, maxY))
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

const close = () => {
  // Stop keyboard control and heartbeat when closing the widget
  if (isActive.value) {
    sendCommand('stop_offboard_heartbeat')
    console.log('Stopping offboard heartbeat on widget close')
    isActive.value = false
  }
  emit('close')
}

onMounted(() => {
  initializeROS()
  document.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  if (ros.value) {
    ros.value.close()
  }
})
</script>