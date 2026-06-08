<template>
  <div class="layout-root" :class="{ 'has-strip': stripVisible }">
    <ReadinessStrip />
    <main class="layout-page"><slot /></main>
    <StatusTextFeed />
  </div>
</template>

<script setup lang="ts">
import { useStripVisibility } from '~/composables/useStripVisibility'

const { visible: stripVisible } = useStripVisibility()
</script>

<style scoped>
/* ReadinessStrip is fixed at viewport top. layout-page is absolutely
 * positioned and fills the area below it. When the strip is hidden, the
 * layout-page reclaims the full viewport.
 *
 * Why absolute positioning instead of flex: pages that use `height: 100%`
 * (Blockly, Unity sim) need a parent with a definite height. flex-derived
 * heights are technically definite but trigger circular-dependency edge
 * cases when the child also uses percent height. Absolute top/bottom is
 * the bulletproof path. */
.layout-root {
  position: relative;
  min-height: 100vh;
}
.layout-page {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
}
.has-strip .layout-page {
  top: 48px;
}
</style>
