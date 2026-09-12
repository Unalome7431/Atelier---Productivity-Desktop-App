import { db } from '@/db/database';
import { syncService } from './syncService';
import { Task, TaskSubtask } from '@/types';
import { getTodayDateString } from '@/lib/utils';

export class TaskService {
  private seedingPromise: Promise<void> | null = null;

  async getTodayTasks(): Promise<Task[]> {
    const today = getTodayDateString();

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
      `SELECT * FROM tasks WHERE scheduled_date = ? ORDER BY position_rank ASC`,
      [today]
    );

    const cleanedRows = await this.deduplicateTasks(rows);
    return cleanedRows.map((t) => this.mapTask(t));
  }

  async getInboxTasks(): Promise<Task[]> {
    await db.init();
    const rows = await db.select<any>(
      `SELECT * FROM tasks WHERE scheduled_date IS NULL ORDER BY position_rank ASC`
    );

    const cleanedRows = await this.deduplicateTasks(rows);
    return cleanedRows.map((t) => this.mapTask(t));
  }

  private mapTask(t: any): Task {
    let subtasks: TaskSubtask[] = [];
    if (t.subtasks) {
      try {
        subtasks = typeof t.subtasks === 'string' ? JSON.parse(t.subtasks) : t.subtasks;
      } catch {
        subtasks = [];
      }
    }

    return {
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category_tag || '',
      iconType: t.icon_type || 'default',
      scheduledDate: t.scheduled_date || null,
      completed: t.status === 'done',
      completedAt: t.completed_at,
      orderIndex: parseInt(t.position_rank || '0', 10),
      subtasks,
      pomodoroCyclesCompleted: t.pomodoro_cycles_completed
        ? Number(t.pomodoro_cycles_completed)
        : 0,
      pomodoroCyclesEstimated: t.pomodoro_cycles_estimated
        ? Number(t.pomodoro_cycles_estimated)
        : 1,
      sourceKanbanCardId: t.kanban_card_id,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    };
  }

  private async deduplicateTasks(rows: any[]): Promise<any[]> {
    const seen = new Set<string>();
    const keep: any[] = [];
    const deleteIds: string[] = [];

    for (const row of rows) {
      const key = `${row.title}__${row.scheduled_date || 'inbox'}`;
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
        id: 'tsk_api_contract',
        title: 'Finalize API module contract',
        category: '',
        icon_type: 'flame',
        scheduled_date: today,
        done: false,
        subtasks: [
          { id: 'sub_1', title: 'Verify SQLite schema constraints', completed: true },
          { id: 'sub_2', title: 'Draft IPC endpoint handlers for Tauri', completed: false },
        ],
      },
      {
        id: 'tsk_onboarding_handoff',
        title: 'Prepare onboarding handoff',
        category: '',
        icon_type: 'chat',
        scheduled_date: today,
        done: false,
        subtasks: [
          { id: 'sub_3', title: 'Export Figma screen assets', completed: true },
          { id: 'sub_4', title: 'Document Aura UI tokens', completed: true },
        ],
      },
      {
        id: 'tsk_cohort_feedback',
        title: 'Respond to beta cohort feedback',
        category: '',
        icon_type: 'mail',
        scheduled_date: today,
        done: false,
        subtasks: [],
      },
      {
        id: 'tsk_inbox_crdt',
        title: 'Explore offline CRDT algorithms for multi-device sync',
        category: '',
        icon_type: 'code',
        scheduled_date: null,
        done: false,
        subtasks: [],
      },
    ];

    for (let i = 0; i < defaultTasks.length; i++) {
      const t = defaultTasks[i];
      await db.execute(
        `INSERT OR IGNORE INTO tasks (id, title, description, status, position_rank, scheduled_date, category_tag, icon_type, subtasks, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.title,
          null,
          t.done ? 'done' : 'todo',
          `${i}`,
          t.scheduled_date,
          t.category,
          t.icon_type,
          JSON.stringify(t.subtasks),
          t.done ? now : null,
          now,
          now,
        ]
      );
    }
  }

  async createTask(params: {
    title: string;
    description?: string;
    category?: string;
    iconType?: 'flame' | 'chat' | 'mail' | 'code' | 'default';
    scheduledDate?: string | null;
    sourceKanbanCardId?: string;
  }): Promise<Task> {
    const today = getTodayDateString();
    const id = `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const category = params.category || '';
    const scheduledDate = params.scheduledDate !== undefined ? params.scheduledDate : today;
    const iconType = params.iconType || 'default';

    await db.execute(
      `INSERT INTO tasks (id, title, description, status, position_rank, scheduled_date, category_tag, icon_type, subtasks, kanban_card_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.title,
        params.description || null,
        'todo',
        '99',
        scheduledDate,
        category,
        iconType,
        '[]',
        params.sourceKanbanCardId || null,
        now,
        now,
      ]
    );

    const task: Task = {
      id,
      title: params.title,
      description: params.description,
      category,
      iconType,
      scheduledDate,
      completed: false,
      orderIndex: 99,
      subtasks: [],
      sourceKanbanCardId: params.sourceKanbanCardId,
      createdAt: now,
      updatedAt: now,
    };

    await syncService.enqueueMutation('tasks', id, 'INSERT', task);
    return task;
  }

  async toggleTask(taskId: string, completed: boolean): Promise<void> {
    const now = new Date().toISOString();
    const status = completed ? 'done' : 'todo';

    await db.execute(`UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?`, [
      status,
      completed ? now : null,
      now,
      taskId,
    ]);

    await syncService.enqueueMutation('tasks', taskId, 'UPDATE', {
      status,
      completed_at: completed ? now : null,
      updated_at: now,
    });
  }

  async reorderTasks(taskIds: string[]): Promise<void> {
    const now = new Date().toISOString();
    for (let i = 0; i < taskIds.length; i++) {
      const id = taskIds[i];
      await db.execute(`UPDATE tasks SET position_rank = ?, updated_at = ? WHERE id = ?`, [
        `${i}`,
        now,
        id,
      ]);
    }
  }

  async moveTaskToInbox(taskId: string): Promise<void> {
    const now = new Date().toISOString();
    await db.execute(
      `UPDATE tasks SET scheduled_date = NULL, updated_at = ? WHERE id = ?`,
      [now, taskId]
    );
    await syncService.enqueueMutation('tasks', taskId, 'UPDATE', {
      scheduled_date: null,
      updated_at: now,
    });
  }

  async moveTaskToToday(taskId: string): Promise<void> {
    const today = getTodayDateString();
    const now = new Date().toISOString();
    await db.execute(
      `UPDATE tasks SET scheduled_date = ?, updated_at = ? WHERE id = ?`,
      [today, now, taskId]
    );
    await syncService.enqueueMutation('tasks', taskId, 'UPDATE', {
      scheduled_date: today,
      updated_at: now,
    });
  }

  async addSubtask(taskId: string, subtaskTitle: string): Promise<TaskSubtask[]> {
    const rows = await db.select<any>(`SELECT subtasks FROM tasks WHERE id = ?`, [taskId]);
    let subtasks: TaskSubtask[] = [];
    if (rows[0]?.subtasks) {
      try {
        subtasks =
          typeof rows[0].subtasks === 'string' ? JSON.parse(rows[0].subtasks) : rows[0].subtasks;
      } catch {
        subtasks = [];
      }
    }

    const newSubtask: TaskSubtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      title: subtaskTitle.trim(),
      completed: false,
    };
    subtasks.push(newSubtask);

    const now = new Date().toISOString();
    const jsonStr = JSON.stringify(subtasks);
    await db.execute(`UPDATE tasks SET subtasks = ?, updated_at = ? WHERE id = ?`, [
      jsonStr,
      now,
      taskId,
    ]);
    await syncService.enqueueMutation('tasks', taskId, 'UPDATE', {
      subtasks: jsonStr,
      updated_at: now,
    });

    return subtasks;
  }

  async toggleSubtask(taskId: string, subtaskId: string): Promise<TaskSubtask[]> {
    const rows = await db.select<any>(`SELECT subtasks FROM tasks WHERE id = ?`, [taskId]);
    let subtasks: TaskSubtask[] = [];
    if (rows[0]?.subtasks) {
      try {
        subtasks =
          typeof rows[0].subtasks === 'string' ? JSON.parse(rows[0].subtasks) : rows[0].subtasks;
      } catch {
        subtasks = [];
      }
    }

    subtasks = subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s));

    const now = new Date().toISOString();
    const jsonStr = JSON.stringify(subtasks);
    await db.execute(`UPDATE tasks SET subtasks = ?, updated_at = ? WHERE id = ?`, [
      jsonStr,
      now,
      taskId,
    ]);
    await syncService.enqueueMutation('tasks', taskId, 'UPDATE', {
      subtasks: jsonStr,
      updated_at: now,
    });

    return subtasks;
  }

  async incrementPomodoroCycle(taskId: string): Promise<number> {
    await db.init();
    const rows = await db.select<any>(`SELECT pomodoro_cycles_completed FROM tasks WHERE id = ?`, [
      taskId,
    ]);
    const current = rows[0]?.pomodoro_cycles_completed
      ? Number(rows[0].pomodoro_cycles_completed)
      : 0;
    const next = current + 1;
    const now = new Date().toISOString();

    await db.execute(
      `UPDATE tasks SET pomodoro_cycles_completed = ?, updated_at = ? WHERE id = ?`,
      [next, now, taskId]
    );
    await syncService.enqueueMutation('tasks', taskId, 'UPDATE', {
      pomodoro_cycles_completed: next,
      updated_at: now,
    });

    return next;
  }

  async updatePomodoroEstimation(taskId: string, estimated: number): Promise<void> {
    await db.init();
    const now = new Date().toISOString();

    await db.execute(
      `UPDATE tasks SET pomodoro_cycles_estimated = ?, updated_at = ? WHERE id = ?`,
      [estimated, now, taskId]
    );
    await syncService.enqueueMutation('tasks', taskId, 'UPDATE', {
      pomodoro_cycles_estimated: estimated,
      updated_at: now,
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await db.execute(`DELETE FROM tasks WHERE id = ?`, [taskId]);
    await syncService.enqueueMutation('tasks', taskId, 'DELETE', { id: taskId });
  }
}

export const taskService = new TaskService();
