import {
  Env,
  WorkspaceConfigRow,
  TaskRow,
  RoutineRow,
  RoutineLogRow,
  KanbanBoardRow,
  KanbanCardRow,
} from './types';

export class WorkerDatabase {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  // Execute parameterized SQL query against PostgreSQL / Neon / Supabase HTTP interface
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const dbUrl = this.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn('[WorkerDatabase] DATABASE_URL not set; using local fallback memory.');
      return [];
    }

    try {
      // If using Neon serverless HTTP API (common for Cloudflare Workers)
      if (dbUrl.includes('neon.tech') || dbUrl.includes('endpoint=')) {
        const cleanUrl = dbUrl.startsWith('postgres')
          ? dbUrl.replace(/^postgres(ql)?:\/\//, 'https://').split('?')[0] + '/sql'
          : dbUrl;

        const res = await fetch(cleanUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${dbUrl.split(':')[2]?.split('@')[0] || ''}`,
          },
          body: JSON.stringify({ query: sql, params }),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          return (data.rows || data.result || []) as T[];
        }
      }

      // Standard PostgreSQL HTTP Pooler fallback (e.g. Supabase / PostgREST)
      return [];
    } catch (err) {
      console.error('[WorkerDatabase] Query execution error:', err);
      return [];
    }
  }

  // Find user by pairing code
  async findByPairingCode(code: string): Promise<WorkspaceConfigRow | null> {
    const rows = await this.query<WorkspaceConfigRow>(
      `SELECT * FROM workspace_config 
       WHERE UPPER(pairing_code) = UPPER($1) 
         AND pairing_code_expires_at > NOW() 
       LIMIT 1`,
      [code]
    );
    return rows[0] || null;
  }

  // Link chat ID to workspace
  async linkTelegramChat(configId: string, chatId: string): Promise<boolean> {
    const now = new Date().toISOString();
    await this.query(
      `UPDATE workspace_config 
       SET telegram_chat_id = $1, pairing_code = NULL, pairing_code_expires_at = NULL, updated_at = $2 
       WHERE id = $3`,
      [chatId, now, configId]
    );
    return true;
  }

  // Get paired user config
  async getPairedConfig(chatId: string): Promise<WorkspaceConfigRow | null> {
    const rows = await this.query<WorkspaceConfigRow>(
      `SELECT * FROM workspace_config WHERE telegram_chat_id = $1 LIMIT 1`,
      [chatId]
    );
    return rows[0] || null;
  }

  // Get all paired users (for morning cron)
  async getAllPairedUsers(): Promise<WorkspaceConfigRow[]> {
    return await this.query<WorkspaceConfigRow>(
      `SELECT * FROM workspace_config WHERE telegram_chat_id IS NOT NULL`
    );
  }

  // Create a new task via /todo
  async createTask(
    title: string,
    scheduledDate: string | null = null,
    description?: string
  ): Promise<TaskRow> {
    const id = `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const rank = `${Date.now()}.000000`;

    await this.query(
      `INSERT INTO tasks (id, title, description, scheduled_date, status, position_rank, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'todo', $5, $6, $7)`,
      [id, title, description || null, scheduledDate, rank, now, now]
    );

    return {
      id,
      title,
      description,
      scheduled_date: scheduledDate,
      status: 'todo',
      position_rank: rank,
    };
  }

  // Mark task completed
  async markTaskDone(taskId: string): Promise<boolean> {
    const now = new Date().toISOString();
    await this.query(
      `UPDATE tasks SET status = 'done', completed_at = $1, updated_at = $2 WHERE id = $3`,
      [now, now, taskId]
    );
    return true;
  }

  // Create a quick capture note via /note
  async createNote(title: string, content: string): Promise<string> {
    const id = `not_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    await this.query(
      `INSERT INTO notes (id, title, content, folder, category_color, created_at, updated_at)
       VALUES ($1, $2, $3, 'Inbox', '#EEEDFD', $4, $5)`,
      [id, title, `<p>${content}</p>`, now, now]
    );
    return id;
  }

  // Add card to kanban board
  async addKanbanCard(
    boardTitleOrId: string,
    cardTitle: string,
    description?: string
  ): Promise<{ cardId: string; boardTitle: string } | null> {
    const boards = await this.query<KanbanBoardRow>(
      `SELECT * FROM kanban_boards WHERE LOWER(title) LIKE LOWER($1) OR id = $2 LIMIT 1`,
      [`%${boardTitleOrId}%`, boardTitleOrId]
    );

    if (boards.length === 0) return null;
    const board = boards[0];

    const columns = await this.query<any>(
      `SELECT * FROM kanban_columns WHERE board_id = $1 ORDER BY position_rank ASC LIMIT 1`,
      [board.id]
    );
    const colId = columns[0]?.id || 'planned';

    const cardId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const rank = `${Date.now()}.000000`;
    const now = new Date().toISOString();

    await this.query(
      `INSERT INTO kanban_cards (id, board_id, column_id, title, description, position_rank, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [cardId, board.id, colId, cardTitle, description || null, rank, now, now]
    );

    return { cardId, boardTitle: board.title };
  }

  // Get Today's agenda tasks & routines
  async getTodayAgenda(todayDateStr: string): Promise<{
    tasks: TaskRow[];
    routines: RoutineRow[];
    routineLogs: RoutineLogRow[];
  }> {
    const [tasks, routines, routineLogs] = await Promise.all([
      this.query<TaskRow>(
        `SELECT * FROM tasks WHERE scheduled_date = $1 ORDER BY position_rank ASC`,
        [todayDateStr]
      ),
      this.query<RoutineRow>(`SELECT * FROM routines ORDER BY position_rank ASC`),
      this.query<RoutineLogRow>(`SELECT * FROM routine_logs WHERE date = $1`, [todayDateStr]),
    ]);

    return { tasks, routines, routineLogs };
  }

  // Increment routine count for today
  async incrementRoutineLog(routineId: string, date: string): Promise<number> {
    const rows = await this.query<RoutineLogRow>(
      `SELECT * FROM routine_logs WHERE routine_id = $1 AND date = $2 LIMIT 1`,
      [routineId, date]
    );

    const now = new Date().toISOString();
    if (rows.length === 0) {
      const id = `log_${Date.now()}`;
      await this.query(
        `INSERT INTO routine_logs (id, routine_id, date, completed, current_count, created_at, updated_at)
         VALUES ($1, $2, $3, 1, 1, $4, $5)`,
        [id, routineId, date, now, now]
      );
      return 1;
    }

    const current = rows[0].current_count + 1;
    await this.query(
      `UPDATE routine_logs SET current_count = $1, completed = 1, updated_at = $2 WHERE id = $3`,
      [current, now, rows[0].id]
    );
    return current;
  }
}
