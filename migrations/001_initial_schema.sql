-- ========================================================================
-- ATELIER PRODUCTIVITY DESKTOP APP — POSTGRESQL CLOUD SCHEMA
-- Reference: PRD.md §6.1
-- Compatible with Supabase / Neon / Self-Hosted PostgreSQL
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Workspace Configuration (Single-Tenant Cloud Profile)
CREATE TABLE IF NOT EXISTS workspace_config (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL DEFAULT 'Creator',
    telegram_chat_id TEXT,
    pairing_code TEXT,
    pairing_code_expires_at TIMESTAMPTZ,
    theme TEXT DEFAULT 'parchment',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Routines (Daily Habits / Disciplines)
CREATE TABLE IF NOT EXISTS routines (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT '#general',
    cadence TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekdays', 'custom'
    custom_days JSONB DEFAULT '[]'::jsonb, -- e.g., [1, 3, 5] for Mon/Wed/Fri
    icon TEXT,
    color TEXT,
    position_rank TEXT NOT NULL DEFAULT '0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Routine Daily Logs
CREATE TABLE IF NOT EXISTS routine_logs (
    id TEXT PRIMARY KEY,
    routine_id TEXT REFERENCES routines(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    UNIQUE(routine_id, date)
);

-- 4. Tasks (Daily Queue & Backlog Inbox)
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'done', 'canceled'
    position_rank TEXT NOT NULL DEFAULT '0',
    scheduled_date DATE,
    scheduled_start_time TIME,
    scheduled_end_time TIME,
    kanban_card_id TEXT,
    category_tag TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Kanban Boards & Cards
CREATE TABLE IF NOT EXISTS kanban_boards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    color_tag TEXT,
    position_rank TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kanban_cards (
    id TEXT PRIMARY KEY,
    board_id TEXT REFERENCES kanban_boards(id) ON DELETE CASCADE,
    column_id TEXT NOT NULL, -- 'planned', 'in_progress', 'review', 'done'
    title TEXT NOT NULL,
    description TEXT,
    tag_label TEXT,
    tag_color TEXT,
    position_rank TEXT NOT NULL, -- fractional indexing key (Lexorank)
    checklist JSONB DEFAULT '[]'::jsonb,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Canvases, Nodes, and Edges
CREATE TABLE IF NOT EXISTS canvases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canvas_nodes (
    id TEXT PRIMARY KEY,
    canvas_id TEXT REFERENCES canvases(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'simple_text', 'note', 'kanban', 'media', 'section'
    position_x REAL NOT NULL,
    position_y REAL NOT NULL,
    width REAL,
    height REAL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canvas_edges (
    id TEXT PRIMARY KEY,
    canvas_id TEXT REFERENCES canvases(id) ON DELETE CASCADE,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    source_handle TEXT,
    target_handle TEXT,
    label TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Knowledge Notes
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content_json JSONB DEFAULT '{}'::jsonb,
    folder TEXT,
    category_color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Calendar Events (Internal Time-Blocking)
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    event_type TEXT NOT NULL DEFAULT 'focus_block', -- 'meeting', 'focus_block', 'reminder'
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    color_token TEXT,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Cloud Mutation Stream Log
CREATE TABLE IF NOT EXISTS cloud_mutation_log (
    mutation_id TEXT PRIMARY KEY,
    entity_table TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
