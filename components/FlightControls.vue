<template>
  <!--
    FlightControls used to render the inline GCS button bar (Mode/Arm/Land).
    Those controls are now part of the interactive ReadinessStrip, so this
    component is a logic-only shell that exposes the offboard helpers that
    GCSLayout reads via flightControlsRef.
  -->
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineExpose } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'

const { getROSURL } = useROS()

const ros = ref<ROSLIB.Ros | null>(null)
const isOffboardActive = ref(false)
const offboardTargetPosition = ref({ x: 0, y: 0, z: -1.0, yaw: 0 })

let offboardManagerTopic: ROSLIB.Topic | null = null

onMounted(() => {
  ros.value = new ROSLIB.Ros({ url: getROSURL() })

  offboardManagerTopic = new ROSLIB.Topic({
    ros: ros.value as ROSLIB.Ros,
    name: '/dexi/offboard_manager',
    messageType: 'dexi_interfaces/msg/OffboardNavCommand',
  })
})

onBeforeUnmount(() => {
  if (isOffboardActive.value) sendOffboardManagerCommand('stop_offboard_heartbeat')
  if (ros.value) ros.value.close()
})

const sendOffboardManagerCommand = (command: string, distance_or_degrees = 0.0) => {
  if (!offboardManagerTopic) return
  const msg = new ROSLIB.Message({ command, distance_or_degrees })
  offboardManagerTopic.publish(msg)
}

const publishLocalPosition = (x: number, y: number, z: number = -1.0, yaw: number = 0) => {
  offboardTargetPosition.value = { x, y, z, yaw }
}

defineExpose({
  publishLocalPosition,
  isOffboardActive,
  offboardTargetPosition,
})
</script>
