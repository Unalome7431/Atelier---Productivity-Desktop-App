import { create } from 'zustand';
import { CalendarEvent } from '@/types';
import { calendarService } from '@/services/calendarService';

interface CalendarState {
  events: CalendarEvent[];
  isLoading: boolean;
  loadEvents: () => Promise<void>;
  addEvent: (title: string, category: 'meeting' | 'focus' | 'personal' | 'deadline', start: string, end: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  isLoading: false,

  loadEvents: async () => {
    set({ isLoading: true });
    try {
      const events = await calendarService.getEvents();
      set({ events, isLoading: false });
    } catch (err) {
      console.error('Failed to load events:', err);
      set({ isLoading: false });
    }
  },

  addEvent: async (title, category, start, end) => {
    const newEvent = await calendarService.addEvent(title, category, start, end);
    set((state) => ({ events: [...state.events, newEvent] }));
  },
}));
