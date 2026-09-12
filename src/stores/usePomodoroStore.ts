import { create } from 'zustand';
import { PomodoroState, PomodoroSettings, ActiveFocusTarget } from '@/types';
import { audioService } from '@/services/audioService';
import { notificationService } from '@/services/notificationService';
import { useTasksStore } from '@/stores/useTasksStore';
import { getTodayDateString } from '@/lib/utils';

interface PomodoroStore extends PomodoroState {
  play: () => void;
  pause: () => void;
  reset: () => void;
  skipCycle: () => void;
  tick: () => void;
  setMode: (mode: 'focus' | 'shortBreak' | 'longBreak') => void;
  bindTarget: (target: ActiveFocusTarget) => void;
  unbindTarget: () => void;
  updateSettings: (newSettings: Partial<PomodoroSettings>) => void;
  checkMidnightRollover: () => void;
  resetDailyCycles: () => void;
}

const SETTINGS_STORAGE_KEY = 'atelier_pomodoro_settings';
const CYCLES_STORAGE_KEY = 'atelier_pomodoro_cycles';

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  targetCyclesDaily: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  autoStartBreaks: false,
  autoStartFocus: false,
};

function getInitialSettings(): PomodoroSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // Fall back to defaults
  }
  return DEFAULT_SETTINGS;
}

function getInitialCycles(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(CYCLES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === getTodayDateString()) {
        return Number(parsed.count) || 0;
      }
    }
  } catch {
    // Fall back to 0
  }
  return 0;
}

function persistCycles(count: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CYCLES_STORAGE_KEY, JSON.stringify({ date: getTodayDateString(), count }));
  } catch {
    // Suppress storage write errors
  }
}

function persistSettings(settings: PomodoroSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Suppress storage write errors
  }
}

