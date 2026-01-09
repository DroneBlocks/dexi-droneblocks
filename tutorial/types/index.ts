export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  instruction: string;
  highlightElement?: string; // CSS selector for element to highlight
  highlightBlocks?: string[]; // Block types to highlight in toolbox
  validationFn?: () => boolean | Promise<boolean>;
  autoAdvance?: boolean; // Auto-advance when validation passes
  hints?: string[];
}

export interface TutorialLesson {
  id: string;
  title: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  estimatedMinutes: number;
  icon: string;
  steps: TutorialStep[];
  completionMessage: string;
  prerequisite?: string; // ID of lesson that must be completed first
}

export interface TutorialProgress {
  completedLessons: string[];
  currentLesson?: string;
  currentStep?: number;
  lessonsStarted: Record<string, number>; // lessonId -> timestamp
  lessonsCompleted: Record<string, number>; // lessonId -> timestamp
  skippedTutorial: boolean;
}

export interface TutorialState {
  isActive: boolean;
  showWelcome: boolean;
  currentLesson: TutorialLesson | null;
  currentStepIndex: number;
  progress: TutorialProgress;
}

export type TutorialEvent =
  | 'tutorial:start'
  | 'tutorial:complete'
  | 'tutorial:skip'
  | 'lesson:start'
  | 'lesson:complete'
  | 'step:complete'
  | 'step:hint';
