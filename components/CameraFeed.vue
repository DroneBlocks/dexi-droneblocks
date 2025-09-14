<template>
  <div class="camera-container">
    <img 
      v-if="imageData" 
      :src="imageData" 
      alt="ROS Image" 
      class="camera-feed"
      :style="{ transform: shouldInvert ? 'rotate(180deg)' : 'none' }"
    />
    <div v-else class="flex items-center justify-center h-full">
      <p class="text-gray-400 text-xl font-semibold">Loading image...</p>
    </div>
  </div>
</template>

<script>
import ROSLIB from "roslib";
import { useROS } from '~/composables/useROS'

export default {
  name: 'CameraFeed',
  props: {
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
      imageTopic: null
    };
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
    });

    this.imageTopic.subscribe((message) => {      
      this.imageData = `data:image/jpeg;base64,${message.data}`;
    });
  },
  beforeDestroy() {
    if (this.imageTopic) {
      this.imageTopic.unsubscribe();
    }
  }
};
</script>

<style scoped>
.camera-container {
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
</style> 