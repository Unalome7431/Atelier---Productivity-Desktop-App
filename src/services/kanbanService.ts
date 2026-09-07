import { db } from '@/db/database';
import { syncService } from './syncService';
import { KanbanBoard, KanbanCard } from '@/types';

export class KanbanService {
  private seedingPromise: Promise<void> | null = null;

  async getBoards(): Promise<KanbanBoard[]> {
    const boards = await db.select<any>('SELECT * FROM kanban_boards ORDER BY position_rank ASC');
    if (boards.length === 0) {
      if (!this.seedingPromise) {
        this.seedingPromise = this.seedDefaultBoard().finally(() => {
          this.seedingPromise = null;
        });
      }
      await this.seedingPromise;
      return await this.fetchBoards();
    }

    return await this.fetchBoards();
  }

  private async fetchBoards(): Promise<KanbanBoard[]> {
    const boards = await db.select<any>('SELECT * FROM kanban_boards ORDER BY position_rank ASC');
    const cards = await db.select<any>('SELECT * FROM kanban_cards ORDER BY position_rank ASC');
    const columns = [
      { id: 'planned', title: 'Planned', colorAccent: '#FCFCE8', orderIndex: 0 },
      { id: 'in_progress', title: 'In Progress', colorAccent: '#EBE7FF', orderIndex: 1 },
      { id: 'review', title: 'Review', colorAccent: '#EBE9FE', orderIndex: 2 },
      { id: 'done', title: 'Done', colorAccent: '#D1FAE5', orderIndex: 3 },
    ];

    return boards.map((b) => ({
      id: b.id,
      title: b.title,
      columns,
      cards: cards
        .filter((c) => c.board_id === b.id)
        .map((c) => ({
          id: c.id,
          columnId: c.column_id,
          title: c.title,
          description: c.description,
          tags: c.tag_label ? [c.tag_label] : [],
          dueDate: c.due_date,
          orderIndex: parseInt(c.position_rank || '0', 10),
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        })),
    }));
  }

  private async seedDefaultBoard(): Promise<void> {
    const boardId = 'board_default';
    const now = new Date().toISOString();

    await db.execute(
      `INSERT OR IGNORE INTO kanban_boards (id, title, color_tag, position_rank, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [boardId, 'Productivity OS Roadmap', '#8E677E', '0', now, now]
    );

    const defaultCards = [
      {
        id: 'c1',
        column_id: 'planned',
        title: 'Telegram Serverless Webhook Bot',
        tag: '#research',
        desc: 'Explore grammY edge runtime on Cloudflare Workers',
      },
      {
        id: 'c2',
        column_id: 'in_progress',
        title: 'Desktop Foundation & Data Layer',
        tag: '#core',
        desc: 'Phase 1-3 setup with Tauri, SQLite & Sync Engine',
      },
      {
        id: 'c3',
        column_id: 'done',
        title: 'PRD & Styleguide Definition',
        tag: '#spec',
        desc: 'Aura UI styling and task tracker architecture',
      },
    ];

    for (let i = 0; i < defaultCards.length; i++) {
      const c = defaultCards[i];
      await db.execute(
        `INSERT OR IGNORE INTO kanban_cards (id, board_id, column_id, title, description, tag_label, position_rank, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, boardId, c.column_id, c.title, c.desc, c.tag, `${i}`, now, now]
      );
    }
  }

  async moveCard(cardId: string, targetColumnId: string): Promise<void> {
    const now = new Date().toISOString();
    await db.execute(`UPDATE kanban_cards SET column_id = ?, updated_at = ? WHERE id = ?`, [
      targetColumnId,
      now,
      cardId,
    ]);

    await syncService.enqueueMutation('kanban_cards', cardId, 'UPDATE', {
      column_id: targetColumnId,
      updated_at: now,
    });
  }

  async addCard(
    boardId: string,
    columnId: string,
    title: string,
    tag = '#task'
  ): Promise<KanbanCard> {
    const cardId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO kanban_cards (id, board_id, column_id, title, tag_label, position_rank, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [cardId, boardId, columnId, title, tag, '99', now, now]
    );

    const card: KanbanCard = {
      id: cardId,
      columnId,
      title,
      tags: [tag],
      orderIndex: 99,
      createdAt: now,
      updatedAt: now,
    };

    await syncService.enqueueMutation('kanban_cards', cardId, 'INSERT', card);
    return card;
  }
}

export const kanbanService = new KanbanService();
