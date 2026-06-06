<script setup lang="ts">
// StatusTextFeed — QGC-style PX4 message overlay. Two surfaces:
//   1. Transient toast that flashes at the top-center when a new STATUSTEXT
//      arrives, auto-fades after TOAST_LIFETIME_MS.
//   2. On-demand bottom-right log panel — small chip showing message count;
//      click to expand into a scrollable list. Hidden by default so it
//      doesn't compete with the camera/map view.

import { ref, watch } from 'vue'
import type { StatusText } from '~/composables/useTelemetry'
import { useStatusLog } from '~/composables/useStatusLog'

const { items, latest, logOpen, openLog, closeLog } = useStatusLog()

const TOAST_LIFETIME_MS = 5000
const TOAST_FADE_MS = 400

// ---- Toast on new message -------------------------------------------------
const toastEntry = ref<StatusText | null>(null)
const toastVisible = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null
let fadeTimer: ReturnType<typeof setTimeout> | null = null
let lastToastedTs = 0

watch(latest, (val) => {
  if (!val) return
  if (val.ts === lastToastedTs) return
  lastToastedTs = val.ts
  toastEntry.value = val
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  if (fadeTimer) clearTimeout(fadeTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
    fadeTimer = setTimeout(() => { toastEntry.value = null }, TOAST_FADE_MS)
  }, TOAST_LIFETIME_MS)
}, { flush: 'post' })

// ---- Helpers --------------------------------------------------------------
const fmtTime = (ts: number) => {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour12: false })
}
const sevClass = (s: number) => {
  if (s <= 2) return 'sev-critical'
  if (s === 3) return 'sev-error'
  if (s === 4) return 'sev-warning'
  if (s === 5) return 'sev-notice'
  return 'sev-info'
}
const sevLabel = (s: number) => {
  if (s <= 2) return 'CRIT'
  if (s === 3) return 'ERR'
  if (s === 4) return 'WARN'
  if (s === 5) return 'NOTICE'
  if (s === 7) return 'DEBUG'
  return 'INFO'
}
</script>

<template>
  <Teleport to="body">
    <!-- Toast: flashes top-center when a new message arrives -->
    <Transition name="toast">
      <div
        v-if="toastEntry && toastVisible"
        class="msg-toast"
        :class="sevClass(toastEntry.severity)"
        role="status"
        @click="openLog"
      >
        <span class="toast-sev">{{ sevLabel(toastEntry.severity) }}</span>
        <span class="toast-text">{{ toastEntry.text }}</span>
      </div>
    </Transition>

    <!-- Log panel overlay (opened via MSG pill in the readiness strip) -->
    <Transition name="panel">
      <div v-if="logOpen" class="msg-panel">
        <div class="panel-header">
          <span class="panel-title">FC Messages</span>
          <span class="panel-count">{{ items.length }}</span>
          <button class="panel-close" @click="closeLog" aria-label="Close">×</button>
        </div>
        <div class="panel-body">
          <div v-if="items.length === 0" class="empty">No messages</div>
          <div
            v-for="(it, i) in items"
            :key="i"
            class="row"
            :class="sevClass(it.severity)"
          >
            <span class="ts">{{ fmtTime(it.ts) }}</span>
            <span class="sev">{{ sevLabel(it.severity) }}</span>
            <span class="text">{{ it.text }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ---- Toast (top-center) ------------------------------------------------ */
.msg-toast {
  position: fixed;
  top: 4.2rem;            /* below readiness strip */
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.3);
  backdrop-filter: blur(8px);
  font-family: ui-monospace, monospace;
  font-size: 0.82rem;
  color: rgb(241 245 249);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  max-width: 70vw;
  cursor: pointer;
}
.toast-sev {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: rgb(51 65 85);
}
.toast-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toast-enter-active, .toast-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

/* ---- Log panel --------------------------------------------------------- */
.msg-panel {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 60;
  width: min(520px, calc(100vw - 2rem));
  max-height: 50vh;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 10px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  color: rgb(241 245 249);
  font-family: ui-monospace, monospace;
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}
.panel-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgb(148 163 184);
}
.panel-count {
  font-size: 0.7rem;
  color: rgb(100 116 139);
  flex: 1;
}
.panel-close {
  background: transparent;
  border: none;
  color: rgb(148 163 184);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
}
.panel-close:hover { color: rgb(241 245 249); }

.panel-body {
  overflow-y: auto;
  padding: 0.25rem 0;
}
.empty {
  padding: 1rem;
  text-align: center;
  color: rgb(100 116 139);
  font-size: 0.78rem;
}
.row {
  display: grid;
  grid-template-columns: 70px 60px 1fr;
  gap: 0.5rem;
  padding: 0.3rem 0.75rem;
  font-size: 0.72rem;
  border-bottom: 1px solid rgba(30, 41, 59, 0.5);
}
.row:last-child { border-bottom: none; }
.ts { color: rgb(100 116 139); }
.sev {
  font-size: 0.62rem;
  text-transform: uppercase;
  font-weight: 700;
  align-self: center;
}
.text { word-break: break-word; }

.sev-info .sev { color: rgb(148 163 184); }
.sev-info .text { color: rgb(226 232 240); }
.sev-notice .sev { color: rgb(96 165 250); }
.sev-notice .text { color: rgb(191 219 254); }
.sev-warning .sev { color: rgb(245 158 11); }
.sev-warning .text { color: rgb(252 211 77); }
.sev-error .sev { color: rgb(239 68 68); }
.sev-error .text { color: rgb(252 165 165); }
.sev-critical .sev { color: rgb(220 38 38); }
.sev-critical .text { color: rgb(254 202 202); font-weight: 600; }

/* Toast variants */
.msg-toast.sev-warning { border-color: rgba(245, 158, 11, 0.5); }
.msg-toast.sev-warning .toast-sev { background: rgba(245, 158, 11, 0.3); color: rgb(252 211 77); }
.msg-toast.sev-error { border-color: rgba(239, 68, 68, 0.5); }
.msg-toast.sev-error .toast-sev { background: rgba(239, 68, 68, 0.3); color: rgb(252 165 165); }
.msg-toast.sev-critical { border-color: rgba(220, 38, 38, 0.6); }
.msg-toast.sev-critical .toast-sev { background: rgba(220, 38, 38, 0.4); color: rgb(254 202 202); }
.msg-toast.sev-notice { border-color: rgba(96, 165, 250, 0.4); }
.msg-toast.sev-notice .toast-sev { background: rgba(96, 165, 250, 0.3); color: rgb(191 219 254); }

/* Panel transitions */
.panel-enter-active, .panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.panel-enter-from, .panel-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
