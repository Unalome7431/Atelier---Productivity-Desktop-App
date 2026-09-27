import { Bot, InlineKeyboard } from 'grammy';
import { Env } from './types';
import { WorkerDatabase } from './db';

export function createBot(env: Env) {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);
  const db = new WorkerDatabase(env);

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 1. /add — Add task with destination choice (Today or Inbox)
  bot.command('add', async (ctx) => {
    const raw = ctx.match?.trim();
    if (!raw) {
      await ctx.reply(
        `✦ *Add Task*\n\n` +
          `Usage:\n` +
          `• \`/add <task title>\` — prompt to choose Today or Inbox\n` +
          `• \`/add today <task title>\` — add directly to Today\n` +
          `• \`/add inbox <task title>\` — add directly to Inbox\n\n` +
          `_Example:_ \`/add Review quarterly roadmap\``,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (/^today\s+/i.test(raw)) {
      const title = raw.replace(/^today\s+/i, '').trim();
      await db.createTask(title, getTodayStr());
      await ctx.reply(`✓ *Added to Today's Tasks*\n\n"${title}"`, { parse_mode: 'Markdown' });
      return;
    }

    if (/^inbox\s+/i.test(raw)) {
      const title = raw.replace(/^inbox\s+/i, '').trim();
      await db.createTask(title, undefined);
      await ctx.reply(`✓ *Added to Inbox Backlog*\n\n"${title}"`, { parse_mode: 'Markdown' });
      return;
    }

    // Interactive button choice
    const keyboard = new InlineKeyboard()
      .text('Add to Today', `w_add:today:${raw.slice(0, 30)}`)
      .text('Add to Inbox', `w_add:inbox:${raw.slice(0, 30)}`);

    await ctx.reply(`✦ *Choose Destination for Task*\n\n"${raw}"`, {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
  });

  // 2. /habit — List habits active for today with checklist or increment
  bot.command('habit', async (ctx) => {
    const todayStr = getTodayStr();
    const agenda = await db.getTodayAgenda(todayStr);

    const d = new Date();
    const dayOfWeek = d.getDay();
    const isRoutineActive = (r: any) => {
      if (!r.cadence || r.cadence === 'daily') return true;
      if (r.cadence === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
      if (r.cadence === 'custom' && Array.isArray(r.custom_days)) return r.custom_days.includes(dayOfWeek);
      return true;
    };
    const todayRoutines = agenda.routines.filter(isRoutineActive);

    if (todayRoutines.length === 0) {
      await ctx.reply(`✦ *Today's Habits*\n\nNo habits scheduled for today (${todayStr}).`);
      return;
    }

    let text = `✦ *Today's Habits* (${todayStr})\n\n`;
    const keyboard = new InlineKeyboard();

    todayRoutines.forEach((r, idx) => {
      text += `${idx + 1}. *${r.title}* (${r.target_count || 1} target)\n`;
      keyboard
        .text(`+1 ${r.title.slice(0, 14)}`, `w_habit_inc:${r.id}`)
        .text(`✓ Done`, `w_habit_done:${r.id}`)
        .row();
    });

    await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'Markdown' });
  });

  // 3. /today — Daily summary of tasks, habits, and events
  bot.command('today', async (ctx) => {
    const todayStr = getTodayStr();
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

    const openTasks = agenda.tasks.filter((t) => t.status !== 'done').slice(0, 4);
    const keyboard = new InlineKeyboard();
    openTasks.forEach((t) => {
      keyboard.text(`✓ ${t.title.slice(0, 18)}`, `w_todo_done:${t.id}`).row();
    });

    await ctx.reply(text, {
      reply_markup: openTasks.length > 0 ? keyboard : undefined,
      parse_mode: 'Markdown',
    });
  });

  // 4. /schedule — Weekly schedule details
  bot.command('schedule', async (ctx) => {
    const text =
      `✦ *Atelier Weekly Schedule*\n\n` +
      `*Monday:*\n• 09:00 - 09:45 | Weekly planning [Planning]\n\n` +
      `*Tuesday:*\n• 10:00 - 12:00 | Project build [Build]\n\n` +
      `*Wednesday:*\n• 11:00 - 11:30 | Team sync [Meeting]\n\n` +
      `*Thursday:*\n• 14:00 - 15:00 | Documentation [Focus]\n\n` +
      `*Friday:*\n• 15:00 - 16:00 | Sprint retro [Review]\n`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  });

  // 5. /inbox — List all todo tasks in inbox
  bot.command('inbox', async (ctx) => {
    const tasks = await db.query<any>(
      `SELECT * FROM tasks WHERE scheduled_date IS NULL ORDER BY created_at DESC LIMIT 20`
    );

    if (tasks.length === 0) {
      await ctx.reply(`✦ *Inbox Backlog*\n\nInbox is empty. No unscheduled tasks.`);
      return;
    }

    let text = `✦ *Inbox Backlog* (${tasks.length} tasks)\n\n`;
    const keyboard = new InlineKeyboard();

    tasks.forEach((t, idx) => {
      text += `${idx + 1}. *${t.title}*\n`;
      if (idx < 5) {
        keyboard.text(`-> Move to Today: ${t.title.slice(0, 16)}`, `w_move:${t.id}`).row();
      }
    });

    text += `\n_Use /move to schedule any task to Today._`;
    await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'Markdown' });
  });

  // 6. /todo — List today tasks with subtasks and checklist
  bot.command('todo', async (ctx) => {
    const todayStr = getTodayStr();
    const agenda = await db.getTodayAgenda(todayStr);

    if (agenda.tasks.length === 0) {
      await ctx.reply(`✦ *Today's Todo Tasks*\n\nNo tasks scheduled for today. Use /add to add one.`);
      return;
    }

    let text = `✦ *Today's Todo Tasks* (${todayStr})\n\n`;
    const keyboard = new InlineKeyboard();

    agenda.tasks.forEach((t, idx) => {
      const isDone = t.status === 'done';
      text += `${idx + 1}. ${isDone ? '[✓] ~' + t.title + '~' : '[ ] *' + t.title + '*'}\n`;
      keyboard.text(isDone ? `Reopen: ${t.title.slice(0, 16)}` : `✓ Done: ${t.title.slice(0, 16)}`, `w_todo_done:${t.id}`).row();
    });

    await ctx.reply(text, { reply_markup: keyboard, parse_mode: 'Markdown' });
  });

  // 7. /help — Full command guide & reminder schedule
  bot.command('help', async (ctx) => {
    await ctx.reply(
      `✦ *Atelier Bot Commands*\n\n` +
        `• \`/add <title>\` — Add todo task (choose Today or Inbox)\n` +
        `• \`/habit\` — List today's habits with checklist or increment (+1)\n` +
        `• \`/today\` — Daily summary of tasks, habits, and events\n` +
        `• \`/schedule\` — Show weekly schedule and recurring blocks\n` +
        `• \`/inbox\` — List all tasks in inbox backlog\n` +
        `• \`/todo\` — List today tasks & subtasks with checklist\n` +
        `• \`/help\` — View this guide\n\n` +
        `*Automated Reminders:*\n` +
        `• 06:00 — Morning daily briefing (/today)\n` +
        `• 16:00 — Afternoon unfinished items check-in\n` +
        `• 21:00 — Evening unfinished items review\n` +
        `• 3h Advance — Advance alert before scheduled events & blocks`,
      { parse_mode: 'Markdown' }
    );
  });

  // /start command
  bot.command('start', async (ctx) => {
    const text = ctx.match?.trim();
    if (text && text.startsWith('ATL-')) {
      const config = await db.findByPairingCode(text);
      if (config) {
        await db.linkTelegramChat(config.id, String(ctx.chat.id));
        await ctx.reply(`✦ *Successfully Linked to Atelier!*\n\nUse \`/help\` to view all commands.`);
        return;
      }
    }
    await ctx.reply(
      `✦ *Welcome to Atelier*\n\nYour personal companion bot.\nUse \`/help\` to view all commands.`
    );
  });

  // /pair command
  bot.command('pair', async (ctx) => {
    const code = ctx.match?.trim();
    if (!code) {
      await ctx.reply(`Please provide your pairing code.\nExample: \`/pair ATL-984\``);
      return;
    }
    const config = await db.findByPairingCode(code);
    if (!config) {
      await ctx.reply(`❌ *Invalid or expired pairing code.*`, { parse_mode: 'Markdown' });
      return;
    }
    await db.linkTelegramChat(config.id, String(ctx.chat.id));
    await ctx.reply(`✦ *Successfully Linked to Atelier!*\n\nUse \`/help\` to view all commands.`);
  });

  // Callback query handling
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;

    if (data.startsWith('w_add:')) {
      const [, dest, title] = data.split(':');
      const scheduledDate = dest === 'today' ? getTodayStr() : undefined;
      await db.createTask(title, scheduledDate);
      await ctx.answerCallbackQuery({ text: `Task added to ${dest === 'today' ? 'Today' : 'Inbox'}` });
      await ctx.editMessageText(`✓ *Task Added to ${dest === 'today' ? "Today's Tasks" : 'Inbox'}*\n\n"${title}"`, {
        parse_mode: 'Markdown',
      });
      return;
    }

    if (data.startsWith('w_todo_done:')) {
      const taskId = data.replace('w_todo_done:', '');
      await db.markTaskDone(taskId);
      await ctx.answerCallbackQuery({ text: '✓ Task marked completed!' });
      return;
    }

    if (data.startsWith('w_move:')) {
      const taskId = data.replace('w_move:', '');
      await db.query(`UPDATE tasks SET scheduled_date = $1 WHERE id = $2`, [getTodayStr(), taskId]);
      await ctx.answerCallbackQuery({ text: '✓ Moved to Today!' });
      return;
    }

    await ctx.answerCallbackQuery();
  });

  return bot;
}
