import { Env } from './types';
import { WorkerDatabase } from './db';

export async function handleCronTrigger(
  env: Env,
  scheduledTime: number
): Promise<{ delivered: number; errors: number }> {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.warn('[CronTrigger] TELEGRAM_BOT_TOKEN is not configured; skipping cron execution.');
    return { delivered: 0, errors: 0 };
  }

  const db = new WorkerDatabase(env);
  const users = await db.getAllPairedUsers();

  const d = new Date(scheduledTime || Date.now());
  const utcHours = d.getUTCHours();
  // Target user timezone is UTC+7
  const localHours = (utcHours + 7) % 24;

  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  let delivered = 0;
  let errors = 0;

  for (const user of users) {
    if (!user.telegram_chat_id) continue;

    try {
      if (localHours >= 5 && localHours <= 7) {
        // Morning 06:00 Briefing
        const agenda = await db.getTodayAgenda(todayStr);
        let text = `✦ *Atelier Today Overview*\n_Date: ${todayStr}_\n\n`;

        text += `*Todo Tasks (${agenda.tasks.filter((t) => t.status === 'done').length}/${agenda.tasks.length}):*\n`;
        if (agenda.tasks.length === 0) {
          text += `_No tasks scheduled for today. Use /add to create one._\n`;
        } else {
          agenda.tasks.forEach((t) => {
            text += `${t.status === 'done' ? '[✓] ~' + t.title + '~' : '[ ] ' + t.title}\n`;
          });
        }
        text += '\n';

        text += `*Daily Habits (${agenda.routines.length}):*\n`;
        if (agenda.routines.length === 0) {
          text += `_No habits active._\n`;
        } else {
          agenda.routines.forEach((r) => {
            text += `• ${r.title} (${r.target_count || 1} target)\n`;
          });
        }

        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_chat_id,
            text,
            parse_mode: 'Markdown',
          }),
        });
        delivered++;
      } else {
        // Afternoon (16:00) or Evening (21:00) Check-in
        const label = localHours >= 20 ? 'Evening Review (21:00)' : 'Afternoon Check-in (16:00)';
        const agenda = await db.getTodayAgenda(todayStr);
        const pendingTasks = agenda.tasks.filter((t) => t.status !== 'done');

        if (pendingTasks.length > 0) {
          let text = `✦ *${label}*\n\nYou have pending tasks for today:\n\n`;
          pendingTasks.forEach((t) => {
            text += `• ${t.title}\n`;
          });
          text += `\n_Use /todo to check them off._`;

          await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.telegram_chat_id,
              text,
              parse_mode: 'Markdown',
            }),
          });
          delivered++;
        }
      }
    } catch (err) {
      console.error('[CronTrigger] Delivery error for user', user.id, err);
      errors++;
    }
  }

  return { delivered, errors };
}
