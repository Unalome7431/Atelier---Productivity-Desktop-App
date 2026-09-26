import { Env } from './types';
import { WorkerDatabase } from './db';

export async function handleMorningCron(env: Env): Promise<{ delivered: number; errors: number }> {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.warn('[MorningCron] TELEGRAM_BOT_TOKEN is not configured; skipping cron execution.');
    return { delivered: 0, errors: 0 };
  }

  const db = new WorkerDatabase(env);
  const users = await db.getAllPairedUsers();

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const formattedDay = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  let delivered = 0;
  let errors = 0;

  for (const user of users) {
    if (!user.telegram_chat_id) continue;

    try {
      const agenda = await db.getTodayAgenda(todayStr);

      let text = `✦ *Good morning, ${user.user_name || 'Creator'}!*\n`;
      text += `*Atelier Daily Briefing · ${formattedDay}*\n\n`;

      if (agenda.routines.length > 0) {
        text += `*Daily Habits:*\n`;
        agenda.routines.slice(0, 5).forEach((r) => {
          text += `• ${r.title} (${r.target_count || 1} target)\n`;
        });
        text += `\n`;
      }

      if (agenda.tasks.length > 0) {
        text += `*Today's Priority Tasks:*\n`;
        agenda.tasks.slice(0, 5).forEach((t) => {
          text += `• ${t.title}\n`;
        });
        text += `\n`;
      } else {
        text += `_No tasks scheduled for today yet. Use \`/todo <title>\` to add one._\n\n`;
      }

      text += `_Ready for deep focus? Atelier is standing by._`;

      // Build inline action buttons for open tasks
      const openTasks = agenda.tasks.filter((t) => t.status !== 'done').slice(0, 3);
      const inlineKeyboard = openTasks.map((t) => [
        {
          text: `✓ ${t.title.length > 22 ? t.title.substring(0, 20) + '…' : t.title}`,
          callback_data: `done:${t.id}`,
        },
      ]);

      const payload: any = {
        chat_id: user.telegram_chat_id,
        text,
        parse_mode: 'Markdown',
      };

      if (inlineKeyboard.length > 0) {
        payload.reply_markup = { inline_keyboard: inlineKeyboard };
      }

      const res = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        delivered++;
      } else {
        errors++;
        const errData = await res.json();
        console.error(`[MorningCron] Failed to send to ${user.telegram_chat_id}:`, errData);
      }
    } catch (err) {
      errors++;
      console.error(`[MorningCron] Exception sending briefing to ${user.telegram_chat_id}:`, err);
    }
  }

  return { delivered, errors };
}
