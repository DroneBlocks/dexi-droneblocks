<template>
  <Transition name="fade">
    <div v-if="isActive && currentLesson && currentStep" class="tutorial-overlay">
      <div class="tutorial-container">
        <!-- Progress Header -->
        <div class="tutorial-header">
          <div class="lesson-info">
            <span class="lesson-icon">{{ currentLesson.icon }}</span>
            <div class="lesson-title-section">
              <h2 class="lesson-title">{{ currentLesson.title }}</h2>
              <p class="step-count">Step {{ currentStepIndex + 1 }} of {{ currentLesson.steps.length }}</p>
            </div>
          </div>
          <button @click="handleExit" class="close-btn" title="Exit Tutorial">×</button>
        </div>

        <!-- Progress Bar -->
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
        </div>

        <!-- Step Content -->
        <div class="tutorial-content">
          <h3 class="step-title">{{ currentStep.title }}</h3>
          <p class="step-description">{{ currentStep.description }}</p>
          <div class="step-instruction">
            <div class="instruction-icon">💡</div>
            <p>{{ currentStep.instruction }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="tutorial-actions">
          <button
            v-if="!currentStep.autoAdvance"
            @click="handleSkip"
            class="btn-skip"
          >
            Skip
          </button>
          <button
            v-if="currentStepIndex > 0"
            @click="handlePrevious"
            class="btn-secondary"
          >
            ← Previous
          </button>
          <div class="spacer"></div>
          <button
            v-if="!isLastStep"
            @click="handleNext"
            class="btn-primary"
          >
            Next →
          </button>
          <button
            v-else
            @click="handleComplete"
            class="btn-complete"
          >
            Complete Lesson ✓
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useTutorial } from '../composables/useTutorial';

const tutorial = useTutorial();
const {
  isActive,
  currentLesson,
  currentStep,
  currentStepIndex,
  isLastStep,
  progressPercentage,
  nextStep,
  previousStep,
  skipStep,
  completeLesson,
  exitLesson,
  getNextLesson,
} = tutorial;

const showHints = ref(false);

// Debug logging
watch([isActive, currentLesson, currentStep], ([active, lesson, step]) => {
  console.log('[TutorialModal] State changed:', {
    isActive: active,
    currentLesson: lesson?.title,
    currentStep: step?.title,
    shouldShow: active && !!lesson && !!step
  });
}, { immediate: true });

function handleNext() {
  showHints.value = false;
  nextStep();
}

function handlePrevious() {
  showHints.value = false;
  previousStep();
}

function handleSkip() {
  showHints.value = false;
  skipStep();
}

function handleComplete() {
  completeLesson();

  const nextLesson = getNextLesson();
  if (nextLesson) {
    // Automatically continue to next lesson
    setTimeout(() => {
      tutorial.startLesson(nextLesson.id);
    }, 100);
  } else {
    // All tutorials completed
    exitLesson();
  }
}

function handleExit() {
  exitLesson();
}
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10002;
  max-width: 500px;
  width: calc(100% - 40px);
}

.tutorial-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border: 2px solid #2a9d8f;
}

.tutorial-header {
  background: linear-gradient(135deg, #2a9d8f 0%, #264653 100%);
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lesson-info {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex: 1;
}

.lesson-icon {
  font-size: 2rem;
}

.lesson-title-section {
  flex: 1;
}

.lesson-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
}

.step-count {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.close-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.progress-bar-container {
  height: 4px;
  background: #e0e0e0;
}

.progress-bar {
  height: 100%;
  background: #2a9d8f;
  transition: width 0.3s ease;
}

.tutorial-content {
  padding: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.step-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.3rem;
  color: #264653;
}

.step-description {
  margin: 0 0 1rem 0;
  color: #666;
  line-height: 1.6;
}

.step-instruction {
  background: #f0f9ff;
  border-left: 4px solid #2a9d8f;
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.instruction-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.step-instruction p {
  margin: 0;
  color: #264653;
  font-weight: 500;
  line-height: 1.5;
}

.hints-section {
  margin-top: 1rem;
}

.hints-toggle {
  background: transparent;
  border: 1px solid #ddd;
  color: #666;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
}

.hints-toggle:hover {
  border-color: #2a9d8f;
  color: #2a9d8f;
}

.hints-list {
  margin-top: 0.5rem;
  background: #fffbf0;
  border: 1px solid #ffd700;
  border-radius: 6px;
  padding: 0.75rem;
}

.hint-item {
  margin-bottom: 0.5rem;
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
}

.hint-item:last-child {
  margin-bottom: 0;
}

.hint-number {
  color: #f39c12;
  font-weight: bold;
}

.tutorial-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  background: #f9f9f9;
}

.spacer {
  flex: 1;
}

.btn-primary,
.btn-secondary,
.btn-skip,
.btn-complete {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #2a9d8f;
  color: white;
}

.btn-primary:hover {
  background: #21867a;
  transform: translateY(-1px);
}

.btn-complete {
  background: #4CAF50;
  color: white;
}

.btn-complete:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.btn-secondary {
  background: transparent;
  color: #666;
  border: 2px solid #ddd;
}

.btn-secondary:hover {
  border-color: #2a9d8f;
  color: #2a9d8f;
}

.btn-skip {
  background: transparent;
  color: #999;
  border: 1px solid #ddd;
}

.btn-skip:hover {
  color: #666;
  border-color: #999;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}
</style>
