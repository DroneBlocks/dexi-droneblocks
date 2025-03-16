<template>
  <button @click="toggleOffboard" :class="{'bg-green-500': isOffboard, 'bg-red-500': !isOffboard}">
    {{ isOffboard ? 'Stop Offboard' : 'Start Offboard' }}
  </button>
</template>

<script setup>
import ROSLIB from 'roslib';

// Reactive state
const isOffboard = ref(false);
let ros, offboardTopic, heartbeatTimer;

// Initialize ROS connection
onMounted(() => {
  ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090'  // Change to your ROS Bridge WebSocket URL
  });

  // Define the topic for offboard control
  offboardTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/mavros/set_mode',
    messageType: 'mavros_msgs/SetMode'
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
    console.log('publishing heartbeat');
  }, 100); // Send heartbeat every 100ms
};

// Toggle Offboard Mode
const toggleOffboard = () => {
  if (isOffboard.value) {
    // Stop the heartbeat
    clearInterval(heartbeatTimer);
    
    // Change PX4 mode back to a non-offboard mode (e.g., manual)
    offboardTopic.publish({ custom_mode: 'MANUAL' });

    isOffboard.value = false;
  } else {
    // Start sending heartbeats
    sendHeartbeat();

    // Request PX4 to switch to Offboard mode
    offboardTopic.publish({ custom_mode: 'OFFBOARD' });

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
