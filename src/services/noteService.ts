import { db } from '@/db/database';
import { syncService } from './syncService';
import { NoteDocument } from '@/types';

export class NoteService {
  private seedingPromise: Promise<void> | null = null;

  async getNotes(): Promise<NoteDocument[]> {
    const notes = await db.select<any>('SELECT * FROM notes ORDER BY updated_at DESC');
    if (notes.length === 0) {
      // Guard against StrictMode double-invoke / concurrent callers racing on empty DB
      if (!this.seedingPromise) {
        this.seedingPromise = this.seedDefaultNotes().finally(() => {
          this.seedingPromise = null;
        });
      }
      await this.seedingPromise;
      // Re-read after seed (avoids recursion race)
      const seeded = await db.select<any>('SELECT * FROM notes ORDER BY updated_at DESC');
      return this.mapRows(seeded);
    }

    return this.mapRows(notes);
  }

  private mapRows(rows: any[]): NoteDocument[] {
    // De-duplicate by id and keep newest updated_at — guards legacy duplicates in fallback localStorage
    const byId = new Map<string, any>();
    for (const n of rows) {
      const existing = byId.get(n.id);
      if (!existing || (n.updated_at ?? '') > (existing.updated_at ?? '')) {
        byId.set(n.id, n);
      }
    }
    return [...byId.values()]
      .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
      .map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content_json,
        category: n.folder,
        tags: [],
        isPinned: Boolean(n.folder === 'pinned'),
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      }));
  }

  private async seedDefaultNotes(): Promise<void> {
    const now = new Date().toISOString();
    const defaultNotes = [
      {
        id: 'n_arch',
        title: 'System Architecture & Offline Sync Protocol',
        content:
          'Atelier operates with a strict local-first architecture. Every action, routine check-in, task completion, and note edit writes immediately to the embedded SQLite database before broadcasting across the network.',
        folder: 'pinned',
        color: null,
      },
      {
        id: 'n_log',
        title: 'Weekly Studio Log',
        content: 'Key milestones achieved in Phase 1-3 layout & offline sync sprint...',
        folder: 'general',
        color: null,
      },
    ];

    for (const n of defaultNotes) {
      await db.execute(
        `INSERT OR IGNORE INTO notes (id, title, content_json, folder, category_color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [n.id, n.title, n.content, n.folder, n.color, now, now]
      );
    }
  }

  async createNote(title: string, content = ''): Promise<NoteDocument> {
    const id = `n_${Date.now()}`;
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO notes (id, title, content_json, folder, category_color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, title, content, 'general', null, now, now]
    );

    const note: NoteDocument = {
      id,
      title,
      content,
      tags: [],
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    };

    await syncService.enqueueMutation('notes', id, 'INSERT', note);
    return note;
  }
}

export const noteService = new NoteService();
