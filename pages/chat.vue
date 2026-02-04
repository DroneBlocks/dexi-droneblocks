<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import ROSLIB from "roslib";
import { useROS } from "~/composables/useROS";
import type { DroneContext } from "~/composables/useClaudeChat";

const { getROSURL } = useROS();

const ros = ref<ROSLIB.Ros | null>(null);
const rosConnected = ref(false);
const droneContext = ref<DroneContext>({});

// Server-side rosbridge connection state
const serverRosbridgeUrl = ref("");
const serverRosbridgeConnected = ref(false);
const connectionMode = ref<"sim" | "hardware">("sim");
const hardwareIp = ref("192.168.1.1");
const isConnecting = ref(false);

// Fetch current server-side rosbridge status
const fetchRosbridgeStatus = async () => {
  try {
    const status = await $fetch("/api/rosbridge/status");
    serverRosbridgeUrl.value = status.url;
    serverRosbridgeConnected.value = status.connected;
    // Determine mode from URL
    connectionMode.value = status.url.includes("localhost") ? "sim" : "hardware";
  } catch (e) {
    console.error("Failed to fetch rosbridge status:", e);
  }
};

// Switch server-side rosbridge connection
const switchConnection = async (mode: "sim" | "hardware") => {
  isConnecting.value = true;
  const url = mode === "sim"
    ? "ws://localhost:9090"
    : `ws://${hardwareIp.value}:9090`;

  try {
    const result = await $fetch("/api/rosbridge/connect", {
      method: "POST",
      body: { url },
    });
    serverRosbridgeUrl.value = result.url;
    serverRosbridgeConnected.value = result.connected;
    connectionMode.value = mode;

    // Save hardware IP for next time
    if (mode === "hardware") {
      localStorage.setItem("dexi-hardware-ip", hardwareIp.value);
    }
  } catch (e) {
    console.error("Failed to switch rosbridge:", e);
  } finally {
    isConnecting.value = false;
  }
};

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
  // Load saved hardware IP from localStorage
  const savedIp = localStorage.getItem("dexi-hardware-ip");
  if (savedIp) {
    hardwareIp.value = savedIp;
  }

  connectROS();
  fetchRosbridgeStatus();
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
        <!-- Connection mode switcher -->
        <div class="flex items-center gap-2">
          <div class="join">
            <button
              :class="['join-item btn btn-sm', connectionMode === 'sim' ? 'btn-primary' : 'btn-ghost']"
              :disabled="isConnecting"
              @click="switchConnection('sim')"
            >
              Sim
            </button>
            <button
              :class="['join-item btn btn-sm', connectionMode === 'hardware' ? 'btn-primary' : 'btn-ghost']"
              :disabled="isConnecting"
              @click="switchConnection('hardware')"
            >
              Hardware
            </button>
          </div>
          <input
            v-if="connectionMode === 'hardware'"
            v-model="hardwareIp"
            type="text"
            placeholder="Hardware IP"
            class="input input-sm input-bordered w-32"
            @keyup.enter="switchConnection('hardware')"
          />
          <div
            :class="[
              'badge badge-sm',
              serverRosbridgeConnected ? 'badge-success' : 'badge-error',
            ]"
            :title="serverRosbridgeUrl"
          >
            {{ isConnecting ? 'Connecting...' : (serverRosbridgeConnected ? 'API Connected' : 'API Disconnected') }}
          </div>
        </div>

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
            {{ droneContext.battery }}%
          </div>
        </div>
      </div>
    </div>

    <!-- Main content: Chat left, Simulator right -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Chat panel -->
      <div class="w-1/2 p-4 border-r border-base-content/10 overflow-hidden">
        <ClaudeChat :drone-context="droneContext" class="h-full" />
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
