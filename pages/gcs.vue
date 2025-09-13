<template>
  <!-- <div class="flex flex-col h-screen">
    <FlightControls>
      <DroneGrid />
    </FlightControls>
  </div> -->
  <div class="flex flex-col h-screen overflow-hidden">
    <FlightControls class="shrink-0" />
    <div class="flex-1 min-h-0">
      <GCSLayout />
    </div>
  </div>
</template>

<script setup lang="ts">
import FlightControls from '~/components/FlightControls.vue'
import DroneGrid from '~/components/DroneGrid.vue'
import GCSLayout from '~/components/GCSLayout.vue'
</script>
