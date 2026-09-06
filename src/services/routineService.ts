import { db } from '@/db/database';
import { syncService } from './syncService';
import { Routine, RoutineLog } from '@/types';
import { getTodayDateString } from '@/lib/utils';

export class RoutineService {
  async getAllRoutines(): Promise<Routine[]> {
    const rows = await db.select<any>('SELECT * FROM routines ORDER BY position_rank ASC');
    if (rows.length === 0) {
      // Seed default initial habits if none exist
      return await this.seedDefaultRoutines();
    }
    return rows.map((r) => ({
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

  private async seedDefaultRoutines(): Promise<Routine[]> {
    const defaultRoutines: Omit<Routine, 'id' | 'createdAt'>[] = [
      { title: 'Morning Movement & Stretch', category: '#health', cadence: 'daily' },
      { title: 'Read 15 Pages of Architecture Book', category: '#learning', cadence: 'daily' },
      { title: 'Review PRs & Issues', category: '#work', cadence: 'weekdays' },
      { title: 'Evening Daily Reflection & Journal', category: '#mindset', cadence: 'daily' },
    ];

    const seeded: Routine[] = [];
    for (let i = 0; i < defaultRoutines.length; i++) {
      const r = defaultRoutines[i];
      const id = `rt_${Date.now()}_${i}`;
      const now = new Date().toISOString();
      await db.execute(
        `INSERT INTO routines (id, title, description, category, cadence, custom_days, icon, color, position_rank, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, r.title, r.description || null, r.category, r.cadence, '[]', null, null, `${i}`, now, now]
      );
      seeded.push({
        id,
        title: r.title,
        description: r.description,
        category: r.category,
        cadence: r.cadence,
        customDays: [],
        createdAt: now,
      });
    }
    return seeded;
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
