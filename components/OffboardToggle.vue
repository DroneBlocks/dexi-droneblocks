<template>
  <button @click="toggleOffboard" :class="{'bg-green-500': isOffboard, 'bg-red-500': !isOffboard}">
    {{ isOffboard ? 'Stop Offboard' : 'Start Offboard' }}
  </button>
</template>

<script setup>
import ROSLIB from 'roslib';

// Reactive state
const isOffboard = ref(false);
let ros, heartbeatTimer;

// Initialize ROS connection
onMounted(() => {
  ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090'  // Change to your ROS Bridge WebSocket URL
  });
});

// Function to send the offboard heartbeat
const sendHeartbeat = () => {

  const heartbeatTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/fmu/in/offboard_control_mode',
  });

  let offboardControlMode = {
    "position": true,
  }

  heartbeatTimer = setInterval(() => {
    heartbeatTopic.publish(offboardControlMode);
  }, 100); // Send heartbeat every 100ms
};

// Toggle Offboard Mode
const toggleOffboard = () => {
  if (isOffboard.value) {
    // Stop the heartbeat
    clearInterval(heartbeatTimer);


    isOffboard.value = false;
  } else {
    // Start sending heartbeats
    sendHeartbeat();


    isOffboard.value = true;
  }
};

// Cleanup on component unmount
onUnmounted(() => {
  clearInterval(heartbeatTimer);
});
</script>

<style scoped>
button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  cursor: pointer;
}
</style>
