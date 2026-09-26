import { Bot, InlineKeyboard } from 'grammy';
import { Env } from './types';
import { WorkerDatabase } from './db';

export function createBot(env: Env) {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);
  const db = new WorkerDatabase(env);

  // Helper for today's date YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // /start command
  bot.command('start', async (ctx) => {
    const chatId = String(ctx.chat.id);
    const paired = await db.getPairedConfig(chatId);

    if (paired) {
      await ctx.reply(
        `✦ *Atelier Personal Operating System*\n\n` +
          `Welcome back, *${paired.user_name}*! Your Telegram companion is connected.\n\n` +
          `• \`/todo <title>\` — Quick-capture task to Today's queue\n` +
          `• \`/kanban <board> <title>\` — Add card to Kanban board\n` +
          `• \`/note <text>\` — Capture an inbox note\n` +
          `• \`/agenda\` — View today's agenda & routines with interactive buttons\n` +
          `• \`/focus\` — Check current Pomodoro focus target\n` +
          `• \`/help\` — Complete command reference`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply(
        `✦ *Welcome to Atelier*\n\n` +
          `Your personal desktop cockpit companion bot.\n\n` +
          `To link your desktop workspace:\n` +
          `1. Open Atelier on your computer.\n` +
          `2. Click *Telegram* in the status footer (or open Settings).\n` +
          `3. Click *Generate Code* to receive your 15-minute code.\n` +
          `4. Send \`/pair <code>\` right here.\n\n` +
          `Example: \`/pair ATL-984\``,
        { parse_mode: 'Markdown' }
      );
    }
  });

  // /help command
  bot.command('help', async (ctx) => {
    await ctx.reply(
      `✦ *Atelier Telegram Commands*\n\n` +
        `*/pair <code>*\n` +
        `Link this Telegram chat with your Atelier workspace.\n\n` +
        `*/todo <title>*\n` +
        `Schedule a task into Today's queue or Inbox.\n` +
        `_Example:_ \`/todo Review security audit report\`\n\n` +
        `*/kanban <board> <title>*\n` +
        `Drop a new card into a Kanban board's Planned column.\n` +
        `_Example:_ \`/kanban "Project A" Draft API specification\`\n\n` +
        `*/note <text>*\n` +
        `Save a quick thought or reference into your Notes Inbox.\n` +
        `_Example:_ \`/note Meeting with design team: switch to soft warm borders\`\n\n` +
        `*/agenda*\n` +
        `Show today's habit routines and scheduled tasks with one-tap completion buttons.\n\n` +
        `*/focus*\n` +
        `View daily Pomodoro cycle goals and active focus targets.`,
      { parse_mode: 'Markdown' }
    );
  });

  // /pair <code> command
  bot.command('pair', async (ctx) => {
    const raw = ctx.match?.trim();
    if (!raw) {
      await ctx.reply(
        `Please specify your pairing code.\n_Example:_ \`/pair ATL-984\`\n\nGenerate your code in Atelier: Footer → Telegram → Generate Code.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const code = raw.toUpperCase();
    const config = await db.findByPairingCode(code);

    if (!config) {
      await ctx.reply(
        `❌ *Invalid or expired pairing code.*\n\nPairing codes expire after 15 minutes. Please generate a fresh code in Atelier (Footer → Telegram).`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const chatId = String(ctx.chat.id);
    await db.linkTelegramChat(config.id, chatId);

    await ctx.reply(
      `✦ *Linked to Atelier!*\n\n` +
        `Your Telegram account is paired with workspace *${config.user_name}*.\n\n` +
        `You can now send \`/todo\`, \`/kanban\`, \`/note\`, or \`/agenda\` to interact with your desktop workspace away from your desk.`,
      { parse_mode: 'Markdown' }
    );
  });

  // /todo <title> command
  bot.command('todo', async (ctx) => {
    const title = ctx.match?.trim();
    if (!title) {
      await ctx.reply('Please provide a task title.\n_Example:_ `/todo Finalize Q3 design sprint`', {
        parse_mode: 'Markdown',
      });
      return;
    }

    const todayStr = getTodayStr();
    const task = await db.createTask(title, todayStr);

    const keyboard = new InlineKeyboard().text('✓ Mark Done', `done:${task.id}`);

    await ctx.reply(`✓ *Task Scheduled for Today*\n\n"${title}"\n\n_Added to Daily Cockpit._`, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });

  // /kanban <board> <title> command
  bot.command('kanban', async (ctx) => {
    const match = ctx.match?.trim();
    if (!match) {
      await ctx.reply(
        'Please provide a board name and card title.\n_Example:_ `/kanban "Project A" Fix layout regression`',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let boardName = 'Project A';
    let cardTitle = match;

    // Check for quoted board name: /kanban "Project A" card title
    const quotedMatch = match.match(/^"([^"]+)"\s+(.+)$/);
    if (quotedMatch) {
      boardName = quotedMatch[1];
      cardTitle = quotedMatch[2];
    } else {
      const parts = match.split(/\s+/);
      if (parts.length > 1) {
        boardName = parts[0];
        cardTitle = parts.slice(1).join(' ');
      }
    }

    const res = await db.addKanbanCard(boardName, cardTitle);
    if (!res) {
      await ctx.reply(
        `Could not find board matching "${boardName}". Check your boards in Atelier or create one on desktop.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    await ctx.reply(
      `✓ *Kanban Card Created*\n\nBoard: *${res.boardTitle}*\nColumn: *Planned*\nCard: "${cardTitle}"`,
      { parse_mode: 'Markdown' }
    );
  });

  // /note <text> command
  bot.command('note', async (ctx) => {
    const text = ctx.match?.trim();
    if (!text) {
      await ctx.reply(
        'Please provide note content.\n_Example:_ `/note Need to investigate SQLite indexing strategies`',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const title = text.length > 40 ? text.substring(0, 37) + '...' : text;
    await db.createNote(title, text);

    await ctx.reply(`✓ *Note Captured to Inbox*\n\n"${title}"\n\n_Available in Notes & Docs._`, {
      parse_mode: 'Markdown',
    });
  });

  // /agenda command
  bot.command('agenda', async (ctx) => {
    const todayStr = getTodayStr();
    const agenda = await db.getTodayAgenda(todayStr);

    let message = `✦ *Atelier Agenda for Today*\n_${todayStr}_\n\n`;

    if (agenda.routines.length > 0) {
      message += `*Daily Routines & Habits:*\n`;
      for (const r of agenda.routines) {
        const log = agenda.routineLogs.find((l) => l.routine_id === r.id);
        const count = log?.current_count || 0;
        const isDone = log?.completed === 1;
        message += `${isDone ? '✓' : '○'} ${r.title} (${count}/${r.target_count || 1})\n`;
      }
      message += `\n`;
    }

    if (agenda.tasks.length > 0) {
      message += `*Today's Tactical Tasks:*\n`;
      for (const t of agenda.tasks) {
        const isDone = t.status === 'done';
        message += `${isDone ? '✓ ~' + t.title + '~' : '• ' + t.title}\n`;
      }
    } else {
      message += `_No tasks scheduled for today. Add one with /todo <title>_\n`;
    }

    const keyboard = new InlineKeyboard();
    const openTasks = agenda.tasks.filter((t) => t.status !== 'done').slice(0, 3);
    for (const t of openTasks) {
      const shortTitle = t.title.length > 20 ? t.title.substring(0, 18) + '…' : t.title;
      keyboard.text(`✓ ${shortTitle}`, `done:${t.id}`).row();
    }

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: openTasks.length > 0 ? keyboard : undefined,
    });
  });

  // /focus command
  bot.command('focus', async (ctx) => {
    const chatId = String(ctx.chat.id);
    const config = await db.getPairedConfig(chatId);

    const target = config?.pomodoro_daily_target || 4;
    const focusMins = config?.pomodoro_focus_mins || 25;

    await ctx.reply(
      `✦ *Pomodoro Focus Status*\n\n` +
        `• Focus Duration: *${focusMins} minutes*\n` +
        `• Daily Cycle Target: *${target} cycles*\n\n` +
        `_Active sessions and countdown are driven live from the Atelier desktop top bar._`,
      { parse_mode: 'Markdown' }
    );
  });

  // Inline button callbacks
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;

    if (data.startsWith('done:')) {
      const taskId = data.replace('done:', '');
      await db.markTaskDone(taskId);
      await ctx.answerCallbackQuery({ text: '✓ Task marked as completed!' });

      try {
        const original = ctx.callbackQuery.message?.text || '';
        await ctx.editMessageText(`${original}\n\n✓ *Completed via Telegram*`, {
          parse_mode: 'Markdown',
        });
      } catch {
        // Message edit optional if content didn't change
      }
    } else if (data.startsWith('habit:')) {
      const routineId = data.replace('habit:', '');
      const todayStr = getTodayStr();
      const nextCount = await db.incrementRoutineLog(routineId, todayStr);
      await ctx.answerCallbackQuery({ text: `✓ Habit progress updated (${nextCount})` });
    } else {
      await ctx.answerCallbackQuery();
    }
  });

  return bot;
}
