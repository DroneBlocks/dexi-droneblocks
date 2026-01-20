<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header Section -->
    <div class="bg-white border-b border-slate-200">
      <div class="container mx-auto px-6 py-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink to="/" class="text-slate-500 hover:text-slate-700 transition-colors">
              <span class="text-2xl">←</span>
            </NuxtLink>
            <h1 class="text-2xl font-semibold text-slate-900">Demo Missions</h1>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-6 py-12">

      <!-- DroneBlocks Section -->
      <div class="mb-8">
        <button
          @click="droneBlocksExpanded = !droneBlocksExpanded"
          class="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
        >
          <div class="flex items-center gap-3">
            <span class="text-3xl">🧩</span>
            <div class="text-left">
              <h2 class="text-2xl font-bold text-slate-900">DroneBlocks Missions</h2>
              <p class="text-slate-600 text-sm">Visual block programming demos - click to open in DroneBlocks</p>
            </div>
          </div>
          <span class="text-2xl text-slate-400 transition-transform" :class="{ 'rotate-180': droneBlocksExpanded }">
            ▼
          </span>
        </button>
      </div>

      <div v-show="droneBlocksExpanded" class="section-content">
        <!-- Basic Category -->
        <div class="mb-12">
          <div class="mb-6">
            <h3 class="text-xl font-semibold text-slate-900 mb-2">Basic</h3>
            <p class="text-slate-600">Simple missions to get started</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div
              v-for="demo in basicDemos"
              :key="demo.id"
              class="group card cursor-pointer"
              @click="launchDemo(demo)"
            >
              <div class="card-content">
                <div class="icon-wrapper bg-emerald-50">
                  <span class="text-3xl">{{ getCategoryIcon('basic') }}</span>
                </div>
                <h3 class="card-title">{{ demo.name }}</h3>
                <p class="card-description">{{ demo.description }}</p>
                <div class="card-arrow">→</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Category -->
        <div class="mb-12">
          <div class="mb-6">
            <h3 class="text-xl font-semibold text-slate-900 mb-2">Navigation</h3>
            <p class="text-slate-600">Flight patterns and movement demos</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div
              v-for="demo in navigationDemos"
              :key="demo.id"
              class="group card cursor-pointer"
              @click="launchDemo(demo)"
            >
              <div class="card-content">
                <div class="icon-wrapper bg-blue-50">
                  <span class="text-3xl">{{ getCategoryIcon('navigation') }}</span>
                </div>
                <h3 class="card-title">{{ demo.name }}</h3>
                <p class="card-description">{{ demo.description }}</p>
                <div class="card-arrow">→</div>
              </div>
            </div>
          </div>
        </div>

        <!-- AprilTag Category -->
        <div class="mb-12">
          <div class="mb-6">
            <h3 class="text-xl font-semibold text-slate-900 mb-2">AprilTag</h3>
            <p class="text-slate-600">Tag detection and response demos</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div
              v-for="demo in apriltagDemos"
              :key="demo.id"
              class="group card cursor-pointer"
              @click="launchDemo(demo)"
            >
              <div class="card-content">
                <div class="icon-wrapper bg-orange-50">
                  <span class="text-3xl">{{ getCategoryIcon('apriltag') }}</span>
                </div>
                <h3 class="card-title">{{ demo.name }}</h3>
                <p class="card-description">{{ demo.description }}</p>
                <div class="card-arrow">→</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Python Section -->
      <div class="mb-8">
        <button
          @click="pythonExpanded = !pythonExpanded"
          class="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
        >
          <div class="flex items-center gap-3">
            <span class="text-3xl">🐍</span>
            <div class="text-left">
              <h2 class="text-2xl font-bold text-slate-900">Python Missions</h2>
              <p class="text-slate-600 text-sm">Python code examples - click to open in VS Code Server</p>
            </div>
          </div>
          <span class="text-2xl text-slate-400 transition-transform" :class="{ 'rotate-180': pythonExpanded }">
            ▼
          </span>
        </button>
      </div>

      <div v-show="pythonExpanded" class="section-content">
        <!-- Python Missions -->
        <div class="mb-12">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div
              v-for="mission in pythonMissions"
              :key="mission.id"
              class="group card cursor-pointer"
              @click="launchPythonMission(mission)"
            >
              <div class="card-content">
                <div class="icon-wrapper bg-purple-50">
                  <span class="text-3xl">🐍</span>
                </div>
                <h3 class="card-title">{{ mission.name }}</h3>
                <p class="card-description">{{ mission.description }}</p>
                <div class="card-arrow">↗</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { demos, getDemosByCategory, type Demo } from '~/assets/ts/demos';

const hostname = process.client ? window.location.hostname : 'localhost';

// Expand/collapse state
const droneBlocksExpanded = ref(false);
const pythonExpanded = ref(false);

const basicDemos = computed(() => getDemosByCategory('basic'));
const navigationDemos = computed(() => getDemosByCategory('navigation'));
const apriltagDemos = computed(() => getDemosByCategory('apriltag'));

interface PythonMission {
  id: string;
  name: string;
  description: string;
  folder: string;
  file: string;
}

const pythonMissions: PythonMission[] = [
  {
    id: 'box-mission',
    name: 'Box Mission',
    description: 'Fly in a box pattern using MAVSDK Python. Great starting point for custom missions.',
    folder: '/home/coder',
    file: '/home/coder/dexi-mavsdk/missions/box_mission.py'
  }
];

function getCategoryIcon(category: Demo['category']): string {
  switch (category) {
    case 'basic': return '🚀';
    case 'navigation': return '🧭';
    case 'apriltag': return '🏷️';
    case 'advanced': return '⚡';
    default: return '📦';
  }
}

function launchDemo(demo: Demo) {
  // Store demo data in localStorage for droneblocks to pick up
  localStorage.setItem('droneblocks_demo', JSON.stringify({
    id: demo.id,
    name: demo.name,
    blocklyXml: demo.blocklyXml
  }));

  // Open droneblocks in a new browser tab
  window.open(`/droneblocks?demo=${demo.id}`, '_blank');
}

function launchPythonMission(mission: PythonMission) {
  // Open code-server in a new tab with the folder and file
  const url = `http://${hostname}:9999/?folder=${encodeURIComponent(mission.folder)}&file=${encodeURIComponent(mission.file)}`;
  window.open(url, '_blank');
}
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

.section-content {
  @apply pl-4 border-l-2 border-slate-200 ml-4 mb-8;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
