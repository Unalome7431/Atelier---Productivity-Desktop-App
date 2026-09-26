import Database from '@tauri-apps/plugin-sql';
import { SQLITE_SCHEMA_QUERIES } from './schema';

export interface QueryResult {
  rowsAffected: number;
  lastInsertId?: number;
}

class DatabaseManager {
  private db: Database | null = null;
  private isInitialized = false;
  private isTauriAvailable = false;
  private fallbackMemoryStore: Map<string, any[]> = new Map();

  constructor() {
    this.isTauriAvailable = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    if (this.isTauriAvailable) {
      try {
        this.db = await Database.load('sqlite:atelier.db');
        for (const query of SQLITE_SCHEMA_QUERIES) {
          try {
            await this.db.execute(query);
          } catch (qErr) {
            console.warn('[Atelier DB] Schema creation query warning:', qErr);
          }
        }

        // Safe column additions for existing local SQLite databases
        const safeColumnMigrations = [
          'ALTER TABLE routines ADD COLUMN target_count INTEGER DEFAULT 1;',
          'ALTER TABLE routine_logs ADD COLUMN current_count INTEGER DEFAULT 0;',
          'ALTER TABLE tasks ADD COLUMN subtasks TEXT DEFAULT "[]";',
          'ALTER TABLE tasks ADD COLUMN icon_type TEXT DEFAULT "default";',
          'ALTER TABLE tasks ADD COLUMN pomodoro_cycles_completed INTEGER DEFAULT 0;',
          'ALTER TABLE tasks ADD COLUMN pomodoro_cycles_estimated INTEGER DEFAULT 1;',
          'ALTER TABLE workspace_config ADD COLUMN pomodoro_focus_mins INTEGER DEFAULT 25;',
          'ALTER TABLE workspace_config ADD COLUMN pomodoro_break_mins INTEGER DEFAULT 5;',
          'ALTER TABLE workspace_config ADD COLUMN pomodoro_long_break_mins INTEGER DEFAULT 15;',
          'ALTER TABLE workspace_config ADD COLUMN pomodoro_daily_target INTEGER DEFAULT 4;',
          'ALTER TABLE kanban_cards ADD COLUMN checklist TEXT DEFAULT "[]";',
          'ALTER TABLE kanban_cards ADD COLUMN due_date TEXT;',
          'ALTER TABLE kanban_cards ADD COLUMN tag_label TEXT;',
          'ALTER TABLE kanban_cards ADD COLUMN tag_color TEXT;',
          'ALTER TABLE kanban_cards ADD COLUMN comments_count INTEGER DEFAULT 0;',
          'ALTER TABLE kanban_cards ADD COLUMN completed_at TEXT;',
          'ALTER TABLE kanban_boards ADD COLUMN color_tag TEXT;',
          'ALTER TABLE kanban_boards ADD COLUMN linked_canvas_id TEXT;',
          'ALTER TABLE kanban_boards ADD COLUMN linked_canvas_title TEXT;',
          'ALTER TABLE kanban_boards ADD COLUMN columns_config TEXT DEFAULT "[]";',
          'ALTER TABLE notes ADD COLUMN canvas_id TEXT;',
          'ALTER TABLE notes ADD COLUMN canvas_title TEXT;',
          'ALTER TABLE notes ADD COLUMN is_pinned INTEGER DEFAULT 0;',
        ];
        for (const migration of safeColumnMigrations) {
          try {
            await this.db.execute(migration);
          } catch {
            // Column already exists, safe to ignore
          }
        }

        // Purge legacy system default tags so user has 100% custom tag control
        try {
          await this.db.execute(
            `UPDATE kanban_cards SET tag_label = NULL, tag_color = NULL WHERE LOWER(tag_label) IN ('docs', 'design', 'engineering', 'research', 'qa', 'content', 'backend')`
          );
          await this.db.execute(
            `UPDATE notes SET folder = NULL WHERE LOWER(folder) IN ('architecture', 'engineering', 'guides', 'studio logs', 'general', 'pinned')`
          );
        } catch {
          // ignore
        }

        this.isInitialized = true;
        console.log('[Atelier DB] Native SQLite initialized successfully.');
        return;
      } catch (err) {
        console.warn('[Atelier DB] Failed to load Tauri SQLite plugin, using local fallback:', err);
        this.db = null;
      }
    }

    // Web Fallback Initializer
    this.initFallbackStorage();
    this.isInitialized = true;
    console.log('[Atelier DB] Web Storage DB engine initialized.');
  }

