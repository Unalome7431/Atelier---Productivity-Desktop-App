import { Pool } from 'pg';
import dotenv from 'dotenv';
import { VpsReminderEngine } from './reminderEngine';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://atelier_user:atelier_pass@127.0.0.1:5432/atelier',
});

async function main() {
  console.log('[Cron] Atelier background reminder check starting...');
  const engine = new VpsReminderEngine(pool);
  try {
    const result = await engine.checkReminders();
    console.log('[Cron] Completed check successfully:', result);
  } catch (err) {
    console.error('[Cron] Execution error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void main();
