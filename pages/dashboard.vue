<template>
  <div class="flex flex-col h-screen">
    <FlightControls />
    <div class="flex-1 p-4">
      <DroneGrid />
    </div>
  </div>
</template>

<script setup lang="ts">
import FlightControls from '~/components/FlightControls.vue'
import DroneGrid from '~/components/DroneGrid.vue'
</script>
