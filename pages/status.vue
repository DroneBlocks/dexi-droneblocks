<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header -->
    <div class="bg-white border-b border-slate-200">
      <div class="container mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="text-xl">←</span>
          </NuxtLink>
          <h1 class="text-xl font-semibold text-slate-900">System Status</h1>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="inline-block w-2 h-2 rounded-full"
            :class="status ? 'bg-green-500' : 'bg-red-500'"
          />
          <span class="text-sm text-slate-500">
            {{ status ? 'Connected' : 'Unreachable' }}
          </span>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-6 py-8">
      <!-- Loading state -->
      <div v-if="!status && !error" class="text-center py-20 text-slate-400">
        Loading system info...
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-20">
        <p class="text-red-500 mb-2">Failed to reach system</p>
        <p class="text-sm text-slate-400">{{ error }}</p>
      </div>

      <template v-else>
        <!-- Top row: System + Memory -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">

          <!-- System -->
          <div class="status-card">
            <h2 class="status-card-title">System</h2>
            <div class="space-y-3">
              <div class="status-row">
                <span class="status-label">Hostname</span>
                <span class="status-value font-mono">{{ status!.hostname }}</span>
              </div>
              <div class="status-row">
                <span class="status-label">Uptime</span>
                <span class="status-value">{{ status!.uptime || 'N/A' }}</span>
              </div>
              <div v-if="status!.cpuTempC != null" class="status-row">
                <span class="status-label">CPU Temp</span>
                <span
                  class="status-value"
                  :class="{
                    'text-green-600': status!.cpuTempC! < 60,
                    'text-amber-600': status!.cpuTempC! >= 60 && status!.cpuTempC! < 75,
                    'text-red-600': status!.cpuTempC! >= 75
                  }"
                >
                  {{ status!.cpuTempC!.toFixed(1) }} °C
                </span>
              </div>
            </div>
          </div>

          <!-- Memory -->
          <div v-if="status!.memory" class="status-card">
            <h2 class="status-card-title">Memory</h2>
            <div class="space-y-3">
              <div class="status-row">
                <span class="status-label">Total</span>
                <span class="status-value">{{ status!.memory!.totalMb }} MB</span>
              </div>
              <div class="status-row">
                <span class="status-label">Used</span>
                <span class="status-value">{{ status!.memory!.usedMb }} MB</span>
              </div>
              <div class="mt-3">
                <div class="w-full bg-slate-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all duration-500"
                    :class="{
                      'bg-green-500': memPercent < 70,
                      'bg-amber-500': memPercent >= 70 && memPercent < 90,
                      'bg-red-500': memPercent >= 90
                    }"
                    :style="{ width: memPercent + '%' }"
                  />
                </div>
                <p class="text-xs text-slate-400 mt-1 text-right">{{ memPercent }}%</p>
              </div>
            </div>
          </div>

          <!-- 5G / Cellular -->
          <div class="status-card">
            <h2 class="status-card-title">Cellular</h2>
            <div v-if="cellularInterface" class="space-y-3">
              <div class="flex items-center gap-2 mb-1">
                <span class="inline-block w-2 h-2 rounded-full bg-green-500" />
                <span class="text-sm text-green-700 font-medium">Connected</span>
              </div>
              <div class="status-row">
                <span class="status-label">Interface</span>
                <span class="status-value font-mono">{{ cellularInterface.name }}</span>
              </div>
              <div v-if="cellularInterface.ip" class="status-row">
                <span class="status-label">IP</span>
                <span class="status-value font-mono">{{ cellularInterface.ip }}</span>
              </div>
            </div>
            <div v-else class="flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full bg-slate-300" />
              <span class="text-sm text-slate-400">No modem detected</span>
            </div>
          </div>
        </div>

        <!-- WiFi Mode Section -->
        <div class="status-card mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="status-card-title mb-0">WiFi Mode</h2>
            <div class="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                class="mode-btn"
                :class="status!.wifiMode === 'hotspot' ? 'mode-btn-active' : ''"
                :disabled="switching"
                @click="switchToHotspot"
              >
                Hotspot
              </button>
              <button
                class="mode-btn"
                :class="status!.wifiMode === 'client' ? 'mode-btn-active' : ''"
                :disabled="switching || !hasClientNetworks"
              >
                Client
              </button>
            </div>
          </div>

          <!-- Hotspot Active -->
          <div v-if="status!.wifiMode === 'hotspot'" class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-lg">📡</span>
              <span class="font-semibold text-amber-900">Hotspot Active</span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="status-row">
                <span class="text-amber-700">SSID</span>
                <span class="font-mono font-medium text-amber-900">{{ hotspotSsid }}</span>
              </div>
              <div class="status-row">
                <span class="text-amber-700">IP Address</span>
                <span class="font-mono font-medium text-amber-900">192.168.4.1</span>
              </div>
              <div class="status-row">
                <span class="text-amber-700">Password</span>
                <span class="font-mono font-medium text-amber-900">droneblocks</span>
              </div>
            </div>
          </div>

          <!-- Client Active -->
          <div v-else-if="status!.wifiMode === 'client'" class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-lg">📶</span>
              <span class="font-semibold text-blue-900">Connected to WiFi</span>
            </div>
            <div v-if="wifiInterface" class="space-y-2 text-sm">
              <div class="status-row">
                <span class="text-blue-700">Network</span>
                <span class="font-mono font-medium text-blue-900">{{ wifiInterface.ssid }}</span>
              </div>
              <div class="status-row">
                <span class="text-blue-700">IP Address</span>
                <span class="font-mono font-medium text-blue-900">{{ wifiInterface.ip }}</span>
              </div>
            </div>
          </div>

          <!-- Disconnected -->
          <div v-else class="p-4 bg-slate-100 border border-slate-200 rounded-lg">
            <div class="flex items-center gap-2">
              <span class="text-lg">⚠️</span>
              <span class="text-slate-600">WiFi disconnected</span>
            </div>
          </div>

          <!-- Switch warning -->
          <div v-if="switchWarning" class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-sm text-yellow-800">{{ switchWarning }}</p>
            <div class="flex gap-2 mt-2">
              <button class="btn btn-sm btn-warning" :disabled="switching" @click="confirmSwitch">
                {{ switching ? 'Switching...' : 'Confirm Switch' }}
              </button>
              <button class="btn btn-sm btn-ghost" @click="cancelSwitch">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Saved Networks -->
        <div class="status-card mb-6">
          <h2 class="status-card-title">Saved Networks</h2>
          <div v-if="status!.savedConnections.length === 0" class="text-sm text-slate-400">
            No saved WiFi networks
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="conn in status!.savedConnections"
              :key="conn.name"
              class="flex items-center justify-between p-3 rounded-lg border"
              :class="conn.active ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'"
            >
              <div class="flex items-center gap-3">
                <span class="text-lg">{{ conn.type === 'hotspot' ? '📡' : '📶' }}</span>
                <div>
                  <span class="font-medium text-slate-800 text-sm">{{ conn.name }}</span>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="badge badge-xs" :class="conn.type === 'hotspot' ? 'badge-warning' : 'badge-info'">
                      {{ conn.type }}
                    </span>
                    <span class="text-xs text-slate-400">priority: {{ conn.priority }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span v-if="conn.active" class="badge badge-sm badge-success">Active</span>
                <button
                  v-else-if="conn.type !== 'hotspot'"
                  class="btn btn-xs btn-outline btn-primary"
                  :disabled="switching"
                  @click="switchToWifi(conn.name)"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Interfaces (collapsed detail) -->
        <details class="status-card">
          <summary class="status-card-title cursor-pointer select-none mb-0">
            All Interfaces ({{ status!.interfaces.length }})
          </summary>
          <div class="mt-4 space-y-3">
            <div
              v-for="iface in status!.interfaces"
              :key="iface.name"
              class="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm"
            >
              <div class="flex items-center gap-2">
                <span>{{ interfaceIcon(iface.type) }}</span>
                <span class="font-mono font-medium text-slate-800">{{ iface.name }}</span>
                <span class="badge badge-xs" :class="typeBadgeClass(iface.type)">{{ iface.type }}</span>
              </div>
              <span v-if="iface.ip" class="font-mono text-slate-600">{{ iface.ip }}</span>
            </div>
          </div>
        </details>

        <!-- Last updated -->
        <p class="text-xs text-slate-400 text-center mt-8">
          Last updated: {{ lastUpdated }}
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NetworkInterface {
  name: string;
  type: string;
  ip?: string;
  ssid?: string;
  state: string;
}

interface SavedConnection {
  name: string;
  type: string;
  priority: number;
  active: boolean;
}

interface SystemStatus {
  hostname: string;
  uptime: string;
  memory: { totalMb: number; usedMb: number; freeMb: number } | null;
  cpuTempC: number | null;
  interfaces: NetworkInterface[];
  savedConnections: SavedConnection[];
  wifiMode: "hotspot" | "client" | "disconnected";
  timestamp: number;
}

const status = ref<SystemStatus | null>(null);
const error = ref<string | null>(null);
const lastUpdated = ref("");
const switching = ref(false);
const switchWarning = ref("");
const pendingAction = ref<{ action: string; connection?: string } | null>(null);

const memPercent = computed(() => {
  if (!status.value?.memory) return 0;
  return Math.round(
    (status.value.memory.usedMb / status.value.memory.totalMb) * 100
  );
});

const wifiInterface = computed(() =>
  status.value?.interfaces.find((i) => i.type === "wifi")
);

const cellularInterface = computed(() =>
  status.value?.interfaces.find((i) => i.type === "cellular")
);

const hotspotSsid = computed(() => {
  const hotspot = status.value?.savedConnections.find((c) => c.type === "hotspot");
  return hotspot?.name === "dexi-hotspot" ? "dexi-hotspot" : hotspot?.name || "dexi-hotspot";
});

const hasClientNetworks = computed(() =>
  status.value?.savedConnections.some((c) => c.type === "wifi") ?? false
);

function interfaceIcon(type: string) {
  switch (type) {
    case "wifi": return "📶";
    case "cellular": return "📱";
    case "ethernet": return "🔌";
    case "bridge": return "🌐";
    default: return "🌐";
  }
}

function typeBadgeClass(type: string) {
  switch (type) {
    case "wifi": return "badge-info";
    case "cellular": return "badge-success";
    case "ethernet": return "badge-neutral";
    default: return "badge-ghost";
  }
}

function switchToHotspot() {
  if (status.value?.wifiMode === "hotspot") return;
  switchWarning.value =
    "Switching to hotspot mode will disconnect from the current WiFi network. " +
    "Connect to the DEXI hotspot and navigate to 192.168.4.1 to continue.";
  pendingAction.value = { action: "hotspot" };
}

function switchToWifi(connection: string) {
  if (status.value?.wifiMode === "hotspot") {
    switchWarning.value =
      `Switching to "${connection}" will turn off the hotspot. ` +
      `You'll need to connect to "${connection}" and find the new IP address.`;
  } else {
    switchWarning.value = `Switch WiFi to "${connection}"?`;
  }
  pendingAction.value = { action: "wifi", connection };
}

function cancelSwitch() {
  switchWarning.value = "";
  pendingAction.value = null;
}

async function confirmSwitch() {
  if (!pendingAction.value) return;
  switching.value = true;
  try {
    await $fetch("/api/network/switch", {
      method: "POST",
      body: pendingAction.value,
    });
    switchWarning.value = "";
    pendingAction.value = null;
    // Give the network a moment to settle, then refresh
    setTimeout(fetchStatus, 3000);
  } catch (e: any) {
    switchWarning.value = `Switch failed: ${e.data?.message || e.message}`;
    pendingAction.value = null;
  } finally {
    switching.value = false;
  }
}

async function fetchStatus() {
  try {
    const data = await $fetch<SystemStatus>("/api/system-status");
    status.value = data;
    error.value = null;
    lastUpdated.value = new Date(data.timestamp).toLocaleTimeString();
  } catch (e: any) {
    error.value = e.message || "Connection failed";
  }
}

let interval: ReturnType<typeof setInterval>;

onMounted(() => {
  fetchStatus();
  interval = setInterval(fetchStatus, 5000);
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<style scoped>
.status-card {
  @apply bg-white rounded-xl border border-slate-200 p-6;
}

.status-card-title {
  @apply text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4;
}

.status-row {
  @apply flex items-center justify-between;
}

.status-label {
  @apply text-sm text-slate-500;
}

.status-value {
  @apply text-sm text-slate-900 font-medium;
}

.mode-btn {
  @apply px-4 py-1.5 text-sm font-medium rounded-md transition-all;
  @apply text-slate-500 hover:text-slate-700;
}

.mode-btn-active {
  @apply bg-white text-slate-900 shadow-sm;
}
</style>
