import { db } from '@/db/database';
import { syncService } from './syncService';
import { CalendarEvent } from '@/types';
import { getTodayDateString } from '@/lib/utils';

export class CalendarService {
  async getEvents(): Promise<CalendarEvent[]> {
    const events = await db.select<any>('SELECT * FROM calendar_events ORDER BY start_time ASC');
    if (events.length === 0) {
      return await this.seedDefaultEvents();
    }

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.event_type as any,
      startTime: e.start_time,
      endTime: e.end_time,
      date: e.start_time.split('T')[0] || getTodayDateString(),
    }));
  }

  private async seedDefaultEvents(): Promise<CalendarEvent[]> {
    const today = getTodayDateString();
    const now = new Date().toISOString();

    const defaultEvents = [
      { id: 'ev_1', title: 'Architecture & API Design', type: 'focus', start: `${today}T10:30:00`, end: `${today}T11:45:00` },
      { id: 'ev_2', title: 'Engineering Deep Work Block', type: 'focus', start: `${today}T14:00:00`, end: `${today}T16:00:00` },
    ];

    for (const e of defaultEvents) {
      await db.execute(
        `INSERT INTO calendar_events (id, title, event_type, start_time, end_time, color_token, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [e.id, e.title, e.type, e.start, e.end, '#mint', now, now]
      );
    }

    return await this.getEvents();
  }

  async addEvent(title: string, category: 'meeting' | 'focus' | 'personal' | 'deadline', startTime: string, endTime: string): Promise<CalendarEvent> {
    const id = `ev_${Date.now()}`;
    const now = new Date().toISOString();
    const today = startTime.split('T')[0] || getTodayDateString();

    await db.execute(
      `INSERT INTO calendar_events (id, title, event_type, start_time, end_time, color_token, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, category, startTime, endTime, '#lavender', now, now]
    );

    const event: CalendarEvent = {
      id,
      title,
      category,
      startTime,
      endTime,
      date: today,
    };

    await syncService.enqueueMutation('calendar_events', id, 'INSERT', event);
    return event;
  }
}

export const calendarService = new CalendarService();