  private initFallbackStorage(): void {
    const tables = [
      'workspace_config',
      'routines',
      'routine_logs',
      'tasks',
      'kanban_boards',
      'kanban_cards',
      'canvases',
      'canvas_nodes',
      'canvas_edges',
      'notes',
      'calendar_events',
      'client_sync_queue',
    ];

    for (const table of tables) {
      const stored = localStorage.getItem(`atelier_db_${table}`);
      if (stored) {
        try {
          this.fallbackMemoryStore.set(table, JSON.parse(stored));
        } catch {
          this.fallbackMemoryStore.set(table, []);
        }
      } else {
        this.fallbackMemoryStore.set(table, []);
      }
    }

    // Clean up any legacy default tags from stored kanban cards in web fallback
    const legacyDefaultTagNames = new Set([
      'docs',
      'design',
      'engineering',
      'research',
      'qa',
      'content',
      'backend',
    ]);
    const kanbanCards = this.fallbackMemoryStore.get('kanban_cards') || [];
    let cardsUpdated = false;
    for (const c of kanbanCards) {
      if (c.tag_label && legacyDefaultTagNames.has(String(c.tag_label).toLowerCase())) {
        c.tag_label = null;
        c.tag_color = null;
        cardsUpdated = true;
      }
    }
    if (cardsUpdated) {
      this.persistFallbackTable('kanban_cards');
    }

    // Clean up any legacy default folders from stored notes in web fallback
    const legacyFolderNames = new Set([
      'architecture',
      'engineering',
      'guides',
      'studio logs',
      'general',
      'pinned',
    ]);
    const storedNotes = this.fallbackMemoryStore.get('notes') || [];
    let notesUpdated = false;
    for (const n of storedNotes) {
      if (n.folder && legacyFolderNames.has(String(n.folder).toLowerCase())) {
        n.folder = null;
        notesUpdated = true;
      }
    }
    if (notesUpdated) {
      this.persistFallbackTable('notes');
    }
  }

  private persistFallbackTable(table: string): void {
    try {
      const data = this.fallbackMemoryStore.get(table) || [];
      localStorage.setItem(`atelier_db_${table}`, JSON.stringify(data));
    } catch (storageErr) {
      console.warn(`[Atelier DB] Failed to persist table "${table}" to localStorage:`, storageErr);
    }
  }

  async execute(query: string, params: any[] = []): Promise<QueryResult> {
    await this.init();

    if (this.db) {
      try {
        const res = await this.db.execute(query, params);
        return { rowsAffected: res.rowsAffected, lastInsertId: res.lastInsertId };
      } catch (sqlErr) {
        console.warn('[Atelier DB] SQLite execute failed, running memory fallback:', sqlErr, query);
      }
    }

    // Fallback simple query parser for INSERT/UPDATE/DELETE
    return this.fallbackExecute(query, params);
  }

  async select<T>(query: string, params: any[] = []): Promise<T[]> {
    await this.init();

    if (this.db) {
      try {
        return await this.db.select<T[]>(query, params);
      } catch (sqlErr) {
        console.warn('[Atelier DB] SQLite select failed, running memory fallback:', sqlErr, query);
      }
    }

    return this.fallbackSelect<T>(query, params);
  }

  private fallbackExecute(query: string, params: any[] = []): QueryResult {
    const trimmed = query.trim().toUpperCase();

    if (trimmed.startsWith('INSERT')) {
      // Handles INSERT INTO and INSERT OR IGNORE / OR REPLACE
      const match = query.match(/INSERT(?:\s+OR\s+(?:IGNORE|REPLACE))?\s+INTO\s+([a-zA-Z0-9_]+)/i);
      if (match) {
        const table = match[1].toLowerCase();
        const isOrReplace = /INSERT\s+OR\s+REPLACE/i.test(query);
        const records = this.fallbackMemoryStore.get(table) || [];
        const recordObj: Record<string, any> = {};

        const colMatch = query.match(/\(([^)]+)\)\s+VALUES/i);
        if (colMatch) {
          const cols = colMatch[1].split(',').map((c) => c.trim());
          cols.forEach((col, idx) => {
            recordObj[col] = params[idx];
          });
        }

        // Enforce PRIMARY KEY-like uniqueness on `id` and `mutation_id`
        const pk = recordObj['id'] ?? recordObj['mutation_id'];
        if (pk !== undefined) {
          const pkField = recordObj['id'] !== undefined ? 'id' : 'mutation_id';
          const existingIdx = records.findIndex((r: any) => r[pkField] === pk);
          if (existingIdx !== -1) {
            if (isOrReplace) {
              records[existingIdx] = { ...records[existingIdx], ...recordObj };
              this.fallbackMemoryStore.set(table, records);
              this.persistFallbackTable(table);
              return { rowsAffected: 1 };
            }
            // OR IGNORE or plain INSERT → do not duplicate (mimics PK constraint)
            return { rowsAffected: 0 };
          }
        }

        records.push(recordObj);
        this.fallbackMemoryStore.set(table, records);
        this.persistFallbackTable(table);
        return { rowsAffected: 1 };
      }
    }

