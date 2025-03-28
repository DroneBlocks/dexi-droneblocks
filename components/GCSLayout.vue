<template>
  <div class="flex flex-col h-screen">
    <!-- Top Bar -->
    <div class="h-[75px] bg-gray-800 text-white p-4">
      <div class="flex items-center gap-4">
        <span>Top Bar</span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex">
      <!-- Main Content Area -->
      <div class="flex-1 bg-blue-500">
        <div class="p-4">
          Main Content
        </div>
      </div>

      <!-- Right Column -->
      <div class="w-[250px] bg-gray-700 text-white p-4">
        <h3 class="text-lg font-bold mb-4">DEXI LED Ring</h3>
        <div class="grid grid-cols-2 gap-2">
          <div v-for="(color, name) in dexiLEDColors" :key="name" 
               class="flex flex-col items-center p-1 rounded cursor-pointer hover:bg-gray-600 relative group"
               @click="printRGB(color, name)"
               :title="name">
            <div class="w-full h-6 rounded" :style="{ backgroundColor: color }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// DEXI LED Ring colors
const dexiLEDColors = {
  'RED': '#FF0000',
  'GREEN': '#00FF00',
  'BLUE': '#0000FF',
  'YELLOW': '#FFFF00',
  'PURPLE': '#800080',
  'ORANGE': '#FFA500',
  'PINK': '#FFC0CB',
  'WHITE': '#FFFFFF',
  'BLACK': '#000000',
  'GRAY': '#808080',
  'CYAN': '#00FFFF',
  'MAGENTA': '#FF00FF',
  'LIME': '#00FF00',
  'MAROON': '#800000',
  'NAVY': '#000080',
  'OLIVE': '#808000',
  'TEAL': '#008080',
  'AQUA': '#00FFFF',
  'FUCHSIA': '#FF00FF',
  'SILVER': '#C0C0C0'
};

const printRGB = (hexColor, colorName) => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  console.log(`${colorName}: RGB(${r}, ${g}, ${b})`);
};
</script>

<style>
</style>
