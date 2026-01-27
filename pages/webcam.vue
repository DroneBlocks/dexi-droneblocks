<template>
  <div class="webcam-container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <a href="/" class="logo-link">
          <span class="text-xl">📷</span>
        </a>
        <span class="header-title">Gesture Control</span>
        <div class="connection-indicator" :class="{ connected: rosConnected }">
          <span class="indicator-dot"></span>
          <span class="indicator-text">{{ rosConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
      </div>

      <div class="header-center">
        <div class="status-item">
          <span class="status-label">Webcam:</span>
          <span class="status-indicator" :class="{ connected: webcamReady }">
            <span class="indicator-dot"></span>
            <span>{{ webcamReady ? 'Ready' : 'Not Ready' }}</span>
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">Model:</span>
          <span class="status-indicator" :class="{ connected: gestureRecognizerReady }">
            <span class="indicator-dot"></span>
            <span>{{ gestureRecognizerReady ? 'Loaded' : 'Loading...' }}</span>
          </span>
        </div>
        <div class="status-item" v-if="isDetecting">
          <span class="status-label">Gesture:</span>
          <span class="gesture-badge">{{ gestureEmoji }} {{ currentGesture }}</span>
        </div>
      </div>

      <div class="header-right">
        <button
          @click="toggleDetection"
          :disabled="!webcamReady || !gestureRecognizerReady"
          class="control-btn"
          :class="isDetecting ? 'btn-stop' : 'btn-detect'"
        >
          {{ isDetecting ? 'Stop Detection' : 'Start Detection' }}
        </button>
      </div>
    </div>

    <!-- Split Container -->
    <div class="split-container">
      <!-- Left Panel - Webcam & Controls -->
      <div class="control-panel" :style="{ width: leftPanelWidth + '%' }">
        <div class="control-content">
          <!-- Video Preview -->
          <div class="video-section">
            <div class="video-wrapper">
              <video
                ref="videoElement"
                autoplay
                playsinline
                muted
                class="video-preview"
              ></video>
              <canvas ref="canvasElement" class="hidden-canvas"></canvas>

              <!-- Gesture Detection Overlay -->
              <div v-if="isDetecting" class="gesture-overlay">
                <div class="gesture-display" :class="{ 'has-gesture': currentGesture !== 'None' }">
                  <span class="gesture-icon">{{ gestureEmoji }}</span>
                  <span class="gesture-name">{{ currentGesture }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Detected Gestures -->
          <div class="action-panel">
            <h3 class="panel-title">Gestures</h3>
            <div class="action-grid">
              <div
                v-for="gesture in availableGestures"
                :key="gesture"
                class="action-item"
                :class="{ active: currentGesture === gesture }"
              >
                <span class="action-gesture">{{ getGestureEmoji(gesture) }}</span>
                <span class="gesture-label">{{ gesture }}</span>
              </div>
            </div>
          </div>

          <!-- Status Panel -->
          <div class="status-panel">
            <h3 class="panel-title">Status</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Gesture Topic</span>
                <span class="info-value">/webcam/gesture</span>
              </div>
              <div class="info-item">
                <span class="info-label">Resolution</span>
                <span class="info-value">{{ resolution }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider" @mousedown="startDragging" :class="{ dragging: isDragging }">
        <div class="divider-handle"></div>
      </div>

      <!-- Right Panel - Unity Simulator -->
      <div class="unity-panel" :style="{ width: (100 - leftPanelWidth) + '%' }">
        <iframe
          :src="unityUrl"
          class="unity-iframe"
          frameborder="0"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ROSLIB from 'roslib'
import { useROS } from '~/composables/useROS'

const { getROSURL } = useROS()

// Unity URL
const unityUrl = ref('')
if (process.client) {
  const urlParams = new URLSearchParams(window.location.search)
  const ip = urlParams.get('ip')

  if (ip) {
    // If IP provided via query param, use HTTP for Unity (doesn't need HTTPS)
    unityUrl.value = `http://${ip}:1337`
  } else {
    // Fallback to current hostname
    const hostname = window.location.hostname
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    unityUrl.value = `${protocol}//${hostname}:1337`
  }
}

// Split panel state
const leftPanelWidth = ref(40)
const isDragging = ref(false)

// Refs for DOM elements
const videoElement = ref<HTMLVideoElement | null>(null)
const canvasElement = ref<HTMLCanvasElement | null>(null)

// State
const rosConnected = ref(false)
const webcamReady = ref(false)
const resolution = ref('--')

// Gesture detection state
const gestureRecognizerReady = ref(false)
const isDetecting = ref(false)
const currentGesture = ref('None')
const availableGestures = ['None', 'Closed_Fist', 'Open_Palm', 'Pointing_Up', 'Thumb_Down', 'Thumb_Up', 'Victory', 'ILoveYou']

const getGestureEmoji = (gesture: string): string => {
  const emojiMap: Record<string, string> = {
    'None': '...',
    'Closed_Fist': '✊',
    'Open_Palm': '✋',
    'Pointing_Up': '☝️',
    'Thumb_Down': '👎',
    'Thumb_Up': '👍',
    'Victory': '✌️',
    'ILoveYou': '🤟'
  }
  return emojiMap[gesture] || '?'
}

const gestureEmoji = computed(() => getGestureEmoji(currentGesture.value))

// ROS connection and publishers
let ros: ROSLIB.Ros | null = null
let gesturePub: ROSLIB.Topic | null = null
let mediaStream: MediaStream | null = null

// MediaPipe
let GestureRecognizer: any = null
let FilesetResolver: any = null
let gestureRecognizer: any = null
let detectionAnimationFrame: number | null = null
let lastGestureTime = 0

// Dragging functions
const startDragging = () => {
  isDragging.value = true
}

const stopDragging = () => {
  isDragging.value = false
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return

  const containerWidth = window.innerWidth
  const newWidth = (e.clientX / containerWidth) * 100

  if (newWidth >= 25 && newWidth <= 60) {
    leftPanelWidth.value = newWidth
  }
}

// Initialize ROS connection
const initROS = () => {
  ros = new ROSLIB.Ros({
    url: getROSURL()
  })

  ros.on('connection', () => {
    console.log('Webcam: Connected to ROS')
    rosConnected.value = true
    initPublisher()
  })

  ros.on('error', (error: any) => {
    console.error('Webcam: ROS connection error:', error)
    rosConnected.value = false
  })

  ros.on('close', () => {
    console.log('Webcam: ROS connection closed')
    rosConnected.value = false
  })
}

// Initialize publisher
const initPublisher = () => {
  if (!ros) return

  gesturePub = new ROSLIB.Topic({
    ros: ros,
    name: '/webcam/gesture',
    messageType: 'std_msgs/String'
  })
}

// Initialize webcam
const initWebcam = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    })

    if (videoElement.value) {
      videoElement.value.srcObject = mediaStream

      videoElement.value.onloadedmetadata = () => {
        if (videoElement.value) {
          const width = videoElement.value.videoWidth
          const height = videoElement.value.videoHeight
          resolution.value = `${width}x${height}`
          webcamReady.value = true
          console.log(`Webcam: Ready at ${resolution.value}`)
        }
      }
    }
  } catch (error) {
    console.error('Webcam: Failed to access camera:', error)
    webcamReady.value = false
  }
}

