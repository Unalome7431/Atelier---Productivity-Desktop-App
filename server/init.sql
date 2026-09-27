-- =========================================================================
-- Atelier Personal Operating System — PostgreSQL Database Initialization Schema
-- =========================================================================

-- 1. Workspace Configuration & Device Binding
CREATE TABLE IF NOT EXISTS workspace_config (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL DEFAULT 'Creator',
    telegram_chat_id TEXT,
    telegram_bot_token TEXT,
    telegram_bot_username TEXT,
    pairing_code TEXT,
    pairing_code_expires_at TIMESTAMPTZ,
    pomodoro_focus_mins INT DEFAULT 25,
    pomodoro_short_break_mins INT DEFAULT 5,
    pomodoro_long_break_mins INT DEFAULT 15,
    pomodoro_daily_target INT DEFAULT 4,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default workspace config if empty
INSERT INTO workspace_config (id, user_name, created_at, updated_at)
VALUES ('cfg_default', 'Creator', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Habits / Routines
CREATE TABLE IF NOT EXISTS routines (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cadence TEXT NOT NULL DEFAULT 'daily',
    custom_days JSONB DEFAULT '[]'::jsonb,
    target_count INT DEFAULT 1,
    position_rank TEXT NOT NULL DEFAULT '0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Routine Logs
CREATE TABLE IF NOT EXISTS routine_logs (
    id TEXT PRIMARY KEY,
    routine_id TEXT REFERENCES routines(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    current_count INT DEFAULT 0,
    completed_at TIMESTAMPTZ,
    UNIQUE(routine_id, date)
);

-- 4. Tasks (Cockpit & Inbox)
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category_tag TEXT,
    icon_type TEXT,
    scheduled_date DATE,
    status TEXT NOT NULL DEFAULT 'todo',
    position_rank TEXT NOT NULL DEFAULT '0',
    subtasks JSONB DEFAULT '[]'::jsonb,
    pomodoro_cycles_completed INT DEFAULT 0,
    pomodoro_cycles_estimated INT DEFAULT 1,
    kanban_card_id TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Kanban Boards & Cards
CREATE TABLE IF NOT EXISTS kanban_boards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    color_tag TEXT,
    linked_canvas_id TEXT,
    linked_canvas_title TEXT,
    position_rank TEXT NOT NULL,
    columns_config JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kanban_cards (
    id TEXT PRIMARY KEY,
    board_id TEXT REFERENCES kanban_boards(id) ON DELETE CASCADE,
    column_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    domain_tag TEXT,
    position_rank TEXT NOT NULL,
    checklist JSONB DEFAULT '[]'::jsonb,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Spatial Canvases, Nodes, and Edges
CREATE TABLE IF NOT EXISTS canvases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Knowledge Notes
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    folder TEXT,
    category_color TEXT,
    canvas_id TEXT,
    canvas_title TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'focus',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    color_token TEXT,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
