// Pomodoro Focus Engine Automated Verification Test Suite

// Mock browser globals for Node test environment
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    AudioContext: class MockAudioContext {
      state = 'running';
      currentTime = 0;
      resume = () => Promise.resolve();
      createOscillator = () => ({
        type: 'sine',
        frequency: { setValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {},
      });
      createGain = () => ({
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        },
        connect: () => {},
      });
      destination = {};
    },
    Notification: class MockNotification {
      static permission = 'granted';
      static requestPermission = () => Promise.resolve('granted');
      constructor() {}
    },
  };
}

const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};

import { usePomodoroStore } from '../stores/usePomodoroStore';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function runTests() {
  console.log('=== ATELIER POMODORO FOCUS BAR TEST SUITE ===\n');

  // Test 1: Initial state
  const store = usePomodoroStore.getState();
  assert(store.mode === 'focus', 'Initial mode is "focus"');
  assert(store.durationSeconds === 25 * 60, 'Initial duration is 25 minutes (1500s)');
  assert(store.remainingSeconds === 25 * 60, 'Initial remaining is 25 minutes (1500s)');
  assert(!store.isRunning, 'Initial timer is paused');
  assert(store.targetCyclesDaily === 4, 'Default daily target is 4 cycles');

  // Test 2: Play, pause, and tick
  store.play();
  assert(usePomodoroStore.getState().isRunning === true, 'play() sets isRunning to true');

  usePomodoroStore.getState().tick();
  assert(
    usePomodoroStore.getState().remainingSeconds === 1500 - 1,
    'tick() decrements remainingSeconds by 1 when running'
  );

  store.pause();
  assert(usePomodoroStore.getState().isRunning === false, 'pause() sets isRunning to false');

  const pausedSeconds = usePomodoroStore.getState().remainingSeconds;
  usePomodoroStore.getState().tick();
  assert(
    usePomodoroStore.getState().remainingSeconds === pausedSeconds,
    'tick() does not decrement when paused'
  );

  // Test 3: Reset
  usePomodoroStore.getState().reset();
  assert(
    usePomodoroStore.getState().remainingSeconds === 1500,
    'reset() restores full duration (1500s)'
  );
  assert(usePomodoroStore.getState().isRunning === false, 'reset() ensures timer is stopped');

  // Test 4: Mode changes
  store.setMode('shortBreak');
  assert(usePomodoroStore.getState().mode === 'shortBreak', 'setMode("shortBreak") updates mode');
  assert(
    usePomodoroStore.getState().remainingSeconds === 5 * 60,
    'shortBreak duration is 5 minutes (300s)'
  );

  store.setMode('longBreak');
  assert(usePomodoroStore.getState().mode === 'longBreak', 'setMode("longBreak") updates mode');
  assert(
    usePomodoroStore.getState().remainingSeconds === 15 * 60,
    'longBreak duration is 15 minutes (900s)'
  );

  store.setMode('focus');
  assert(usePomodoroStore.getState().mode === 'focus', 'setMode("focus") returns to focus');

  // Test 5: Task Binding
  const testTaskTarget = {
    id: 'test-task-1',
    title: 'Implement Pomodoro Focus Bar',
    type: 'task' as const,
  };
  store.bindTarget(testTaskTarget);
  assert(
    usePomodoroStore.getState().activeTaskId === 'test-task-1',
    'bindTarget sets activeTaskId'
  );
  assert(
    usePomodoroStore.getState().activeTarget?.title === 'Implement Pomodoro Focus Bar',
    'bindTarget stores activeTarget details'
  );

  // Test 6: Cycle Completion Transition (Focus -> Short Break)
  // Simulate timer at 1 second
  usePomodoroStore.setState({
    remainingSeconds: 1,
    isRunning: true,
    completedCyclesToday: 0,
    targetCyclesDaily: 4,
  });
  usePomodoroStore.getState().tick();

  const stateAfterFirstFocus = usePomodoroStore.getState();
  assert(
    stateAfterFirstFocus.completedCyclesToday === 1,
    'Focus completion increments completedCyclesToday to 1'
  );
  assert(
    stateAfterFirstFocus.mode === 'shortBreak',
    'After 1st focus cycle, mode transitions to shortBreak'
  );
  assert(
    stateAfterFirstFocus.remainingSeconds === 5 * 60,
    'Short break remaining seconds initialized to 300s'
  );

  // Test 7: Break Completion Transition (Short Break -> Focus)
  usePomodoroStore.setState({ remainingSeconds: 1, isRunning: true });
  usePomodoroStore.getState().tick();

  const stateAfterBreak = usePomodoroStore.getState();
  assert(
    stateAfterBreak.mode === 'focus',
    'After short break finishes, mode transitions back to focus'
  );
  assert(stateAfterBreak.remainingSeconds === 25 * 60, 'Focus remaining seconds restored to 1500s');

  // Test 8: 4th Cycle Long Break Transition
  usePomodoroStore.setState({
    mode: 'focus',
    remainingSeconds: 1,
    isRunning: true,
    completedCyclesToday: 3, // Completing 4th cycle
    targetCyclesDaily: 4,
  });
  usePomodoroStore.getState().tick();

  const stateAfterFourthFocus = usePomodoroStore.getState();
  assert(stateAfterFourthFocus.completedCyclesToday === 4, 'Completed 4th cycle');
  assert(
    stateAfterFourthFocus.mode === 'longBreak',
    '4th cycle completion triggers longBreak mode'
  );
  assert(
    stateAfterFourthFocus.remainingSeconds === 15 * 60,
    'Long break duration is 15 minutes (900s)'
  );

  // Test 9: Skip Cycle
  usePomodoroStore.setState({ mode: 'focus', remainingSeconds: 1200, completedCyclesToday: 1 });
  usePomodoroStore.getState().skipCycle();
  assert(
    usePomodoroStore.getState().mode === 'shortBreak',
    'skipCycle() during focus skips to shortBreak'
  );
  assert(
    usePomodoroStore.getState().remainingSeconds === 300,
    'skipCycle() resets remaining time to break duration'
  );

  usePomodoroStore.getState().skipCycle();
  assert(
    usePomodoroStore.getState().mode === 'focus',
    'skipCycle() during shortBreak skips back to focus'
  );
  assert(
    usePomodoroStore.getState().remainingSeconds === 1500,
    'skipCycle() resets remaining time to focus duration'
  );

  // Test 10: Unbind Task
  usePomodoroStore.getState().unbindTarget();
  assert(
    usePomodoroStore.getState().activeTaskId === undefined,
    'unbindTarget clears activeTaskId'
  );
  assert(usePomodoroStore.getState().activeTarget === null, 'unbindTarget clears activeTarget');

  // Test 11: Settings updates and dynamic duration adjustments
  usePomodoroStore.getState().updateSettings({
    focusMinutes: 50,
    shortBreakMinutes: 10,
    longBreakMinutes: 20,
    targetCyclesDaily: 6,
  });
  const updatedSettings = usePomodoroStore.getState();
  assert(updatedSettings.focusMinutes === 50, 'Custom focus duration updated to 50m');
  assert(updatedSettings.shortBreakMinutes === 10, 'Custom short break duration updated to 10m');
  assert(updatedSettings.longBreakMinutes === 20, 'Custom long break duration updated to 20m');
  assert(updatedSettings.targetCyclesDaily === 6, 'Custom daily target updated to 6');
  assert(
    updatedSettings.remainingSeconds === 50 * 60,
    'Remaining seconds refreshed to new custom focus duration (3000s)'
  );

  // Test 12: Daily cycles reset
  usePomodoroStore.getState().resetDailyCycles();
  assert(
    usePomodoroStore.getState().completedCyclesToday === 0,
    'resetDailyCycles resets completed cycle count to 0'
  );

  console.log('\nAll 12 Pomodoro focus bar engine tests PASSED successfully!');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  throw err;
});