// Initialize MediaPipe Gesture Recognizer
const initMediaPipe = async () => {
  try {
    const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs')
    GestureRecognizer = vision.GestureRecognizer
    FilesetResolver = vision.FilesetResolver

    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
    )

    gestureRecognizer = await GestureRecognizer.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numHands: 1
    })

    gestureRecognizerReady.value = true
    console.log('Webcam: MediaPipe Gesture Recognizer loaded')
  } catch (error) {
    console.error('Webcam: Failed to load MediaPipe:', error)
    gestureRecognizerReady.value = false
  }
}

// Run gesture detection
const detectGesture = () => {
  if (!isDetecting.value || !videoElement.value || !gestureRecognizer) return

  const video = videoElement.value
  const nowMs = performance.now()

  try {
    const results = gestureRecognizer.recognizeForVideo(video, nowMs)

    let detectedGesture = 'None'
    if (results.gestures && results.gestures.length > 0 && results.gestures[0].length > 0) {
      detectedGesture = results.gestures[0][0].categoryName
    }

    // Only publish if gesture changed or every 500ms for same gesture
    if (detectedGesture !== currentGesture.value || nowMs - lastGestureTime > 500) {
      currentGesture.value = detectedGesture
      publishGesture(detectedGesture)
      lastGestureTime = nowMs
    }
  } catch (error) {
    // Ignore timing errors from MediaPipe
  }

  detectionAnimationFrame = requestAnimationFrame(detectGesture)
}

