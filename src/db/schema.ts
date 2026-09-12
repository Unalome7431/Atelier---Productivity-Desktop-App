export const SQLITE_SCHEMA_QUERIES = [
  // 1. Workspace Config
  `CREATE TABLE IF NOT EXISTS workspace_config (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL DEFAULT 'Creator',
    telegram_chat_id TEXT,
    pairing_code TEXT,
    pairing_code_expires_at TEXT,
    theme TEXT DEFAULT 'parchment',
    pomodoro_focus_mins INTEGER DEFAULT 25,
    pomodoro_break_mins INTEGER DEFAULT 5,
    pomodoro_long_break_mins INTEGER DEFAULT 15,
    pomodoro_daily_target INTEGER DEFAULT 4,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 2. Routines (Daily Habits)
  `CREATE TABLE IF NOT EXISTS routines (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT '',
    cadence TEXT NOT NULL DEFAULT 'daily',
    custom_days TEXT DEFAULT '[]',
    icon TEXT,
    color TEXT,
    target_count INTEGER DEFAULT 1,
    position_rank TEXT NOT NULL DEFAULT '0',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 3. Routine Daily Logs
  `CREATE TABLE IF NOT EXISTS routine_logs (
    id TEXT PRIMARY KEY,
    routine_id TEXT NOT NULL,
    date TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    current_count INTEGER DEFAULT 0,
    completed_at TEXT,
    FOREIGN KEY(routine_id) REFERENCES routines(id) ON DELETE CASCADE,
    UNIQUE(routine_id, date)
  );`,

  // 4. Tasks (Daily & Inbox)
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    position_rank TEXT NOT NULL DEFAULT '0',
    scheduled_date TEXT,
    kanban_card_id TEXT,
    category_tag TEXT DEFAULT '',
    icon_type TEXT DEFAULT 'default',
    subtasks TEXT DEFAULT '[]',
    pomodoro_cycles_completed INTEGER DEFAULT 0,
    pomodoro_cycles_estimated INTEGER DEFAULT 1,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 5. Kanban Boards & Cards
  `CREATE TABLE IF NOT EXISTS kanban_boards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    color_tag TEXT,
    position_rank TEXT NOT NULL DEFAULT '0',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS kanban_cards (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    column_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag_label TEXT,
    tag_color TEXT,
    position_rank TEXT NOT NULL DEFAULT '0',
    checklist TEXT DEFAULT '[]',
    due_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(board_id) REFERENCES kanban_boards(id) ON DELETE CASCADE
  );`,

  // 6. Canvases, Nodes, and Edges
  `CREATE TABLE IF NOT EXISTS canvases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    viewport TEXT DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS canvas_nodes (
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL,
    type TEXT NOT NULL,
    position_x REAL NOT NULL,
    position_y REAL NOT NULL,
    width REAL,
    height REAL,
    data TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL,
    FOREIGN KEY(canvas_id) REFERENCES canvases(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS canvas_edges (
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    source_handle TEXT,
    target_handle TEXT,
    label TEXT,
    data TEXT DEFAULT '{}',
    updated_at TEXT NOT NULL,
    FOREIGN KEY(canvas_id) REFERENCES canvases(id) ON DELETE CASCADE
  );`,

  // 7. Knowledge Notes
  `CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content_json TEXT DEFAULT '{}',
    folder TEXT,
    category_color TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // 8. Calendar Events
  `CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'focus_block',
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    color_token TEXT,
    task_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE SET NULL
  );`,

  // 9. Local Sync Queue
  `CREATE TABLE IF NOT EXISTS client_sync_queue (
    mutation_id TEXT PRIMARY KEY,
    entity_table TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    synced_at TEXT
  );`,
];
