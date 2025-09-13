<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50" @click="close"></div>

    <!-- Modal -->
    <div class="relative min-h-screen flex items-center justify-center p-4">
      <div class="relative bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 class="text-xl font-semibold text-white">
            ROS Debug Panel
          </h3>
          <button 
            @click="close"
            class="text-gray-400 hover:text-white focus:outline-none"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-4">
          <!-- Tabs -->
          <div class="border-b border-gray-700 mb-4">
            <nav class="flex space-x-8">
              <button 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="activeTab = tab.id"
                class="py-2 px-1 text-sm font-medium"
                :class="[
                  activeTab === tab.id 
                    ? 'text-blue-400 border-b-2 border-blue-400' 
                    : 'text-gray-400 hover:text-gray-300'
                ]"
              >
                {{ tab.name }}
              </button>
            </nav>
          </div>

          <!-- Services Tab -->
          <div v-if="activeTab === 'services'" class="space-y-4">
            <div class="bg-gray-700 rounded-lg p-4">
              <h4 class="text-lg font-medium text-white mb-2">Available Services</h4>
              <div class="space-y-2">
                <div v-for="service in services" :key="service"
                     class="flex items-center justify-between p-2 bg-gray-600 rounded">
                  <span class="text-gray-200 font-mono text-sm">{{ service }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Topics Tab -->
          <div v-if="activeTab === 'topics'" class="space-y-4">
            <div class="bg-gray-700 rounded-lg p-4">
              <h4 class="text-lg font-medium text-white mb-2">Active Topics</h4>
              <div class="space-y-2">
                <div v-for="topic in topics" :key="topic.name" 
                     class="flex flex-col p-2 bg-gray-600 rounded cursor-pointer hover:bg-gray-500"
                     @click="toggleTopicMessage(topic)">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="text-gray-200 font-mono text-sm">{{ topic.name }}</div>
                      <div class="text-gray-400 text-xs">{{ topic.type }}</div>
                    </div>
                    <div class="text-gray-400">
                      <svg 
                        class="w-4 h-4 transform transition-transform"
                        :class="{ 'rotate-180': topic.showMessage }"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <!-- Message Content -->
                  <div v-if="topic.showMessage" class="mt-2 p-2 bg-gray-700 rounded">
                    <pre class="text-gray-200 text-xs font-mono whitespace-pre-wrap">{{ formatMessage(topic.message) }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const { getROSURL } = useROS()
const ros = new ROSLIB.Ros({
  url: getROSURL()
})

const activeTab = ref('topics')
const services = ref([])
const topics = ref([])
const topicSubscriptions = new Map()

const tabs = [
  { id: 'topics', name: 'Topics' },
  { id: 'services', name: 'Services' }
]

const close = () => {
  emit('close')
}

const loadServices = () => {
  ros.getServices((result) => {
    services.value = result
  })
}

const loadTopics = () => {
  ros.getTopics((result) => {
    topics.value = result.topics.map(topic => ({
      name: topic,
      type: result.types[result.topics.indexOf(topic)],
      showMessage: false,
      message: null
    }))
  })
}

const callService = (serviceName) => {
  // Implement service call logic here
  console.log(`Calling service: ${serviceName}`)
}

const toggleTopicMessage = (topic) => {
  topic.showMessage = !topic.showMessage
  
  if (topic.showMessage && !topicSubscriptions.has(topic.name)) {
    // Subscribe to the topic
    const subscription = new ROSLIB.Topic({
      ros: ros,
      name: topic.name,
      messageType: topic.type
    })

    subscription.subscribe((message) => {
      topic.message = message
    })

    topicSubscriptions.set(topic.name, subscription)
  } else if (!topic.showMessage && topicSubscriptions.has(topic.name)) {
    // Unsubscribe from the topic
    const subscription = topicSubscriptions.get(topic.name)
    subscription.unsubscribe()
    topicSubscriptions.delete(topic.name)
    topic.message = null
  }
}

const formatMessage = (message) => {
  if (!message) return 'No message received yet'
  return JSON.stringify(message, null, 2)
}

onMounted(() => {
  loadServices()
  loadTopics()
})

onBeforeUnmount(() => {
  // Clean up all topic subscriptions
  topicSubscriptions.forEach((subscription) => {
    subscription.unsubscribe()
  })
  topicSubscriptions.clear()
})
</script> 