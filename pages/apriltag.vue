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

    <!-- Main Content — 2-column layout -->
    <div class="flex-1 overflow-y-auto p-4">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <!-- Left column: Camera + Stability + Event Log -->
          <div class="flex flex-col gap-3">
            <!-- Camera Feed (compact) -->
            <div class="bg-gray-800 rounded-lg p-3">
              <h3 class="text-sm text-gray-400 uppercase mb-2">Camera Feed</h3>
              <div class="relative bg-gray-900 rounded overflow-hidden" style="aspect-ratio: 4/3;">
                <CameraFeed topic-name="/cam0/image_raw/compressed" />
              </div>
            </div>

            <!-- Stability handled inside AprilTagVisualizer below -->

            <!-- Event Log -->
            <div class="bg-gray-800 rounded-lg p-3">
              <h3 class="text-sm text-gray-400 uppercase mb-2">Event Log</h3>
              <div class="bg-gray-900 rounded p-2 h-24 overflow-y-auto font-mono text-xs">
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

          <!-- Right column: Visualizer data panels -->
          <div>
            <AprilTagVisualizer :ros="ros" />
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
