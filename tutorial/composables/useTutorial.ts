import { ref, computed, watch } from 'vue';
import type { TutorialState, TutorialLesson, TutorialProgress, TutorialEvent } from '../types';
import { lessons, getLessonById, getNextLesson, canStartLesson } from '../data/lessons';

const STORAGE_KEY = 'droneblocks_tutorial_progress';

// Shared state across components
const state = ref<TutorialState>({
  isActive: false,
  showWelcome: false,
  currentLesson: null,
  currentStepIndex: 0,
  progress: {
    completedLessons: [],
    lessonsStarted: {},
    lessonsCompleted: {},
    skippedTutorial: false,
  },
});

// Load progress from localStorage
function loadProgress(): TutorialProgress {
  if (typeof window === 'undefined') return state.value.progress;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load tutorial progress:', error);
  }

  return {
    completedLessons: [],
    lessonsStarted: {},
    lessonsCompleted: {},
    skippedTutorial: false,
  };
}

// Save progress to localStorage
function saveProgress(progress: TutorialProgress) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save tutorial progress:', error);
  }
}

// Initialize progress on first load
if (typeof window !== 'undefined') {
  state.value.progress = loadProgress();
}

// Auto-save progress when it changes
watch(() => state.value.progress, (newProgress) => {
  saveProgress(newProgress);
}, { deep: true });

export function useTutorial() {
  const isFirstVisit = computed(() => {
    return !state.value.progress.skippedTutorial &&
           state.value.progress.completedLessons.length === 0 &&
           Object.keys(state.value.progress.lessonsStarted).length === 0;
  });

  const availableLessons = computed(() => {
    return lessons.filter(lesson =>
      canStartLesson(lesson.id, state.value.progress.completedLessons)
    );
  });

  const currentStep = computed(() => {
    if (!state.value.currentLesson) return null;
    return state.value.currentLesson.steps[state.value.currentStepIndex] || null;
  });

  const isLastStep = computed(() => {
    if (!state.value.currentLesson) return false;
    return state.value.currentStepIndex === state.value.currentLesson.steps.length - 1;
  });

  const progressPercentage = computed(() => {
    if (!state.value.currentLesson) return 0;
    return Math.round((state.value.currentStepIndex / state.value.currentLesson.steps.length) * 100);
  });

  function showWelcome() {
    state.value.showWelcome = true;
  }

  function hideWelcome() {
    state.value.showWelcome = false;
  }

  function startLesson(lessonId: string) {
    console.log('[useTutorial] startLesson called with:', lessonId);
    const lesson = getLessonById(lessonId);
    if (!lesson) {
      console.error(`Lesson ${lessonId} not found`);
      return;
    }
    console.log('[useTutorial] Lesson found:', lesson);

    // Check prerequisites
    if (!canStartLesson(lessonId, state.value.progress.completedLessons)) {
      console.warn(`Cannot start lesson ${lessonId} - prerequisite not met`);
      return;
    }
    console.log('[useTutorial] Prerequisites check passed');

    state.value.currentLesson = lesson;
    state.value.currentStepIndex = 0;
    state.value.isActive = true;
    state.value.showWelcome = false;

    console.log('[useTutorial] State updated:', {
      isActive: state.value.isActive,
      currentLesson: state.value.currentLesson?.title,
      currentStepIndex: state.value.currentStepIndex,
      showWelcome: state.value.showWelcome
    });

    // Track lesson start
    if (!state.value.progress.lessonsStarted[lessonId]) {
      state.value.progress.lessonsStarted[lessonId] = Date.now();
    }

    emitEvent('lesson:start', { lessonId });
  }

  function nextStep() {
    if (!state.value.currentLesson) return;

    emitEvent('step:complete', {
      lessonId: state.value.currentLesson.id,
      stepIndex: state.value.currentStepIndex,
    });

    if (isLastStep.value) {
      completeLesson();
    } else {
      state.value.currentStepIndex++;
    }
  }

  function previousStep() {
    if (state.value.currentStepIndex > 0) {
      state.value.currentStepIndex--;
    }
  }

  function skipStep() {
    nextStep();
  }

  function completeLesson() {
    if (!state.value.currentLesson) return;

    const lessonId = state.value.currentLesson.id;

    // Mark lesson as completed
    if (!state.value.progress.completedLessons.includes(lessonId)) {
      state.value.progress.completedLessons.push(lessonId);
    }
    state.value.progress.lessonsCompleted[lessonId] = Date.now();

    emitEvent('lesson:complete', { lessonId });

    // Check if all lessons are complete
    if (state.value.progress.completedLessons.length === lessons.length) {
      emitEvent('tutorial:complete', {});
    }
  }

  function exitLesson() {
    state.value.isActive = false;
    state.value.currentLesson = null;
    state.value.currentStepIndex = 0;
  }

  function skipTutorial() {
    state.value.progress.skippedTutorial = true;
    state.value.showWelcome = false;
    state.value.isActive = false;
    emitEvent('tutorial:skip', {});
  }

  function resetProgress() {
    state.value.progress = {
      completedLessons: [],
      lessonsStarted: {},
      lessonsCompleted: {},
      skippedTutorial: false,
    };
    state.value.isActive = false;
    state.value.currentLesson = null;
    state.value.currentStepIndex = 0;
    state.value.showWelcome = false;

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function getLessonProgress(lessonId: string) {
    return {
      isStarted: !!state.value.progress.lessonsStarted[lessonId],
      isCompleted: state.value.progress.completedLessons.includes(lessonId),
      canStart: canStartLesson(lessonId, state.value.progress.completedLessons),
      startedAt: state.value.progress.lessonsStarted[lessonId],
      completedAt: state.value.progress.lessonsCompleted[lessonId],
    };
  }

  function emitEvent(event: TutorialEvent, data: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
    console.log(`[Tutorial Event] ${event}`, data);
  }

  function showHint(hintIndex: number = 0) {
    if (!currentStep.value || !currentStep.value.hints) return;

    emitEvent('step:hint', {
      lessonId: state.value.currentLesson?.id,
      stepIndex: state.value.currentStepIndex,
      hintIndex,
    });
  }

  return {
    // State
    state: computed(() => state.value),
    isActive: computed(() => state.value.isActive),
    isShowingWelcome: computed(() => state.value.showWelcome),
    currentLesson: computed(() => state.value.currentLesson),
    currentStep,
    currentStepIndex: computed(() => state.value.currentStepIndex),
    progress: computed(() => state.value.progress),

    // Computed
    isFirstVisit,
    availableLessons,
    isLastStep,
    progressPercentage,
    allLessons: lessons,

    // Methods
    showWelcome,
    hideWelcome,
    startLesson,
    nextStep,
    previousStep,
    skipStep,
    completeLesson,
    exitLesson,
    skipTutorial,
    resetProgress,
    getLessonProgress,
    getNextLesson: () => state.value.currentLesson ? getNextLesson(state.value.currentLesson.id) : undefined,
    showHint,
  };
}
