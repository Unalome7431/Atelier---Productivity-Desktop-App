import { db } from '@/db/database';
import { syncService } from './syncService';
import { CanvasDocument } from '@/types';

export class CanvasService {
  private seedingPromise: Promise<void> | null = null;

  async getCanvases(): Promise<CanvasDocument[]> {
    const canvases = await db.select<any>('SELECT * FROM canvases ORDER BY updated_at DESC');
    if (canvases.length === 0) {
      if (!this.seedingPromise) {
        this.seedingPromise = this.seedDefaultCanvas().finally(() => {
          this.seedingPromise = null;
        });
      }
      await this.seedingPromise;
      return await this.fetchCanvases();
    }

    return await this.fetchCanvases();
  }

  private async fetchCanvases(): Promise<CanvasDocument[]> {
    const canvases = await db.select<any>('SELECT * FROM canvases ORDER BY updated_at DESC');
    const nodes = await db.select<any>('SELECT * FROM canvas_nodes');
    const edges = await db.select<any>('SELECT * FROM canvas_edges');

    return canvases.map((c) => ({
      id: c.id,
      title: c.title,
      nodes: nodes
        .filter((n) => n.canvas_id === c.id)
        .map((n) => ({
          id: n.id,
          type: n.type,
          position: { x: n.position_x, y: n.position_y },
          data: typeof n.data === 'string' ? JSON.parse(n.data) : n.data,
        })),
      edges: edges
        .filter((e) => e.canvas_id === c.id)
        .map((e) => ({
          id: e.id,
          source: e.source_node_id,
          target: e.target_node_id,
          label: e.label,
        })),
      updatedAt: c.updated_at,
    }));
  }

  private async seedDefaultCanvas(): Promise<void> {
    const canvasId = 'canvas_main';
    const now = new Date().toISOString();

    await db.execute(
      `INSERT OR IGNORE INTO canvases (id, title, viewport, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [canvasId, 'Spatial Architecture & Concepts', '{"x": 0, "y": 0, "zoom": 1}', now, now]
    );

    const defaultNodes = [
      {
        id: 'node_1',
        type: 'simple_text',
        x: 100,
        y: 120,
        data: { label: 'Atelier Core Engine', content: 'Tauri + SQLite + Sync Queue' },
      },
      {
        id: 'node_2',
        type: 'kanban',
        x: 450,
        y: 120,
        data: { label: 'Roadmap Kanban', referenceId: 'board_default' },
      },
      {
        id: 'node_3',
        type: 'note',
        x: 300,
        y: 320,
        data: { label: 'Architecture Doc', referenceId: 'n_arch' },
      },
    ];

    for (const n of defaultNodes) {
      await db.execute(
        `INSERT OR IGNORE INTO canvas_nodes (id, canvas_id, type, position_x, position_y, data, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [n.id, canvasId, n.type, n.x, n.y, JSON.stringify(n.data), now]
      );
    }

    await db.execute(
      `INSERT OR IGNORE INTO canvas_edges (id, canvas_id, source_node_id, target_node_id, label, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['e_1_2', canvasId, 'node_1', 'node_2', 'feeds into', now]
    );
  }

  async saveCanvasNodes(canvasId: string, nodes: any[]): Promise<void> {
    const now = new Date().toISOString();
    await db.execute(`DELETE FROM canvas_nodes WHERE canvas_id = ?`, [canvasId]);

    for (const n of nodes) {
      await db.execute(
        `INSERT INTO canvas_nodes (id, canvas_id, type, position_x, position_y, data, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          n.id,
          canvasId,
          n.type || 'text',
          n.position?.x || 0,
          n.position?.y || 0,
          JSON.stringify(n.data || {}),
          now,
        ]
      );
    }

    await syncService.enqueueMutation('canvas_nodes', canvasId, 'UPDATE', {
      nodes,
      updated_at: now,
    });
  }
}

export const canvasService = new CanvasService();
