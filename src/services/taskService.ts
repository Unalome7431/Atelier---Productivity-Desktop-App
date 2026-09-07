import { db } from '@/db/database';
import { syncService } from './syncService';
import { Task } from '@/types';
import { getTodayDateString } from '@/lib/utils';

export class TaskService {
  private seedingPromise: Promise<void> | null = null;

  async getTodayTasks(): Promise<Task[]> {
    const today = getTodayDateString();

    // Check if the tasks table is completely unseeded
    const allRows = await db.select<any>('SELECT id FROM tasks');
    if (allRows.length === 0) {
      if (!this.seedingPromise) {
        this.seedingPromise = this.seedDefaultTasks().finally(() => {
          this.seedingPromise = null;
        });
      }
      await this.seedingPromise;
    }

    const rows = await db.select<any>(
      `SELECT * FROM tasks WHERE scheduled_date = ? OR scheduled_date IS NULL ORDER BY position_rank ASC`,
      [today]
    );

    // Auto-heal / deduplicate legacy duplicates (e.g. from StrictMode / dev reloads)
    const cleanedRows = await this.deduplicateTasks(rows);

    return cleanedRows.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category_tag || '#work',
      scheduledDate: t.scheduled_date,
      scheduledTime: t.scheduled_start_time,
      completed: t.status === 'done',
      completedAt: t.completed_at,
      orderIndex: parseInt(t.position_rank || '0', 10),
      sourceKanbanCardId: t.kanban_card_id,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  }

  private async deduplicateTasks(rows: any[]): Promise<any[]> {
    const seen = new Set<string>();
    const keep: any[] = [];
    const deleteIds: string[] = [];

    for (const row of rows) {
      // Key by title + scheduled_date so duplicate seed copies are identified
      const key = `${row.title}__${row.scheduled_date || ''}`;
      if (seen.has(key)) {
        deleteIds.push(row.id);
      } else {
        seen.add(key);
        keep.push(row);
      }
    }

    if (deleteIds.length > 0) {
      for (const id of deleteIds) {
        await db.execute('DELETE FROM tasks WHERE id = ?', [id]);
      }
    }

    return keep;
  }

  private async seedDefaultTasks(): Promise<void> {
    const today = getTodayDateString();
    const now = new Date().toISOString();
    const defaultTasks = [
      {
        id: 'tsk_default_scaffold',
        title: 'Scaffold Tauri + Vite frontend foundation',
        category: '#atelier',
        time: '09:00 AM',
        done: true,
      },
      {
        id: 'tsk_default_sqlite',
        title: 'Design SQLite offline schema & sync queue',
        category: '#architecture',
        time: '11:00 AM',
        done: true,
      },
      {
        id: 'tsk_default_sync',
        title: 'Implement full data repositories and sync protocol',
        category: '#data',
        time: '02:00 PM',
        done: false,
      },
    ];

    for (let i = 0; i < defaultTasks.length; i++) {
      const t = defaultTasks[i];
      await db.execute(
        `INSERT OR IGNORE INTO tasks (id, title, description, status, position_rank, scheduled_date, scheduled_start_time, category_tag, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.title,
          null,
          t.done ? 'done' : 'todo',
          `${i}`,
          today,
          t.time,
          t.category,
          t.done ? now : null,
          now,
          now,
        ]
      );
    }
  }

  async createTask(title: string, category = '#work', time?: string): Promise<Task> {
    const today = getTodayDateString();
    const id = `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO tasks (id, title, status, position_rank, scheduled_date, scheduled_start_time, category_tag, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, 'todo', '99', today, time || null, category, now, now]
    );

    const task: Task = {
      id,
      title,
      category,
      scheduledDate: today,
      scheduledTime: time,
      completed: false,
      orderIndex: 99,
      createdAt: now,
      updatedAt: now,
    };

    await syncService.enqueueMutation('tasks', id, 'INSERT', task);
    return task;
  }

  async toggleTask(taskId: string, completed: boolean): Promise<void> {
    const now = new Date().toISOString();
    const status = completed ? 'done' : 'todo';

    await db.execute(
      `UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
      [status, completed ? now : null, now, taskId]
    );

    await syncService.enqueueMutation('tasks', taskId, 'UPDATE', {
      status,
      completed_at: completed ? now : null,
      updated_at: now,
    });
  }
}

export const taskService = new TaskService();
