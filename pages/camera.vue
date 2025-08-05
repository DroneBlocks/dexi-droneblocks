<template>
  <CameraFeed :should-invert="shouldInvert" />
</template>

<script>
export default {
  data() {
    return {
      shouldInvert: true,
    };
  },
  mounted() {
    // Get the invert parameter from the URL
    const route = useRoute();
    this.shouldInvert = route.query.invert === 'true';
  }
};
</script>

<style scoped>
.camera-page {
  position: fixed;
  width: 320px;
  height: 240px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  z-index: 1000;
}

.camera-page.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100vw;
  height: 100vh;
}

.camera-feed-container {
  width: 100%;
  height: 100%;
  cursor: move;
}
</style>
