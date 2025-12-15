<template>
  <div class="flex flex-col h-full">
    <MainMenu ref="mainMenuRef" @open-keyboard-control="showKeyboardControl = true" />
    <!-- Main Content -->
    <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
      <!-- Main Content Area with Tabs -->
      <div class="flex-1 bg-black relative flex flex-col min-h-0">
        <!-- Tab Navigation -->
        <div class="bg-gray-800 border-b border-gray-700">
          <nav class="flex space-x-4 sm:space-x-8 px-2 sm:px-4 overflow-x-auto">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="py-2 sm:py-3 px-1 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
              :class="[
                activeTab === tab.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300 border-transparent'
              ]"
            >
              {{ tab.name }}
            </button>
            <!-- LED Panel Toggle Button (mobile only) -->
            <button
              @click="showLEDPanel = !showLEDPanel"
              class="md:hidden py-2 sm:py-3 px-1 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ml-auto"
              :class="[
                showLEDPanel
                  ? 'text-purple-400 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300 border-transparent'
              ]"
            >
              LED
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="flex-1 relative min-h-0">
          <!-- Camera Tab -->
          <div v-if="activeTab === 'camera'" class="p-2 sm:p-4 h-full">
            <CameraFeed :should-invert="mainMenuRef?.cameraInverted ?? false" />
          </div>

          <!-- Map Tab -->
          <div v-if="activeTab === 'map'" class="h-full">
            <DroneGrid ref="droneGridRef" :flight-controls-ref="flightControlsRef" />
          </div>

          <!-- SITL Tab -->
          <div v-if="activeTab === 'sitl'" class="absolute inset-0">
            <iframe
              :src="sitlUrl"
              class="w-full h-full border-0 block"
              title="SITL Simulator"
            />
          </div>

        </div>
      </div>

      <!-- Right Column - Hidden on mobile, shown on md+ OR when toggled -->
      <div
        class="bg-gray-700 text-white p-3 sm:p-4 transition-all duration-300 overflow-y-auto"
        :class="[
          showLEDPanel ? 'block' : 'hidden md:block',
          'w-full md:w-[200px] lg:w-[250px]',
          'max-h-[40vh] md:max-h-none'
        ]"
      >
        <h3 class="text-base sm:text-lg font-bold mb-2">DEXI LED Ring</h3>
        <div class="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-2 gap-1">
          <div v-for="(color, name) in dexiLEDColors" :key="name"
               class="flex flex-col items-center p-0.5 rounded cursor-pointer hover:bg-gray-600 relative group"
               @click="setLEDColor(name)"
               :title="name">
            <div class="w-full h-4 rounded" :style="{ backgroundColor: color }"></div>
            <span class="text-[10px] mt-0.5 truncate w-full text-center">{{ name }}</span>
          </div>
        </div>

        <ServoPanel />
      </div>
    </div>

    <!-- Keyboard Control Modal -->
    <KeyboardControl :is-open="showKeyboardControl" @close="showKeyboardControl = false" />

  </div>
</template>

<script setup>
import ROSLIB from 'roslib';
import { useROS } from '~/composables/useROS';
import { ref, computed } from 'vue';
import CameraFeed from '~/components/CameraFeed.vue';
import ServoPanel from '~/components/ServoPanel.vue';
import MainMenu from '~/components/MainMenu.vue';
import DroneGrid from '~/components/DroneGrid.vue';
import KeyboardControl from '~/components/KeyboardControl.vue';

const props = defineProps({
  flightControlsRef: {
    required: true
  }
})

const { getROSURL, isDevMode } = useROS();
const route = useRoute();

// Tab management
const activeTab = ref('camera');
const droneGridRef = ref();
const mainMenuRef = ref();

// Keyboard control modal
const showKeyboardControl = ref(false);

// LED panel visibility (mobile toggle)
const showLEDPanel = ref(false);

// SITL URL - construct from current hostname with port 1337
const sitlUrl = ref('');
if (process.client) {
  const hostname = window.location.hostname;
  sitlUrl.value = `http://${hostname}:1337/`;
}

// Check if SITL mode is enabled via query parameter or dev mode
const sitlEnabled = computed(() => isDevMode() || route.query.sitl === 'true');

// All possible tabs
const allTabs = [
  { id: 'camera', name: 'Camera' },
  { id: 'map', name: 'Map' },
  { id: 'sitl', name: 'SITL' }
];

// Filter tabs based on SITL mode
const tabs = computed(() => {
  if (sitlEnabled.value) {
    return allTabs;
  }
  return allTabs.filter(tab => tab.id !== 'sitl');
});

// DEXI LED Ring colors from DroneBlocks node-red-dexi
const dexiLEDColors = {
  'white': '#FFFFFF',
  'black': '#000000',
  'red': '#FF0000',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'green': '#00FF00',
  'teal': '#008080',
  'cyan': '#00FFFF',
  'blue': '#0000FF',
  'purple': '#800080',
  'magenta': '#FF00FF',
  'gold': '#FFD700',
  'pink': '#FFC0CB',
  'aqua': '#00FFFF',
  'jade': '#00A86B',
  'amber': '#FFBF00'
};

// Initialize ROS connection
const ros = new ROSLIB.Ros({
  url: getROSURL()
});

// Create LED service client
const ledService = new ROSLIB.Service({
  ros: ros,
  name: '/dexi/led_service/set_led_ring_color',
  serviceType: 'dexi_interfaces/srv/LEDRingColor'
});

const setLEDColor = (color) => {
  console.log('Sending color name:', color, 'Type:', typeof color);
  const request = new ROSLIB.ServiceRequest({
    color: color
  });

  ledService.callService(request, (result) => {
    console.log('Service call result:', result);
  }, (error) => {
    console.error('Service call failed:', error);
  });
};
</script>

<style>
/* Custom styling for the range input */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #4CAF50;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #4CAF50;
  border-radius: 50%;
  cursor: pointer;
}
</style>
