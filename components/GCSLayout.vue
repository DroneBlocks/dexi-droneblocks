<template>
  <div class="flex flex-col h-screen">
    <!-- Top Bar -->
    <div class="h-[75px] bg-gray-800 text-white p-4">
      <div class="flex items-center gap-4">
        <span>Top Bar</span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex">
      <!-- Main Content Area -->
      <div class="flex-1 bg-blue-500">
        <div class="p-4 h-full">
          <DroneGrid />
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

        <h3 class="text-lg font-bold mt-4 mb-2">DEXI Servos</h3>
        <div class="space-y-4">
          <div v-for="servo in servos" :key="servo.pin" class="space-y-1">
            <div class="flex justify-between text-sm">
              <span>GPIO {{ servo.pin }}</span>
              <span>{{ servo.angle }}°</span>
            </div>
            <input 
              type="range" 
              v-model="servo.angle"
              min="0" 
              max="180" 
              step="1"
              class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              @mouseup="setServoAngle(servo)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ROSLIB from 'roslib';
import { useROS } from '~/composables/useROS';
import { ref } from 'vue';
import DroneGrid from '~/components/DroneGrid.vue';

const { getROSURL } = useROS();

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

// Create Servo service client
const servoService = new ROSLIB.Service({
  ros: ros,
  name: '/servo_control',
  serviceType: 'dexi_interfaces/srv/ServoControl'
});

// Servo configuration
const servos = ref([
  { pin: 13, angle: 90 },
  { pin: 16, angle: 90 },
  { pin: 18, angle: 90 },
  { pin: 19, angle: 90 }
]);

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

const setServoAngle = (servo) => {
  const request = new ROSLIB.ServiceRequest({
    pin: servo.pin,
    angle: Number(servo.angle) // Convert to number
  });

  servoService.callService(request, (result) => {
    console.log('Servo service call result:', result);
  }, (error) => {
    console.error('Servo service call failed:', error);
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
