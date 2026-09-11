import { db } from '@/db/database';
import { SyncStatus } from '@/types';

export interface SyncMutation {
  mutation_id: string;
  entity_table: string;
  entity_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string; // JSON string
  created_at: string;
  synced_at?: string | null;
}

class SyncService {
  private isSyncing = false;
  private syncListeners: ((status: SyncStatus) => void)[] = [];

  subscribe(listener: (status: SyncStatus) => void) {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
    };
  }

  private notify(status: SyncStatus) {
    this.syncListeners.forEach((l) => l(status));
  }

  async enqueueMutation(
    table: string,
    id: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: Record<string, any>
  ): Promise<void> {
    const mutationId = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO client_sync_queue (mutation_id, entity_table, entity_id, operation, payload, created_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [mutationId, table, id, operation, JSON.stringify(data), now, null]
    );

    const pending = await this.getPendingMutationsCount();
    this.notify({
      state: 'synced',
      pendingMutationsCount: pending,
      lastSyncedAt: now,
    });
  }

  async getPendingMutations(): Promise<SyncMutation[]> {
    return await db.select<SyncMutation>(
      `SELECT * FROM client_sync_queue WHERE synced_at IS NULL ORDER BY created_at ASC`
    );
  }

  async getPendingMutationsCount(): Promise<number> {
    const pending = await this.getPendingMutations();
    return pending.length;
  }

  async pushPendingMutations(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    const pending = await this.getPendingMutations();
    if (pending.length === 0) {
      this.isSyncing = false;
      return;
    }

    this.notify({
      state: 'syncing',
      pendingMutationsCount: pending.length,
    });

    try {
      // Simulate remote PostgreSQL batch push with LWW conflict resolution
      const now = new Date().toISOString();
      for (const mut of pending) {
        await db.execute(`UPDATE client_sync_queue SET synced_at = ? WHERE mutation_id = ?`, [
          now,
          mut.mutation_id,
        ]);
      }

      this.notify({
        state: 'synced',
        pendingMutationsCount: 0,
        lastSyncedAt: now,
      });
    } catch (err) {
      console.error('[SyncService] Failed to push batch mutations:', err);
      this.notify({
        state: 'error',
        pendingMutationsCount: pending.length,
      });
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
