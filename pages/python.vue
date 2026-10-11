<template>
  <div class="python-page">
    <div class="python-header">
      <a href="/demos" class="header-btn" title="Back to Demos">← Demos</a>
      <div class="header-title">
        <span class="text-xl">🐍</span>
        <span class="font-semibold">{{ example ? example.name : fileName }}</span>
        <span v-if="file" class="header-path">{{ file }}</span>
      </div>
      <div class="header-actions">
        <button class="header-btn" @click="toggleView">
          {{ viewMode === 'drone' ? 'Show Sim' : 'Show DEXI Camera' }}
        </button>
        <a v-if="codeUrl" :href="codeUrl" target="_blank" class="header-btn">Open in New Tab ↗</a>
      </div>
    </div>

    <div class="split-container">
      <div class="code-panel" :style="{ width: leftPanelWidth + '%' }">
        <iframe v-if="codeUrl" :src="codeUrl" class="panel-iframe" :class="{ 'no-pointer': isDragging }"></iframe>
        <div v-else class="panel-message">Finding the workspace…</div>
      </div>

      <div class="divider" :class="{ dragging: isDragging }" @mousedown="isDragging = true">
        <div class="divider-handle"></div>
      </div>

      <div class="view-panel" :style="{ width: (100 - leftPanelWidth) + '%' }">
        <iframe
          v-if="viewMode !== 'drone'"
          :src="simViewerUrl"
          class="panel-iframe"
          :class="{ 'no-pointer': isDragging }"
          allowfullscreen
        ></iframe>
        <CameraFeed v-else :should-invert="false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// code-server on the left, the simulator (or the drone's camera) on the right,
// so a script can be edited, run, and watched without switching tabs.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import ROSLIB from 'roslib';
import CameraFeed from '~/components/CameraFeed.vue';
import { useROS } from '~/composables/useROS';
import { useDexiPlatform } from '~/composables/useDexiPlatform';
import { findPythonExample } from '~/assets/ts/pythonExamples';

const route = useRoute();
const config = useRuntimeConfig().public;
const { getROSURL } = useROS();
const { isSim, isHardware, loadPlatformParams } = useDexiPlatform();

const file = computed(() => String(route.query.file || ''));
const example = computed(() => findPythonExample(file.value));
const fileName = computed(() => file.value.split('/').pop() || 'Python');

const viewMode = ref<'simulator' | 'drone'>('simulator');
const homeDir = ref('');
const leftPanelWidth = ref(55);
const isDragging = ref(false);

const hostname = process.client ? window.location.hostname : 'localhost';
const simViewerUrl = computed(() => {
  const base = (config.simUrl || `http://${hostname}:1337`).replace(/\/$/, '');
  const ws = config.rosbridgeUrl || `ws://${hostname}:9090`;
  return `${base}/viewer-corridor.html?autoconnect=1&ws=${encodeURIComponent(ws)}`;
});

// code-server opens the example's own folder, so its neighbors are one click away.
const codeUrl = computed(() => {
  if (!homeDir.value) return '';
  const base = (config.vscodeUrl || `http://${hostname}:9999`).replace(/\/$/, '');
  if (!file.value) return `${base}/?folder=${encodeURIComponent(homeDir.value)}`;
  const abs = `${homeDir.value}/${file.value}`;
  const folder = abs.slice(0, abs.lastIndexOf('/'));
  // code-server ignores a file= parameter; the workbench opens files from a payload.
  const payload = JSON.stringify([['openFile', `vscode-remote://${abs}`]]);
  return `${base}/?folder=${encodeURIComponent(folder)}&payload=${encodeURIComponent(payload)}`;
});

function setPlatform(sim: boolean) {
  homeDir.value = sim ? '/home/ubuntu' : '/home/dexi';
  viewMode.value = sim ? 'simulator' : 'drone';
}

function toggleView() {
  viewMode.value = viewMode.value === 'drone' ? 'simulator' : 'drone';
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return;
  const pct = (e.clientX / window.innerWidth) * 100;
  if (pct >= 20 && pct <= 80) leftPanelWidth.value = pct;
}

function stopDragging() {
  isDragging.value = false;
}

let ros: ROSLIB.Ros | null = null;
let fallback: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDragging);

  // The platform param says whether this is the simulator or a drone, which
  // decides the home folder. Without rosbridge, fall back to the last view
  // picked on the DroneBlocks page.
  const fromLastView = () => setPlatform(localStorage.getItem('droneblocks_view_mode') !== 'drone');
  fallback = setTimeout(() => { if (!homeDir.value) fromLastView(); }, 3000);
  ros = new ROSLIB.Ros({ url: getROSURL() });
  ros.on('connection', () => {
    loadPlatformParams(ros as ROSLIB.Ros).then(() => {
      if (isSim.value || isHardware.value) setPlatform(isSim.value);
      else if (!homeDir.value) fromLastView();
    });
  });
  ros.on('error', () => { if (!homeDir.value) fromLastView(); });
});

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDragging);
  if (fallback) clearTimeout(fallback);
  ros?.close();
});
</script>

<style scoped>
.python-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.python-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #0f172a;
}

.header-path {
  color: #64748b;
  font-size: 12px;
  font-family: ui-monospace, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.header-btn {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font-size: 14px;
  white-space: nowrap;
}

.header-btn:hover {
  border-color: #2a9d8f;
}

.split-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.code-panel,
.view-panel {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.view-panel {
  background-color: #1a1a1a;
}

.panel-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* Iframes swallow mouse events, which would stop the divider drag. */
.panel-iframe.no-pointer {
  pointer-events: none;
}

.panel-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
}

.divider {
  width: 8px;
  height: 100%;
  background-color: #2a9d8f;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
}

.divider:hover,
.divider.dragging {
  background-color: #21867a;
}

.divider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}
</style>
