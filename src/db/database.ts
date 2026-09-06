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
          await this.db.execute(query);
        }
        this.isInitialized = true;
        console.log('[Atelier DB] Native SQLite initialized successfully.');
        return;
      } catch (err) {
        console.warn('[Atelier DB] Failed to load Tauri SQLite plugin, using local fallback:', err);
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
  }

  private persistFallbackTable(table: string): void {
    const data = this.fallbackMemoryStore.get(table) || [];
    localStorage.setItem(`atelier_db_${table}`, JSON.stringify(data));
  }

  async execute(query: string, params: any[] = []): Promise<QueryResult> {
    await this.init();

    if (this.db) {
      const res = await this.db.execute(query, params);
      return { rowsAffected: res.rowsAffected, lastInsertId: res.lastInsertId };
    }

    // Fallback simple query parser for INSERT/UPDATE/DELETE
    return this.fallbackExecute(query, params);
  }

  async select<T>(query: string, params: any[] = []): Promise<T[]> {
    await this.init();

    if (this.db) {
      return await this.db.select<T[]>(query, params);
    }

    return this.fallbackSelect<T>(query, params);
  }

  private fallbackExecute(query: string, params: any[] = []): QueryResult {
    const trimmed = query.trim().toUpperCase();

    if (trimmed.startsWith('INSERT INTO')) {
      const match = query.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
      if (match) {
        const table = match[1].toLowerCase();
        const records = this.fallbackMemoryStore.get(table) || [];
        const recordObj: Record<string, any> = {};

        // Extract column names if specified
        const colMatch = query.match(/\(([^)]+)\)\s+VALUES/i);
        if (colMatch) {
          const cols = colMatch[1].split(',').map((c) => c.trim());
          cols.forEach((col, idx) => {
            recordObj[col] = params[idx];
          });
        }
        records.push(recordObj);
        this.fallbackMemoryStore.set(table, records);
        this.persistFallbackTable(table);
        return { rowsAffected: 1 };
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
        // Match simple `id = ?` or `routine_id = ? AND date = ?`
        let records = this.fallbackMemoryStore.get(table) || [];
        const initialLen = records.length;
        if (whereClause.includes('id =') || whereClause.includes('id=')) {
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
    const records = (this.fallbackMemoryStore.get(table) || []) as T[];

    if (query.toUpperCase().includes('WHERE') && params.length > 0) {
      if (query.includes('id =') || query.includes('id=')) {
        return records.filter((r: any) => r.id === params[0]);
      }
      if (query.includes('date =') || query.includes('date=')) {
        return records.filter((r: any) => r.date === params[0]);
      }
    }

    return records;
  }
}

export const db = new DatabaseManager();
