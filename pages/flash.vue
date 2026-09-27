<template>
  <!-- Dev-gated: renders only with ?dev=1 in the URL. Not linked from any menu.
       This surface flashes the flight controller and is NOT for end users yet. -->
  <div v-if="!enabled" class="min-h-screen flex items-center justify-center bg-slate-50">
    <p class="text-slate-400 text-sm">Not found.</p>
  </div>

  <div v-else class="min-h-screen bg-slate-50">
    <!-- Header -->
    <div class="bg-white border-b border-slate-200">
      <div class="container mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="text-xl">←</span>
          </NuxtLink>
          <h1 class="text-xl font-semibold text-slate-900">Flight Controller Firmware</h1>
          <span class="text-[11px] uppercase tracking-wide font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Dev</span>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-6 py-8 max-w-2xl">
      <!-- Safety banner -->
      <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6 text-sm text-amber-900">
        <p class="font-semibold mb-1">Reboots the flight controller.</p>
        <p>Remove propellers and keep the drone on the bench. Do not run this while armed or in flight. The FC will be unavailable for ~30&nbsp;s while it flashes and reboots.</p>
      </div>

      <!-- Firmware path -->
      <label class="block text-sm font-medium text-slate-700 mb-1">Firmware file on the drone</label>
      <input
        v-model="firmwarePath"
        type="text"
        spellcheck="false"
        :disabled="flashing"
        class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
      />
      <p class="text-xs text-slate-400 mt-1">Path is read on the drone's filesystem. The image ships the current firmware under <code>/home/dexi/</code>.</p>

      <!-- Action -->
      <button
        class="mt-5 w-full rounded-lg px-4 py-2.5 font-semibold text-white transition-colors"
        :class="canFlash ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 cursor-not-allowed'"
        :disabled="!canFlash"
        @click="confirmAndFlash"
      >
        {{ flashing ? 'Flashing…' : 'Flash Flight Controller' }}
      </button>

      <!-- Result -->
      <div
        v-if="result"
        class="mt-5 rounded-lg p-4 text-sm"
        :class="result.success ? 'bg-green-50 border border-green-200 text-green-900' : 'bg-red-50 border border-red-200 text-red-900'"
      >
        <p class="font-semibold">{{ result.success ? 'Flash completed' : 'Flash failed' }}</p>
        <p>{{ result.message }}</p>
        <p v-if="result.exit_code !== undefined" class="font-mono text-xs mt-1 opacity-70">exit_code: {{ result.exit_code }}</p>
      </div>

      <!-- Live progress log -->
      <div v-if="log.length" class="mt-6">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-medium text-slate-700">Progress</h2>
          <button v-if="!flashing" class="text-xs text-slate-400 hover:text-slate-600" @click="log = []">clear</button>
        </div>
        <pre ref="logEl" class="rounded-lg bg-slate-900 text-slate-100 text-xs font-mono p-4 h-64 overflow-auto whitespace-pre-wrap">{{ log.join('\n') }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

// ── Gate ────────────────────────────────────────────────────────────────────
// Hidden feature: only active with ?dev=1. Anything else renders "Not found".
const route = useRoute()
const enabled = computed(() => route.query.dev === '1')

const DEFAULT_FW = '/home/dexi/ark_pi6x_default_v1.16.2.px4'

const firmwarePath = ref(DEFAULT_FW)
const flashing = ref(false)
const log = ref([])
const result = ref(null)
const logEl = ref(null)

const canFlash = computed(() => !flashing.value && /\.px4$/.test(firmwarePath.value.trim()))

const append = (line) => {
  log.value.push(line)
  nextTick(() => { if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight })
}

const confirmAndFlash = () => {
  if (!canFlash.value) return
  const ok = window.confirm(
    `Flash this firmware to the flight controller?\n\n${firmwarePath.value}\n\nProps off, not in flight. The FC will reboot.`,
  )
  if (ok) flash()
}

// POST to the Nitro endpoint, which runs flash_px4.sh (or a simulated run when
// no drone is present) and streams progress back line-by-line. No ROS.
const flash = async () => {
  result.value = null
  log.value = []
  flashing.value = true
  append(`→ Requesting flash: ${firmwarePath.value}`)

  try {
    const resp = await fetch('/api/flash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firmwarePath: firmwarePath.value.trim() }),
    })
    if (!resp.ok || !resp.body) {
      const msg = await resp.text().catch(() => resp.statusText)
      throw new Error(msg || `HTTP ${resp.status}`)
    }

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    const handleLine = (l) => {
      if (l.startsWith('RESULT:')) {
        try { result.value = JSON.parse(l.slice('RESULT:'.length)) } catch {}
      } else {
        append(l)
      }
    }
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop()
      for (const l of lines) if (l) handleLine(l)
    }
    if (buf) handleLine(buf)
    if (!result.value) result.value = { success: false, message: 'Stream ended without a result' }
  } catch (err) {
    append(`← ERROR: ${err.message || err}`)
    result.value = { success: false, message: `Flash request failed: ${err.message || err}` }
  } finally {
    flashing.value = false
  }
}
</script>
