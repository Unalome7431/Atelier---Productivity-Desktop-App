import { db } from '@/db/database';
import { syncService } from './syncService';
import { NoteDocument } from '@/types';

export class NoteService {
  async getNotes(): Promise<NoteDocument[]> {
    const notes = await db.select<any>('SELECT * FROM notes ORDER BY updated_at DESC');
    if (notes.length === 0) {
      return await this.seedDefaultNotes();
    }

    return notes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content_json,
      category: n.folder,
      tags: n.category_color ? [n.category_color] : ['#general'],
      isPinned: Boolean(n.folder === 'pinned'),
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }));
  }

  private async seedDefaultNotes(): Promise<NoteDocument[]> {
    const now = new Date().toISOString();
    const defaultNotes = [
      {
        id: 'n_arch',
        title: 'System Architecture & Offline Sync Protocol',
        content:
          'Atelier operates with a strict local-first architecture. Every action, routine check-in, task completion, and note edit writes immediately to the embedded SQLite database before broadcasting across the network.',
        folder: 'pinned',
        color: '#design',
      },
      {
        id: 'n_log',
        title: 'Weekly Studio Log',
        content: 'Key milestones achieved in Phase 1-3 layout & offline sync sprint...',
        folder: 'general',
        color: '#log',
      },
    ];

    for (const n of defaultNotes) {
      await db.execute(
        `INSERT INTO notes (id, title, content_json, folder, category_color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [n.id, n.title, n.content, n.folder, n.color, now, now]
      );
    }

    return await this.getNotes();
  }

  async createNote(title: string, content = ''): Promise<NoteDocument> {
    const id = `n_${Date.now()}`;
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO notes (id, title, content_json, folder, category_color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, title, content, 'general', '#general', now, now]
    );

    const note: NoteDocument = {
      id,
      title,
      content,
      tags: ['#general'],
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    };

    await syncService.enqueueMutation('notes', id, 'INSERT', note);
    return note;
  }
}

export const noteService = new NoteService();
