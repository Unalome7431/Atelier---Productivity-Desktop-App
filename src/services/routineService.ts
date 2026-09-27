import { db } from '@/db/database';
import { syncService } from './syncService';
import { Routine, RoutineLog } from '@/types';
import { getTodayDateString } from '@/lib/utils';

export class RoutineService {
  isRoutineActiveOnDate(routine: Routine, dateStr: string): boolean {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    if (routine.cadence === 'daily') return true;
    if (routine.cadence === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (routine.cadence === 'custom') {
      return Array.isArray(routine.customDays) && routine.customDays.includes(dayOfWeek);
    }
    return true;
  }

  async getAllRoutines(): Promise<Routine[]> {
    const rows = await db.select<any>('SELECT * FROM routines ORDER BY position_rank ASC');
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

    return keep.map((r) => {
      let customDays: number[] = [];
      if (r.custom_days) {
        try {
          customDays =
            typeof r.custom_days === 'string' ? JSON.parse(r.custom_days) : r.custom_days;
        } catch {
          customDays = [];
        }
      }

      return {
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category || '',
        cadence: r.cadence || 'daily',
        customDays,
        icon: r.icon || 'droplets',
        color: r.color || 'mint',
        targetCount: Number(r.target_count) || 1,
        orderIndex: Number(r.position_rank) || 0,
        createdAt: r.created_at,
      };
    });
  }

  async seedDefaultRoutines(): Promise<void> {
    const today = getTodayDateString();
    const now = new Date().toISOString();

    const defaultRoutines = [
      {
        id: 'rt_hydration',
        title: 'Hydration',
        category: '',
        cadence: 'daily',
        icon: 'droplets',
        color: 'mint',
        target_count: 4,
      },
      {
        id: 'rt_code_review',
        title: 'Code review',
        category: '',
        cadence: 'weekdays',
        icon: 'code',
        color: 'lavender',
        target_count: 1,
      },
      {
        id: 'rt_stretch',
        title: 'Morning Movement & Stretch',
        category: '',
        cadence: 'daily',
        icon: 'activity',
        color: 'mint',
        target_count: 1,
      },
      {
        id: 'rt_read',
        title: 'Read 15 Pages of Architecture Book',
        category: '',
        cadence: 'daily',
        icon: 'book-open',
        color: 'sky',
        target_count: 1,
      },
      {
        id: 'rt_journal',
        title: 'Evening Daily Reflection & Journal',
        category: '',
        cadence: 'daily',
        icon: 'pen-tool',
        color: 'mauve',
        target_count: 1,
      },
    ];

    for (let i = 0; i < defaultRoutines.length; i++) {
      const r = defaultRoutines[i];
      await db.execute(
        `INSERT OR IGNORE INTO routines (id, title, description, category, cadence, custom_days, icon, color, target_count, position_rank, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id,
          r.title,
          null,
          r.category,
          r.cadence,
          '[]',
          r.icon,
          r.color,
          r.target_count,
          `${i}`,
          now,
          now,
        ]
      );
    }

    // Seed 5 days of completed logs so the initial streak matches the Figma 5-day streak
    const [y, m, d] = today.split('-').map(Number);
    for (let dayOffset = 5; dayOffset >= 1; dayOffset--) {
      const pastDateObj = new Date(y, m - 1, d - dayOffset);
      const pastDateStr = pastDateObj.toISOString().split('T')[0];
      for (const r of defaultRoutines) {
        const logId = `log_${r.id}_${pastDateStr}`;
        await db.execute(
          `INSERT OR IGNORE INTO routine_logs (id, routine_id, date, completed, current_count, completed_at)
           VALUES (?, ?, ?, 1, ?, ?)`,
          [logId, r.id, pastDateStr, r.target_count, pastDateObj.toISOString()]
        );
      }
    }

    // Seed today's logs with realistic partial progress matching Figma:
    // Hydration: 3/4 completed
    await db.execute(
      `INSERT OR IGNORE INTO routine_logs (id, routine_id, date, completed, current_count, completed_at)
       VALUES (?, ?, ?, 0, ?, ?)`,
      [`log_rt_hydration_${today}`, 'rt_hydration', today, 3, null]
    );

    // Code review: completed
    await db.execute(
      `INSERT OR IGNORE INTO routine_logs (id, routine_id, date, completed, current_count, completed_at)
       VALUES (?, ?, ?, 1, 1, ?)`,
      [`log_rt_code_review_${today}`, 'rt_code_review', today, now]
    );

    // Morning stretch: completed
    await db.execute(
      `INSERT OR IGNORE INTO routine_logs (id, routine_id, date, completed, current_count, completed_at)
       VALUES (?, ?, ?, 1, 1, ?)`,
      [`log_rt_stretch_${today}`, 'rt_stretch', today, now]
    );

    // Read book: completed
    await db.execute(
      `INSERT OR IGNORE INTO routine_logs (id, routine_id, date, completed, current_count, completed_at)
       VALUES (?, ?, ?, 1, 1, ?)`,
      [`log_rt_read_${today}`, 'rt_read', today, now]
    );

    // Evening journal: uncompleted
    await db.execute(
      `INSERT OR IGNORE INTO routine_logs (id, routine_id, date, completed, current_count, completed_at)
       VALUES (?, ?, ?, 0, 0, ?)`,
      [`log_rt_journal_${today}`, 'rt_journal', today, null]
    );
  }

  // Midnight Auto-Instantiation Engine: Ensures today's logs exist for all active routines
  async ensureTodayLogs(today = getTodayDateString()): Promise<RoutineLog[]> {
    const routines = await this.getAllRoutines();
    const existingLogs = await db.select<any>(`SELECT * FROM routine_logs WHERE date = ?`, [today]);
    const existingMap = new Map<string, any>(existingLogs.map((l) => [l.routine_id, l]));

    for (const r of routines) {
      if (this.isRoutineActiveOnDate(r, today)) {
        if (!existingMap.has(r.id)) {
          const logId = `log_${r.id}_${today}`;
          await db.execute(
            `INSERT OR IGNORE INTO routine_logs (id, routine_id, date, completed, current_count, completed_at)
             VALUES (?, ?, ?, 0, 0, NULL)`,
            [logId, r.id, today]
          );
        }
      }
    }

    return this.getTodayLogs(today);
  }

  async getTodayLogs(today = getTodayDateString()): Promise<RoutineLog[]> {
    const rows = await db.select<any>(`SELECT * FROM routine_logs WHERE date = ?`, [today]);
    return rows.map((r) => ({
      id: r.id,
      routineId: r.routine_id,
      date: r.date,
      completed: Boolean(r.completed),
      currentCount: Number(r.current_count) || 0,
      completedAt: r.completed_at,
    }));
  }

  async toggleRoutine(routineId: string, completed: boolean): Promise<RoutineLog> {
    const today = getTodayDateString();
    const now = new Date().toISOString();
    const logId = `log_${routineId}_${today}`;

    // Get routine target count
    const routines = await db.select<any>(`SELECT target_count FROM routines WHERE id = ?`, [
      routineId,
    ]);
    const targetCount = routines[0]?.target_count ? Number(routines[0].target_count) : 1;
    const currentCount = completed ? targetCount : 0;

    await db.execute(`DELETE FROM routine_logs WHERE routine_id = ? AND date = ?`, [
      routineId,
      today,
    ]);

    await db.execute(
      `INSERT INTO routine_logs (id, routine_id, date, completed, current_count, completed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [logId, routineId, today, completed ? 1 : 0, currentCount, completed ? now : null]
    );

    const log: RoutineLog = {
      id: logId,
      routineId,
      date: today,
      completed,
      currentCount,
      completedAt: completed ? now : undefined,
    };

    await syncService.enqueueMutation('routine_logs', logId, 'UPDATE', {
      routine_id: routineId,
      date: today,
      completed,
      current_count: currentCount,
      completed_at: completed ? now : null,
    });

    return log;
  }

  async updateRoutineCount(routineId: string, delta: number): Promise<RoutineLog> {
    const today = getTodayDateString();
    const now = new Date().toISOString();
    const logId = `log_${routineId}_${today}`;

    const routines = await db.select<any>(`SELECT target_count FROM routines WHERE id = ?`, [
      routineId,
    ]);
    const targetCount = routines[0]?.target_count ? Number(routines[0].target_count) : 1;

    const existingLogs = await db.select<any>(
      `SELECT * FROM routine_logs WHERE routine_id = ? AND date = ?`,
      [routineId, today]
    );
    const existing = existingLogs[0];
    const prevCount = existing?.current_count ? Number(existing.current_count) : 0;
    const nextCount = Math.max(0, Math.min(targetCount, prevCount + delta));
    const completed = nextCount >= targetCount;

    await db.execute(`DELETE FROM routine_logs WHERE routine_id = ? AND date = ?`, [
      routineId,
      today,
    ]);

    await db.execute(
      `INSERT INTO routine_logs (id, routine_id, date, completed, current_count, completed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [logId, routineId, today, completed ? 1 : 0, nextCount, completed ? now : null]
    );

    const log: RoutineLog = {
      id: logId,
      routineId,
      date: today,
      completed,
      currentCount: nextCount,
      completedAt: completed ? now : undefined,
    };

    await syncService.enqueueMutation('routine_logs', logId, 'UPDATE', {
      routine_id: routineId,
      date: today,
      completed,
      current_count: nextCount,
      completed_at: completed ? now : null,
    });

    return log;
  }

  async createRoutine(params: {
    title: string;
    description?: string;
    category?: string;
    cadence?: 'daily' | 'weekdays' | 'custom';
    customDays?: number[];
    icon?: string;
    color?: string;
    targetCount?: number;
  }): Promise<Routine> {
    const id = `rt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const today = getTodayDateString();
    const cadence = params.cadence || 'daily';
    const customDays = params.customDays || [];
    const targetCount = params.targetCount || 1;
    const category = params.category || '';
    const icon = params.icon || 'droplets';
    const color = params.color || 'mint';

    await db.execute(
      `INSERT INTO routines (id, title, description, category, cadence, custom_days, icon, color, target_count, position_rank, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.title,
        params.description || null,
        category,
        cadence,
        JSON.stringify(customDays),
        icon,
        color,
        targetCount,
        '99',
        now,
        now,
      ]
    );

    const routine: Routine = {
      id,
      title: params.title,
      description: params.description,
      category,
      cadence,
      customDays,
      icon,
      color,
      targetCount,
      orderIndex: 99,
      createdAt: now,
    };

    // Auto-instantiate today's log if active today
    if (this.isRoutineActiveOnDate(routine, today)) {
      const logId = `log_${id}_${today}`;
      await db.execute(
        `INSERT OR IGNORE INTO routine_logs (id, routine_id, date, completed, current_count, completed_at)
         VALUES (?, ?, ?, 0, 0, NULL)`,
        [logId, id, today]
      );
    }

    await syncService.enqueueMutation('routines', id, 'INSERT', routine);
    return routine;
  }

  async deleteRoutine(routineId: string): Promise<void> {
    await db.execute(`DELETE FROM routine_logs WHERE routine_id = ?`, [routineId]);
    await db.execute(`DELETE FROM routines WHERE id = ?`, [routineId]);
    await syncService.enqueueMutation('routines', routineId, 'DELETE', { id: routineId });
  }

  async calculateStreak(): Promise<number> {
    const routines = await this.getAllRoutines();
    if (routines.length === 0) return 0;

    const allLogs = await db.select<any>(`SELECT * FROM routine_logs ORDER BY date DESC`);
    const logsByDate = new Map<string, any[]>();
    for (const l of allLogs) {
      const list = logsByDate.get(l.date) || [];
      list.push(l);
      logsByDate.set(l.date, list);
    }

    const today = getTodayDateString();
    const [y, m, d] = today.split('-').map(Number);
    let streak = 0;

    // Check yesterday going backwards
    let dayOffset = 1;
    while (dayOffset <= 365) {
      const checkDateObj = new Date(y, m - 1, d - dayOffset);
      const checkDateStr = checkDateObj.toISOString().split('T')[0];
      const activeRoutinesForDay = routines.filter((r) =>
        this.isRoutineActiveOnDate(r, checkDateStr)
      );

      if (activeRoutinesForDay.length === 0) {
        dayOffset++;
        continue;
      }

      const dayLogs = logsByDate.get(checkDateStr) || [];
      const allCompleted = activeRoutinesForDay.every((r) => {
        const log = dayLogs.find((l) => l.routine_id === r.id);
        if (!log) return false;
        return (
          Boolean(log.completed) || (log.current_count && log.current_count >= (r.targetCount || 1))
        );
      });

      if (allCompleted) {
        streak++;
        dayOffset++;
      } else {
        break;
      }
    }

    // Check if today is 100% completed too — if so, increment streak by 1
    const todayActive = routines.filter((r) => this.isRoutineActiveOnDate(r, today));
    if (todayActive.length > 0) {
      const todayLogs = logsByDate.get(today) || [];
      const todayAllDone = todayActive.every((r) => {
        const log = todayLogs.find((l) => l.routine_id === r.id);
        if (!log) return false;
        return (
          Boolean(log.completed) || (log.current_count && log.current_count >= (r.targetCount || 1))
        );
      });
      if (todayAllDone) {
        streak++;
      }
    }

    return streak;
  }

  async calculateIndividualStreaks(): Promise<Record<string, number>> {
    const routines = await this.getAllRoutines();
    if (routines.length === 0) return {};

    const allLogs = await db.select<any>(`SELECT * FROM routine_logs ORDER BY date DESC`);
    const logsByRoutineAndDate = new Map<string, any>();
    for (const l of allLogs) {
      logsByRoutineAndDate.set(`${l.routine_id}_${l.date}`, l);
    }

    const today = getTodayDateString();
    const [y, m, d] = today.split('-').map(Number);
    const result: Record<string, number> = {};

    for (const routine of routines) {
      let streak = 0;
      let dayOffset = 1;

      while (dayOffset <= 365) {
        const checkDateObj = new Date(y, m - 1, d - dayOffset);
        const checkDateStr = checkDateObj.toISOString().split('T')[0];

        if (!this.isRoutineActiveOnDate(routine, checkDateStr)) {
          dayOffset++;
          continue;
        }

        const log = logsByRoutineAndDate.get(`${routine.id}_${checkDateStr}`);
        const isDone =
          log &&
          (Boolean(log.completed) ||
            (log.current_count !== undefined && log.current_count >= (routine.targetCount || 1)));

        if (isDone) {
          streak++;
          dayOffset++;
        } else {
          break;
        }
      }

      // Check if today is active and completed
      if (this.isRoutineActiveOnDate(routine, today)) {
        const todayLog = logsByRoutineAndDate.get(`${routine.id}_${today}`);
        const todayDone =
          todayLog &&
          (Boolean(todayLog.completed) ||
            (todayLog.current_count !== undefined &&
              todayLog.current_count >= (routine.targetCount || 1)));
        if (todayDone) {
          streak++;
        }
      }

      result[routine.id] = streak;
    }

    return result;
  }
}

export const routineService = new RoutineService();
