<template>
  <div>
    <h1>ROS Image Stream</h1>
    <!-- Image tag to display the live image -->
    <img 
      v-if="imageData" 
      :src="imageData" 
      alt="ROS Image" 
      width="640" 
      height="480" 
      :style="{ transform: shouldInvert ? 'rotate(180deg)' : 'none' }"
    />
    <p v-else>Loading image...</p>
  </div>
</template>

<script>
import ROSLIB from "roslib";
import { useROS } from '~/composables/useROS'

export default {
  data() {
    return {
      imageData: null,  // This will store the base64-encoded image
      shouldInvert: false, // Default value for image inversion
    };
  },
  mounted() {
    // Get the invert parameter from the URL
    const route = useRoute();
    this.shouldInvert = route.query.invert === 'true';

    const { getROSURL } = useROS()
    // Connect to the ROSBridge WebSocket
    const ros = new ROSLIB.Ros({
      url: getROSURL(),
    });

    ros.on('connection', function () {
      console.log('connected')
    });

    // Subscribe to the /camera/image_raw topic
    const imageTopic = new ROSLIB.Topic({
      ros: ros,
      name: '/cam0/image_raw/compressed',  // Your image topic
      messageType: 'sensor_msgs/CompressedImage',
    });

    imageTopic.subscribe((message) => {      
      // Set the base64 image string to be used in the img tag
      this.imageData = `data:image/jpeg;base64,${message.data}`;
      
    });
  },
  beforeDestroy() {
    // Unsubscribe from the topic when the component is destroyed
    if (this.imageTopic) {
      this.imageTopic.unsubscribe();
    }
  },
  methods: {
    // Convert uint8Array to base64 string
    uint8ArrayToBase64(uint8Array) {
      const binaryString = String.fromCharCode.apply(null, uint8Array);
      return window.btoa(binaryString);
    }
  }
};
</script>

<style scoped>
/* Add any styling you want for the component */
img {
  max-width: 100%;
  height: auto;
}
</style>
