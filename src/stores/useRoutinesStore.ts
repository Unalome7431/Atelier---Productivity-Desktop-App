import { create } from 'zustand';
import { Routine, RoutineLog } from '@/types';
import { routineService } from '@/services/routineService';

interface RoutinesState {
  routines: Routine[];
  todayLogs: RoutineLog[];
  streakDays: number;
  individualStreaks: Record<string, number>;
  isLoading: boolean;
  loadRoutines: () => Promise<void>;
  toggleRoutine: (routineId: string) => Promise<void>;
  incrementRoutine: (routineId: string) => Promise<void>;
  decrementRoutine: (routineId: string) => Promise<void>;
  addRoutine: (params: {
    title: string;
    description?: string;
    category?: string;
    cadence?: 'daily' | 'weekdays' | 'custom';
    customDays?: number[];
    icon?: string;
    color?: string;
    targetCount?: number;
  }) => Promise<void>;
  deleteRoutine: (routineId: string) => Promise<void>;
}

export const useRoutinesStore = create<RoutinesState>((set, get) => ({
  routines: [],
  todayLogs: [],
  streakDays: 5,
  individualStreaks: {},
  isLoading: false,

  loadRoutines: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      // 1. Fetch routines
      const routines = await routineService.getAllRoutines();
      // 2. Midnight auto-instantiation engine: ensure today's logs exist for active routines
      const todayLogs = await routineService.ensureTodayLogs();
      // 3. Compute real streak
      const streak = await routineService.calculateStreak();
      const individualStreaks = await routineService.calculateIndividualStreaks();

      set({
        routines,
        todayLogs,
        streakDays: streak,
        individualStreaks,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load routines:', err);
      set({ isLoading: false });
    }
  },

  toggleRoutine: async (routineId: string) => {
    const { todayLogs } = get();
    const existing = todayLogs.find((l) => l.routineId === routineId);
    const nextCompleted = !existing?.completed;

    // Optimistic UI update
    set({
      todayLogs: todayLogs.map((l) =>
        l.routineId === routineId
          ? {
              ...l,
              completed: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : undefined,
            }
          : l
      ),
    });

    const updatedLog = await routineService.toggleRoutine(routineId, nextCompleted);
    const streak = await routineService.calculateStreak();
    const individualStreaks = await routineService.calculateIndividualStreaks();
    set((state) => ({
      todayLogs: state.todayLogs.map((l) => (l.routineId === routineId ? updatedLog : l)),
      streakDays: streak,
      individualStreaks,
    }));
  },

  incrementRoutine: async (routineId: string) => {
    const updatedLog = await routineService.updateRoutineCount(routineId, 1);
    const streak = await routineService.calculateStreak();
    const individualStreaks = await routineService.calculateIndividualStreaks();
    set((state) => ({
      todayLogs: state.todayLogs.map((l) => (l.routineId === routineId ? updatedLog : l)),
      streakDays: streak,
      individualStreaks,
    }));
  },

  decrementRoutine: async (routineId: string) => {
    const updatedLog = await routineService.updateRoutineCount(routineId, -1);
    const streak = await routineService.calculateStreak();
    const individualStreaks = await routineService.calculateIndividualStreaks();
    set((state) => ({
      todayLogs: state.todayLogs.map((l) => (l.routineId === routineId ? updatedLog : l)),
      streakDays: streak,
      individualStreaks,
    }));
  },

  addRoutine: async (params) => {
    const newRoutine = await routineService.createRoutine(params);
    const todayLogs = await routineService.getTodayLogs();
    const streak = await routineService.calculateStreak();
    const individualStreaks = await routineService.calculateIndividualStreaks();
    set((state) => ({
      routines: [...state.routines, newRoutine],
      todayLogs,
      streakDays: streak,
      individualStreaks,
    }));
  },

  deleteRoutine: async (routineId: string) => {
    await routineService.deleteRoutine(routineId);
    const streak = await routineService.calculateStreak();
    const individualStreaks = await routineService.calculateIndividualStreaks();
    set((state) => ({
      routines: state.routines.filter((r) => r.id !== routineId),
      todayLogs: state.todayLogs.filter((l) => l.routineId !== routineId),
      streakDays: streak,
      individualStreaks,
    }));
  },
}));
