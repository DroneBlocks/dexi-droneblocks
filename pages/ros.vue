<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <div class="bg-gray-800 text-white">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 class="text-2xl font-semibold">ROS Debug</h1>
        <NuxtLink to="/" class="text-blue-400 hover:text-blue-300 text-sm">
          ← Back to Dashboard
        </NuxtLink>
      </div>

      <!-- Tab Navigation -->
      <div class="border-b border-gray-700">
        <nav class="flex space-x-8 px-4">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="py-3 px-1 text-sm font-medium border-b-2 transition-colors"
            :class="[
              activeTab === tab.id
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 hover:text-gray-300 border-transparent'
            ]"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 bg-gray-900 overflow-hidden">
      <!-- Topics Tab -->
      <div v-if="activeTab === 'topics'" class="h-full p-4 overflow-y-auto">
        <div class="bg-gray-800 rounded-lg p-4 h-full">
          <h2 class="text-lg font-medium text-white mb-4">Active Topics</h2>
          <div class="space-y-2">
            <div v-for="topic in topics" :key="topic.name"
                 class="flex flex-col p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
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
              <div v-if="topic.showMessage" class="mt-3 p-3 bg-gray-800 rounded relative">
                <!-- Copy button -->
                <button
                  @click.stop="copyToClipboard(topic)"
                  class="absolute top-2 right-2 p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  :title="topic.copied ? 'Copied!' : 'Copy JSON to clipboard'"
                >
                  <svg v-if="!topic.copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <svg v-else class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <pre class="text-gray-200 text-xs font-mono whitespace-pre-wrap pr-8">{{ formatMessage(topic.message) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Services Tab -->
      <div v-if="activeTab === 'services'" class="h-full p-4 overflow-y-auto">
        <div class="bg-gray-800 rounded-lg p-4 h-full">
          <h2 class="text-lg font-medium text-white mb-4">Available Services</h2>
          <div class="space-y-2">
            <div v-for="service in services" :key="service.name"
                 class="flex flex-col p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                 @click="toggleServiceDefinition(service)">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="text-gray-200 font-mono text-sm">{{ service.name }}</div>
                  <div class="text-gray-400 text-xs">{{ service.type || 'Loading type...' }}</div>
                </div>
                <div class="text-gray-400">
                  <svg
                    class="w-4 h-4 transform transition-transform"
                    :class="{ 'rotate-180': service.showDefinition }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <!-- Service Definition Content -->
              <div v-if="service.showDefinition" class="mt-3 p-3 bg-gray-800 rounded">
                <div v-if="service.definition">
                  <div class="mb-3">
                    <h4 class="text-sm font-medium text-white mb-2">Request Structure:</h4>
                    <pre class="text-gray-200 text-xs font-mono whitespace-pre-wrap">{{ formatServiceDefinition(service.definition.request) }}</pre>
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-white mb-2">Response Structure:</h4>
                    <pre class="text-gray-200 text-xs font-mono whitespace-pre-wrap">{{ formatServiceDefinition(service.definition.response) }}</pre>
                  </div>
                </div>
                <div v-else class="text-gray-400 text-sm">
                  Loading service definition...
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

const { getROSURL } = useROS()
const ros = new ROSLIB.Ros({
  url: getROSURL()
})

// Tab management
const activeTab = ref('topics')
const tabs = [
  { id: 'topics', name: 'Topics' },
  { id: 'services', name: 'Services' }
]

// Data
const topics = ref([])
const services = ref([])
const topicSubscriptions = new Map()

const loadTopics = () => {
  ros.getTopics((result) => {
    topics.value = result.topics.map(topic => ({
      name: topic,
      type: result.types[result.topics.indexOf(topic)],
      showMessage: false,
      message: null,
      copied: false
    }))
  })
}

const loadServices = () => {
  ros.getServices((result) => {
    // Convert service names to objects with name, type, and expansion properties
    services.value = result.map(serviceName => ({
      name: serviceName,
      type: null, // Will be loaded asynchronously
      showDefinition: false,
      definition: null
    }))

    // Load service types asynchronously
    services.value.forEach(async (service) => {
      try {
        ros.getServiceType(service.name, (serviceType) => {
          service.type = serviceType
        }, (error) => {
          console.warn(`Could not get type for service ${service.name}:`, error)
          service.type = 'Unknown'
        })
      } catch (error) {
        console.warn(`Error getting service type for ${service.name}:`, error)
        service.type = 'Unknown'
      }
    })
  })
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

const copyToClipboard = async (topic) => {
  if (!topic.message) return

  try {
    const jsonText = JSON.stringify(topic.message, null, 2)
    await navigator.clipboard.writeText(jsonText)

    // Show copied state
    topic.copied = true

    // Reset copied state after 2 seconds
    setTimeout(() => {
      topic.copied = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = JSON.stringify(topic.message, null, 2)
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)

    topic.copied = true
    setTimeout(() => {
      topic.copied = false
    }, 2000)
  }
}

const toggleServiceDefinition = (service) => {
  service.showDefinition = !service.showDefinition

  // Load service definition if not already loaded
  if (service.showDefinition && !service.definition && service.type && service.type !== 'Unknown') {
    // Use a safer approach that doesn't crash rosapi
    service.definition = {
      request: formatServiceTypeInfo(service.type, 'Request'),
      response: formatServiceTypeInfo(service.type, 'Response')
    }
  }
}

const formatServiceDefinition = (definition) => {
  return definition || 'No definition available'
}

const formatServiceTypeInfo = (serviceType, messageType) => {
  if (!serviceType || serviceType === 'Unknown') {
    return `# ${messageType} structure not available`
  }

  // Extract package and service name from type
  // e.g., "px4_msgs/srv/VehicleCommand" -> package: px4_msgs, service: VehicleCommand
  const parts = serviceType.split('/')
  if (parts.length >= 3) {
    const packageName = parts[0]
    const serviceName = parts[2]

    return `# ${messageType} for ${serviceType}
# Package: ${packageName}
# Service: ${serviceName}
#
# To see full message definition, use:
# ros2 interface show ${serviceType}
#
# Common ${messageType.toLowerCase()} patterns for ${packageName} services:
${getCommonServicePatterns(packageName, serviceName, messageType)}`
  }

  return `# ${messageType} structure for ${serviceType}
# Use 'ros2 interface show ${serviceType}' to see full definition`
}

const getCommonServicePatterns = (packageName, serviceName, messageType) => {
  // Provide helpful patterns based on common ROS service structures
  if (messageType === 'Request') {
    if (packageName === 'px4_msgs') {
      return `# Likely contains:
# - Header information (timestamp, etc.)
# - Command parameters
# - Target system/component IDs`
    } else if (packageName === 'std_srvs') {
      return `# Standard service request
# May be empty or contain simple parameters`
    }
    return `# Service request parameters
# Check ROS documentation for ${packageName}/${serviceName}`
  } else { // Response
    if (packageName === 'px4_msgs') {
      return `# Likely contains:
# - Success/failure status
# - Result information
# - Error codes if applicable`
    } else if (packageName === 'std_srvs') {
      return `# Standard service response
# Often contains success boolean`
    }
    return `# Service response data
# Check ROS documentation for ${packageName}/${serviceName}`
  }
}

onMounted(() => {
  loadTopics()
  loadServices()
})

onBeforeUnmount(() => {
  // Clean up all topic subscriptions
  topicSubscriptions.forEach((subscription) => {
    subscription.unsubscribe()
  })
  topicSubscriptions.clear()
})
</script>