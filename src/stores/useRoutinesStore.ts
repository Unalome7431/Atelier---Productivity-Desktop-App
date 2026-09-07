import { create } from 'zustand';
import { Routine, RoutineLog } from '@/types';
import { routineService } from '@/services/routineService';

interface RoutinesState {
  routines: Routine[];
  todayLogs: RoutineLog[];
  streakDays: number;
  isLoading: boolean;
  loadRoutines: () => Promise<void>;
  toggleRoutine: (routineId: string) => Promise<void>;
}

export const useRoutinesStore = create<RoutinesState>((set, get) => ({
  routines: [],
  todayLogs: [],
  streakDays: 5,
  isLoading: false,

  loadRoutines: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const [routines, todayLogs, streak] = await Promise.all([
        routineService.getAllRoutines(),
        routineService.getTodayLogs(),
        routineService.calculateStreak(),
      ]);
      set({ routines, todayLogs, streakDays: streak, isLoading: false });
    } catch (err) {
      console.error('Failed to load routines:', err);
      set({ isLoading: false });
    }
  },

  toggleRoutine: async (routineId: string) => {
    const { todayLogs } = get();
    const existing = todayLogs.find((l) => l.routineId === routineId);
    const nextCompleted = !existing?.completed;

    const nextLogs = todayLogs.filter((l) => l.routineId !== routineId).concat({
      id: `log_${routineId}`,
      routineId,
      date: new Date().toISOString().split('T')[0],
      completed: nextCompleted,
    });

    set({ todayLogs: nextLogs });
    await routineService.toggleRoutine(routineId, nextCompleted);
  },
}));
