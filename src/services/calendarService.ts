import { db } from '@/db/database';
import { syncService } from './syncService';
import { CalendarEvent, RecurringWeeklyBlock } from '@/types';

export class CalendarService {
  private seedingPromise: Promise<void> | null = null;

  async getEvents(): Promise<CalendarEvent[]> {
    const events = await db.select<any>('SELECT * FROM calendar_events ORDER BY start_time ASC');
    if (events.length === 0) {
      if (!this.seedingPromise) {
        this.seedingPromise = this.seedDefaultEvents().finally(() => {
          this.seedingPromise = null;
        });
      }
      await this.seedingPromise;
      return await this.fetchEvents();
    }

    return await this.fetchEvents();
  }

  private async fetchEvents(): Promise<CalendarEvent[]> {
    const events = await db.select<any>('SELECT * FROM calendar_events ORDER BY start_time ASC');
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.event_type as any,
      startTime: e.start_time,
      endTime: e.end_time,
      date: e.start_time.includes('T') ? e.start_time.split('T')[0] : e.start_time,
      description: e.color_token && !e.color_token.startsWith('#') ? e.color_token : undefined,
      colorAccent: e.color_token === '#mint' || e.event_type === 'focus' ? 'mint' : 'lavender',
    }));
  }

  private async seedDefaultEvents(): Promise<void> {
    const now = new Date().toISOString();

    const defaultEvents: {
      id: string;
      title: string;
      category: CalendarEvent['category'];
      date: string;
      start: string;
      end: string;
      desc?: string;
      color: 'lavender' | 'mint';
    }[] = [
      {
        id: 'ev_sep_1',
        title: 'Weekly planning',
        category: 'meeting',
        date: '2026-09-01',
        start: '09:00',
        end: '09:45',
        color: 'lavender',
      },
      {
        id: 'ev_sep_2',
        title: 'Project build',
        category: 'focus',
        date: '2026-09-02',
        start: '10:00',
        end: '12:00',
        color: 'mint',
      },
      {
        id: 'ev_sep_4',
        title: 'Code review',
        category: 'review',
        date: '2026-09-04',
        start: '15:00',
        end: '16:00',
        color: 'lavender',
      },
      {
        id: 'ev_sep_7',
        title: 'Weekly review',
        category: 'review',
        date: '2026-09-07',
        start: '09:30',
        end: '10:15',
        color: 'lavender',
      },
      {
        id: 'ev_sep_8',
        title: 'Documentation',
        category: 'focus',
        date: '2026-09-08',
        start: '14:00',
        end: '15:00',
        color: 'mint',
      },
      {
        id: 'ev_sep_9_1',
        title: 'Team sync',
        category: 'meeting',
        date: '2026-09-09',
        start: '09:30',
        end: '10:15',
        desc: 'Review delivery progress and blockers.',
        color: 'lavender',
      },
      {
        id: 'ev_sep_9_2',
        title: 'Deep work block',
        category: 'focus',
        date: '2026-09-09',
        start: '13:00',
        end: '15:00',
        desc: 'Complete architecture specification notes.',
        color: 'mint',
      },
      {
        id: 'ev_sep_11',
        title: 'Feedback review',
        category: 'review',
        date: '2026-09-11',
        start: '11:00',
        end: '11:45',
        color: 'lavender',
      },
      {
        id: 'ev_sep_15',
        title: 'Inbox follow-up',
        category: 'focus',
        date: '2026-09-15',
        start: '10:00',
        end: '11:00',
        color: 'mint',
      },
      {
        id: 'ev_sep_16',
        title: 'Prepare next sprint',
        category: 'meeting',
        date: '2026-09-16',
        start: '13:00',
        end: '14:00',
        color: 'lavender',
      },
    ];

    for (const e of defaultEvents) {
      await db.execute(
        `INSERT OR IGNORE INTO calendar_events (id, title, event_type, start_time, end_time, color_token, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          e.id,
          e.title,
          e.category,
          `${e.date}T${e.start}:00`,
          `${e.date}T${e.end}:00`,
          e.desc || (e.color === 'mint' ? '#mint' : '#lavender'),
          now,
          now,
        ]
      );
    }
  }

  async addEvent(
    title: string,
    category: CalendarEvent['category'],
    date: string,
    startTime: string,
    endTime: string,
    description?: string
  ): Promise<CalendarEvent> {
    const id = `ev_${Date.now()}`;
    const now = new Date().toISOString();
    const color = category === 'focus' ? 'mint' : 'lavender';

    await db.execute(
      `INSERT INTO calendar_events (id, title, event_type, start_time, end_time, color_token, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        category,
        `${date}T${startTime}:00`,
        `${date}T${endTime}:00`,
        description || (color === 'mint' ? '#mint' : '#lavender'),
        now,
        now,
      ]
    );

    const event: CalendarEvent = {
      id,
      title,
      category,
      startTime,
      endTime,
      date,
      description,
      colorAccent: color,
    };

    await syncService.enqueueMutation('calendar_events', id, 'INSERT', event);
    return event;
  }

  async deleteEvent(eventId: string): Promise<void> {
    await db.execute(`DELETE FROM calendar_events WHERE id = ?`, [eventId]);
    await syncService.enqueueMutation('calendar_events', eventId, 'DELETE', { id: eventId });
  }

  getRecurringWeeklyBlocks(): RecurringWeeklyBlock[] {
    const stored = localStorage.getItem('atelier_weekly_schedule');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallback to default
      }
    }

    const defaultBlocks: RecurringWeeklyBlock[] = [
      {
        id: 'rec_1',
        dayOfWeek: 1, // Mon
        timeSlot: '09:00',
        title: 'Weekly planning',
        startFormatted: '09:00',
        endFormatted: '09:45',
        category: 'planning',
        colorAccent: 'lavender',
      },
      {
        id: 'rec_2',
        dayOfWeek: 2, // Tue
        timeSlot: '10:00',
        title: 'Project build',
        startFormatted: '10:00',
        endFormatted: '12:00',
        category: 'build',
        colorAccent: 'mint',
      },
      {
        id: 'rec_3',
        dayOfWeek: 3, // Wed
        timeSlot: '11:00',
        title: 'Team sync',
        startFormatted: '11:00',
        endFormatted: '11:30',
        category: 'meeting',
        colorAccent: 'lavender',
      },
      {
        id: 'rec_4',
        dayOfWeek: 4, // Thu
        timeSlot: '14:00',
        title: 'Documentation',
        startFormatted: '14:00',
        endFormatted: '15:00',
        category: 'focus',
        colorAccent: 'mint',
      },
      {
        id: 'rec_5',
        dayOfWeek: 5, // Fri
        timeSlot: '16:00',
        title: 'Weekly review',
        startFormatted: '16:00',
        endFormatted: '16:30',
        category: 'review',
        colorAccent: 'lavender',
      },
      {
        id: 'rec_6',
        dayOfWeek: 6, // Sat
        timeSlot: '10:00',
        title: 'Open focus block',
        startFormatted: '10:00',
        endFormatted: '11:30',
        category: 'focus',
        colorAccent: 'sand',
      },
    ];

    localStorage.setItem('atelier_weekly_schedule', JSON.stringify(defaultBlocks));
    return defaultBlocks;
  }

  saveRecurringWeeklyBlocks(blocks: RecurringWeeklyBlock[]): void {
    localStorage.setItem('atelier_weekly_schedule', JSON.stringify(blocks));
  }
}

export const calendarService = new CalendarService();
