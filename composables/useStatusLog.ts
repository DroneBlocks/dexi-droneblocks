// useStatusLog — module-level state for the STATUSTEXT log panel so that the
// chip (ReadinessStrip) and the panel (StatusTextFeed) can sit in different
// components and still agree on open/close + unseen tracking.

import { computed, ref } from 'vue'
import { useTelemetry } from './useTelemetry'

const logOpen = ref(false)
const lastSeenCount = ref(0)

export function useStatusLog() {
  const { telemetry } = useTelemetry()
  const items = computed(() => telemetry.value.statusTexts)
  const totalCount = computed(() => items.value.length)
  const unseenCount = computed(() => Math.max(0, totalCount.value - lastSeenCount.value))
  const latest = computed(() => items.value[0] ?? null)

  const openLog = () => {
    logOpen.value = true
    lastSeenCount.value = totalCount.value
  }
  const closeLog = () => { logOpen.value = false }
  const toggleLog = () => {
    if (logOpen.value) closeLog()
    else openLog()
  }

  return {
    logOpen,
    items,
    totalCount,
    unseenCount,
    latest,
    openLog,
    closeLog,
    toggleLog,
  }
}
