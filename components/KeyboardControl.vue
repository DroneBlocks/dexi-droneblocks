<template>
  <!-- Draggable Widget -->
  <div
    v-if="isOpen"
    ref="widgetRef"
    class="fixed z-[2000] bg-gray-800 text-white rounded-lg shadow-lg select-none"
    :class="[
      isActive && !hasFocus ? 'border-2 border-yellow-500' : 'border border-gray-600'
    ]"
    :style="{ left: position.x + 'px', top: position.y + 'px', width: widgetWidth + 'px' }"
    @mousedown="startDrag"
    @touchstart="startDrag"
    @click="recaptureFocus"
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

    <!-- Focus Lost Warning -->
    <div
      v-if="isActive && !hasFocus"
      class="bg-yellow-500 text-black text-xs text-center py-2 px-3 cursor-pointer"
      @click.stop="recaptureFocus"
    >
      Click here to regain keyboard control
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

      <!-- Active keys display -->
      <div v-if="isActive" class="text-xs bg-gray-700 p-2 rounded">
        <span class="text-gray-400">Active:</span>
        <span v-if="activeKeys.size > 0" class="ml-1 font-mono">
          {{ Array.from(activeKeys).map(k => keyLabels[k] || k).join(' + ') }}
        </span>
        <span v-else class="ml-1 text-gray-500">none</span>
      </div>

      <!-- Controls -->
      <div class="mt-3 space-y-3">
        <!-- Quick Key Reference -->
        <div class="text-xs">
          <div class="font-medium mb-2">Controls (hold for continuous):</div>
          <div class="grid grid-cols-2 gap-[50px]">
            <!-- Left Column: T W S A D -->
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">T</span>
                <span class="text-gray-300">Takeoff</span>
              </div>
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">W</span>
                <span class="text-gray-300">Up</span>
              </div>
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">S</span>
                <span class="text-gray-300">Down</span>
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
                <span class="text-gray-300">Left</span>
              </div>
              <div class="flex justify-between">
                <span class="font-mono bg-gray-700 px-1 rounded">→</span>
                <span class="text-gray-300">Right</span>
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
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

