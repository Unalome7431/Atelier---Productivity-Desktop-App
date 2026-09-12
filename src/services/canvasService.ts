import { db } from '@/db/database';
import { syncService } from './syncService';
import { CanvasDocument, CanvasViewport } from '@/types';

export class CanvasService {
  private seedingPromise: Promise<void> | null = null;

  async getCanvases(): Promise<CanvasDocument[]> {
    const canvases = await db.select<any>('SELECT * FROM canvases ORDER BY created_at ASC');
    if (canvases.length === 0) {
      if (!this.seedingPromise) {
        this.seedingPromise = this.seedDefaultCanvases().finally(() => {
          this.seedingPromise = null;
        });
      }
      await this.seedingPromise;
      return await this.fetchCanvases();
    }

    return await this.fetchCanvases();
  }

  private async fetchCanvases(): Promise<CanvasDocument[]> {
    const canvases = await db.select<any>('SELECT * FROM canvases ORDER BY created_at ASC');
    const nodes = await db.select<any>('SELECT * FROM canvas_nodes');
    const edges = await db.select<any>('SELECT * FROM canvas_edges');

    return canvases.map((c) => {
      let viewport: CanvasViewport | undefined;
      try {
        viewport = typeof c.viewport === 'string' ? JSON.parse(c.viewport) : c.viewport;
      } catch {
        viewport = { x: 0, y: 0, zoom: 1 };
      }

      return {
        id: c.id,
        title: c.title,
        viewport,
        nodes: nodes
          .filter((n) => n.canvas_id === c.id)
          .map((n) => ({
            id: n.id,
            type: n.type,
            position: { x: Number(n.position_x) || 0, y: Number(n.position_y) || 0 },
            width: n.width ? Number(n.width) : undefined,
            height: n.height ? Number(n.height) : undefined,
            data: typeof n.data === 'string' ? JSON.parse(n.data) : n.data || {},
          })),
        edges: edges
          .filter((e) => e.canvas_id === c.id)
          .map((e) => {
            let edgeData: Record<string, any> = {};
            try {
              edgeData = typeof e.data === 'string' ? JSON.parse(e.data) : e.data || {};
            } catch {
              edgeData = {};
            }
            return {
              id: e.id,
              source: e.source_node_id,
              target: e.target_node_id,
              sourceHandle: e.source_handle || null,
              targetHandle: e.target_handle || null,
              label: e.label || undefined,
              data: edgeData,
            };
          }),
        updatedAt: c.updated_at,
      };
    });
  }

  async createCanvas(title = 'New Canvas'): Promise<CanvasDocument> {
    const id = `canvas_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const defaultViewport = JSON.stringify({ x: 0, y: 0, zoom: 1 });

    await db.execute(
      `INSERT INTO canvases (id, title, viewport, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, title, defaultViewport, now, now]
    );

    await syncService.enqueueMutation('canvases', id, 'INSERT', {
      id,
      title,
      viewport: defaultViewport,
      created_at: now,
      updated_at: now,
    });

    const created: CanvasDocument = {
      id,
      title,
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [],
      edges: [],
      updatedAt: now,
    };

