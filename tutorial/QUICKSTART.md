# Tutorial System Quick Start

## What You Got

A complete tutorial system for DroneBlocks with **8 lessons** teaching users from basic connection to advanced computer vision!

## How to Test It

### Option 1: First-Time User Experience

1. **Clear your browser storage**:
   ```javascript
   // In browser console (F12)
   localStorage.removeItem('droneblocks_tutorial_progress');
   ```

2. **Reload the page**
   - You should see the welcome modal appear
   - Click "Start Tutorial" to begin Lesson 1
   - Or click "Skip" to dismiss

### Option 2: Existing User

1. **Click the 🎓 Tutorials button** in the header
2. **Browse available lessons** in the lesson picker
3. **Click any unlocked lesson** to start it
4. **Track your progress** - completed lessons show ✓

## Tutorial Flow

```
First Visit
    ↓
Welcome Modal (TutorialWelcome.vue)
    ↓
Click "Start Tutorial"
    ↓
Lesson 1 Starts (TutorialModal.vue appears bottom-right)
    ↓
Follow step-by-step instructions
    ↓
Complete lesson → Next lesson unlocks
    ↓
Access all lessons via 🎓 button
```

## The 8 Lessons

1. **🔌 Connecting to Your Drone** (3 min) - Interface basics
2. **🛡️ Arming Your Drone** (5 min) - First command
3. **💓 Offboard Mode & Heartbeat** (7 min) - Safety systems
4. **🚁 First Flight - Takeoff** (5 min) - Make it fly!
5. **💡 LED Control** (4 min) - Visual effects
6. **🧭 Basic Navigation** (8 min) - Movement commands
7. **🔁 Creating Patterns with Loops** (10 min) - Efficient programming
8. **📷 Computer Vision with AprilTags** (12 min) - Smart missions

## Key Components

### TutorialWelcome.vue
- Shows on first visit
- Big, friendly welcome screen
- "Start" or "Skip" options

### TutorialModal.vue
- Bottom-right overlay (non-intrusive)
- Step-by-step instructions
- Progress bar
- Hints system
- Next/Previous/Skip controls

### TutorialHighlight.vue
- Spotlights UI elements
- Pulsing border effect
- Animated arrow
- Auto-positions

### TutorialLessonPicker.vue
- Full lesson browser
- Shows progress
- Locked/unlocked states
- Reset option

## Controls

While in a tutorial:
- **Next →** - Move to next step
- **← Previous** - Go back one step
- **Skip** - Skip current step
- **Need a hint?** - Toggle hints
- **× (close)** - Exit tutorial (progress saved)

## Customizing Lessons

Edit `tutorial/data/lessons.ts`:

```typescript
{
  id: 'lesson-custom',
  title: 'My Custom Lesson',
  category: 'beginner',
  description: 'What this teaches',
  estimatedMinutes: 5,
  icon: '🎯',
  completionMessage: 'Great job!',
  steps: [
    {
      id: 'step-1',
      title: 'Step Title',
      description: 'What this step is about',
      instruction: 'Tell user what to do',
      hints: ['Hint 1', 'Hint 2'],
    },
  ],
}
```

## Testing Individual Features

### Test Welcome Modal
```javascript
// In browser console
const tutorial = useTutorial();
tutorial.showWelcome();
```

### Test Specific Lesson
```javascript
// Start Lesson 3 directly
const tutorial = useTutorial();
tutorial.startLesson('lesson-3-offboard');
```

### Reset All Progress
```javascript
// Clear everything
const tutorial = useTutorial();
tutorial.resetProgress();
```

### Check Progress
```javascript
// See what's completed
const tutorial = useTutorial();
console.log(tutorial.progress.value);
```

## File Locations

```
tutorial/
├── components/        # Vue components
├── composables/       # useTutorial()
├── data/             # Lesson content
├── types/            # TypeScript types
├── index.ts          # Package exports
├── README.md         # Full documentation
├── IMPLEMENTATION.md # Technical details
└── QUICKSTART.md     # This file
```

## Common Issues

### Welcome Modal Not Showing
- Clear localStorage: `localStorage.removeItem('droneblocks_tutorial_progress')`
- Check if `tutorial.isFirstVisit.value` is `true`

### Highlighting Not Working
- Element highlighting requires matching CSS selectors
- Currently set up with generic selectors like `.run-btn`
- Update `highlightElement` in lesson steps to match your actual DOM

### Progress Not Saving
- Check browser console for errors
- Verify localStorage is enabled
- Try incognito mode to test fresh state

### Lesson Locked
- Complete prerequisite lessons first
- Check `prerequisite` field in lesson definition
- Use lesson picker to see which lesson to complete

## What Happens on First Visit

1. User navigates to `/droneblocks`
2. Page loads and `onMounted()` runs
3. Checks `tutorial.isFirstVisit.value`
4. If `true`, shows `TutorialWelcome` modal
5. User clicks "Start Tutorial"
6. Lesson 1 begins in `TutorialModal`
7. Progress saves to localStorage

## What Happens on Return Visit

1. User navigates to `/droneblocks`
2. Progress loads from localStorage
3. Welcome doesn't show (user already saw it)
4. User can click 🎓 button anytime
5. `TutorialLessonPicker` shows completed/available lessons
6. User can resume or replay lessons

## Modifying the Experience

### Change First Lesson
In `droneblocks.vue`:
```typescript
// Instead of first lesson, start a specific one
tutorial.startLesson('lesson-4-takeoff');
```

### Always Show Tutorials Button
Already done! The 🎓 button is always visible in the header.

### Disable Auto-Welcome
In `droneblocks.vue`, comment out:
```typescript
// if (tutorial.isFirstVisit.value) {
//   tutorial.showWelcome();
// }
```

### Change Tutorial Position
In `TutorialModal.vue`, modify:
```css
.tutorial-overlay {
  /* Change from bottom-right to top-left */
  top: 20px;
  left: 20px;
  /* Remove bottom/right */
}
```

## Need to Make Changes?

All lesson content is easily editable:
- **Lesson titles/descriptions**: `tutorial/data/lessons.ts`
- **Step instructions**: `tutorial/data/lessons.ts`
- **UI styling**: Each `.vue` component's `<style>` section
- **Logic/behavior**: `tutorial/composables/useTutorial.ts`

## Next Steps

1. **Test the flow** - Clear storage and experience it fresh
2. **Customize content** - Update lesson text to match your style
3. **Adjust styling** - Colors, positions, animations
4. **Add lessons** - Create your own tutorials
5. **Get feedback** - Watch users interact with it

## That's It!

You now have a complete, production-ready tutorial system that:
- ✅ Guides new users through 8 comprehensive lessons
- ✅ Tracks progress across sessions
- ✅ Provides visual highlighting and hints
- ✅ Is completely self-contained in the `tutorial/` folder
- ✅ Can be easily customized or extended

Enjoy teaching your users to fly! 🚁
