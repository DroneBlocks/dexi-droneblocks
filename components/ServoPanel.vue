<template>
  <div>
    <h3 class="text-lg font-bold mb-2">DEXI Servos</h3>
    <div class="space-y-4">
      <div v-for="servo in servos" :key="servo.pin" class="space-y-1">
        <div class="flex justify-between text-sm">
          <span>{{ servo.label }}</span>
          <span>{{ servo.angle }}°</span>
        </div>
        <input 
          type="range" 
          v-model="servo.angle"
          min="0" 
          max="180" 
          step="1"
          class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          @input="setServoAngle(servo)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import ROSLIB from 'roslib';
import { useROS } from '~/composables/useROS';
import { ref } from 'vue';

const { getROSURL } = useROS();

// Initialize ROS connection
const ros = new ROSLIB.Ros({
  url: getROSURL()
});

// Create Servo service client
const servoService = new ROSLIB.Service({
  ros: ros,
  name: '/dexi/servo_control',
  serviceType: 'dexi_interfaces/srv/ServoControl'
});

// Servo configuration - using pin numbers for dexi servo control
const servos = ref([
  { label: 'Servo 1', pin: 0, angle: 90 },
  { label: 'Servo 2', pin: 1, angle: 90 },
  { label: 'Servo 3', pin: 2, angle: 90 },
  { label: 'Servo 4', pin: 3, angle: 90 },
  { label: 'Servo 5', pin: 4, angle: 90 }
]);

const setServoAngle = (servo) => {
  const request = new ROSLIB.ServiceRequest({
    pin: servo.pin,
    angle: Number(servo.angle)
  });

  servoService.callService(request, (result) => {
    console.log('Servo service call result:', result);
  }, (error) => {
    console.error('Servo service call failed:', error);
  });
};
</script>

<style scoped>
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