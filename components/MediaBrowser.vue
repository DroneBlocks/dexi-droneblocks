<template>
  <!-- Photos and videos saved on the drone by dexi_capture_media. -->
  <div class="h-full overflow-y-auto p-2 sm:p-4 text-gray-200">
    <div class="flex items-center gap-3 mb-3 text-sm">
      <span class="font-semibold">{{ files.length }} file{{ files.length === 1 ? '' : 's' }}</span>
      <span v-if="freeMb !== null" class="text-gray-400">{{ (freeMb / 1024).toFixed(1) }} GB free</span>
      <label v-if="files.length" class="ml-auto flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" :checked="allSelected" :indeterminate.prop="someSelected" @change="toggleAll" />
        Select all
      </label>
      <button
        v-if="selected.size"
        class="px-3 py-1 rounded bg-red-900 hover:bg-red-800 disabled:opacity-50"
        :disabled="deleting"
        @click="removeSelected"
      >
        {{ deleting ? 'Deleting…' : `Delete ${selected.size} selected` }}
      </button>
      <button class="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600" :class="{ 'ml-auto': !files.length }" :disabled="loading" @click="refresh">
        {{ loading ? 'Loading…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="error" class="text-red-300 text-sm">
      Could not reach the capture service on the drone ({{ error }}). Check that
      <code>nodes.capture_media.enabled</code> is true.
    </p>
    <p v-else-if="!loading && files.length === 0" class="text-gray-400 text-sm">
      No photos or videos yet. Use the buttons on the Camera tab or your RC switch.
    </p>

    <div class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="f in files"
        :key="f.name"
        class="bg-gray-800 rounded overflow-hidden relative ring-2"
        :class="selected.has(f.name) ? 'ring-blue-400' : 'ring-transparent'"
      >
        <input
          type="checkbox"
          class="absolute top-2 left-2 w-5 h-5 cursor-pointer z-10"
          :checked="selected.has(f.name)"
          :aria-label="`Select ${f.name}`"
          @change="toggle(f.name)"
        />
        <img v-if="f.type === 'photo'" :src="mediaUrl(f.name)" :alt="f.name" loading="lazy" class="w-full aspect-[4/3] object-contain bg-black" />
        <video v-else :src="mediaUrl(f.name)" controls preload="metadata" class="w-full aspect-[4/3] bg-black" />
        <div class="flex items-center gap-2 px-2 py-1.5 text-xs">
          <div class="min-w-0">
            <div class="truncate">{{ f.name }}</div>
            <div class="text-gray-400">{{ when(f.mtime) }} · {{ size(f.size) }}</div>
          </div>
          <a class="ml-auto px-2 py-1 rounded bg-gray-700 hover:bg-gray-600" :href="mediaUrl(f.name, true)">Download</a>
          <button class="px-2 py-1 rounded bg-red-900 hover:bg-red-800" @click="remove(f)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listMedia, deleteMedia, mediaUrl } from '~/composables/useCaptureMedia'

const files = ref([])
const freeMb = ref(null)
const loading = ref(false)
const error = ref('')
const selected = ref(new Set())
const deleting = ref(false)

const allSelected = computed(() => files.value.length > 0 && selected.value.size === files.value.length)
const someSelected = computed(() => selected.value.size > 0 && !allSelected.value)

function toggle(name) {
  const s = new Set(selected.value)
  s.has(name) ? s.delete(name) : s.add(name)
  selected.value = s
}

function toggleAll() {
  selected.value = allSelected.value ? new Set() : new Set(files.value.map((f) => f.name))
}

async function refresh() {
  loading.value = true
  try {
    const res = await listMedia()
    files.value = res.files
    freeMb.value = res.free_mb
    // Keep only selections that still exist.
    const names = new Set(res.files.map((f) => f.name))
    selected.value = new Set([...selected.value].filter((n) => names.has(n)))
    error.value = ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Deletes one at a time; the node has no batch endpoint and does not need one.
async function deleteNames(names) {
  const failed = []
  for (const name of names) {
    try {
      await deleteMedia(name)
    } catch (e) {
      failed.push(`${name} (${e.message})`)
    }
  }
  await refresh()
  if (failed.length) alert(`Could not delete:\n${failed.join('\n')}`)
}

async function remove(f) {
  if (!confirm(`Delete ${f.name}? This cannot be undone.`)) return
  await deleteNames([f.name])
}

async function removeSelected() {
  const names = [...selected.value]
  if (!confirm(`Delete ${names.length} file${names.length === 1 ? '' : 's'}? This cannot be undone.`)) return
  deleting.value = true
  try {
    await deleteNames(names)
  } finally {
    deleting.value = false
  }
}

const when = (t) => new Date(t * 1000).toLocaleString()
const size = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`)

onMounted(refresh)
</script>
