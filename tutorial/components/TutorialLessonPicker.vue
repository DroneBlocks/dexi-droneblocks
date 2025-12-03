<template>
  <Transition name="fade">
    <div v-if="show" class="lesson-picker-overlay" @click.self="$emit('close')">
      <div class="lesson-picker-modal">
        <div class="picker-header">
          <h2 class="picker-title">Choose a Lesson</h2>
          <button @click="$emit('close')" class="close-btn">×</button>
        </div>

        <div class="picker-content">
          <!-- Lesson Categories -->
          <div
            v-for="category in ['beginner', 'intermediate', 'advanced']"
            :key="category"
            class="category-section"
          >
            <h3 class="category-title">{{ categoryTitle(category) }}</h3>

            <div class="lessons-grid">
              <div
                v-for="lesson in getLessonsByCategory(category)"
                :key="lesson.id"
                class="lesson-card"
                :class="{
                  'completed': getLessonProgress(lesson.id).isCompleted,
                  'locked': !getLessonProgress(lesson.id).canStart,
                  'available': getLessonProgress(lesson.id).canStart && !getLessonProgress(lesson.id).isCompleted,
                }"
                @click="handleLessonClick(lesson.id)"
              >
                <div class="lesson-card-header">
                  <span class="lesson-icon">{{ lesson.icon }}</span>
                  <span v-if="getLessonProgress(lesson.id).isCompleted" class="completion-badge">✓</span>
                  <span v-else-if="!getLessonProgress(lesson.id).canStart" class="lock-badge">🔒</span>
                </div>

                <h4 class="lesson-card-title">{{ lesson.title }}</h4>
                <p class="lesson-card-description">{{ lesson.description }}</p>

                <div class="lesson-card-footer">
                  <span class="lesson-duration">⏱️ {{ lesson.estimatedMinutes }} min</span>
                  <span class="lesson-steps">{{ lesson.steps.length }} steps</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Reset Progress -->
          <div class="picker-footer">
            <button @click="handleResetProgress" class="btn-reset">
              Reset All Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTutorial } from '../composables/useTutorial';

defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const {
  allLessons,
  availableLessons,
  progress,
  startLesson,
  getLessonProgress,
  resetProgress,
} = useTutorial();

function categoryTitle(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1) + ' Lessons';
}

function getLessonsByCategory(category: string) {
  return allLessons.filter(lesson => lesson.category === category);
}

function handleLessonClick(lessonId: string) {
  const lessonProgress = getLessonProgress(lessonId);

  if (!lessonProgress.canStart) {
    // Don't start locked lessons
    return;
  }

  startLesson(lessonId);
  emit('close');
}

function handleResetProgress() {
  if (confirm('Are you sure you want to reset all tutorial progress? This cannot be undone.')) {
    resetProgress();
  }
}
</script>

<style scoped>
.lesson-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 20px;
}

.lesson-picker-modal {
  background: white;
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.picker-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #2a9d8f 0%, #264653 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.picker-title {
  margin: 0;
  font-size: 1.5rem;
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

.picker-content {
  overflow-y: auto;
  padding: 2rem;
  flex: 1;
}

.progress-summary {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 12px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #2a9d8f;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.category-section {
  margin-bottom: 2.5rem;
}

.category-title {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #264653;
  font-weight: 600;
}

.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.lesson-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.lesson-card.available {
  border-color: #2a9d8f;
}

.lesson-card.available:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(42, 157, 143, 0.2);
  border-color: #21867a;
}

.lesson-card.completed {
  background: #f0f9f7;
  border-color: #4CAF50;
}

.lesson-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.lesson-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.lesson-icon {
  font-size: 2.5rem;
}

.completion-badge {
  background: #4CAF50;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.lock-badge {
  font-size: 1.5rem;
}

.lesson-card-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #264653;
}

.lesson-card-description {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  min-height: 3rem;
}

.lesson-card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #999;
}

.picker-footer {
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.btn-reset {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 2px solid #e76f51;
  color: #e76f51;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: #e76f51;
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
