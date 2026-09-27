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
    return events.map((e) => {
      const rawStart = e.start_time || '';
      const rawEnd = e.end_time || '';
      const date = rawStart.includes('T') ? rawStart.split('T')[0] : e.date || rawStart;
      const startTime = rawStart.includes('T') ? rawStart.split('T')[1].substring(0, 5) : rawStart;
      const endTime = rawEnd.includes('T') ? rawEnd.split('T')[1].substring(0, 5) : rawEnd;

      let colorAccent: CalendarEvent['colorAccent'] = 'lavender';
      let description: string | undefined;

      if (e.color_token) {
        if (e.color_token.includes('|')) {
          const [colorTag, ...rest] = e.color_token.split('|');
          const cleanTag = colorTag.replace('#', '').trim();
          if (['lavender', 'mint', 'sand', 'blue', 'mauve', 'rose', 'amber'].includes(cleanTag)) {
            colorAccent = cleanTag as any;
          }
          description = rest.join('|').trim();
          } else if (e.color_token.startsWith('#')) {
          const cleanTag = e.color_token.replace('#', '').trim();
          if (['lavender', 'mint', 'sand', 'blue', 'mauve', 'rose', 'amber'].includes(cleanTag)) {
            colorAccent = cleanTag as any;
          }
        } else {
          description = e.color_token;
        }
      }

      if (!colorAccent || colorAccent === 'lavender') {
        if (e.event_type === 'focus') colorAccent = 'mint';
        else if (e.event_type === 'meeting') colorAccent = 'lavender';
        else if (e.event_type === 'review') colorAccent = 'lavender';
        else if (e.event_type === 'personal') colorAccent = 'blue';
        else if (e.event_type === 'deadline') colorAccent = 'mauve';
      }

      const isFixed = e.event_type === 'meeting' || e.event_type === 'review';

      return {
        id: e.id,
        title: e.title,
        category: e.event_type as any,
        startTime,
        endTime,
        date,
        description,
        colorAccent,
        taskId: e.task_id || undefined,
        isFixed,
      };
    });
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
      taskId?: string;
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
        taskId: 'tsk_api_contract',
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
      const colorToken = e.desc ? `#${e.color}|${e.desc}` : `#${e.color}`;
      await db.execute(
        `INSERT OR IGNORE INTO calendar_events (id, title, event_type, start_time, end_time, color_token, task_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          e.id,
          e.title,
          e.category,
          `${e.date}T${e.start}:00`,
          `${e.date}T${e.end}:00`,
          colorToken,
          e.taskId || null,
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
    description?: string,
    options?: {
      colorAccent?: CalendarEvent['colorAccent'];
      taskId?: string;
      isFixed?: boolean;
    }
  ): Promise<CalendarEvent> {
    const id = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const colorAccent =
      options?.colorAccent ||
      (category === 'focus'
        ? 'mint'
        : category === 'personal'
          ? 'blue'
          : category === 'deadline'
            ? 'mauve'
            : 'lavender');
    const colorToken = description ? `#${colorAccent}|${description}` : `#${colorAccent}`;
    const taskId = options?.taskId || null;
    const isFixed =
      options?.isFixed !== undefined
        ? options.isFixed
        : category === 'meeting' || category === 'review';

    await db.execute(
      `INSERT INTO calendar_events (id, title, event_type, start_time, end_time, color_token, task_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        category,
        `${date}T${startTime}:00`,
        `${date}T${endTime}:00`,
        colorToken,
        taskId,
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
      colorAccent,
      taskId: taskId || undefined,
      isFixed,
    };

    await syncService.enqueueMutation('calendar_events', id, 'INSERT', event);
    return event;
  }

  async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent | null> {
    const events = await this.fetchEvents();
    const existing = events.find((e) => e.id === eventId);
    if (!existing) return null;

    const merged: CalendarEvent = {
      ...existing,
      ...updates,
    };

    const now = new Date().toISOString();
    const colorToken = merged.description
      ? `#${merged.colorAccent || 'lavender'}|${merged.description}`
      : `#${merged.colorAccent || 'lavender'}`;

    await db.execute(
      `UPDATE calendar_events
       SET title = ?, event_type = ?, start_time = ?, end_time = ?, color_token = ?, task_id = ?, updated_at = ?
       WHERE id = ?`,
      [
        merged.title,
        merged.category,
        `${merged.date}T${merged.startTime}:00`,
        `${merged.date}T${merged.endTime}:00`,
        colorToken,
        merged.taskId || null,
        now,
        eventId,
      ]
    );

    await syncService.enqueueMutation('calendar_events', eventId, 'UPDATE', merged);
    return merged;
  }

  async deleteEvent(eventId: string): Promise<void> {
    await db.execute(`DELETE FROM calendar_events WHERE id = ?`, [eventId]);
    await syncService.enqueueMutation('calendar_events', eventId, 'DELETE', { id: eventId });
  }

  async scheduleTaskAsEvent(
    taskId: string,
    taskTitle: string,
    date: string,
    startTime: string,
    durationMinutes: number = 60
  ): Promise<CalendarEvent> {
    const [startH, startM] = startTime.split(':').map((v) => parseInt(v, 10));
    const totalMinutes = (startH || 9) * 60 + (startM || 0) + durationMinutes;
    const endH = Math.min(23, Math.floor(totalMinutes / 60));
    const endM = totalMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    return await this.addEvent(
      taskTitle,
      'focus',
      date,
      startTime,
      endTime,
      `Time-box allocated for task "${taskTitle}"`,
      {
        colorAccent: 'mint',
        taskId,
        isFixed: false,
      }
    );
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
