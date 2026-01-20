<template>
  <div class="flex flex-col h-screen overflow-hidden bg-gray-900">
    <!-- Header -->
    <div class="bg-gray-800 text-white">
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-semibold">AprilTag Pose Visualizer</h1>
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded-full"
              :class="isConnected ? 'bg-green-500' : 'bg-red-500'"
            ></div>
            <span class="text-sm text-gray-400">{{ connectionStatus }}</span>
          </div>
        </div>
        <NuxtLink to="/" class="text-blue-400 hover:text-blue-300 text-sm">
          Back to Dashboard
        </NuxtLink>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <div class="max-w-4xl mx-auto">
        <!-- Info Banner -->
        <div class="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
          <h3 class="text-blue-400 font-semibold mb-2">How to Use</h3>
          <ul class="text-sm text-gray-300 space-y-1">
            <li>1. Ensure AprilTag is visible to the camera</li>
            <li>2. Wait for the stability indicator to show <span class="text-green-400 font-semibold">STABLE</span></li>
            <li>3. Position variance should be under 5 cm for reliable position hold</li>
            <li>4. When ready, the banner will show <span class="text-green-400 font-semibold">READY FOR POSITION HOLD</span></li>
          </ul>
        </div>

        <!-- Camera Feed -->
        <div class="bg-gray-800 rounded-lg p-4 mb-4">
          <h3 class="text-sm text-gray-400 uppercase mb-3">Camera Feed</h3>
          <div class="relative aspect-video bg-gray-900 rounded overflow-hidden">
            <CameraFeed topic-name="/cam0/image_raw/compressed" />
          </div>
        </div>

        <!-- AprilTag Visualizer Component -->
        <AprilTagVisualizer :ros="ros" />

        <!-- Event Log -->
        <div class="bg-gray-800 rounded-lg p-4 mt-4">
          <h3 class="text-sm text-gray-400 uppercase mb-3">Event Log</h3>
          <div class="bg-gray-900 rounded p-3 h-40 overflow-y-auto font-mono text-xs">
            <div
              v-for="(log, index) in logs"
              :key="index"
              class="mb-1 py-1 px-2 rounded"
              :class="logClass(log.type)"
            >
              <span class="text-gray-500 mr-2">{{ log.time }}</span>
              {{ log.message }}
            </div>
            <div v-if="logs.length === 0" class="text-gray-500">
              Waiting for events...
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'

const { getROSURL } = useROS()

// ROS connection
const ros = ref<ROSLIB.Ros | null>(null)
const isConnected = ref(false)


// Logging
interface LogEntry {
  time: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}
const logs = ref<LogEntry[]>([])

const log = (message: string, type: LogEntry['type'] = 'info') => {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift({ time, message, type })
  if (logs.value.length > 100) {
    logs.value.pop()
  }
}

const logClass = (type: LogEntry['type']) => {
  switch (type) {
    case 'success': return 'bg-green-900/30 border-l-2 border-green-500'
    case 'warning': return 'bg-yellow-900/30 border-l-2 border-yellow-500'
    case 'error': return 'bg-red-900/30 border-l-2 border-red-500'
    default: return 'bg-blue-900/30 border-l-2 border-blue-500'
  }
}

// Connection status
const connectionStatus = computed(() => {
  return isConnected.value ? 'Connected to ROS' : 'Disconnected'
})

onMounted(() => {
  log('Initializing AprilTag Pose Visualizer', 'info')

  ros.value = new ROSLIB.Ros({
    url: getROSURL()
  })

  ros.value.on('connection', () => {
    isConnected.value = true
    log('Connected to ROS bridge: ' + getROSURL(), 'success')
  })

  ros.value.on('error', (error: any) => {
    log('ROS connection error: ' + error, 'error')
  })

  ros.value.on('close', () => {
    isConnected.value = false
    log('ROS connection closed', 'warning')
  })
})

onBeforeUnmount(() => {
  if (ros.value) {
    ros.value.close()
  }
})
</script>
