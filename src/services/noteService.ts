import { db } from '@/db/database';
import { syncService } from './syncService';
import { NoteDocument, BacklinkItem } from '@/types';

export class NoteService {
  private seedingPromise: Promise<void> | null = null;

  async getNotes(): Promise<NoteDocument[]> {
    const notes = await db.select<any>('SELECT * FROM notes ORDER BY updated_at DESC');
    if (notes.length === 0) {
      if (!this.seedingPromise) {
        this.seedingPromise = this.seedDefaultNotes().finally(() => {
          this.seedingPromise = null;
        });
      }
      await this.seedingPromise;
      const seeded = await db.select<any>('SELECT * FROM notes ORDER BY updated_at DESC');
      return this.mapRows(seeded);
    }

    return this.mapRows(notes);
  }

  private mapRows(rows: any[]): NoteDocument[] {
    const byId = new Map<string, any>();
    for (const n of rows) {
      const existing = byId.get(n.id);
      if (!existing || (n.updated_at ?? '') > (existing.updated_at ?? '')) {
        byId.set(n.id, n);
      }
    }

    const legacyFolderNames = new Set([
      'architecture',
      'engineering',
      'guides',
      'studio logs',
      'general',
      'pinned',
    ]);

    return [...byId.values()]
      .sort((a, b) => {
        const aPinned = Number(a.is_pinned === 1 || a.is_pinned === true || a.folder === 'pinned');
        const bPinned = Number(b.is_pinned === 1 || b.is_pinned === true || b.folder === 'pinned');
        if (aPinned !== bPinned) return bPinned - aPinned;
        return (b.updated_at ?? '').localeCompare(a.updated_at ?? '');
      })
      .map((n) => {
        const rawFolder = n.folder ? String(n.folder).trim() : null;
        const cleanFolder =
          rawFolder && !legacyFolderNames.has(rawFolder.toLowerCase()) ? rawFolder : undefined;

        return {
          id: n.id,
          title: n.title,
          content: n.content_json || '',
          folder: cleanFolder,
          category: cleanFolder,
          categoryColor: n.category_color || '#EEEDFD',
          canvasId: n.canvas_id || undefined,
          canvasTitle: n.canvas_title || undefined,
          tags: [],
          isPinned: Boolean(n.is_pinned === 1 || n.is_pinned === true || n.folder === 'pinned'),
          createdAt: n.created_at,
          updatedAt: n.updated_at,
        };
      });
  }

