<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import ROSLIB from "roslib";
import { useROS } from "~/composables/useROS";
import type { DroneContext } from "~/composables/useChat";

const { getROSURL } = useROS();

const ros = ref<ROSLIB.Ros | null>(null);
const rosConnected = ref(false);
const droneContext = ref<DroneContext>({});

// ROS connection
const connectROS = () => {
  const url = getROSURL();
  ros.value = new ROSLIB.Ros({ url });

  ros.value.on("connection", () => {
    rosConnected.value = true;
    subscribeToTopics();
  });

  ros.value.on("close", () => {
    rosConnected.value = false;
  });

  ros.value.on("error", () => {
    rosConnected.value = false;
  });
};

const subscribeToTopics = () => {
  if (!ros.value) return;

  // Battery status
  const batteryTopic = new ROSLIB.Topic({
    ros: ros.value,
    name: "/fmu/out/battery_status",
    messageType: "px4_msgs/msg/BatteryStatus",
  });

  batteryTopic.subscribe((msg: any) => {
    droneContext.value.battery = Math.round(msg.remaining * 100);
  });

  // Vehicle status
  const statusTopic = new ROSLIB.Topic({
    ros: ros.value,
    name: "/fmu/out/vehicle_control_mode",
    messageType: "px4_msgs/msg/VehicleControlMode",
  });

  statusTopic.subscribe((msg: any) => {
    droneContext.value.armed = msg.flag_armed;
    droneContext.value.mode = msg.flag_control_offboard_enabled
      ? "Offboard"
      : "Auto";
  });

  // Local position for altitude
  const posTopic = new ROSLIB.Topic({
    ros: ros.value,
    name: "/fmu/out/vehicle_local_position",
    messageType: "px4_msgs/msg/VehicleLocalPosition",
  });

  posTopic.subscribe((msg: any) => {
    droneContext.value.altitude = -msg.z; // NED to altitude
  });
};

onMounted(() => {
  connectROS();
});

onUnmounted(() => {
  if (ros.value) {
    ros.value.close();
  }
});

// Get simulator URL based on current hostname
const simulatorUrl = computed(() => {
  const hostname = process.client ? window.location.hostname : "localhost";
  return `http://${hostname}:1337`;
});
</script>

<template>
  <div class="h-screen bg-base-100 flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="navbar bg-base-200 border-b border-base-content/10 px-4">
      <div class="flex-1">
        <NuxtLink to="/" class="btn btn-ghost text-xl gap-2">
          <span>←</span>
          <span>DEXI Chat</span>
        </NuxtLink>
      </div>
      <div class="flex-none flex items-center gap-4">
        <!-- Drone context badges -->
        <div class="flex items-center gap-2 text-sm">
          <div
            :class="[
              'badge',
              rosConnected ? 'badge-success' : 'badge-error',
            ]"
          >
            {{ rosConnected ? "ROS Connected" : "ROS Disconnected" }}
          </div>
          <div
            v-if="droneContext.armed !== undefined"
            :class="['badge', droneContext.armed ? 'badge-warning' : 'badge-ghost']"
          >
            {{ droneContext.armed ? "Armed" : "Disarmed" }}
          </div>
          <div v-if="droneContext.altitude !== undefined" class="badge badge-info">
            {{ droneContext.altitude?.toFixed(1) }}m
          </div>
          <div v-if="droneContext.battery !== undefined" class="badge badge-ghost">
            🔋 {{ droneContext.battery }}%
          </div>
        </div>
      </div>
    </div>

    <!-- Main content: Chat left, Simulator right -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Chat panel -->
      <div class="w-1/2 p-4 border-r border-base-content/10 overflow-hidden">
        <Chat :drone-context="droneContext" class="h-full" />
      </div>

      <!-- Simulator panel -->
      <div class="w-1/2 p-4 overflow-hidden">
        <iframe
          :src="simulatorUrl"
          class="w-full h-full rounded-lg border border-base-content/10"
          frameborder="0"
        ></iframe>
      </div>
    </div>
  </div>
</template>
