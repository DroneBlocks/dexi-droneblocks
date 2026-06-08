<script setup lang="ts">
// Reusable status pill for ReadinessStrip + future status panels.
// `label` is the static prefix ("FC", "Battery"); `value` is the live string.
// `state` controls color: green / amber / red / gray.
// When `clickable`, renders as a button with hover styles and emits `click`.

const props = defineProps<{
  label?: string
  value: string
  state: 'green' | 'amber' | 'red' | 'gray'
  clickable?: boolean
  active?: boolean
  /**
   * Reserve a fixed character width for the value with tabular-nums + right
   * alignment, so the pill doesn't jitter horizontally as the value's char
   * count changes (e.g., `9.5m` → `10.2m`). Pass a CSS length like "6ch".
   */
  valueWidth?: string
}>()

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <component
    :is="clickable ? 'button' : 'span'"
    :type="clickable ? 'button' : undefined"
    class="pill"
    :class="[`pill-${state}`, { 'pill-clickable': clickable, 'pill-active': active }]"
    @click="(e: MouseEvent) => clickable && $emit('click', e)"
  >
    <span class="dot" />
    <span v-if="label" class="pill-label">{{ label }}</span>
    <span
      class="pill-value"
      :class="{ 'pill-value-numeric': valueWidth }"
      :style="valueWidth ? { minWidth: valueWidth } : undefined"
    >{{ value }}</span>
    <svg
      v-if="clickable"
      class="caret"
      viewBox="0 0 12 12"
      fill="currentColor"
      aria-hidden="true"
    ><path d="M2 4l4 4 4-4z" /></svg>
  </component>
</template>

<style scoped>
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-family: ui-monospace, monospace;
  font-size: 0.78rem;
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
  color: rgb(148 163 184);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.68rem;
  font-weight: 600;
}
.pill-value {
  color: rgb(241 245 249);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.pill-value-numeric {
  display: inline-block;
  text-align: right;
}
.caret {
  width: 9px;
  height: 9px;
  margin-left: 0.15rem;
  color: rgb(148 163 184);
}

.pill-clickable {
  cursor: pointer;
  transition: filter 0.12s ease, transform 0.06s ease;
}
.pill-clickable:hover { filter: brightness(1.25); }
.pill-clickable:active { transform: translateY(1px); }
.pill-active { box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.5); }

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
