<template>
  <Transition name="fade">
    <div v-if="tutorial.isShowingWelcome.value" class="tutorial-welcome-overlay">
      <div class="tutorial-welcome-modal">
        <div class="welcome-header">
          <h1 class="welcome-title">Welcome to DroneBlocks! 🚁</h1>
          <p class="welcome-subtitle">Learn to program autonomous drones with visual blocks</p>
        </div>

        <div class="welcome-content">
          <div class="welcome-feature">
            <div class="feature-icon">🧩</div>
            <div class="feature-text">
              <h3>Visual Programming</h3>
              <p>Drag and drop blocks to create drone missions - no coding required</p>
            </div>
          </div>

          <div class="welcome-feature">
            <div class="feature-icon">🎮</div>
            <div class="feature-text">
              <h3>Real-time Simulation</h3>
              <p>See your missions come to life in the 3D simulator</p>
            </div>
          </div>

          <div class="welcome-feature">
            <div class="feature-icon">🎓</div>
            <div class="feature-text">
              <h3>Interactive Lessons</h3>
              <p>Step-by-step tutorials from basic takeoff to advanced autonomous missions</p>
            </div>
          </div>
        </div>

        <div class="welcome-actions">
          <button @click="handleStartTutorial" class="btn-primary">
            Start Tutorial
          </button>
          <button @click="handleSkipTutorial" class="btn-secondary">
            Skip - I'll Explore On My Own
          </button>
        </div>

        <div class="welcome-footer">
          <p class="footer-text">You can always access tutorials from the help menu later</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useTutorial } from '../composables/useTutorial';

const tutorial = useTutorial();
const { startLesson, skipTutorial, allLessons } = tutorial;

function handleStartTutorial() {
  console.log('Start Tutorial clicked');
  console.log('All lessons:', allLessons);
  if (allLessons.length > 0) {
    console.log('Starting lesson:', allLessons[0].id);
    startLesson(allLessons[0].id);
  } else {
    console.error('No lessons available!');
  }
}

function handleSkipTutorial() {
  console.log('Skip Tutorial clicked');
  console.log('showWelcome before skip:', tutorial.isShowingWelcome.value);
  skipTutorial();
  console.log('showWelcome after skip:', tutorial.isShowingWelcome.value);
}
</script>

<style scoped>
.tutorial-welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.tutorial-welcome-modal {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.welcome-header {
  padding: 2rem;
  text-align: center;
  background: linear-gradient(135deg, #2a9d8f 0%, #264653 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.welcome-title {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
}

.welcome-subtitle {
  margin: 0.5rem 0 0 0;
  font-size: 1.1rem;
  opacity: 0.95;
}

.welcome-content {
  padding: 2rem;
}

.welcome-feature {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}

.welcome-feature:last-child {
  margin-bottom: 0;
}

.feature-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.feature-text h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: #264653;
}

.feature-text p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.welcome-actions {
  padding: 0 2rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-primary {
  padding: 1rem 2rem;
  background: #2a9d8f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #21867a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(42, 157, 143, 0.3);
}

.btn-secondary {
  padding: 0.75rem 2rem;
  background: transparent;
  color: #666;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: #999;
  color: #333;
}

.welcome-footer {
  padding: 0 2rem 2rem 2rem;
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 0.9rem;
  color: #999;
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
