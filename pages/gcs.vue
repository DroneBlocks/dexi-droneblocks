<template>
  <!-- <div class="flex flex-col h-screen">
    <FlightControls>
      <DroneGrid />
    </FlightControls>
  </div> -->
  <div>
    <FlightControls />
    <GCSLayout />
  </div>
</template>

<script setup lang="ts">
import FlightControls from '~/components/FlightControls.vue'
import DroneGrid from '~/components/DroneGrid.vue'
import GCSLayout from '~/components/GCSLayout.vue'
</script>
