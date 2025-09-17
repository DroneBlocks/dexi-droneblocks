<template>
  <!-- <div class="flex flex-col h-screen">
    <FlightControls>
      <DroneGrid />
    </FlightControls>
  </div> -->
  <div class="flex flex-col h-screen overflow-hidden">
    <FlightControls ref="flightControlsRef" class="shrink-0" />
    <div class="flex-1 min-h-0">
      <GCSLayout :flight-controls-ref="flightControlsRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FlightControls from '~/components/FlightControls.vue'
import DroneGrid from '~/components/DroneGrid.vue'
import GCSLayout from '~/components/GCSLayout.vue'

const flightControlsRef = ref()
</script>
