import { db } from '@/db/database';
import { syncService } from './syncService';

export type TrashTable =
  | 'notes'
  | 'canvases'
  | 'kanban_boards'
  | 'kanban_cards'
  | 'tasks'
  | 'routines'
  | 'calendar_events';

export interface TrashItem {
  id: string;
  tableName: TrashTable;
  title: string;
  itemType: 'Note' | 'Canvas' | 'Kanban Board' | 'Kanban Card' | 'Task' | 'Habit' | 'Calendar Event';
  deletedAt: string;
  daysRemaining: number;
}

export class TrashService {
  private readonly tables: {
    table: TrashTable;
    type: TrashItem['itemType'];
    titleField: string;
  }[] = [
    { table: 'notes', type: 'Note', titleField: 'title' },
    { table: 'canvases', type: 'Canvas', titleField: 'title' },
    { table: 'kanban_boards', type: 'Kanban Board', titleField: 'title' },
    { table: 'kanban_cards', type: 'Kanban Card', titleField: 'title' },
    { table: 'tasks', type: 'Task', titleField: 'title' },
    { table: 'routines', type: 'Habit', titleField: 'title' },
    { table: 'calendar_events', type: 'Calendar Event', titleField: 'title' },
  ];

  /**
   * Automatically purge items older than 30 days (1 month).
   */
  async purgeExpiredTrash(): Promise<number> {
    await db.init();
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let totalPurged = 0;

    for (const { table } of this.tables) {
      try {
        const expired = await db.select<any>(
          `SELECT id FROM ${table} WHERE deleted_at IS NOT NULL AND deleted_at < ?`,
          [cutoff]
        );
        for (const row of expired) {
          await db.execute(`DELETE FROM ${table} WHERE id = ?`, [row.id]);
          await syncService.enqueueMutation(table, row.id, 'DELETE', {});
          totalPurged++;
        }
      } catch (err) {
        console.warn(`[TrashService] Error purging expired items from ${table}:`, err);
      }
    }

    return totalPurged;
  }

  /**
   * Fetch all soft-deleted items across all entities.
   */
  async getTrashItems(): Promise<TrashItem[]> {
    await db.init();
    // Run background purge of 30-day expired items first
    await this.purgeExpiredTrash();

    const items: TrashItem[] = [];
    const now = Date.now();

    for (const { table, type, titleField } of this.tables) {
      try {
        const rows = await db.select<any>(
          `SELECT * FROM ${table} WHERE deleted_at IS NOT NULL`
        );
        for (const r of rows) {
          if (!r.deleted_at) continue;
          const deletedTime = new Date(r.deleted_at).getTime();
          const ageDays = Math.floor((now - deletedTime) / (1000 * 60 * 60 * 24));
          const daysRemaining = Math.max(0, 30 - ageDays);

          items.push({
            id: r.id,
            tableName: table,
            title: r[titleField] || 'Untitled Item',
            itemType: type,
            deletedAt: r.deleted_at,
            daysRemaining,
          });
        }
      } catch (err) {
        console.warn(`[TrashService] Error reading trash from ${table}:`, err);
      }
    }

    return items.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  }

  /**
   * Soft delete a record by setting deleted_at to current timestamp.
   */
  async softDelete(table: TrashTable, id: string): Promise<void> {
    await db.init();
    const now = new Date().toISOString();
    try {
      await db.execute(`UPDATE ${table} SET deleted_at = ? WHERE id = ?`, [now, id]);
      await syncService.enqueueMutation(table, id, 'UPDATE', { deleted_at: now });
    } catch (err) {
      console.error(`[TrashService] Failed to soft delete ${table}:${id}:`, err);
      throw err;
    }
  }

  /**
   * Restore a soft-deleted item.
   */
  async restoreItem(table: TrashTable, id: string): Promise<void> {
    await db.init();
    try {
      await db.execute(`UPDATE ${table} SET deleted_at = NULL WHERE id = ?`, [id]);
      await syncService.enqueueMutation(table, id, 'UPDATE', { deleted_at: null });
    } catch (err) {
      console.error(`[TrashService] Failed to restore ${table}:${id}:`, err);
      throw err;
    }
  }

  /**
   * Permanently delete an item immediately.
   */
  async permanentlyDeleteItem(table: TrashTable, id: string): Promise<void> {
    await db.init();
    try {
      await db.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
      await syncService.enqueueMutation(table, id, 'DELETE', {});
    } catch (err) {
      console.error(`[TrashService] Failed to permanently delete ${table}:${id}:`, err);
      throw err;
    }
  }

  /**
   * Empty all items in the trash.
   */
  async emptyTrash(): Promise<void> {
    await db.init();
    for (const { table } of this.tables) {
      try {
        const rows = await db.select<any>(`SELECT id FROM ${table} WHERE deleted_at IS NOT NULL`);
        for (const r of rows) {
          await db.execute(`DELETE FROM ${table} WHERE id = ?`, [r.id]);
          await syncService.enqueueMutation(table, r.id, 'DELETE', {});
        }
      } catch (err) {
        console.warn(`[TrashService] Failed to empty trash for table ${table}:`, err);
      }
    }
  }
}

export const trashService = new TrashService();
