# DroneBlocks Tutorial System

A comprehensive, self-contained tutorial framework for teaching users how to program autonomous drones with DroneBlocks.

## Overview

The tutorial system provides:
- **8 Progressive Lessons** from beginner to advanced concepts
- **Interactive Step-by-Step Guidance** with visual highlighting
- **Progress Tracking** saved to localStorage
- **Prerequisite System** ensuring proper learning progression
- **Visual Feedback** with animations and notifications

## Architecture

```
tutorial/
├── types/              # TypeScript type definitions
├── composables/        # State management (useTutorial)
├── components/         # UI components
│   ├── TutorialWelcome.vue       # First-time welcome modal
│   ├── TutorialModal.vue         # Main lesson overlay
│   ├── TutorialHighlight.vue     # Element highlighting
│   └── TutorialLessonPicker.vue  # Lesson selection
├── data/              # Lesson content and definitions
└── index.ts           # Package entry point
```

## Lessons

### Beginner
1. **Connecting to Your Drone** (3 min) - Understanding the interface and ROS connection
2. **Arming Your Drone** (5 min) - Safety protocols and first command
3. **Offboard Mode & Heartbeat** (7 min) - Critical safety systems
4. **First Flight - Takeoff** (5 min) - Making the drone fly
5. **LED Control** (4 min) - Visual feedback and effects

### Intermediate
6. **Basic Navigation** (8 min) - Movement and creating flight paths
7. **Creating Patterns with Loops** (10 min) - Efficient programming

### Advanced
8. **Computer Vision with AprilTags** (12 min) - Reactive autonomous missions

## Usage

### Integration

```vue
<script setup>
import { useTutorial } from '~/tutorial';
import TutorialWelcome from '~/tutorial/components/TutorialWelcome.vue';
import TutorialModal from '~/tutorial/components/TutorialModal.vue';
import TutorialHighlight from '~/tutorial/components/TutorialHighlight.vue';
import TutorialLessonPicker from '~/tutorial/components/TutorialLessonPicker.vue';

const tutorial = useTutorial();
const showLessonPicker = ref(false);

onMounted(() => {
  // Show welcome for first-time visitors
  if (tutorial.isFirstVisit.value) {
    tutorial.showWelcome();
  }
});
</script>

<template>
  <div>
    <!-- Your app content -->

    <!-- Tutorial components -->
    <TutorialWelcome />
    <TutorialModal />
    <TutorialHighlight />
    <TutorialLessonPicker :show="showLessonPicker" @close="showLessonPicker = false" />
  </div>
</template>
```

### Composable API

```typescript
const {
  // State
  isActive,           // Is tutorial currently running
  currentLesson,      // Current lesson object
  currentStep,        // Current step object
  progress,           // User progress data

  // Computed
  isFirstVisit,       // Has user seen tutorial?
  availableLessons,   // Lessons user can start
  progressPercentage, // Current lesson progress %

  // Methods
  startLesson(id),    // Start a specific lesson
  nextStep(),         // Advance to next step
  previousStep(),     // Go back one step
  exitLesson(),       // Exit current lesson
  resetProgress(),    // Clear all progress
} = useTutorial();
```

## Adding New Lessons

Edit `tutorial/data/lessons.ts`:

```typescript
{
  id: 'lesson-custom',
  title: 'Your Lesson Title',
  category: 'beginner', // or 'intermediate', 'advanced'
  description: 'Brief description',
  estimatedMinutes: 5,
  icon: '🎯',
  prerequisite: 'lesson-previous', // optional
  completionMessage: 'Congratulations message',
  steps: [
    {
      id: 'step-1',
      title: 'Step Title',
      description: 'What this step teaches',
      instruction: 'What user should do',
      highlightElement: '.css-selector', // optional
      highlightBlocks: ['block_type'], // optional
      hints: ['Hint 1', 'Hint 2'], // optional
      autoAdvance: false, // optional
    },
    // More steps...
  ],
}
```

## Features

### Progress Tracking
- Automatically saved to localStorage
- Tracks started and completed lessons
- Prevents skipping prerequisites
- Can be reset by user

### Visual Highlighting
- Spotlight effect on UI elements
- Pulsing borders
- Animated arrows
- Blockly toolbox category highlighting

### Step Validation
- Optional validation functions
- Auto-advance when conditions met
- Hint system for stuck users

### Responsive Design
- Mobile-friendly modals
- Adjustable panel positions
- Smooth animations and transitions

## Events

The tutorial system emits custom events:

```typescript
window.addEventListener('tutorial:start', (e) => {
  console.log('Tutorial started');
});

window.addEventListener('lesson:start', (e) => {
  console.log('Lesson started:', e.detail.lessonId);
});

window.addEventListener('lesson:complete', (e) => {
  console.log('Lesson completed:', e.detail.lessonId);
});

window.addEventListener('tutorial:complete', (e) => {
  console.log('All lessons completed!');
});
```

## Customization

### Theming
All components use CSS custom properties that can be overridden:

```css
:root {
  --tutorial-primary: #2a9d8f;
  --tutorial-secondary: #264653;
  --tutorial-accent: #e76f51;
}
```

### Content
- Lesson content is in `data/lessons.ts`
- All text is easily editable
- Icons use emojis for universal compatibility

## Best Practices

1. **Keep steps focused** - One concept per step
2. **Use clear instructions** - Tell users exactly what to do
3. **Provide hints** - Help users who get stuck
4. **Test thoroughly** - Ensure selectors match your UI
5. **Progressive difficulty** - Build on previous lessons

## Troubleshooting

### Tutorial not showing on first visit
- Check `tutorial.isFirstVisit.value`
- Verify localStorage is available
- Clear `droneblocks_tutorial_progress` key to test

### Highlighting not working
- Verify CSS selectors are correct
- Check z-index conflicts
- Ensure elements exist in DOM

### Progress not saving
- Check localStorage permissions
- Verify no errors in console
- Test in incognito mode

## Future Enhancements

Potential additions:
- Video tutorials embedded in steps
- Code explanations and generation preview
- Achievement badges
- Sharing completed missions
- Multi-language support
- Accessibility improvements (screen reader support)
