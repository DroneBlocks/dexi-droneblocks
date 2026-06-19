<template>
  <div class="camera-container">
    <img
      v-if="imageData"
      :src="imageData"
      alt="ROS Image"
      class="camera-feed"
      :style="{ transform: inverted ? 'rotate(180deg)' : 'none' }"
    />
    <div v-else class="flex items-center justify-center h-full">
      <p class="text-gray-400 text-xl font-semibold">Loading image...</p>
    </div>

    <!-- Rotate overlay button (top-right of the image). Toggles 180° flip
         for upside-down or mirrored mounts. Always rendered so the
         affordance is visible even before a stream arrives. -->
    <button
      class="rotate-btn"
      :class="{ 'is-active': inverted }"
      @click="inverted = !inverted"
      :title="inverted ? 'Restore orientation' : 'Rotate 180°'"
      aria-label="Rotate camera 180 degrees"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 3v6h-6" />
      </svg>
    </button>
  </div>
</template>

<script>
import ROSLIB from "roslib";
import { useROS } from '~/composables/useROS'

export default {
  name: 'CameraFeed',
  props: {
    // Initial orientation. Kept for backward compatibility — the rotate-btn
    // overlay below is the source of truth for runtime toggling.
    shouldInvert: {
      type: Boolean,
      default: false
    },
    topicName: {
      type: String,
      default: '/cam0/image_raw/compressed'
    }
  },
  data() {
    return {
      imageData: null,
      imageTopic: null,
      inverted: this.shouldInvert,
    };
  },
  watch: {
    shouldInvert(v) { this.inverted = v; },
  },
  mounted() {
    const { getROSURL } = useROS()
    const ros = new ROSLIB.Ros({
      url: getROSURL(),
    });

    ros.on('connection', function () {
    });

    this.imageTopic = new ROSLIB.Topic({
      ros: ros,
      name: this.topicName,
      messageType: 'sensor_msgs/CompressedImage',
      throttle_rate: 33,   // ~30 fps target (was 200 = 5 fps); camera currently
                           // caps ~21 fps. rosbridge serializes once and shares
                           // across viewers, so the higher rate costs ~1% CPU total.
      queue_length: 1,
      // CBOR sends the JPEG as binary instead of base64-in-JSON (~26% less
      // bandwidth, no base64 decode in the browser). roslib decodes the frame
      // so message.data arrives as a byte array, not a base64 string.
      compression: 'cbor',
    });

    this.imageTopic.subscribe((message) => {
      const blob = new Blob([new Uint8Array(message.data)], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      // Release the previous frame's blob URL to avoid leaking one per frame.
      if (this.imageData && this.imageData.startsWith('blob:')) {
        URL.revokeObjectURL(this.imageData);
      }
      this.imageData = url;
    });
  },
  beforeDestroy() {
    if (this.imageTopic) {
      this.imageTopic.unsubscribe();
    }
    if (this.imageData && this.imageData.startsWith('blob:')) {
      URL.revokeObjectURL(this.imageData);
    }
  }
};
</script>

<style scoped>
.camera-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
}

.camera-feed {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.rotate-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: rgb(226 232 240);
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: filter 0.12s ease, background-color 0.12s ease;
}
.rotate-btn:hover { filter: brightness(1.3); }
.rotate-btn.is-active {
  background: rgba(96, 165, 250, 0.45);
  border-color: rgba(96, 165, 250, 0.7);
  color: white;
}
.rotate-btn svg { width: 18px; height: 18px; }
</style>
