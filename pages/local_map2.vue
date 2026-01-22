<template>
  <div class="dashboard">
    <div class="sidebar">
      <h3>Drone Status</h3>
      <p><strong>x:</strong> {{ x }}</p>
      <p><strong>y:</strong> {{ y }}</p>
      <p><strong>z:</strong> {{ z }}</p>
      <p><strong>yaw:</strong> {{ yaw }}</p>
      <p><strong>Flight Mode:</strong> {{ flightMode }}</p>
      <p><strong>Battery:</strong> {{ battery }}%</p>
      <p><strong>Position:</strong> ({{ marker.x.toFixed(2) }}, {{ marker.y.toFixed(2) }})</p>
      <OffboardToggle />
    </div>
    <div class="floor-plan-container">
      <canvas ref="canvas" @click="handleClick"></canvas>
    </div>
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
const flightMode = ref("Unknown");
const battery = ref(100);
const floorPlanUrl = 'https://your-image-url.com/floorplan.png'; // Set your image URL here
let floorPlanImage = new Image();

let ros, odomTopic, flightModeTopic, batteryTopic, setpointTopic; //localPositionTopic;

const x = ref(0);
const y = ref(0);
const z = ref(0);
const yaw_radians = ref(0);
const yaw = ref(0);

onMounted(() => {
//   floorPlanImage.src = floorPlanUrl;
//   floorPlanImage.onload = () => {
//     const ctx = canvas.value.getContext('2d');
//     canvas.value.width = gridSize * gridCount * 2;
//     canvas.value.height = gridSize * gridCount * 2;
//     drawGrid(ctx);
//     setupROS();
//   };

  setupROS();

  const ctx = canvas.value.getContext('2d');
  drawGrid(ctx);
});

const setupROS = () => {
  ros = new Ros({ url: 'ws://localhost:9090' });

  ros.on('connection', function () {
    console.log('connected')

  });

  ros.on('close', function () {
    setTimeout(function() {
      // reconnect
      ros.connect(url);
    }, 2000);
  });
  
  odomTopic = new Topic({
    ros,
    name: '/fmu/out/vehicle_odometry',
    messageType: 'px4_msgs/msg/VehicleOdometry'
  });
  
  odomTopic.subscribe((msg) => {
    marker.value.x = msg.position[0];
    marker.value.y = msg.position[1];
    x.value = Math.round(msg.position[0] * 100) / 100;
    y.value = Math.round(msg.position[1] * 100) / 100;
    z.value = Math.round(msg.position[2] * 100) / 100;

    // Globally sets yaw_radians
    quaternionToYaw(msg.q);
    
    yaw.value = yaw_radians.value * (180 / Math.PI);
    
    updateCanvas();
  });
  
  flightModeTopic = new Topic({
    ros,
    name: '/fmu/out/vehicle_status',
    messageType: 'px4_msgs/msg/VehicleStatus'
  });
  
  flightModeTopic.subscribe((msg) => {
    flightMode.value = msg.nav_state;
  });

  // localPositionTopic = new Topic({
  //   ros,
  //   name: '/fmu/out/vehicle_local_position',
  //   messageType: 'px4_msgs/msg/VehicleLocalPosition'
  // });

  // localPositionTopic.subscribe((msg) => {
  //   x.value = Math.round(msg.x * 100) / 100;
  //   y.value = Math.round(msg.y * 100) / 100;
  //   z.value = Math.round(msg.z * 100) / 100;
  // });
  
  batteryTopic = new Topic({
    ros,
    name: '/fmu/out/battery_status',
    messageType: 'sensor_msgs/msg/BatteryState'
  });
  
  batteryTopic.subscribe((msg) => {
    battery.value = (msg.remaining * 100).toFixed(0);
  });
  
  setpointTopic = new Topic({
    ros,
    name: '/fmu/in/trajectory_setpoint',
    messageType: 'px4_msgs/msg/TrajectorySetpoint'
  });
};

const drawGrid = (ctx) => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  
  // Draw the floor plan image first
  //ctx.drawImage(floorPlanImage, 0, 0, canvas.value.width, canvas.value.height);
  
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
  let distance = 1
  let new_x = distance * Math.cos(yaw_radians.value) + x
  let new_y = distance * Math.sin(yaw_radians.value) + y

  let position = {
    "position": [
        new_x,
        new_y,
        -10
    ],
    "yaw": yaw_radians.value
  }

  console.log(position)
  setpointTopic.publish(position);
};

const quaternionToYaw = (q) => {
    if (isNaN(q[0])) return NaN; // Handle invalid quaternion

    const [q_w, q_x, q_y, q_z] = q;

    // Compute yaw (rotation around Z-axis)
    yaw_radians.value = Math.atan2(2.0 * (q_w * q_z + q_x * q_y), 1.0 - 2.0 * (q_y * q_y + q_z * q_z)); // Radians

}


const updateCanvas = () => {
  const ctx = canvas.value.getContext('2d');
  drawGrid(ctx); // Redraw the grid
  drawHome(ctx); // Redraw the home marker
  drawMarker(ctx); // Redraw the drone's current position
  drawMarkers(ctx); // Redraw the target markers
};

</script>

<style scoped>
.dashboard {
  display: flex;
  height: 100vh;
}
.sidebar {
  width: 250px;
  padding: 20px;
  background: #f4f4f4;
  border-right: 2px solid #ddd;
}
.floor-plan-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
canvas {
  background-color: white;
  border: 1px solid #000;
}
</style>
