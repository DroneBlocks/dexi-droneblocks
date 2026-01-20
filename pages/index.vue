<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header Section -->
    <div class="bg-white border-b border-slate-200">
      <div class="container mx-auto px-6 py-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <img src="~/assets/droneblocks_logo.svg" class="h-12" alt="DroneBlocks Logo" />
          </div>
          <a
            href="https://github.com/DroneBlocks/dexi-os/releases/tag/v0.13"
            target="_blank"
            class="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            v0.13
          </a>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-6 py-12">
      <!-- Section Title -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-slate-900 mb-2">Development Tools</h2>
        <p class="text-slate-600">Access all DEXI development and debugging tools</p>
      </div>

      <!-- Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">

        <!-- DEXI GCS -->
        <NuxtLink to="/gcs" class="group card">
          <div class="card-content">
            <div class="icon-wrapper bg-emerald-50">
              <span class="text-3xl">🎮</span>
            </div>
            <h3 class="card-title">DEXI GCS</h3>
            <p class="card-description">
              Ground control station with camera, LED, and servo controls
            </p>
            <div class="card-arrow">→</div>
          </div>
        </NuxtLink>

        <!-- DroneBlocks -->
        <NuxtLink to="/droneblocks" class="group card">
          <div class="card-content">
            <div class="icon-wrapper bg-blue-50">
              <span class="text-3xl">🧩</span>
            </div>
            <h3 class="card-title">DroneBlocks</h3>
            <p class="card-description">
              Visual block programming for autonomous missions
            </p>
            <div class="card-arrow">→</div>
          </div>
        </NuxtLink>

        <!-- Demo Missions -->
        <NuxtLink to="/demos" class="group card">
          <div class="card-content">
            <div class="icon-wrapper bg-cyan-50">
              <span class="text-3xl">🎯</span>
            </div>
            <h3 class="card-title">Demo Missions</h3>
            <p class="card-description">
              Pre-built example missions to learn from
            </p>
            <div class="card-arrow">→</div>
          </div>
        </NuxtLink>

        <!-- Node-RED -->
        <NuxtLink
          :to="`http://${hostname}:1880`"
          target="_blank"
          class="group card"
        >
          <div class="card-content">
            <div class="icon-wrapper bg-red-50">
              <span class="text-3xl">🔴</span>
            </div>
            <h3 class="card-title">Node-RED</h3>
            <p class="card-description">
              Flow-based visual programming environment
            </p>
            <div class="card-arrow">↗</div>
          </div>
        </NuxtLink>

        <!-- VS Code Server -->
        <NuxtLink
          :to="`http://${hostname}:9999`"
          target="_blank"
          class="group card"
        >
          <div class="card-content">
            <div class="icon-wrapper bg-purple-50">
              <span class="text-3xl">💻</span>
            </div>
            <h3 class="card-title">VS Code Server</h3>
            <p class="card-description">
              Browser-based IDE for ROS2 development
            </p>
            <div class="card-arrow">↗</div>
          </div>
        </NuxtLink>

        <!-- DEXI Chat -->
        <NuxtLink to="/chat" class="group card">
          <div class="card-content">
            <div class="icon-wrapper bg-violet-50">
              <span class="text-3xl">🤖</span>
            </div>
            <h3 class="card-title">DEXI Chat</h3>
            <p class="card-description">
              AI assistant for natural language drone control
            </p>
            <div class="card-arrow">→</div>
          </div>
        </NuxtLink>

      </div>

      <!-- Section Title -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-slate-900 mb-2">Resources & Support</h2>
        <p class="text-slate-600">Documentation, source code, and community</p>
      </div>

      <!-- Resources Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        <!-- AprilTag Visualizer -->
        <NuxtLink to="/apriltag" class="group card">
          <div class="card-content">
            <div class="icon-wrapper bg-teal-50">
              <span class="text-3xl">📍</span>
            </div>
            <h3 class="card-title">AprilTag Visualizer</h3>
            <p class="card-description">
              Verify pose estimates before position hold
            </p>
            <div class="card-arrow">→</div>
          </div>
        </NuxtLink>

        <!-- ROS Debug -->
        <NuxtLink to="/ros" class="group card">
          <div class="card-content">
            <div class="icon-wrapper bg-amber-50">
              <span class="text-3xl">🔧</span>
            </div>
            <h3 class="card-title">ROS Debug</h3>
            <p class="card-description">
              Debug ROS topics and services
            </p>
            <div class="card-arrow">→</div>
          </div>
        </NuxtLink>

        <!-- GitHub -->
        <NuxtLink
          to="https://github.com/droneblocks/dexi"
          target="_blank"
          class="group card"
        >
          <div class="card-content">
            <div class="icon-wrapper bg-slate-50">
              <span class="text-3xl">💾</span>
            </div>
            <h3 class="card-title">GitHub</h3>
            <p class="card-description">
              Source code repository
            </p>
            <div class="card-arrow">↗</div>
          </div>
        </NuxtLink>

        <!-- Discord -->
        <NuxtLink
          to="https://discord.gg/Wjw7wGf7Wn"
          target="_blank"
          class="group card"
        >
          <div class="card-content">
            <div class="icon-wrapper bg-indigo-50">
              <span class="text-3xl">💬</span>
            </div>
            <h3 class="card-title">Discord</h3>
            <p class="card-description">
              Community support and discussion
            </p>
            <div class="card-arrow">↗</div>
          </div>
        </NuxtLink>

      </div>
    </div>
  </div>
</template>

<script setup>
const hostname = process.client ? window.location.hostname : '192.168.4.1'
</script>

<style scoped>
.card {
  @apply relative bg-white rounded-xl border border-slate-200 transition-all duration-200;
  @apply hover:border-slate-300 hover:shadow-lg;
}

.card-content {
  @apply p-6 flex flex-col h-full relative;
}

.icon-wrapper {
  @apply w-14 h-14 rounded-lg flex items-center justify-center mb-4;
  @apply transition-transform duration-200 group-hover:scale-110;
}

.card-title {
  @apply text-lg font-semibold text-slate-900 mb-2;
}

.card-description {
  @apply text-sm text-slate-600 leading-relaxed flex-grow;
}

.card-arrow {
  @apply absolute bottom-5 right-5 text-slate-400 text-xl;
  @apply opacity-0 transform translate-x-2;
  @apply transition-all duration-200;
  @apply group-hover:opacity-100 group-hover:translate-x-0;
}
</style>
