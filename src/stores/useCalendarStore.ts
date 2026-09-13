import { create } from 'zustand';
import { CalendarEvent, RecurringWeeklyBlock, Task } from '@/types';
import { calendarService } from '@/services/calendarService';
import { useTasksStore } from './useTasksStore';

function getSundayOfWeek(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = date.getDay(); // 0 = Sun
  date.setDate(date.getDate() - day);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string; // YYYY-MM-DD
  activeWeekStartDate: string; // YYYY-MM-DD for Sunday of current week
  viewMode: 'month' | 'week';
  isTaskDrawerOpen: boolean;
  weeklyBlocks: RecurringWeeklyBlock[];
  isLoading: boolean;

  loadEvents: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setActiveWeekStartDate: (date: string) => void;
  setViewMode: (mode: 'month' | 'week') => void;
  toggleTaskDrawer: () => void;
  setTaskDrawerOpen: (open: boolean) => void;

  addEvent: (
    title: string,
    category: CalendarEvent['category'],
    date: string,
    startTime: string,
    endTime: string,
    description?: string,
    options?: {
      colorAccent?: CalendarEvent['colorAccent'];
      taskId?: string;
      isFixed?: boolean;
    }
  ) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  scheduleTask: (
    task: Task,
    date: string,
    startTime: string,
    durationMinutes?: number
  ) => Promise<CalendarEvent>;

  addWeeklyBlock: (block: Omit<RecurringWeeklyBlock, 'id'>) => void;
  updateWeeklyBlock: (blockId: string, updates: Partial<RecurringWeeklyBlock>) => void;
  deleteWeeklyBlock: (blockId: string) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  selectedDate: '2026-09-09', // Matches Figma Design focus date
  activeWeekStartDate: getSundayOfWeek('2026-09-09'),
  viewMode: 'month',
  isTaskDrawerOpen: false,
  weeklyBlocks: [],
  isLoading: false,

  loadEvents: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const events = await calendarService.getEvents();
      const weeklyBlocks = calendarService.getRecurringWeeklyBlocks();
      set({ events, weeklyBlocks, isLoading: false });
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      set({ isLoading: false });
    }
  },

  setSelectedDate: (date: string) => {
    set({
      selectedDate: date,
      activeWeekStartDate: getSundayOfWeek(date),
    });
  },

  setActiveWeekStartDate: (date: string) => set({ activeWeekStartDate: date }),

  setViewMode: (mode: 'month' | 'week') => set({ viewMode: mode }),

  toggleTaskDrawer: () => set((state) => ({ isTaskDrawerOpen: !state.isTaskDrawerOpen })),

  setTaskDrawerOpen: (open: boolean) => set({ isTaskDrawerOpen: open }),

  addEvent: async (title, category, date, startTime, endTime, description, options) => {
    const newEvent = await calendarService.addEvent(
      title,
      category,
      date,
      startTime,
      endTime,
      description,
      options
    );
    set((state) => ({ events: [...state.events, newEvent] }));
    return newEvent;
  },

  updateEvent: async (eventId: string, updates: Partial<CalendarEvent>) => {
    set((state) => ({
      events: state.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
    }));
    await calendarService.updateEvent(eventId, updates);
  },

  deleteEvent: async (eventId: string) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
    }));
    await calendarService.deleteEvent(eventId);
  },

  scheduleTask: async (task: Task, date: string, startTime: string, durationMinutes = 60) => {
    const newEvent = await calendarService.scheduleTaskAsEvent(
      task.id,
      task.title,
      date,
      startTime,
      durationMinutes
    );
    set((state) => ({ events: [...state.events, newEvent] }));
    try {
      await useTasksStore.getState().setTaskScheduledDate(task.id, date);
    } catch (err) {
      console.warn('Could not update task scheduled date in tasks store:', err);
    }
    return newEvent;
  },

  addWeeklyBlock: (block) => {
    const { weeklyBlocks } = get();
    const newBlock: RecurringWeeklyBlock = {
      ...block,
      id: `rec_${Date.now()}`,
    };
    const updated = [...weeklyBlocks, newBlock];
    set({ weeklyBlocks: updated });
    calendarService.saveRecurringWeeklyBlocks(updated);
  },

  updateWeeklyBlock: (blockId, updates) => {
    const { weeklyBlocks } = get();
    const updated = weeklyBlocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b));
    set({ weeklyBlocks: updated });
    calendarService.saveRecurringWeeklyBlocks(updated);
  },

  deleteWeeklyBlock: (blockId) => {
    const { weeklyBlocks } = get();
    const updated = weeklyBlocks.filter((b) => b.id !== blockId);
    set({ weeklyBlocks: updated });
    calendarService.saveRecurringWeeklyBlocks(updated);
  },
}));
