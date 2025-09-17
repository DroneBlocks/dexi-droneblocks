<template>
  <div class="flex flex-col h-screen">
    <MainMenu />
    <!-- Flight Controls -->
    <FlightControls ref="flightControlsRef" />
    <!-- Main Content -->
    <div class="flex-1 flex">
      <!-- Main Content Area -->
      <div class="flex-1 bg-black relative">
        <div class="p-4 h-full">
          <DroneGrid ref="droneGridRef" />
        </div>
      </div>

      <!-- Right Column -->
      <div class="w-[250px] bg-gray-700 text-white p-4">
        <h3 class="text-lg font-bold mb-2">DEXI LED Ring</h3>
        <div class="grid grid-cols-2 gap-1">
          <div v-for="(color, name) in dexiLEDColors" :key="name" 
               class="flex flex-col items-center p-0.5 rounded cursor-pointer hover:bg-gray-600 relative group"
               @click="setLEDColor(name)"
               :title="name">
            <div class="w-full h-4 rounded" :style="{ backgroundColor: color }"></div>
            <span class="text-[10px] mt-0.5">{{ name }}</span>
          </div>
        </div>

        <ServoPanel />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ROSLIB from 'roslib';
import { useROS } from '~/composables/useROS';
import DroneGrid from '~/components/DroneGrid.vue';
import ServoPanel from '~/components/ServoPanel.vue';
import MainMenu from '~/components/MainMenu.vue';
import FlightControls from '~/components/FlightControls.vue';

const { getROSURL } = useROS();

// Component refs
const flightControlsRef = ref()
const droneGridRef = ref()

// Connect components when mounted
onMounted(() => {
  // Wait for components to be available
  setTimeout(() => {
    if (droneGridRef.value && flightControlsRef.value) {
      // Set the FlightControls reference in DroneGrid
      droneGridRef.value.flightControlsRef = flightControlsRef.value
      console.log('Connected FlightControls and DroneGrid components')
    }
  }, 100)
})

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