export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_BOT_USERNAME?: string;
  DATABASE_URL?: string;
  WEBHOOK_SECRET?: string;
}

export interface WorkspaceConfigRow {
  id: string;
  user_name: string;
  telegram_chat_id: string | null;
  pairing_code: string | null;
  pairing_code_expires_at: string | null;
  pomodoro_focus_mins: number;
  pomodoro_daily_target: number;
}

export interface TaskRow {
  id: string;
  title: string;
  description?: string;
  category_tag?: string;
  scheduled_date?: string | null;
  status: 'todo' | 'done';
  position_rank: string;
  subtasks?: string;
}

export interface RoutineRow {
  id: string;
  title: string;
  description?: string;
  cadence: string;
  custom_days?: string;
  target_count: number;
  position_rank: string;
}

export interface RoutineLogRow {
  id: string;
  routine_id: string;
  date: string;
  completed: number;
  current_count: number;
}

export interface KanbanBoardRow {
  id: string;
  title: string;
  color_tag?: string;
}

export interface KanbanColumnRow {
  id: string;
  board_id: string;
  title: string;
  position_rank: string;
}

export interface KanbanCardRow {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description?: string;
  position_rank: string;
}
