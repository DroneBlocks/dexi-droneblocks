<template>
  <!-- Photo / record buttons over the camera feed (dexi_capture_media). Hidden
       when the capture node is not running, so the camera tab looks as before. -->
  <div v-if="available" class="capture-controls">
    <span v-if="status?.recording" class="rec-badge">● REC {{ elapsed }}</span>
    <button class="cap-btn" :disabled="busy" title="Take photo" aria-label="Take photo" @click="photo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    </button>
    <button
      class="cap-btn"
      :class="{ 'is-recording': status?.recording }"
      :disabled="busy"
      :title="status?.recording ? 'Stop recording' : 'Start recording'"
      :aria-label="status?.recording ? 'Stop recording' : 'Start recording'"
      @click="toggleRecording"
    >
      <span :class="status?.recording ? 'stop-icon' : 'rec-icon'" />
    </button>
    <span v-if="toast" class="toast" :class="{ 'is-error': toastError }">{{ toast }}</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCaptureMedia } from '~/composables/useCaptureMedia'

const { status, available, busy, capturePhoto, startRecording, stopRecording } = useCaptureMedia()

const toast = ref('')
const toastError = ref(false)
let toastTimer = null

const elapsed = computed(() => {
  const s = Math.floor(status.value?.elapsed_s || 0)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

function show(text, error = false) {
  toast.value = text
  toastError.value = error
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 3000)
}

async function run(fn, label) {
  try {
    show(`${label}: ${await fn()}`)
  } catch (e) {
    show(e.message, true)
  }
}

const photo = () => run(capturePhoto, 'Saved')
const toggleRecording = () =>
  status.value?.recording ? run(stopRecording, 'Saved') : run(startRecording, 'Recording')
</script>

<style scoped>
.capture-controls {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.cap-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: rgb(226 232 240);
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: filter 0.12s ease, background-color 0.12s ease;
}
.cap-btn:hover:not(:disabled) { filter: brightness(1.3); }
.cap-btn:disabled { opacity: 0.5; cursor: wait; }
.cap-btn svg { width: 20px; height: 20px; }
.cap-btn.is-recording { border-color: rgba(239, 68, 68, 0.8); }
.rec-icon { width: 16px; height: 16px; border-radius: 999px; background: rgb(239 68 68); }
.stop-icon { width: 14px; height: 14px; border-radius: 2px; background: rgb(239 68 68); }
.rec-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(254 202 202);
  background: rgba(127, 29, 29, 0.75);
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-variant-numeric: tabular-nums;
}
.toast {
  position: absolute;
  bottom: 54px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.75rem;
  color: rgb(226 232 240);
  background: rgba(15, 23, 42, 0.85);
  padding: 0.25rem 0.6rem;
  border-radius: 0.375rem;
}
.toast.is-error { color: rgb(254 202 202); }
</style>
