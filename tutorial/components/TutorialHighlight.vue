<template>
  <Teleport to="body">
    <Transition name="highlight-fade">
      <div v-if="isActive && currentStep?.highlightElement" class="highlight-overlay">
        <!-- Darkened overlay with cutout -->
        <div class="highlight-backdrop" @click="handleBackdropClick"></div>

        <!-- Spotlight effect -->
        <div
          v-if="highlightRect"
          class="highlight-spotlight"
          :style="spotlightStyle"
        ></div>

        <!-- Pulsing border around highlighted element -->
        <div
          v-if="highlightRect"
          class="highlight-border"
          :style="borderStyle"
        ></div>

        <!-- Arrow pointing to element -->
        <div
          v-if="highlightRect"
          class="highlight-arrow"
          :style="arrowStyle"
        >
          ↑
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useTutorial } from '../composables/useTutorial';

const { isActive, currentStep } = useTutorial();

const highlightRect = ref<DOMRect | null>(null);
const resizeObserver = ref<ResizeObserver | null>(null);

const spotlightStyle = computed(() => {
  if (!highlightRect.value) return {};

  const padding = 8;
  return {
    left: `${highlightRect.value.left - padding}px`,
    top: `${highlightRect.value.top - padding}px`,
    width: `${highlightRect.value.width + padding * 2}px`,
    height: `${highlightRect.value.height + padding * 2}px`,
  };
});

const borderStyle = computed(() => {
  if (!highlightRect.value) return {};

  const padding = 8;
  return {
    left: `${highlightRect.value.left - padding}px`,
    top: `${highlightRect.value.top - padding}px`,
    width: `${highlightRect.value.width + padding * 2}px`,
    height: `${highlightRect.value.height + padding * 2}px`,
  };
});

const arrowStyle = computed(() => {
  if (!highlightRect.value) return {};

  return {
    left: `${highlightRect.value.left + highlightRect.value.width / 2}px`,
    top: `${highlightRect.value.bottom + 12}px`,
  };
});

function updateHighlight() {
  if (!currentStep.value?.highlightElement) {
    highlightRect.value = null;
    return;
  }

  try {
    // Try to find element by selector
    const element = document.querySelector(currentStep.value.highlightElement);
    if (element) {
      highlightRect.value = element.getBoundingClientRect();
    } else {
      highlightRect.value = null;
    }
  } catch (error) {
    console.warn('Failed to highlight element:', currentStep.value.highlightElement, error);
    highlightRect.value = null;
  }
}

function handleBackdropClick() {
  // Optional: could advance to next step or show hint
  console.log('Backdrop clicked');
}

// Watch for step changes
watch(() => currentStep.value?.highlightElement, () => {
  updateHighlight();
}, { immediate: true });

// Update on window resize
onMounted(() => {
  window.addEventListener('resize', updateHighlight);
  window.addEventListener('scroll', updateHighlight);

  // Watch for DOM changes that might affect element position
  resizeObserver.value = new ResizeObserver(() => {
    updateHighlight();
  });

  if (document.body) {
    resizeObserver.value.observe(document.body);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateHighlight);
  window.removeEventListener('scroll', updateHighlight);

  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
  }
});
</script>

<style scoped>
.highlight-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9998;
}

.highlight-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: auto;
}

.highlight-spotlight {
  position: absolute;
  background: transparent;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 1;
}

.highlight-border {
  position: absolute;
  border: 3px solid #2a9d8f;
  border-radius: 8px;
  pointer-events: none;
  animation: pulse-border 2s ease-in-out infinite;
  z-index: 2;
}

.highlight-arrow {
  position: absolute;
  transform: translateX(-50%);
  font-size: 2rem;
  color: #2a9d8f;
  pointer-events: none;
  animation: bounce-arrow 1.5s ease-in-out infinite;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 3;
}

@keyframes pulse-border {
  0%, 100% {
    border-color: #2a9d8f;
    box-shadow: 0 0 0 0 rgba(42, 157, 143, 0.7);
  }
  50% {
    border-color: #21867a;
    box-shadow: 0 0 0 8px rgba(42, 157, 143, 0);
  }
}

@keyframes bounce-arrow {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-8px);
  }
}

.highlight-fade-enter-active,
.highlight-fade-leave-active {
  transition: opacity 0.3s ease;
}

.highlight-fade-enter-from,
.highlight-fade-leave-to {
  opacity: 0;
}
</style>
