<template>
  <div ref="container" class="rviz-container"></div>
</template>

<script>
import ROSLIB from 'roslib'
import { shallowRef } from 'vue'

export default {
  name: 'RvizViewer',
  setup() {
    // Use shallowRef to prevent deep reactivity
    const scene = shallowRef(null)
    const camera = shallowRef(null)
    const renderer = shallowRef(null)
    const ros = shallowRef(null)
    const transformObjects = new Map()
    let animationFrameId = null

    return {
      scene,
      camera,
      renderer,
      ros,
      transformObjects,
      animationFrameId
    }
  },
  mounted() {
    // Load Three.js from CDN
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js'
    script.onload = () => {
      this.initThreeJS()
      this.initROS()
      this.animate()
      window.addEventListener('resize', this.handleResize)
    }
    document.head.appendChild(script)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    if (this.ros) {
      this.ros.close()
    }
    // Clean up Three.js resources
    if (this.renderer) {
      this.renderer.dispose()
    }
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose()
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }
  },
  methods: {
    initThreeJS() {
      // Initialize Three.js scene
      const newScene = new THREE.Scene()
      const newCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      const newRenderer = new THREE.WebGLRenderer({ antialias: true })
      newRenderer.setSize(window.innerWidth, window.innerHeight)
      this.$refs.container.appendChild(newRenderer.domElement)

      // Add grid helper with larger size
      const gridHelper = new THREE.GridHelper(20, 20)
      newScene.add(gridHelper)

      // Add camera frame axes helper
      const cameraAxesHelper = new THREE.AxesHelper(1)
      newScene.add(cameraAxesHelper)

      // Set up camera position to view from above and behind
      newCamera.position.set(5, 5, 5)
      newCamera.lookAt(0, 0, 0)

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      newScene.add(ambientLight)

      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
      directionalLight.position.set(5, 5, 5)
      newScene.add(directionalLight)

      // Update refs
      this.scene = newScene
      this.camera = newCamera
      this.renderer = newRenderer
    },
    initROS() {
      // Initialize ROS connection
      const newRos = new ROSLIB.Ros({
        url: 'ws://192.168.6.188:9090'
      })

      // Subscribe to TF topic
      const tfTopic = new ROSLIB.Topic({
        ros: newRos,
        name: '/tf',
        messageType: 'tf2_msgs/msg/TFMessage'
      })

      tfTopic.subscribe((message) => {
        message.transforms.forEach(transform => {
          this.updateTransform(transform)
        })
      })

      this.ros = newRos
    },
    updateTransform(transform) {
      const { header, child_frame_id, transform: tf } = transform
      
      // Create axes helper if it doesn't exist
      if (!this.transformObjects.has(child_frame_id)) {
        // Create a larger axes helper for better visibility
        const axesHelper = new THREE.AxesHelper(0.5)
        
        // Add a small cube at the origin of the axes
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        const cube = new THREE.Mesh(geometry, material)
        axesHelper.add(cube)
        
        this.transformObjects.set(child_frame_id, axesHelper)
        this.scene.add(axesHelper)
      }

      const axesHelper = this.transformObjects.get(child_frame_id)
      
      // Update position
      axesHelper.position.set(
        tf.translation.x,
        tf.translation.y,
        tf.translation.z
      )

      // Update rotation
      axesHelper.quaternion.set(
        tf.rotation.x,
        tf.rotation.y,
        tf.rotation.z,
        tf.rotation.w
      )

      // Update camera to follow the tag
      if (child_frame_id === 'tag36h11:0') {
        const offset = new THREE.Vector3(2, 2, 2)
        this.camera.position.copy(axesHelper.position).add(offset)
        this.camera.lookAt(axesHelper.position)
      }
    },
    animate() {
      this.animationFrameId = requestAnimationFrame(this.animate)
      this.renderer.render(this.scene, this.camera)
    },
    handleResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    }
  }
}
</script>

<style scoped>
.rviz-container {
  width: 100%;
  height: 100vh;
  margin: 0;
  overflow: hidden;
}

.rviz-container canvas {
  display: block;
}
</style>