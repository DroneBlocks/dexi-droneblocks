<template>
  <div class="ned-position-display">
    <div class="ned-label">NED Position</div>
    <div class="ned-values">
      <div class="ned-item">
        <span class="ned-axis">N:</span>
        <span class="ned-value">{{ northDisplay }}</span>
      </div>
      <div class="ned-item">
        <span class="ned-axis">E:</span>
        <span class="ned-value">{{ eastDisplay }}</span>
      </div>
      <div class="ned-item">
        <span class="ned-axis">D:</span>
        <span class="ned-value">{{ downDisplay }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import ROSLIB from 'roslib';

const props = defineProps<{
  ros: ROSLIB.Ros | null;
}>();

const north = ref<number>(0);
const east = ref<number>(0);
const down = ref<number>(0);

let localPositionTopic: ROSLIB.Topic | null = null;

// Format numbers to 2 decimal places
const northDisplay = computed(() => north.value.toFixed(2) + 'm');
const eastDisplay = computed(() => east.value.toFixed(2) + 'm');
const downDisplay = computed(() => down.value.toFixed(2) + 'm');

onMounted(() => {
  if (!props.ros) {
    console.warn('NEDPositionDisplay: ROS not available');
    return;
  }

  // Subscribe to vehicle local position topic
  // PX4 publishes local position in NED frame
  localPositionTopic = new ROSLIB.Topic({
    ros: props.ros,
    name: '/fmu/out/vehicle_local_position',
    messageType: 'px4_msgs/msg/VehicleLocalPosition'
  });

  localPositionTopic.subscribe((message: any) => {
    // PX4 VehicleLocalPosition message contains:
    // x (North), y (East), z (Down) in meters
    north.value = message.x || 0;
    east.value = message.y || 0;
    down.value = message.z || 0;
  });

  console.log('NEDPositionDisplay: Subscribed to /fmu/out/vehicle_local_position');
});

onBeforeUnmount(() => {
  if (localPositionTopic) {
    localPositionTopic.unsubscribe();
  }
});
</script>

<style scoped>
.ned-position-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: 'Courier New', monospace;
}

.ned-label {
  font-weight: bold;
  color: #2a9d8f;
}

.ned-values {
  display: flex;
  gap: 1rem;
}

.ned-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.ned-axis {
  font-weight: bold;
  color: #666;
}

.ned-value {
  color: #fff;
  background: rgba(42, 157, 143, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  min-width: 60px;
  text-align: right;
}
</style>
