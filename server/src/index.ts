import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const syncApiKey = process.env.SYNC_API_KEY || 'atelier_default_secret_key';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://atelier_user:atelier_password@127.0.0.1:5432/atelier',
});

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${syncApiKey}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid SYNC_API_KEY' });
  }
  next();
};

// Health Check
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      database: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Full Workspace Snapshot (for fresh desktop login or complete restore)
app.get('/api/sync/snapshot', requireAuth, async (_req: Request, res: Response) => {
  try {
    const [
      config,
      routines,
      routineLogs,
      tasks,
      kanbanBoards,
      kanbanCards,
      canvases,
      notes,
      calendarEvents,
    ] = await Promise.all([
      pool.query('SELECT * FROM workspace_config LIMIT 1'),
      pool.query('SELECT * FROM routines ORDER BY position_rank ASC'),
      pool.query('SELECT * FROM routine_logs'),
      pool.query('SELECT * FROM tasks ORDER BY position_rank ASC'),
      pool.query('SELECT * FROM kanban_boards ORDER BY position_rank ASC'),
      pool.query('SELECT * FROM kanban_cards ORDER BY position_rank ASC'),
      pool.query('SELECT * FROM canvases'),
      pool.query('SELECT * FROM notes'),
      pool.query('SELECT * FROM calendar_events ORDER BY start_time ASC'),
    ]);

    res.json({
      workspace_config: config.rows[0] || null,
      routines: routines.rows,
      routine_logs: routineLogs.rows,
      tasks: tasks.rows,
      kanban_boards: kanbanBoards.rows,
      kanban_cards: kanbanCards.rows,
      canvases: canvases.rows,
      notes: notes.rows,
      calendar_events: calendarEvents.rows,
      synced_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[SyncAPI] Snapshot error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Batch Mutation Endpoint (Receives offline mutation queue from desktop client)
interface MutationPayload {
  mutation_id: string;
  entity_table: string;
  entity_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  created_at: string;
}

app.post('/api/sync/push', requireAuth, async (req: Request, res: Response) => {
  const mutations: MutationPayload[] = req.body.mutations || [];
  if (!Array.isArray(mutations) || mutations.length === 0) {
    return res.json({ applied: 0, acknowledged: [] });
  }

  const client = await pool.connect();
  const acknowledged: string[] = [];

  try {
    await client.query('BEGIN');

    for (const m of mutations) {
      const { entity_table, entity_id, operation, payload } = m;
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

      // Whitelist permitted tables to prevent arbitrary SQL injection
      const allowedTables = [
        'workspace_config',
        'routines',
        'routine_logs',
        'tasks',
        'kanban_boards',
        'kanban_cards',
        'canvases',
        'notes',
        'calendar_events',
      ];

      if (!allowedTables.includes(entity_table)) {
        console.warn(`[SyncAPI] Skipped unknown table: ${entity_table}`);
        acknowledged.push(m.mutation_id);
        continue;
      }

      if (operation === 'DELETE') {
        await client.query(`DELETE FROM ${entity_table} WHERE id = $1`, [entity_id]);
      } else if (operation === 'INSERT' || operation === 'UPDATE') {
        const keys = Object.keys(data);
        if (keys.length > 0) {
          const columns = keys.map((k) => `"${k}"`).join(', ');
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const values = keys.map((k) => {
            const val = data[k];
            // Serialize complex objects or arrays into JSON string for JSONB columns
            if (typeof val === 'object' && val !== null) {
              return JSON.stringify(val);
            }
            return val;
          });

          const updateClause = keys
            .filter((k) => k !== 'id')
            .map((k, i) => `"${k}" = EXCLUDED."${k}"`)
            .join(', ');

          const query = `
            INSERT INTO ${entity_table} (${columns})
            VALUES (${placeholders})
            ON CONFLICT (id) DO UPDATE SET ${updateClause || 'updated_at = NOW()'}
          `;

          await client.query(query, values);
        }
      }

      acknowledged.push(m.mutation_id);
    }

    await client.query('COMMIT');
    res.json({
      applied: acknowledged.length,
      acknowledged,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[SyncAPI] Transaction failure:', err);
    res.status(500).json({ error: err.message, acknowledged: [] });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`[Atelier Server] Sync Bridge running on port ${port}`);
});
