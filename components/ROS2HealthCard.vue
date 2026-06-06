<script setup lang="ts">
// ROS2HealthCard — diagnostic card for the /status page. Surfaces the state
// of the uXRCE-DDS pipe (FC ↔ micro_ros_agent ↔ ROS 2 ↔ rosbridge).
// Purposefully independent of mavlink2rest so users can tell which side is
// failing when telemetry goes N/A.

import { computed } from 'vue'
import { useROSHealth } from '~/composables/useROSHealth'

const { health } = useROSHealth()

// ---- Diagnostic verdict ----
type Verdict = { state: 'green' | 'amber' | 'red' | 'gray'; label: string; hint: string }

const verdict = computed<Verdict>(() => {
  const h = health.value
  if (!h.connected) {
    return {
      state: 'red',
      label: 'rosbridge offline',
      hint: 'The Pi-side rosbridge_server is unreachable. The ROS 2 stack may be down.',
    }
  }
  if (h.totalTopics == null) {
    return { state: 'gray', label: 'querying…', hint: '' }
  }
  if ((h.fmuTopics ?? 0) === 0) {
    return {
      state: 'red',
      label: 'µROS agent not registered',
      hint: 'No /fmu/* topics in the graph. The micro_ros_agent may not be running, or the FC has not connected.',
    }
  }
  const probedTopics = h.probes.filter((p) => p.rate !== null)
  const alive = probedTopics.filter((p) => p.alive).length
  if (probedTopics.length > 0 && alive === 0) {
    return {
      state: 'red',
      label: 'FC not publishing',
      hint: '/fmu/* topics are advertised but no data is flowing. The FC\'s uXRCE-DDS client may need a restart — try `sudo systemctl restart dexi` or power-cycle the FC.',
    }
  }
  if (probedTopics.length > 0 && alive < probedTopics.length) {
    return {
      state: 'amber',
      label: 'partial flow',
      hint: `${alive}/${probedTopics.length} critical topics receiving data. Some PX4 components may not be publishing yet.`,
    }
  }
  return {
    state: 'green',
    label: 'healthy',
    hint: 'All probed PX4 topics receiving data via uXRCE-DDS.',
  }
})

// short topic display (strip /fmu/out/ prefix to save space)
function shortTopicName(name: string): string {
  return name.replace(/^\/fmu\/out\//, '')
}
</script>

<template>
  <div class="status-card">
    <div class="flex items-center justify-between mb-3">
      <h2 class="status-card-title mb-0">ROS 2 / µROS</h2>
      <span
        class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="{
          'bg-green-100 text-green-800': verdict.state === 'green',
          'bg-amber-100 text-amber-800': verdict.state === 'amber',
          'bg-red-100 text-red-800': verdict.state === 'red',
          'bg-slate-200 text-slate-600': verdict.state === 'gray',
        }"
      >
        <span
          class="inline-block w-1.5 h-1.5 rounded-full"
          :class="{
            'bg-green-500': verdict.state === 'green',
            'bg-amber-500': verdict.state === 'amber',
            'bg-red-500': verdict.state === 'red',
            'bg-slate-400': verdict.state === 'gray',
          }"
        />
        {{ verdict.label }}
      </span>
    </div>

    <div class="space-y-3">
      <!-- rosbridge connection -->
      <div class="status-row">
        <span class="status-label">rosbridge</span>
        <span class="status-value">
          <span
            class="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
            :class="health.connected ? 'bg-green-500' : 'bg-red-500'"
          />
          {{ health.connected ? 'connected' : 'offline' }}
        </span>
      </div>

      <!-- topic counts -->
      <div class="status-row">
        <span class="status-label">PX4 topics (/fmu/*)</span>
        <span class="status-value font-mono">
          {{ health.fmuTopics ?? '—' }}
        </span>
      </div>
      <div class="status-row">
        <span class="status-label">DEXI topics (/dexi/*)</span>
        <span class="status-value font-mono">{{ health.dexiTopics ?? '—' }}</span>
      </div>
      <div class="status-row">
        <span class="status-label">Total topics</span>
        <span class="status-value font-mono">{{ health.totalTopics ?? '—' }}</span>
      </div>

      <!-- per-topic probes -->
      <div v-if="health.probes.length" class="border-t border-slate-100 pt-3 mt-3">
        <div class="text-xs uppercase tracking-wide text-slate-400 mb-2 font-medium">
          Critical PX4 topic probes
        </div>
        <div class="space-y-1.5">
          <div
            v-for="p in health.probes"
            :key="p.name"
            class="flex items-center gap-2 text-xs"
          >
            <span
              class="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
              :class="{
                'bg-green-500': p.alive,
                'bg-red-500': p.rate !== null && !p.alive,
                'bg-slate-300': p.rate === null,
              }"
            />
            <code class="font-mono flex-1 truncate text-slate-700" :title="p.name">
              {{ shortTopicName(p.name) }}
            </code>
            <span class="font-mono text-slate-500 w-20 text-right">
              <template v-if="p.rate === null">untyped</template>
              <template v-else-if="p.alive">{{ p.rate.toFixed(1) }} Hz</template>
              <template v-else>0 Hz</template>
            </span>
          </div>
        </div>
      </div>

      <!-- diagnostic hint -->
      <div
        v-if="verdict.hint"
        class="border-t border-slate-100 pt-3 mt-3"
      >
        <p
          class="text-xs leading-relaxed"
          :class="{
            'text-green-700': verdict.state === 'green',
            'text-amber-700': verdict.state === 'amber',
            'text-red-700': verdict.state === 'red',
            'text-slate-500': verdict.state === 'gray',
          }"
        >
          {{ verdict.hint }}
        </p>
      </div>
    </div>
  </div>
</template>
