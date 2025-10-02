<template>
  <div class="relative">
    <!-- Hamburger Icon -->
    <button 
      @click="isOpen = !isOpen"
      class="fixed top-4 right-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 focus:outline-none"
    >
      <svg 
        class="w-6 h-6" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          v-if="!isOpen"
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M4 6h16M4 12h16M4 18h16"
        />
        <path 
          v-else
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

    <!-- Slide-out Menu -->
    <div 
      class="fixed top-0 right-0 h-full w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-40"
      :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="pt-16 px-4">
        <nav class="space-y-4">
          <NuxtLink
            to="/"
            class="w-full text-left py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors block"
            @click="isOpen = false"
          >
            Dashboard
          </NuxtLink>
          <button
            class="w-full text-left py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            @click="toggleCameraRotation"
          >
            Rotate Camera
          </button>
          <button
            v-if="keyboardControlAvailable"
            class="w-full text-left py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            @click="openKeyboardControl"
          >
            Keyboard Control
          </button>
          <button
            class="w-full text-left py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            @click="openGitHub"
          >
            GitHub
          </button>
          <button
            class="w-full text-left py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            @click="openDiscord"
          >
            Discord
          </button>
        </nav>
      </div>
    </div>

    <!-- Backdrop -->
    <div 
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-30"
      @click="isOpen = false"
    ></div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'

const isOpen = ref(false)
const cameraInverted = ref(true) // Default matches current GCSLayout setting
const keyboardControlAvailable = ref(false)

const { getROSURL } = useROS()

const openGitHub = () => {
  window.open('https://github.com/droneblocks', '_blank')
  isOpen.value = false
}

const openDiscord = () => {
  window.open('https://discord.gg/Wjw7wGf7Wn', '_blank')
  isOpen.value = false
}

const toggleCameraRotation = () => {
  cameraInverted.value = !cameraInverted.value
  isOpen.value = false
}

const emit = defineEmits(['open-keyboard-control'])

const openKeyboardControl = () => {
  emit('open-keyboard-control')
  isOpen.value = false
}

const checkKeyboardControlAvailability = () => {
  try {
    const ros = new ROSLIB.Ros({
      url: getROSURL()
    })

    ros.on('connection', () => {
      const paramClient = new ROSLIB.Param({
        ros: ros,
        name: '/dexi/px4_offboard_manager:keyboard_control_enabled'
      })

      paramClient.get((value) => {
        keyboardControlAvailable.value = value === true
        ros.close()
      }, (error) => {
        keyboardControlAvailable.value = false
        ros.close()
      })
    })

    ros.on('error', () => {
      keyboardControlAvailable.value = false
    })
  } catch (error) {
    keyboardControlAvailable.value = false
  }
}

onMounted(() => {
  checkKeyboardControlAvailability()
})

defineExpose({
  cameraInverted
})
</script> 