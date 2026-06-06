<script setup lang="ts">
// StatusTextFeed — scrollable list of recent PX4 STATUSTEXT messages from the
// FC. Severity-colored. Sources from useTelemetry().statusTexts (ring buffer).

import { computed, ref } from 'vue'
import { useTelemetry } from '~/composables/useTelemetry'

const { telemetry } = useTelemetry()
const expanded = ref(true)

const items = computed(() => telemetry.value.statusTexts)
const latest = computed(() => items.value[0] ?? null)

const fmtTime = (ts: number) => {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
}

const sevClass = (s: number) => {
  if (s <= 2) return 'sev-critical'  // EMERGENCY / ALERT / CRITICAL
  if (s === 3) return 'sev-error'
  if (s === 4) return 'sev-warning'
  if (s === 5) return 'sev-notice'
  return 'sev-info'
}
</script>

<template>
  <div class="status-feed">
    <div class="status-feed-header" @click="expanded = !expanded">
      <span class="title">Messages</span>
      <span v-if="latest" class="latest" :class="sevClass(latest.severity)" :title="latest.text">
        <span class="latest-sev">{{ latest.severityName }}</span>
        <span class="latest-text">{{ latest.text }}</span>
      </span>
      <span v-else class="muted">no messages yet</span>
      <button class="toggle" :aria-label="expanded ? 'Collapse' : 'Expand'">
        <svg viewBox="0 0 12 12" fill="currentColor" :style="{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }"><path d="M2 4l4 4 4-4z" /></svg>
      </button>
    </div>
    <div v-show="expanded" class="status-feed-body">
      <div v-if="items.length === 0" class="empty">Waiting for FC messages…</div>
      <div v-else class="rows">
        <div v-for="(it, i) in items" :key="i" class="row" :class="sevClass(it.severity)">
          <span class="ts">{{ fmtTime(it.ts) }}</span>
          <span class="sev">{{ it.severityName }}</span>
          <span class="text">{{ it.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-feed {
  background: rgb(15 23 42);
  color: rgb(241 245 249);
  border: 1px solid rgb(30 41 59);
  border-radius: 8px;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  overflow: hidden;
}
.status-feed-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0.75rem;
  background: rgb(30 41 59);
  cursor: pointer;
  user-select: none;
}
.title {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.65rem;
  font-weight: 600;
  color: rgb(148 163 184);
}
.muted { color: rgb(100 116 139); flex: 1; }
.latest {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}
.latest-sev {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  background: rgb(51 65 85);
}
.latest-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.toggle {
  background: transparent;
  border: none;
  color: rgb(148 163 184);
  cursor: pointer;
  padding: 0.15rem;
}
.toggle svg { width: 12px; height: 12px; transition: transform 0.15s ease; }

.status-feed-body {
  max-height: 200px;
  overflow-y: auto;
}
.empty {
  padding: 0.75rem;
  color: rgb(100 116 139);
  text-align: center;
}
.rows {
  display: flex;
  flex-direction: column;
}
.row {
  display: grid;
  grid-template-columns: 110px 80px 1fr;
  gap: 0.5rem;
  padding: 0.3rem 0.75rem;
  border-bottom: 1px solid rgba(30, 41, 59, 0.5);
}
.row:last-child { border-bottom: none; }
.ts { color: rgb(100 116 139); }
.sev {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
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

.latest.sev-warning .latest-sev { background: rgba(245, 158, 11, 0.3); color: rgb(252 211 77); }
.latest.sev-error .latest-sev { background: rgba(239, 68, 68, 0.3); color: rgb(252 165 165); }
.latest.sev-critical .latest-sev { background: rgba(220, 38, 38, 0.4); color: rgb(254 202 202); }
.latest.sev-notice .latest-sev { background: rgba(59, 130, 246, 0.3); color: rgb(191 219 254); }
</style>