    return created;
  }

  async renameCanvas(canvasId: string, title: string): Promise<void> {
    const now = new Date().toISOString();
    await db.execute(`UPDATE canvases SET title = ?, updated_at = ? WHERE id = ?`, [
      title,
      now,
      canvasId,
    ]);

    await syncService.enqueueMutation('canvases', canvasId, 'UPDATE', {
      title,
      updated_at: now,
    });
  }

  async deleteCanvas(canvasId: string): Promise<void> {
    await db.execute(`DELETE FROM canvas_edges WHERE canvas_id = ?`, [canvasId]);
    await db.execute(`DELETE FROM canvas_nodes WHERE canvas_id = ?`, [canvasId]);
    await db.execute(`DELETE FROM canvases WHERE id = ?`, [canvasId]);

    await syncService.enqueueMutation('canvases', canvasId, 'DELETE', { id: canvasId });
  }

  async saveCanvasViewport(canvasId: string, viewport: CanvasViewport): Promise<void> {
    const now = new Date().toISOString();
    const vpJson = JSON.stringify(viewport);
    await db.execute(`UPDATE canvases SET viewport = ?, updated_at = ? WHERE id = ?`, [
      vpJson,
      now,
      canvasId,
    ]);

    await syncService.enqueueMutation('canvases', canvasId, 'UPDATE', {
      viewport: vpJson,
      updated_at: now,
    });
  }

  async saveCanvasNodes(canvasId: string, nodes: any[]): Promise<void> {
    const now = new Date().toISOString();
    await db.execute(`DELETE FROM canvas_nodes WHERE canvas_id = ?`, [canvasId]);

    for (const n of nodes) {
      await db.execute(
        `INSERT INTO canvas_nodes (id, canvas_id, type, position_x, position_y, width, height, data, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          n.id,
          canvasId,
          n.type || 'simple_text',
          n.position?.x ?? 0,
          n.position?.y ?? 0,
          n.width ?? null,
          n.height ?? null,
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

  async saveCanvasEdges(canvasId: string, edges: any[]): Promise<void> {
    const now = new Date().toISOString();
    await db.execute(`DELETE FROM canvas_edges WHERE canvas_id = ?`, [canvasId]);

    for (const e of edges) {
      await db.execute(
        `INSERT INTO canvas_edges (id, canvas_id, source_node_id, target_node_id, source_handle, target_handle, label, data, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          e.id,
          canvasId,
          e.source,
          e.target,
          e.sourceHandle ?? null,
          e.targetHandle ?? null,
          e.label ?? null,
          JSON.stringify(e.data || {}),
          now,
        ]
      );
    }

    await syncService.enqueueMutation('canvas_edges', canvasId, 'UPDATE', {
      edges,
      updated_at: now,
    });
  }

  private async seedDefaultCanvases(): Promise<void> {
    const now = new Date().toISOString();

    // 1. Canvas A - Master Concept from Figma Design
    const canvasAId = 'canvas_a';
    await db.execute(
      `INSERT OR IGNORE INTO canvases (id, title, viewport, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [canvasAId, 'Canvas A', '{"x": 100, "y": 60, "zoom": 0.95}', now, now]
    );

    const canvasANodes = [
      {
        id: 'node_section_1',
        type: 'section',
        x: 20,
        y: 20,
        width: 1040,
        height: 600,
        data: {
          sectionTitle: 'Sprint Architecture & Launch Loop',
          bgColor: 'rgba(245, 241, 232, 0.45)',
        },
      },
      {
        id: 'node_kanban_1',
        type: 'kanban',
        x: 390,
        y: 190,
        data: {
          title: 'Release readiness',
          badge: 'KANBAN',
          color: '#DEE5FD',
          boardId: 'board_default',
          items: [
            { id: 'k1', title: 'Stabilize API responses', completed: true },
            { id: 'k2', title: 'Prepare beta cohort update', completed: false },
            { id: 'k3', title: 'Polish offline sync fallback', completed: true },
            { id: 'k4', title: 'Validate zero-latency desktop launch', completed: false },
          ],
          completedCount: 2,
          totalCount: 4,
        },
      },
      {
        id: 'node_launch_1',
        type: 'simple_text',
        x: 60,
        y: 70,
        data: {
          title: 'Launch outcome',
          content:
            'A dependable MVP that gives users one focused workspace for planning and delivery.',
          color: '#EEEDFD',
        },
      },
      {
        id: 'node_media_1',
        type: 'media',
        x: 740,
        y: 70,
        data: {
          title: 'Calm, focused workspace',
          caption: 'Reference moodboard',
          color: '#D1FBE3',
          imageUrl:
            'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&auto=format&fit=crop&q=80',
        },
      },
      {
        id: 'node_evidence_1',
        type: 'simple_text',
        x: 60,
        y: 380,
        data: {
          title: 'Evidence',
          content:
            'Keep automation quiet: the interface should clarify priority, not invent urgency.',
          color: '#F5F0E6',
        },
      },
      {
        id: 'node_beta_1',
        type: 'simple_text',
        x: 740,
        y: 380,
        data: {
          title: 'Beta handoff',
          badge: 'NEXT STEP',
          content:
            'Finalize onboarding flow and invite beta cohort testers to exercise the daily loop.',
          color: '#FED7E8',
        },
      },
    ];

    for (const n of canvasANodes) {
      await db.execute(
        `INSERT OR IGNORE INTO canvas_nodes (id, canvas_id, type, position_x, position_y, width, height, data, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          n.id,
          canvasAId,
          n.type,
          n.x,
          n.y,
          n.width || null,
          n.height || null,
          JSON.stringify(n.data),
          now,
        ]
      );
    }

    const canvasAEdges = [
      {
        id: 'e_kanban_launch',
        source: 'node_kanban_1',
        target: 'node_launch_1',
        label: 'feeds into',
        data: { stroke: '#BAC8FF' },
      },
      {
        id: 'e_kanban_media',
        source: 'node_kanban_1',
        target: 'node_media_1',
        label: 'references',
        data: { stroke: '#B0EED0' },
      },
      {
        id: 'e_kanban_evidence',
        source: 'node_kanban_1',
        target: 'node_evidence_1',
        label: 'depends on',
        data: { stroke: '#E5DAC4' },
      },
      {
        id: 'e_kanban_beta',
        source: 'node_kanban_1',
        target: 'node_beta_1',
        label: 'next step',
        data: { stroke: '#F9BDD6' },
      },
    ];

    for (const e of canvasAEdges) {
      await db.execute(
        `INSERT OR IGNORE INTO canvas_edges (id, canvas_id, source_node_id, target_node_id, source_handle, target_handle, label, data, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [e.id, canvasAId, e.source, e.target, null, null, e.label, JSON.stringify(e.data), now]
      );
    }

    // 2. Canvas B - Architecture & Data Flow
    const canvasBId = 'canvas_b';
    await db.execute(
      `INSERT OR IGNORE INTO canvases (id, title, viewport, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [canvasBId, 'Canvas B', '{"x": 80, "y": 80, "zoom": 1}', now, now]
    );

    const canvasBNodes = [
      {
        id: 'node_b1',
        type: 'simple_text',
        x: 100,
        y: 120,
        data: {
          title: 'SQLite Local-First',
          content: 'Zero-latency reads and writes; optimistic updates with monotonic sync queue.',
          color: '#EEEDFD',
        },
      },
      {
        id: 'node_b2',
        type: 'note',
        x: 460,
        y: 120,
        data: {
          title: 'System Architecture & Offline Sync',
          referenceId: 'n_arch',
          content:
            'Atelier operates with a strict local-first architecture. Every action writes immediately to the embedded SQLite database.',
          badge: 'PINNED',
          color: '#D1FBE3',
        },
      },
      {
        id: 'node_b3',
        type: 'simple_text',
        x: 280,
        y: 340,
        data: {
          title: 'PostgreSQL Sync Worker',
          content: 'Bi-directional LWW conflict resolution on network reconnect.',
          color: '#BAE6FD',
        },
      },
    ];

    for (const n of canvasBNodes) {
      await db.execute(
        `INSERT OR IGNORE INTO canvas_nodes (id, canvas_id, type, position_x, position_y, width, height, data, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [n.id, canvasBId, n.type, n.x, n.y, null, null, JSON.stringify(n.data), now]
      );
    }

    await db.execute(
      `INSERT OR IGNORE INTO canvas_edges (id, canvas_id, source_node_id, target_node_id, source_handle, target_handle, label, data, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['e_b1_b2', canvasBId, 'node_b1', 'node_b2', null, null, 'documents', '{}', now]
    );
    await db.execute(
      `INSERT OR IGNORE INTO canvas_edges (id, canvas_id, source_node_id, target_node_id, source_handle, target_handle, label, data, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['e_b1_b3', canvasBId, 'node_b1', 'node_b3', null, null, 'synchronizes', '{}', now]
    );

    // 3. Canvas C - User Onboarding & Growth
    const canvasCId = 'canvas_c';
    await db.execute(
      `INSERT OR IGNORE INTO canvases (id, title, viewport, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [canvasCId, 'Canvas C', '{"x": 60, "y": 60, "zoom": 1}', now, now]
    );

    const canvasCNodes = [
      {
        id: 'node_c1',
        type: 'simple_text',
        x: 100,
        y: 100,
        data: {
          title: 'First-Run Experience',
          content:
            'Guide new users through Daily Cockpit routine setup in under 60 seconds with cozy presets.',
          color: '#FCFCE8',
        },
      },
      {
        id: 'node_c2',
        type: 'kanban',
        x: 480,
        y: 100,
        data: {
          title: 'Onboarding Checklist',
          badge: 'KANBAN',
          color: '#DEE5FD',
          boardId: 'board_default',
          items: [
            { id: 'ci1', title: 'Complete first daily routine', completed: true },
            { id: 'ci2', title: 'Link Telegram capture bot', completed: false },
            { id: 'ci3', title: 'Create first spatial canvas card', completed: true },
          ],
          completedCount: 2,
          totalCount: 3,
        },
      },
    ];

    for (const n of canvasCNodes) {
      await db.execute(
        `INSERT OR IGNORE INTO canvas_nodes (id, canvas_id, type, position_x, position_y, width, height, data, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [n.id, canvasCId, n.type, n.x, n.y, null, null, JSON.stringify(n.data), now]
      );
    }

    await db.execute(
      `INSERT OR IGNORE INTO canvas_edges (id, canvas_id, source_node_id, target_node_id, source_handle, target_handle, label, data, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['e_c1_c2', canvasCId, 'node_c1', 'node_c2', null, null, 'tracks', '{}', now]
    );
  }
}

export const canvasService = new CanvasService();
