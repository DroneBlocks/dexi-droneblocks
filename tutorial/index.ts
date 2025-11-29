// Tutorial system entry point
export { useTutorial } from './composables/useTutorial';
export { lessons, getLessonById, getNextLesson, canStartLesson } from './data/lessons';
export type {
  TutorialStep,
  TutorialLesson,
  TutorialProgress,
  TutorialState,
  TutorialEvent,
} from './types';

// Component exports for convenience
export { default as TutorialWelcome } from './components/TutorialWelcome.vue';
export { default as TutorialModal } from './components/TutorialModal.vue';
export { default as TutorialHighlight } from './components/TutorialHighlight.vue';
export { default as TutorialLessonPicker } from './components/TutorialLessonPicker.vue';
