<template>
  <div class="floor-plan-container">
    <canvas ref="canvas" @click="handleClick"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Ros, Topic } from 'roslib';

const canvas = ref(null);
const gridSize = 50; // 50 pixels per meter
const gridCount = 10; // 10m x 10m grid
const marker = ref({ x: 0, y: 0 });
const targetMarkers = ref([]);

let ros, odomTopic, setpointTopic;

onMounted(() => {
  const ctx = canvas.value.getContext('2d');
  canvas.value.width = gridSize * gridCount * 2;
  canvas.value.height = gridSize * gridCount * 2;
  drawGrid(ctx);
  setupROS();
});

const setupROS = () => {
  ros = new Ros({ url: 'ws://localhost:9090' });
  
  odomTopic = new Topic({
    ros,
    name: '/vehicle_odometry',
    messageType: 'px4_msgs/msg/VehicleOdometry'
  });
  
  odomTopic.subscribe((msg) => {
    marker.value.x = msg.position[0];
    marker.value.y = msg.position[1];
    updateCanvas();
  });
  
  setpointTopic = new Topic({
    ros,
    name: '/offboard/setpoint_trajectory',
    messageType: 'px4_msgs/msg/TrajectorySetpoint'
  });
};

const drawGrid = (ctx) => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  
  for (let x = 0; x <= canvas.value.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.value.height);
    ctx.stroke();
  }
  
  for (let y = 0; y <= canvas.value.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.value.width, y);
    ctx.stroke();
  }
  
  drawHome(ctx);
  drawMarkers(ctx);
  drawMarker(ctx);
};

const drawHome = (ctx) => {
  const centerX = canvas.value.width / 2;
  const centerY = canvas.value.height / 2;
  
  ctx.fillStyle = 'green';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', centerX, centerY);
};

const drawMarker = (ctx) => {
  const centerX = canvas.value.width / 2;
  const centerY = canvas.value.height / 2;
  const markerX = centerX + marker.value.x * gridSize;
  const markerY = centerY - marker.value.y * gridSize;
  
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
  ctx.fill();
};

const drawMarkers = (ctx) => {
  ctx.fillStyle = 'blue';
  targetMarkers.value.forEach(({ x, y }) => {
    const centerX = canvas.value.width / 2;
    const centerY = canvas.value.height / 2;
    const markerX = centerX + x * gridSize;
    const markerY = centerY - y * gridSize;
    ctx.beginPath();
    ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
    ctx.fill();
  });
};

const handleClick = (event) => {
  const rect = canvas.value.getBoundingClientRect();
  const canvasX = event.clientX - rect.left;
  const canvasY = event.clientY - rect.top;
  
  const centerX = canvas.value.width / 2;
  const centerY = canvas.value.height / 2;
  
  const metersX = (canvasX - centerX) / gridSize;
  const metersY = (centerY - canvasY) / gridSize;
  
  console.log(`Clicked position: (${metersX.toFixed(2)}m, ${metersY.toFixed(2)}m)`);
  
  targetMarkers.value.push({ x: metersX, y: metersY });
  sendSetpoint(metersX, metersY);
  updateCanvas();
};

const sendSetpoint = (x, y) => {
  const message = {
    position: [x, y, -1.0], // Assuming Z = -1.0 for a stable altitude
    velocity: [0.0, 0.0, 0.0],
    acceleration: [0.0, 0.0, 0.0],
    yaw: 0.0,
    yaw_rate: 0.0
  };
  setpointTopic.publish(message);
};

const updateCanvas = () => {
  const ctx = canvas.value.getContext('2d');
  drawGrid(ctx);
};
</script>

<style scoped>
.floor-plan-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  overflow: hidden;
}

</style>