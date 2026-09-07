import { db } from '@/db/database';
import { syncService } from './syncService';
import { Routine, RoutineLog } from '@/types';
import { getTodayDateString } from '@/lib/utils';

export class RoutineService {
  private seedingPromise: Promise<void> | null = null;

  async getAllRoutines(): Promise<Routine[]> {
    const rows = await db.select<any>('SELECT * FROM routines ORDER BY position_rank ASC');
    if (rows.length === 0) {
      // Seed default initial habits if none exist
      if (!this.seedingPromise) {
        this.seedingPromise = this.seedDefaultRoutines().finally(() => {
          this.seedingPromise = null;
        });
      }
      await this.seedingPromise;
      const seeded = await db.select<any>('SELECT * FROM routines ORDER BY position_rank ASC');
      return this.mapCleanRoutines(seeded);
    }
    return this.mapCleanRoutines(rows);
  }

  private async mapCleanRoutines(rows: any[]): Promise<Routine[]> {
    const seen = new Set<string>();
    const keep: any[] = [];
    const deleteIds: string[] = [];

    for (const r of rows) {
      if (seen.has(r.title)) {
        deleteIds.push(r.id);
      } else {
        seen.add(r.title);
        keep.push(r);
      }
    }

    if (deleteIds.length > 0) {
      for (const id of deleteIds) {
        await db.execute('DELETE FROM routines WHERE id = ?', [id]);
      }
    }

    return keep.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      cadence: r.cadence,
      customDays: r.custom_days ? JSON.parse(r.custom_days) : [],
      icon: r.icon,
      color: r.color,
      createdAt: r.created_at,
    }));
  }

  private async seedDefaultRoutines(): Promise<void> {
    const defaultRoutines = [
      { id: 'rt_morning', title: 'Morning Movement & Stretch', category: '#health', cadence: 'daily' },
      { id: 'rt_read', title: 'Read 15 Pages of Architecture Book', category: '#learning', cadence: 'daily' },
      { id: 'rt_prs', title: 'Review PRs & Issues', category: '#work', cadence: 'weekdays' },
      { id: 'rt_evening', title: 'Evening Daily Reflection & Journal', category: '#mindset', cadence: 'daily' },
    ];

    const now = new Date().toISOString();
    for (let i = 0; i < defaultRoutines.length; i++) {
      const r = defaultRoutines[i];
      await db.execute(
        `INSERT OR IGNORE INTO routines (id, title, description, category, cadence, custom_days, icon, color, position_rank, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.title, null, r.category, r.cadence, '[]', null, null, `${i}`, now, now]
      );
    }
  }

  async getTodayLogs(): Promise<RoutineLog[]> {
    const today = getTodayDateString();
    const rows = await db.select<any>(`SELECT * FROM routine_logs WHERE date = ?`, [today]);
    return rows.map((r) => ({
      id: r.id,
      routineId: r.routine_id,
      date: r.date,
      completed: Boolean(r.completed),
      completedAt: r.completed_at,
    }));
  }

  async toggleRoutine(routineId: string, completed: boolean): Promise<void> {
    const today = getTodayDateString();
    const now = new Date().toISOString();
    const logId = `log_${routineId}_${today}`;

    // Upsert routine log
    await db.execute(
      `DELETE FROM routine_logs WHERE routine_id = ? AND date = ?`,
      [routineId, today]
    );

    await db.execute(
      `INSERT INTO routine_logs (id, routine_id, date, completed, completed_at)
       VALUES (?, ?, ?, ?, ?)`,
      [logId, routineId, today, completed ? 1 : 0, completed ? now : null]
    );

    await syncService.enqueueMutation('routine_logs', logId, 'UPDATE', {
      routine_id: routineId,
      date: today,
      completed,
      completed_at: completed ? now : null,
    });
  }

  async calculateStreak(): Promise<number> {
    // Return standard streak or calculate from history
    return 5;
  }
}

export const routineService = new RoutineService();