    if (trimmed.startsWith('UPDATE')) {
      const match = query.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)\s+WHERE\s+([\s\S]+)/i);
      if (match) {
        const table = match[1].toLowerCase();
        const setClause = match[2];
        const whereClause = match[3];
        const records = this.fallbackMemoryStore.get(table) || [];
        const setAssignments = setClause.split(',').map((s) => {
          const parts = s.trim().split(/\s*=\s*/);
          return { col: parts[0].trim(), valExpr: (parts[1] || '').trim() };
        });

        let pIdx = 0;
        const colSetters: { col: string; getVal: () => any }[] = [];
        for (const a of setAssignments) {
          if (a.valExpr === '?') {
            const val = params[pIdx++];
            colSetters.push({ col: a.col, getVal: () => val });
          } else if (a.valExpr.toUpperCase() === 'NULL') {
            colSetters.push({ col: a.col, getVal: () => null });
          } else {
            colSetters.push({ col: a.col, getVal: () => a.valExpr });
          }
        }
        const whereParams = params.slice(pIdx);

        let affected = 0;
        for (const r of records) {
          let matches = false;
          if (whereClause.includes('mutation_id =') || whereClause.includes('mutation_id=')) {
            matches = r.mutation_id === whereParams[0];
          } else if (whereClause.includes('routine_id =') && whereClause.includes('date =')) {
            matches = r.routine_id === whereParams[0] && r.date === whereParams[1];
          } else if (whereClause.includes('board_id =') && whereClause.includes('column_id =')) {
            matches = r.board_id === whereParams[0] && r.column_id === whereParams[1];
          } else if (whereClause.includes('board_id =') || whereClause.includes('board_id=')) {
            matches = r.board_id === whereParams[0];
          } else if (whereClause.includes('column_id =') || whereClause.includes('column_id=')) {
            matches = r.column_id === whereParams[0];
          } else if (/\bid\s*=/i.test(whereClause)) {
            matches = r.id === whereParams[0];
          }
          if (matches) {
            colSetters.forEach((setter) => {
              r[setter.col] = setter.getVal();
            });
            affected++;
          }
        }
        if (affected > 0) this.persistFallbackTable(table);
        return { rowsAffected: affected };
      }
    }

    if (trimmed.startsWith('DELETE FROM')) {
      const match = query.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?/i);
      if (match) {
        const table = match[1].toLowerCase();
        const whereClause = match[2];
        if (!whereClause) {
          this.fallbackMemoryStore.set(table, []);
          this.persistFallbackTable(table);
          return { rowsAffected: 1 };
        }
        let records = this.fallbackMemoryStore.get(table) || [];
        const initialLen = records.length;
        if (whereClause.includes('routine_id =') && whereClause.includes('date =')) {
          records = records.filter((r) => !(r.routine_id === params[0] && r.date === params[1]));
        } else if (whereClause.includes('mutation_id =') || whereClause.includes('mutation_id=')) {
          records = records.filter((r) => r.mutation_id !== params[0]);
        } else if (whereClause.includes('canvas_id =') || whereClause.includes('canvas_id=')) {
          records = records.filter((r) => r.canvas_id !== params[0]);
        } else if (whereClause.includes('board_id =') || whereClause.includes('board_id=')) {
          records = records.filter((r) => r.board_id !== params[0]);
        } else if (whereClause.includes('id =') || whereClause.includes('id=')) {
          records = records.filter((r) => r.id !== params[0]);
        }
        this.fallbackMemoryStore.set(table, records);
        this.persistFallbackTable(table);
        return { rowsAffected: initialLen - records.length };
      }
    }

    return { rowsAffected: 1 };
  }

  private fallbackSelect<T>(query: string, params: any[] = []): T[] {
    const match = query.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!match) return [];

    const table = match[1].toLowerCase();
    let records = [...((this.fallbackMemoryStore.get(table) || []) as any[])];

    // De-duplicate by primary key (id / mutation_id) — guards against legacy duplicates
    const seen = new Set<string>();
    const deduped: any[] = [];
    for (const r of records) {
      const pk = r.id ?? r.mutation_id;
      if (pk !== undefined) {
        if (seen.has(String(pk))) continue;
        seen.add(String(pk));
      }
      deduped.push(r);
    }
    records = deduped;

    // Apply WHERE filtering
    const upper = query.toUpperCase();
    if (upper.includes('WHERE')) {
      if (query.includes('synced_at IS NULL')) {
        records = records.filter((r: any) => r.synced_at === null || r.synced_at === undefined);
      } else if (query.includes('scheduled_date IS NULL')) {
        records = records.filter(
          (r: any) =>
            r.scheduled_date === null || r.scheduled_date === undefined || r.scheduled_date === ''
        );
      } else if (query.includes('routine_id =') && query.includes('date =') && params.length >= 2) {
        records = records.filter((r: any) => r.routine_id === params[0] && r.date === params[1]);
      } else if (
        (query.includes('mutation_id =') || query.includes('mutation_id=')) &&
        params.length > 0
      ) {
        records = records.filter((r: any) => r.mutation_id === params[0]);
      } else if (
        query.includes('board_id =') &&
        query.includes('column_id =') &&
        params.length >= 2
      ) {
        records = records.filter((r: any) => r.board_id === params[0] && r.column_id === params[1]);
      } else if (
        (query.includes('board_id =') || query.includes('board_id=')) &&
        params.length > 0
      ) {
        records = records.filter((r: any) => r.board_id === params[0]);
      } else if (
        (query.includes('canvas_id =') || query.includes('canvas_id=')) &&
        params.length > 0
      ) {
        records = records.filter((r: any) => r.canvas_id === params[0]);
      } else if (
        query.includes('scheduled_date =') &&
        query.includes('OR scheduled_date IS NULL') &&
        params.length > 0
      ) {
        records = records.filter(
          (r: any) =>
            r.scheduled_date === params[0] || r.scheduled_date == null || r.scheduled_date === ''
        );
      } else if (
        (query.includes('scheduled_date =') || query.includes('scheduled_date=')) &&
        params.length > 0
      ) {
        records = records.filter((r: any) => r.scheduled_date === params[0]);
      } else if ((query.includes('id =') || query.includes('id=')) && params.length > 0) {
        records = records.filter((r: any) => r.id === params[0]);
      } else if ((query.includes('date =') || query.includes('date=')) && params.length > 0) {
        records = records.filter((r: any) => r.date === params[0]);
      }
    }

    // Apply ORDER BY (supports updated_at, created_at, position_rank, created_at ASC)
    if (upper.includes('ORDER BY')) {
      const orderMatch = query.match(/ORDER BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?/i);
      if (orderMatch) {
        const col = orderMatch[1].toLowerCase();
        const dir = (orderMatch[2] || 'ASC').toUpperCase();
        records.sort((a: any, b: any) => {
          const av = a[col] ?? '';
          const bv = b[col] ?? '';
          if (col === 'position_rank') {
            const numA = Number(av);
            const numB = Number(bv);
            if (!isNaN(numA) && !isNaN(numB)) {
              return dir === 'ASC' ? numA - numB : numB - numA;
            }
          }
          if (av < bv) return dir === 'ASC' ? -1 : 1;
          if (av > bv) return dir === 'ASC' ? 1 : -1;
          return 0;
        });
      }
    }

    // Apply LIMIT (e.g. LIMIT 1)
    if (upper.includes('LIMIT')) {
      const limitMatch = query.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        const lim = parseInt(limitMatch[1], 10);
        if (!isNaN(lim) && lim >= 0) {
          records = records.slice(0, lim);
        }
      }
    }

    return records as T[];
  }
}

export const db = new DatabaseManager();