// Publish gesture to ROS
const publishGesture = (gesture: string) => {
  if (!gesturePub || !rosConnected.value) return

  const message = new ROSLIB.Message({
    data: gesture
  })

  gesturePub.publish(message)
}

// Toggle gesture detection
const toggleDetection = () => {
  if (isDetecting.value) {
    stopDetection()
  } else {
    startDetection()
  }
}

const startDetection = () => {
  if (!webcamReady.value || !gestureRecognizerReady.value) return

  isDetecting.value = true
  currentGesture.value = 'None'
  lastGestureTime = 0
  detectionAnimationFrame = requestAnimationFrame(detectGesture)
  console.log('Webcam: Started gesture detection')
}

const stopDetection = () => {
  isDetecting.value = false
  currentGesture.value = 'None'

  if (detectionAnimationFrame) {
    cancelAnimationFrame(detectionAnimationFrame)
    detectionAnimationFrame = null
  }

  console.log('Webcam: Stopped gesture detection')
}

// Cleanup
const cleanup = () => {
  stopDetection()

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }

  if (ros) {
    ros.close()
    ros = null
  }
}

onMounted(() => {
  initROS()
  initWebcam()
  initMediaPipe()
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDragging)
})

onUnmounted(() => {
  cleanup()
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDragging)
})
</script>

<style scoped>
.webcam-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1a2e;
  color: white;
  overflow: hidden;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-link {
  text-decoration: none;
}

.header-title {
  font-weight: 600;
  font-size: 1rem;
}

.connection-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.connection-indicator.connected .indicator-dot {
  background: #22c55e;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.status-label {
  color: #94a3b8;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #ef4444;
}

.status-indicator.connected {
  color: #22c55e;
}

.gesture-badge {
  background: #8b5cf6;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-detect {
  background: #8b5cf6;
  color: white;
}

.btn-detect:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-stop {
  background: #ef4444;
  color: white;
}

.btn-stop:hover:not(:disabled) {
  background: #dc2626;
}

/* Split Container */
.split-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.control-panel {
  height: 100%;
  background: #1a1a2e;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.control-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Video Section */
.video-section {
  background: #16213e;
  border-radius: 0.5rem;
  overflow: hidden;
}

.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.video-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.hidden-canvas {
  display: none;
}

/* Gesture Overlay */
.gesture-overlay {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 10;
}

.gesture-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(15, 52, 96, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: 2px solid #1e3a5f;
  transition: all 0.2s;
}

.gesture-display.has-gesture {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.3);
}

.gesture-icon {
  font-size: 1.5rem;
}

.gesture-name {
  font-size: 1rem;
  font-weight: 600;
  font-family: monospace;
}

/* Action Panel */
.action-panel,
.status-panel {
  background: #16213e;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.panel-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.action-grid {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #0f3460;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.action-item.active {
  background: rgba(139, 92, 246, 0.3);
  border-color: #8b5cf6;
}

.action-gesture {
  font-size: 1.25rem;
}

.gesture-label {
  font-family: monospace;
  color: #94a3b8;
}

.action-item.active .gesture-label {
  color: white;
  font-weight: 500;
}

/* Status Panel */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0.5rem;
  background: #0f3460;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.info-label {
  color: #64748b;
}

.info-value {
  font-family: monospace;
  color: #60a5fa;
}

/* Divider */
.divider {
  width: 6px;
  height: 100%;
  background: #0f3460;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}

.divider:hover,
.divider.dragging {
  background: #8b5cf6;
}

.divider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
}

/* Unity Panel */
.unity-panel {
  height: 100%;
  background: #000;
  position: relative;
  overflow: hidden;
}

.unity-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* Responsive */
@media (max-width: 768px) {
  .header-center {
    display: none;
  }

  .split-container {
    flex-direction: column;
  }

  .control-panel {
    width: 100% !important;
    max-height: 50%;
  }

  .unity-panel {
    width: 100% !important;
  }

  .divider {
    width: 100%;
    height: 6px;
    cursor: row-resize;
  }
}
</style>
