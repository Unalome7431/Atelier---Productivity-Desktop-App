import { create } from 'zustand';
import { PomodoroState } from '@/types';

interface PomodoroStore extends PomodoroState {
  play: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  setMode: (mode: 'focus' | 'shortBreak' | 'longBreak') => void;
  setActiveTask: (taskId?: string) => void;
}

const DURATIONS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  mode: 'focus',
  durationSeconds: DURATIONS.focus,
  remainingSeconds: DURATIONS.focus,
  isRunning: false,
  completedCyclesToday: 2,
  targetCyclesDaily: 4,
  activeTaskId: undefined,

  play: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),
  reset: () => {
    const { mode } = get();
    set({
      remainingSeconds: DURATIONS[mode],
      isRunning: false,
    });
  },
  tick: () => {
    const { remainingSeconds, isRunning, completedCyclesToday, mode } = get();
    if (!isRunning) return;

    if (remainingSeconds <= 1) {
      // Completed current cycle
      if (mode === 'focus') {
        const nextCycles = completedCyclesToday + 1;
        const nextMode = nextCycles % 4 === 0 ? 'longBreak' : 'shortBreak';
        set({
          completedCyclesToday: nextCycles,
          mode: nextMode,
          durationSeconds: DURATIONS[nextMode],
          remainingSeconds: DURATIONS[nextMode],
          isRunning: false,
        });
      } else {
        set({
          mode: 'focus',
          durationSeconds: DURATIONS.focus,
          remainingSeconds: DURATIONS.focus,
          isRunning: false,
        });
      }
    } else {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },
  setMode: (mode) =>
    set({
      mode,
      durationSeconds: DURATIONS[mode],
      remainingSeconds: DURATIONS[mode],
      isRunning: false,
    }),
  setActiveTask: (taskId) => set({ activeTaskId: taskId }),
}));
