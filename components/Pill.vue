<script setup lang="ts">
// Reusable status pill for ReadinessStrip + future status panels.
// `label` is the static prefix ("FC", "Battery"); `value` is the live string.
// `state` controls color: green / amber / red / gray.

defineProps<{
  label?: string
  value: string
  state: 'green' | 'amber' | 'red' | 'gray'
}>()
</script>

<template>
  <span class="pill" :class="`pill-${state}`">
    <span class="dot" />
    <span v-if="label" class="pill-label">{{ label }}</span>
    <span class="pill-value">{{ value }}</span>
  </span>
</template>

<style scoped>
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid transparent;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pill-label {
  color: rgb(148 163 184); /* slate-400 */
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.65rem;
  font-weight: 600;
}
.pill-value {
  color: rgb(241 245 249); /* slate-100 */
  font-weight: 500;
}

.pill-green { background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.3); }
.pill-green .dot { background: rgb(16 185 129); box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
.pill-amber { background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.3); }
.pill-amber .dot { background: rgb(245 158 11); box-shadow: 0 0 0 2px rgba(245,158,11,0.2); }
.pill-red { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.35); }
.pill-red .dot { background: rgb(239 68 68); box-shadow: 0 0 0 2px rgba(239,68,68,0.2); }
.pill-gray { background: rgba(71, 85, 105, 0.2); border-color: rgba(71, 85, 105, 0.4); }
.pill-gray .dot { background: rgb(100 116 139); }
.pill-gray .pill-value { color: rgb(148 163 184); }
</style>