  private async seedDefaultNotes(): Promise<void> {
    const now = new Date().toISOString();
    const defaultNotes = [
      {
        id: 'n_note_a',
        title: 'Note A',
        content: `
          <p>StudioFlow is designed as an integrated, low-latency operating environment for personal engineering sprints, daily habit consistency, and visual software architecture.</p>
          <h2>Objective</h2>
          <ul>
            <li>Unify daily task execution, spatial whiteboard planning, and long-term project roadmaps into a single desktop cockpit.</li>
            <li>Eliminate context switching between disjointed browser tabs, task managers, and documentation tools.</li>
            <li>Provide sub-16ms typing latency and 60 FPS spatial manipulation with offline-first local SQLite resilience.</li>
          </ul>
          <h2>Delivery scope</h2>
          <ul>
            <li>Embedded SQLite persistence engine paired with monotonic synchronization queue.</li>
            <li>Spatial canvas featuring multi-quadrant bezier connectors and reactive node boundaries.</li>
            <li>Long-term Kanban board engine utilizing fractional indexing (Lexorank) for zero-cascade reordering.</li>
          </ul>
          <div data-type="callout" data-callout-type="decision" data-eyebrow="DECISION RECORD · 04" data-title="Use typed resource envelopes for all MVP endpoints.">
            <p>Every response payload must conform to a versioned TypeScript schema with monotonic timestamping. This guarantees deterministic Last-Write-Wins (LWW) conflict resolution and eliminates ad-hoc payload normalization across client stores.</p>
          </div>
          <h2>Open questions</h2>
          <ul>
            <li>Evaluate Telegram Bot webhook delivery latency across Cloudflare Serverless edge workers.</li>
            <li>Determine optimal debouncing threshold for spatial canvas node dragging persistence (600ms vs 800ms).</li>
          </ul>
        `.trim(),
        folder: null,
        color: '#EEEDFD',
        canvasId: 'canvas_a',
        canvasTitle: 'CANVAS A',
        isPinned: 1,
      },
      {
        id: 'n_note_b',
        title: 'Note B',
        content: `
          <p>Detailed specification of the local SQLite storage engine, fallback web storage adapters, and background mutation queues.</p>
          <h2>Local-First Philosophy</h2>
          <ul>
            <li>Reads and writes hit embedded SQLite synchronously with 0ms UI latency.</li>
            <li>State updates are applied optimistically to client Zustand stores.</li>
          </ul>
          <div data-type="callout" data-callout-type="reference" data-eyebrow="REFERENCE" data-title="Last-Write-Wins (LWW) Protocol">
            <p>All remote mutations compare monotonic UTC ISO timestamps. Client edits override stale cloud records while preserving foreign key integrity.</p>
          </div>
        `.trim(),
        folder: null,
        color: '#D0F8E3',
        canvasId: 'canvas_b',
        canvasTitle: 'CANVAS B',
        isPinned: 0,
      },
      {
        id: 'n_note_c',
        title: 'Note C',
        content: `
          <p>Visual design contract rooted in Aura UI, soft minimalism, and warm parchment surfaces.</p>
          <h2>Zero-Emoji Policy</h2>
          <ul>
            <li>Strictly monochrome Lucide SVG icons across all views.</li>
            <li>No decorative hashtags or unconstrained system presets.</li>
          </ul>
          <div data-type="callout" data-callout-type="caution" data-eyebrow="CAUTION" data-title="Token Discipline">
            <p>Never use raw hex colors or arbitrary font families in component files. Always map to design tokens in STYLEGUIDE.md.</p>
          </div>
        `.trim(),
        folder: null,
        color: '#D7E3FF',
        canvasId: 'canvas_c',
        canvasTitle: 'CANVAS C',
        isPinned: 0,
      },
      {
        id: 'n_arch',
        title: 'System Architecture & Offline Sync Protocol',
        content:
          'Atelier operates with a strict local-first architecture. Every action, routine check-in, task completion, and note edit writes immediately to the embedded SQLite database before broadcasting across the network.',
        folder: null,
        color: '#EEEDFD',
        canvasId: 'canvas_a',
        canvasTitle: 'CANVAS A',
        isPinned: 0,
      },
      {
        id: 'n_log',
        title: 'Weekly Studio Log',
        content: 'Key milestones achieved in Phase 1-7 layout, canvas, and kanban sprints...',
        folder: null,
        color: '#F5F0E6',
        canvasId: undefined,
        canvasTitle: undefined,
        isPinned: 0,
      },
    ];

    for (const n of defaultNotes) {
      await db.execute(
        `INSERT OR IGNORE INTO notes (id, title, content_json, folder, category_color, canvas_id, canvas_title, is_pinned, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [n.id, n.title, n.content, n.folder, n.color, n.canvasId || null, n.canvasTitle || null, n.isPinned, now, now]
      );
    }
  }

  async createNote(params: {
    title: string;
    content?: string;
    folder?: string;
    categoryColor?: string;
    canvasId?: string;
    canvasTitle?: string;
    isPinned?: boolean;
  }): Promise<NoteDocument> {
    const id = `n_${Date.now()}`;
    const now = new Date().toISOString();
    const title = params.title.trim() || 'Untitled Note';
    const content = params.content || '';
    const folder = params.folder?.trim() || null;
    const color = params.categoryColor || '#EEEDFD';
    const canvasId = params.canvasId || null;
    const canvasTitle = params.canvasTitle || null;
    const isPinned = params.isPinned ? 1 : 0;

    await db.execute(
      `INSERT INTO notes (id, title, content_json, folder, category_color, canvas_id, canvas_title, is_pinned, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, content, folder, color, canvasId, canvasTitle, isPinned, now, now]
    );

    const note: NoteDocument = {
      id,
      title,
      content,
      folder: folder || undefined,
      category: folder || undefined,
      categoryColor: color,
      canvasId: canvasId || undefined,
      canvasTitle: canvasTitle || undefined,
      tags: [],
      isPinned: Boolean(isPinned),
      createdAt: now,
      updatedAt: now,
    };

    await syncService.enqueueMutation('notes', id, 'INSERT', note);
    return note;
  }

  async updateNote(id: string, updates: Partial<NoteDocument>): Promise<void> {
    const now = new Date().toISOString();
    const existingNotes = await db.select<any>('SELECT * FROM notes WHERE id = ?', [id]);
    if (existingNotes.length === 0) return;

    const current = existingNotes[0];
    const newTitle = updates.title !== undefined ? updates.title : current.title;
    const newContent = updates.content !== undefined ? updates.content : current.content_json;
    const newFolder = updates.folder !== undefined ? updates.folder : (updates.category !== undefined ? updates.category : current.folder);
    const newColor = updates.categoryColor !== undefined ? updates.categoryColor : current.category_color;
    const newCanvasId = updates.canvasId !== undefined ? (updates.canvasId || null) : current.canvas_id;
    const newCanvasTitle = updates.canvasTitle !== undefined ? (updates.canvasTitle || null) : current.canvas_title;
    const newIsPinned = updates.isPinned !== undefined ? (updates.isPinned ? 1 : 0) : current.is_pinned;

    await db.execute(
      `UPDATE notes SET 
        title = ?, 
        content_json = ?, 
        folder = ?, 
        category_color = ?, 
        canvas_id = ?, 
        canvas_title = ?, 
        is_pinned = ?, 
        updated_at = ? 
       WHERE id = ?`,
      [newTitle, newContent, newFolder, newColor, newCanvasId, newCanvasTitle, newIsPinned, now, id]
    );

    const updatedNote: NoteDocument = {
      id,
      title: newTitle,
      content: newContent,
      folder: newFolder,
      category: newFolder,
      categoryColor: newColor,
      canvasId: newCanvasId || undefined,
      canvasTitle: newCanvasTitle || undefined,
      tags: [],
      isPinned: Boolean(newIsPinned),
      createdAt: current.created_at,
      updatedAt: now,
    };

    await syncService.enqueueMutation('notes', id, 'UPDATE', updatedNote);
  }

  async deleteNote(id: string): Promise<void> {
    await db.execute('DELETE FROM notes WHERE id = ?', [id]);
    await syncService.enqueueMutation('notes', id, 'DELETE', { id });
  }

  async getBacklinks(noteId: string, noteTitle: string, noteCanvasId?: string): Promise<BacklinkItem[]> {
    const backlinks: BacklinkItem[] = [];
    const seenIds = new Set<string>();

    try {
      // 1. Fetch Canvases map
      const allCanvases = await db.select<any>('SELECT * FROM canvases');
      const canvasMap = new Map<string, string>();
      for (const c of allCanvases) {
        canvasMap.set(c.id, c.title);
      }

      // If note explicitly has canvasId, add direct canvas backlink
      if (noteCanvasId && !seenIds.has(`canvas_${noteCanvasId}`)) {
        seenIds.add(`canvas_${noteCanvasId}`);
        const cTitle = canvasMap.get(noteCanvasId) || (noteCanvasId === 'canvas_a' ? 'Canvas A' : 'Tethered Canvas');
        backlinks.push({
          id: `canvas_${noteCanvasId}`,
          type: 'canvas',
          title: cTitle,
          subtitle: 'Tethered Spatial Canvas',
          targetId: noteCanvasId,
          containerId: noteCanvasId,
        });
      }

      // 2. Check Canvas nodes referencing this note
      const canvasNodes = await db.select<any>('SELECT * FROM canvas_nodes');
      for (const node of canvasNodes) {
        let nodeData: any = {};
        try {
          nodeData = typeof node.data === 'string' ? JSON.parse(node.data) : (node.data || {});
        } catch {
          nodeData = {};
        }

        const isReference =
          nodeData.referenceId === noteId ||
          (nodeData.title && nodeData.title.toLowerCase() === noteTitle.toLowerCase());

        if (isReference && !seenIds.has(`canvas_${node.canvas_id}`)) {
          seenIds.add(`canvas_${node.canvas_id}`);
          const cTitle = canvasMap.get(node.canvas_id) || 'Spatial Canvas';
          backlinks.push({
            id: `canvas_${node.canvas_id}`,
            type: 'canvas',
            title: cTitle,
            subtitle: `Referenced in node "${nodeData.title || node.label || 'Note Card'}"`,
            targetId: node.canvas_id,
            containerId: node.canvas_id,
          });
        }
      }

      // 3. Check other notes mentioning this note
      const allNotes = await db.select<any>('SELECT * FROM notes WHERE id != ?', [noteId]);
      for (const otherNote of allNotes) {
        const text = otherNote.content_json || '';
        const mentionsId = text.includes(noteId);
        const mentionsTitle = text.includes(`@${noteTitle}`) || text.includes(`data-label="${noteTitle}"`);

        if ((mentionsId || mentionsTitle) && !seenIds.has(`note_${otherNote.id}`)) {
          seenIds.add(`note_${otherNote.id}`);
          backlinks.push({
            id: `note_${otherNote.id}`,
            type: 'note',
            title: otherNote.title,
            subtitle: `Folder: ${otherNote.folder || 'General'}`,
            targetId: otherNote.id,
            containerId: otherNote.id,
          });
        }
      }

      // 4. Check Kanban boards and cards
      const allBoards = await db.select<any>('SELECT * FROM kanban_boards');
      const boardMap = new Map<string, string>();
      for (const b of allBoards) {
        boardMap.set(b.id, b.title);
      }

      const cards = await db.select<any>('SELECT * FROM kanban_cards');
      for (const card of cards) {
        const text = `${card.title} ${card.description || ''}`;
        if (text.toLowerCase().includes(noteTitle.toLowerCase()) || text.includes(noteId)) {
          if (!seenIds.has(`card_${card.id}`)) {
            seenIds.add(`card_${card.id}`);
            const bTitle = boardMap.get(card.board_id) || 'Kanban Board';
            backlinks.push({
              id: `card_${card.id}`,
              type: 'kanban',
              title: card.title,
              subtitle: `Board: ${bTitle}`,
              targetId: card.id,
              containerId: card.board_id,
            });
          }
        }
      }

      // 5. Check Tasks
      const tasks = await db.select<any>('SELECT * FROM tasks');
      for (const task of tasks) {
        if (task.title.toLowerCase().includes(noteTitle.toLowerCase()) && !seenIds.has(`task_${task.id}`)) {
          seenIds.add(`task_${task.id}`);
          backlinks.push({
            id: `task_${task.id}`,
            type: 'task',
            title: task.title,
            subtitle: "Today's Tactical Queue",
            targetId: task.id,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching backlinks:', err);
    }

    return backlinks;
  }
}

export const noteService = new NoteService();