// Widget state
const widgetRef = ref(null)
const widgetWidth = 240
const position = ref({ x: 20, y: 80 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const hasFocus = ref(true)

// Velocity control state
const activeKeys = reactive(new Set())
let velocityInterval = null

// Velocity speeds
const XY_SPEED = 1.0    // m/s
const Z_SPEED = 0.3     // m/s
const YAW_RATE = 45.0   // deg/s

// Key labels for display
const keyLabels = {
  'ArrowUp': '↑',
  'ArrowDown': '↓',
  'ArrowLeft': '←',
  'ArrowRight': '→',
  'w': 'W', 'W': 'W',
  's': 'S', 'S': 'S',
  'a': 'A', 'A': 'A',
  'd': 'D', 'D': 'D'
}

// Keys that produce velocity commands (normalized to lowercase for tracking)
const velocityKeys = new Set([
  'w', 's', 'a', 'd',
  'arrowup', 'arrowdown', 'arrowleft', 'arrowright'
])

const normalizeKey = (key) => key.toLowerCase()

const computeVelocity = () => {
  let vx = 0, vy = 0, vz = 0, yawRate = 0

  // Arrows: body-frame XY
  if (activeKeys.has('arrowup'))    vx += XY_SPEED
  if (activeKeys.has('arrowdown'))  vx -= XY_SPEED
  if (activeKeys.has('arrowright')) vy += XY_SPEED
  if (activeKeys.has('arrowleft')) vy -= XY_SPEED

  // W/S: up/down (NED: negative Z = up)
  if (activeKeys.has('w')) vz -= Z_SPEED
  if (activeKeys.has('s')) vz += Z_SPEED

  // A/D: yaw
  if (activeKeys.has('d')) yawRate += YAW_RATE
  if (activeKeys.has('a')) yawRate -= YAW_RATE

  return { vx, vy, vz, yawRate }
}

const sendVelocityCommand = () => {
  if (!isConnected.value || !cmdPublisher.value) return

  const { vx, vy, vz, yawRate } = computeVelocity()

  const message = new ROSLIB.Message({
    command: 'set_velocity_body',
    distance_or_degrees: 0.0,
    north: vx,
    east: vy,
    down: vz,
    yaw: yawRate
  })

  cmdPublisher.value.publish(message)
}

const sendStopVelocity = () => {
  if (!isConnected.value || !cmdPublisher.value) return

  const message = new ROSLIB.Message({
    command: 'stop_velocity',
    distance_or_degrees: 0.0,
    north: 0.0,
    east: 0.0,
    down: 0.0,
    yaw: 0.0
  })

  cmdPublisher.value.publish(message)
  console.log('Sent stop_velocity')
}

const startVelocityLoop = () => {
  if (velocityInterval) return
  // Publish at 10Hz while any velocity key is held
  sendVelocityCommand()
  velocityInterval = setInterval(sendVelocityCommand, 100)
}

const stopVelocityLoop = () => {
  if (velocityInterval) {
    clearInterval(velocityInterval)
    velocityInterval = null
  }
  sendStopVelocity()
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
  console.log(`Sent command: ${command} (${distance_or_degrees})`)
}

const handleKeyDown = (event) => {
  if (!isActive.value || !props.isOpen) return

  const key = event.key
  const normKey = normalizeKey(key)

  // Takeoff (one-shot, not velocity)
  if (normKey === 't') {
    event.preventDefault()
    sendCommand('offboard_takeoff', 2.0)
    return
  }

  // Land (one-shot)
  if (normKey === 'l') {
    event.preventDefault()
    sendCommand('stop_offboard_heartbeat')
    console.log('Stopping offboard heartbeat before landing')
    sendCommand('land')
    isActive.value = false
    // Clean up velocity state
    activeKeys.clear()
    stopVelocityLoop()
    return
  }

  // Velocity keys
  if (velocityKeys.has(normKey)) {
    event.preventDefault()
    if (!activeKeys.has(normKey)) {
      activeKeys.add(normKey)
      startVelocityLoop()
    }
  }
}

const handleKeyUp = (event) => {
  if (!isActive.value || !props.isOpen) return

  const normKey = normalizeKey(event.key)

  if (velocityKeys.has(normKey) && activeKeys.has(normKey)) {
    event.preventDefault()
    activeKeys.delete(normKey)

    if (activeKeys.size === 0) {
      // All keys released — stop and hold
      stopVelocityLoop()
    } else {
      // Still have keys held — update velocity immediately
      sendVelocityCommand()
    }
  }
}

const toggleControl = () => {
  if (!isActive.value) {
    // Starting keyboard control - enable offboard mode
    sendCommand('start_offboard_heartbeat')
    console.log('Starting offboard heartbeat for keyboard control')
    isActive.value = true
    recaptureFocus()
  } else {
    // Stopping keyboard control - disable offboard mode
    activeKeys.clear()
    if (velocityInterval) {
      clearInterval(velocityInterval)
      velocityInterval = null
    }
    sendCommand('stop_offboard_heartbeat')
    console.log('Stopping offboard heartbeat')
    isActive.value = false
  }
}

// Focus management - detect when iframe captures focus
const recaptureFocus = () => {
  // Blur any iframe that might have focus
  const iframes = document.querySelectorAll('iframe')
  iframes.forEach(iframe => {
    iframe.blur()
  })
  // Focus the main window
  window.focus()
  hasFocus.value = true
}

const handleWindowFocus = () => {
  hasFocus.value = true
}

const handleWindowBlur = () => {
  hasFocus.value = false
  // Release all keys when window loses focus to prevent stuck velocity
  if (activeKeys.size > 0) {
    activeKeys.clear()
    stopVelocityLoop()
  }
}

// Drag functionality - supports both mouse and touch
const getEventCoords = (event) => {
  if (event.touches && event.touches.length > 0) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }
  return { x: event.clientX, y: event.clientY }
}

const startDrag = (event) => {
  if (event.target.closest('button')) return // Don't drag when clicking buttons

  isDragging.value = true
  const rect = widgetRef.value.getBoundingClientRect()
  const coords = getEventCoords(event)
  dragOffset.value = {
    x: coords.x - rect.left,
    y: coords.y - rect.top
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
  event.preventDefault()
}

const onDrag = (event) => {
  if (!isDragging.value) return

  const coords = getEventCoords(event)
  const x = coords.x - dragOffset.value.x
  const y = coords.y - dragOffset.value.y

  // Keep widget within viewport bounds
  const maxX = window.innerWidth - widgetWidth
  const maxY = window.innerHeight - 100

  position.value = {
    x: Math.max(0, Math.min(x, maxX)),
    y: Math.max(0, Math.min(y, maxY))
  }

  event.preventDefault()
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

const close = () => {
  // Stop velocity and heartbeat when closing the widget
  activeKeys.clear()
  if (velocityInterval) {
    clearInterval(velocityInterval)
    velocityInterval = null
  }
  if (isActive.value) {
    sendStopVelocity()
    sendCommand('stop_offboard_heartbeat')
    console.log('Stopping offboard heartbeat on widget close')
    isActive.value = false
  }
  emit('close')
}

onMounted(() => {
  initializeROS()
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
  window.addEventListener('focus', handleWindowFocus)
  window.addEventListener('blur', handleWindowBlur)
})

onUnmounted(() => {
  // Clean up velocity loop
  if (velocityInterval) {
    clearInterval(velocityInterval)
    velocityInterval = null
  }
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
  window.removeEventListener('focus', handleWindowFocus)
  window.removeEventListener('blur', handleWindowBlur)
  if (ros.value) {
    ros.value.close()
  }
})
</script>
