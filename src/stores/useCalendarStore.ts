import { create } from 'zustand';
import { CalendarEvent, RecurringWeeklyBlock } from '@/types';
import { calendarService } from '@/services/calendarService';

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string; // YYYY-MM-DD
  weeklyBlocks: RecurringWeeklyBlock[];
  isLoading: boolean;
  loadEvents: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  addEvent: (
    title: string,
    category: CalendarEvent['category'],
    date: string,
    startTime: string,
    endTime: string,
    description?: string
  ) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  addWeeklyBlock: (block: Omit<RecurringWeeklyBlock, 'id'>) => void;
  deleteWeeklyBlock: (blockId: string) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  selectedDate: '2026-09-09', // Matches Figma Design focus date
  weeklyBlocks: [],
  isLoading: false,

  loadEvents: async () => {
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

  setSelectedDate: (date: string) => set({ selectedDate: date }),

  addEvent: async (title, category, date, startTime, endTime, description) => {
    const newEvent = await calendarService.addEvent(
      title,
      category,
      date,
      startTime,
      endTime,
      description
    );
    set((state) => ({ events: [...state.events, newEvent] }));
  },

  deleteEvent: async (eventId: string) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
    }));
    await calendarService.deleteEvent(eventId);
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

  deleteWeeklyBlock: (blockId) => {
    const { weeklyBlocks } = get();
    const updated = weeklyBlocks.filter((b) => b.id !== blockId);
    set({ weeklyBlocks: updated });
    calendarService.saveRecurringWeeklyBlocks(updated);
  },
}));