const initialSettings = getInitialSettings();
const initialCycles = getInitialCycles();
const initialFocusDuration = initialSettings.focusMinutes * 60;

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  ...initialSettings,
  mode: 'focus',
  durationSeconds: initialFocusDuration,
  remainingSeconds: initialFocusDuration,
  isRunning: false,
  activeTarget: null,
  activeTaskId: undefined,
  completedCyclesToday: initialCycles,

  play: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),

  reset: () => {
    const { mode, focusMinutes, shortBreakMinutes, longBreakMinutes } = get();
    const duration =
      mode === 'focus'
        ? focusMinutes * 60
        : mode === 'shortBreak'
          ? shortBreakMinutes * 60
          : longBreakMinutes * 60;

    set({
      remainingSeconds: duration,
      durationSeconds: duration,
      isRunning: false,
    });
  },

  skipCycle: () => {
    const {
      mode,
      focusMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      completedCyclesToday,
      targetCyclesDaily,
    } = get();

    if (mode === 'focus') {
      // Skip focus to break
      const isLongBreak = (completedCyclesToday + 1) % targetCyclesDaily === 0;
      const nextMode = isLongBreak ? 'longBreak' : 'shortBreak';
      const nextDuration = isLongBreak ? longBreakMinutes * 60 : shortBreakMinutes * 60;

      set({
        mode: nextMode,
        durationSeconds: nextDuration,
        remainingSeconds: nextDuration,
        isRunning: false,
      });
    } else {
      // Skip break to focus
      const nextDuration = focusMinutes * 60;
      set({
        mode: 'focus',
        durationSeconds: nextDuration,
        remainingSeconds: nextDuration,
        isRunning: false,
      });
    }
  },

  tick: () => {
    const {
      remainingSeconds,
      isRunning,
      completedCyclesToday,
      mode,
      focusMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      targetCyclesDaily,
      soundEnabled,
      notificationsEnabled,
      autoStartBreaks,
      autoStartFocus,
      activeTarget,
      activeTaskId,
    } = get();

    if (!isRunning) return;

    if (remainingSeconds <= 1) {
      // 1. Play chime if sound enabled
      if (soundEnabled) {
        audioService.playCompletionChime();
      }

      // 2. Send desktop OS notification
      if (notificationsEnabled) {
        void notificationService.notifyCycleComplete(mode, activeTarget?.title);
      }

      // 3. State transition
      if (mode === 'focus') {
        const nextCycles = completedCyclesToday + 1;
        persistCycles(nextCycles);

        // Increment cycle count on active task if bound
        if (activeTaskId && activeTarget?.type === 'task') {
          void useTasksStore.getState().incrementTaskPomodoro(activeTaskId);
        }

        const isLongBreak = nextCycles % targetCyclesDaily === 0;
        const nextMode = isLongBreak ? 'longBreak' : 'shortBreak';
        const nextDuration = isLongBreak ? longBreakMinutes * 60 : shortBreakMinutes * 60;

        set({
          completedCyclesToday: nextCycles,
          mode: nextMode,
          durationSeconds: nextDuration,
          remainingSeconds: nextDuration,
          isRunning: autoStartBreaks,
        });
      } else {
        // Break ended → transition to focus
        const nextDuration = focusMinutes * 60;
        set({
          mode: 'focus',
          durationSeconds: nextDuration,
          remainingSeconds: nextDuration,
          isRunning: autoStartFocus,
        });
      }
    } else {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },

  setMode: (mode) => {
    const { focusMinutes, shortBreakMinutes, longBreakMinutes } = get();
    const duration =
      mode === 'focus'
        ? focusMinutes * 60
        : mode === 'shortBreak'
          ? shortBreakMinutes * 60
          : longBreakMinutes * 60;

    set({
      mode,
      durationSeconds: duration,
      remainingSeconds: duration,
      isRunning: false,
    });
  },

  bindTarget: (target) => {
    set({
      activeTarget: target,
      activeTaskId: target.id,
    });
  },

  unbindTarget: () => {
    set({
      activeTarget: null,
      activeTaskId: undefined,
    });
  },

  updateSettings: (newSettings) => {
    const current = get();
    const updated: PomodoroSettings = {
      focusMinutes: newSettings.focusMinutes ?? current.focusMinutes,
      shortBreakMinutes: newSettings.shortBreakMinutes ?? current.shortBreakMinutes,
      longBreakMinutes: newSettings.longBreakMinutes ?? current.longBreakMinutes,
      targetCyclesDaily: newSettings.targetCyclesDaily ?? current.targetCyclesDaily,
      soundEnabled: newSettings.soundEnabled ?? current.soundEnabled,
      notificationsEnabled: newSettings.notificationsEnabled ?? current.notificationsEnabled,
      autoStartBreaks: newSettings.autoStartBreaks ?? current.autoStartBreaks,
      autoStartFocus: newSettings.autoStartFocus ?? current.autoStartFocus,
    };

    persistSettings(updated);

    // If currently paused, recalculate remainingSeconds if the active mode's duration changed
    let nextDuration = current.durationSeconds;
    let nextRemaining = current.remainingSeconds;

    if (!current.isRunning) {
      if (current.mode === 'focus' && newSettings.focusMinutes !== undefined) {
        nextDuration = newSettings.focusMinutes * 60;
        nextRemaining = nextDuration;
      } else if (current.mode === 'shortBreak' && newSettings.shortBreakMinutes !== undefined) {
        nextDuration = newSettings.shortBreakMinutes * 60;
        nextRemaining = nextDuration;
      } else if (current.mode === 'longBreak' && newSettings.longBreakMinutes !== undefined) {
        nextDuration = newSettings.longBreakMinutes * 60;
        nextRemaining = nextDuration;
      }
    }

    set({
      ...updated,
      durationSeconds: nextDuration,
      remainingSeconds: nextRemaining,
    });
  },

  checkMidnightRollover: () => {
    const stored = getInitialCycles();
    if (stored !== get().completedCyclesToday) {
      set({ completedCyclesToday: stored });
    }
  },

  resetDailyCycles: () => {
    persistCycles(0);
    set({ completedCyclesToday: 0 });
  },
}));
