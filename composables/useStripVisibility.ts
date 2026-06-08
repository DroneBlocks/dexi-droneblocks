// useStripVisibility — single source of truth for which routes get the
// ReadinessStrip. Used by both the strip itself (whether to render) and the
// default layout (whether to carve 48px out of layout-page's top).

import { computed } from 'vue'
import { useRoute } from 'vue-router'

const HIDE_ON = new Set(['/', '/index', '/status'])

export function useStripVisibility() {
  const route = useRoute()
  const visible = computed(() => !HIDE_ON.has(route.path))
  return { visible }
}
