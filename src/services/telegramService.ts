import { db } from '@/db/database';
import { syncService } from './syncService';
import { taskService } from './taskService';
import { routineService } from './routineService';
import { calendarService } from './calendarService';
import { useTasksStore } from '@/stores/useTasksStore';
import { useRoutinesStore } from '@/stores/useRoutinesStore';
import { getTodayDateString } from '@/lib/utils';
import { TaskSubtask } from '@/types';

export interface TelegramConfigState {
  chatId: string | null;
  botToken: string | null;
  botUsername: string | null;
  pairingCode: string | null;
  pairingCodeExpiresAt: string | null;
  isLinked: boolean;
  isPolling: boolean;
}

export interface BotInfoResponse {
  ok: boolean;
  bot?: {
    id: number;
    first_name: string;
    username: string;
  };
  error?: string;
}

export class TelegramService {
  private static STORAGE_TOKEN_KEY = 'atelier_telegram_bot_token';
  private static STORAGE_USERNAME_KEY = 'atelier_telegram_bot_username';

  private inMemoryToken: string | null = null;
  private inMemoryUsername: string | null = null;

  private isPolling = false;
  private abortController: AbortController | null = null;
  private lastUpdateId = 0;
  private statusListeners: ((state: TelegramConfigState) => void)[] = [];

  // Temporary storage for pending /add task drafts: draftId -> task title
  private pendingDraftTasks = new Map<string, string>();

  // Reminder tracking set to prevent double alerts within the same interval/day
  private sentReminders = new Set<string>();
  private reminderIntervalTimer: any = null;

  isPollingActive(): boolean {
    return this.isPolling;
  }

  subscribe(listener: (state: TelegramConfigState) => void) {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private async notifyListeners() {
    const config = await this.getConfig();
    this.statusListeners.forEach((l) => l(config));
  }

  async getConfig(): Promise<TelegramConfigState> {
    await db.init();
    const rows = await db.select<any>('SELECT * FROM workspace_config LIMIT 1');

    let localToken: string | null = this.inMemoryToken;
    let localUsername: string | null = this.inMemoryUsername;

    try {
      if (!localToken && typeof localStorage !== 'undefined') {
        localToken = localStorage.getItem(TelegramService.STORAGE_TOKEN_KEY);
      }
      if (!localUsername && typeof localStorage !== 'undefined') {
        localUsername = localStorage.getItem(TelegramService.STORAGE_USERNAME_KEY);
      }
    } catch {
      // LocalStorage access fallback
    }

    if (rows.length === 0) {
      return {
        chatId: null,
        botToken: localToken || null,
        botUsername: localUsername || null,
        pairingCode: null,
        pairingCodeExpiresAt: null,
        isLinked: false,
        isPolling: this.isPolling,
      };
    }

    const row = rows[0];
    const isCodeExpired = row.pairing_code_expires_at
      ? new Date(row.pairing_code_expires_at).getTime() < Date.now()
      : true;

    let resolvedToken = row.telegram_bot_token;
    if (resolvedToken === undefined) {
      resolvedToken = this.inMemoryToken || localToken || null;
    }

    let resolvedUsername = row.telegram_bot_username;
    if (resolvedUsername === undefined) {
      resolvedUsername = this.inMemoryUsername || localUsername || null;
    }

    if (resolvedToken) {
      this.inMemoryToken = resolvedToken;
    } else if (resolvedToken === null) {
      this.inMemoryToken = null;
    }

    if (resolvedUsername) {
      this.inMemoryUsername = resolvedUsername;
    } else if (resolvedUsername === null) {
      this.inMemoryUsername = null;
    }

    return {
      chatId: row.telegram_chat_id || null,
      botToken: resolvedToken || null,
      botUsername: resolvedUsername || null,
      pairingCode: isCodeExpired ? null : row.pairing_code || null,
      pairingCodeExpiresAt: row.pairing_code_expires_at || null,
      isLinked: Boolean(row.telegram_chat_id),
      isPolling: this.isPolling,
    };
  }

  async generatePairingCode(): Promise<{ code: string; expiresAt: string }> {
    await db.init();
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 3; i++) {
      randomPart += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    const code = `ATL-${randomPart}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const existing = await db.select<any>('SELECT id FROM workspace_config LIMIT 1');
    const now = new Date().toISOString();

    if (existing.length === 0) {
      const configId = 'cfg_default';
      await db.execute(
        `INSERT INTO workspace_config (id, user_name, pairing_code, pairing_code_expires_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [configId, 'Creator', code, expiresAt, now, now]
      );
      await syncService.enqueueMutation('workspace_config', configId, 'INSERT', {
        id: configId,
        user_name: 'Creator',
        pairing_code: code,
        pairing_code_expires_at: expiresAt,
        created_at: now,
        updated_at: now,
      });
    } else {
      const configId = existing[0].id;
      await db.execute(
        `UPDATE workspace_config SET pairing_code = ?, pairing_code_expires_at = ?, updated_at = ? WHERE id = ?`,
        [code, expiresAt, now, configId]
      );
      await syncService.enqueueMutation('workspace_config', configId, 'UPDATE', {
        pairing_code: code,
        pairing_code_expires_at: expiresAt,
        updated_at: now,
      });
    }

    void this.notifyListeners();
    return { code, expiresAt };
  }

  async saveCredentials(
    botToken: string,
    chatId?: string,
    botUsername?: string
  ): Promise<void> {
    await db.init();
    const cleanToken = botToken.trim();
    this.inMemoryToken = cleanToken || null;
    if (botUsername) {
      this.inMemoryUsername = botUsername.trim().replace(/^@/, '');
    }

    try {
      if (cleanToken) {
        localStorage.setItem(TelegramService.STORAGE_TOKEN_KEY, cleanToken);
      } else {
        localStorage.removeItem(TelegramService.STORAGE_TOKEN_KEY);
      }

      if (botUsername) {
        localStorage.setItem(TelegramService.STORAGE_USERNAME_KEY, botUsername.trim().replace(/^@/, ''));
      }
    } catch (e) {
      console.warn('[TelegramService] localStorage quota reached; credentials kept in database/memory:', e);
    }

    const cleanChatId = chatId ? chatId.trim() : null;
    const now = new Date().toISOString();

    const existing = await db.select<any>('SELECT id FROM workspace_config LIMIT 1');
    if (existing.length === 0) {
      const configId = 'cfg_default';
      await db.execute(
        `INSERT INTO workspace_config (id, user_name, telegram_chat_id, telegram_bot_token, telegram_bot_username, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [configId, 'Creator', cleanChatId, cleanToken || null, this.inMemoryUsername, now, now]
      );
      await syncService.enqueueMutation('workspace_config', configId, 'INSERT', {
        id: configId,
        user_name: 'Creator',
        telegram_chat_id: cleanChatId,
        telegram_bot_token: cleanToken || null,
        telegram_bot_username: this.inMemoryUsername,
        created_at: now,
        updated_at: now,
      });
    } else {
      const configId = existing[0].id;
      await db.execute(
        `UPDATE workspace_config SET telegram_chat_id = ?, telegram_bot_token = ?, telegram_bot_username = ?, updated_at = ? WHERE id = ?`,
        [cleanChatId, cleanToken || null, this.inMemoryUsername, now, configId]
      );
      await syncService.enqueueMutation('workspace_config', configId, 'UPDATE', {
        telegram_chat_id: cleanChatId,
        telegram_bot_token: cleanToken || null,
        telegram_bot_username: this.inMemoryUsername,
        updated_at: now,
      });
    }

    // Restart polling with new token if provided
    if (cleanToken) {
      await this.startPolling();
    } else {
      this.stopPolling();
    }

    void this.notifyListeners();
  }

  async verifyBotToken(botToken: string): Promise<BotInfoResponse> {
    const clean = botToken.trim();
    if (!clean) {
      return { ok: false, error: 'Token is empty.' };
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${clean}/getMe`);
      const data = await res.json();
      if (data.ok && data.result) {
        return {
          ok: true,
          bot: {
            id: data.result.id,
            first_name: data.result.first_name,
            username: data.result.username,
          },
        };
      }
      return {
        ok: false,
        error: data.description || 'Invalid token response from Telegram API.',
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err.message || 'Network error reaching api.telegram.org',
      };
    }
  }

  async sendTestNotification(
    botToken: string,
    chatId: string
  ): Promise<{ ok: boolean; error?: string }> {
    const cleanToken = botToken.trim();
    const cleanChatId = chatId.trim();

    if (!cleanToken || !cleanChatId) {
      return { ok: false, error: 'Bot token and Chat ID are both required.' };
    }

    try {
      const text =
        `✦ *Atelier Desktop Connected*\n\n` +
        `Your personal Telegram companion bot is active and listening.\n\n` +
        `• /add — Add task (choose Today or Inbox)\n` +
        `• /habit — List today's habits & toggle or increment\n` +
        `• /today — Tasks, habits, and events summary\n` +
        `• /schedule — Weekly schedule details\n` +
        `• /inbox — List inbox tasks\n` +
        `• /todo — Today's tasks & subtasks checklist\n` +
        `• /help — Full command guide`;

      const res = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      const data = await res.json();
      if (data.ok) {
        return { ok: true };
      }
      return { ok: false, error: data.description || 'Failed to deliver message via Telegram.' };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Network error reaching Telegram API.' };
    }
  }

  async unlink(): Promise<void> {
    this.stopPolling();
    this.inMemoryToken = null;
    this.inMemoryUsername = null;
    await db.init();
    try {
      localStorage.removeItem(TelegramService.STORAGE_TOKEN_KEY);
      localStorage.removeItem(TelegramService.STORAGE_USERNAME_KEY);
    } catch {
      // Ignore storage cleanup error
    }
    const now = new Date().toISOString();
    const existing = await db.select<any>('SELECT id FROM workspace_config LIMIT 1');
    if (existing.length > 0) {
      const configId = existing[0].id;
      await db.execute(
        `UPDATE workspace_config SET telegram_chat_id = ?, telegram_bot_token = ?, telegram_bot_username = ?, pairing_code = ?, pairing_code_expires_at = ?, updated_at = ? WHERE id = ?`,
        [null, null, null, null, null, now, configId]
      );
      await syncService.enqueueMutation('workspace_config', configId, 'UPDATE', {
        telegram_chat_id: null,
        telegram_bot_token: null,
        telegram_bot_username: null,
        pairing_code: null,
        pairing_code_expires_at: null,
        updated_at: now,
      });
    }
    void this.notifyListeners();
  }

  // =========================================================================
  // Desktop Long-Polling Engine (Listens for incoming Telegram commands live)
  // =========================================================================

  async startPolling(): Promise<void> {
    const config = await this.getConfig();
    const token = config.botToken;
    if (!token) return;
    if (this.isPolling) return;

    this.isPolling = true;
    this.abortController = new AbortController();
    void this.notifyListeners();

    // Register official 8 bot commands with Telegram so client autocomplete shows them
    try {
      await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [
            { command: 'add', description: 'Add todo task (choose Today or Inbox)' },
            { command: 'habit', description: 'List today habits with checklist or increment' },
            { command: 'today', description: 'Daily summary of tasks, habits, and events' },
            { command: 'schedule', description: 'Show weekly schedule and details' },
            { command: 'inbox', description: 'List all todo tasks in inbox' },
            { command: 'todo', description: 'List today tasks with subtasks and checklist' },
            { command: 'help', description: 'List all available bot commands' },
          ],
        }),
      });
    } catch (e) {
      console.warn('[TelegramPolling] Could not register bot commands menu:', e);
    }

    // Clear any stale webhook so getUpdates works properly
    try {
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
    } catch (err) {
      console.warn('[TelegramPolling] Could not delete webhook prior to polling:', err);
    }

    // Start background reminder checks (06:00, 16:00, 21:00, 3h advance alerts)
    this.startReminderScheduler();

    console.log('[TelegramPolling] Starting desktop long-polling loop...');
    this.pollLoop(token);
  }

  stopPolling(): void {
    if (!this.isPolling) return;
    this.isPolling = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.reminderIntervalTimer) {
      clearInterval(this.reminderIntervalTimer);
      this.reminderIntervalTimer = null;
    }
    console.log('[TelegramPolling] Stopped desktop long-polling.');
    void this.notifyListeners();
  }

  private async pollLoop(token: string): Promise<void> {
    while (this.isPolling) {
      try {
        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=20`;
        const res = await fetch(url, {
          signal: this.abortController?.signal,
        });

        if (!res.ok) {
          if (res.status === 409) {
            console.warn('[TelegramPolling] Conflict (another webhook/poller is active). Retrying in 5s...');
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }
          await new Promise((resolve) => setTimeout(resolve, 3000));
          continue;
        }

        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            await this.handleUpdate(token, update);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  // =========================================================================
  // Command & Callback Handlers
  // =========================================================================

  private async handleUpdate(token: string, update: any): Promise<void> {
    // 1. Incoming text commands
    if (update.message?.text) {
      const msg = update.message;
      const text: string = msg.text.trim();
      const chatId = String(msg.chat.id);

      if (text.startsWith('/add')) {
        await this.handleAddCommand(token, chatId, text);
      } else if (text.startsWith('/habit')) {
        await this.handleHabitCommand(token, chatId);
      } else if (text.startsWith('/today')) {
        await this.handleTodayCommand(token, chatId);
      } else if (text.startsWith('/schedule')) {
        await this.handleScheduleCommand(token, chatId);
      } else if (text.startsWith('/inbox')) {
        await this.handleInboxCommand(token, chatId);
      } else if (text.startsWith('/todo')) {
        await this.handleTodoCommand(token, chatId);
      } else if (text.startsWith('/help')) {
        await this.handleHelpCommand(token, chatId);
      } else if (text.startsWith('/start') || text.startsWith('/pair')) {
        await this.handleStartOrPairCommand(token, chatId, text);
      }
      return;
    }

    // 2. Inline keyboard callbacks
    if (update.callback_query) {
      await this.handleCallbackQuery(token, update.callback_query);
    }
  }

  private async sendMessage(
    token: string,
    chatId: string,
    text: string,
    replyMarkup?: any
  ): Promise<any> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error('[TelegramService] sendMessage error:', err);
    }
  }

  private async editMessageText(
    token: string,
    chatId: string,
    messageId: number,
    text: string,
    replyMarkup?: any
  ): Promise<void> {
    try {
      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
        }),
      });
    } catch (err) {
      console.error('[TelegramService] editMessageText error:', err);
    }
  }

  private async answerCallback(token: string, callbackQueryId: string, text?: string): Promise<void> {
    try {
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
        }),
      });
    } catch (err) {
      console.error('[TelegramService] answerCallback error:', err);
    }
  }

  // -------------------------------------------------------------------------
  // 1. /add — Add task with destination choice (Today or Inbox)
  // -------------------------------------------------------------------------
  private async handleAddCommand(token: string, chatId: string, text: string): Promise<void> {
    const raw = text.replace(/^\/add(@\w+)?/i, '').trim();
    if (!raw) {
      await this.sendMessage(
        token,
        chatId,
        `✦ *Add Task*\n\n` +
          `Usage:\n` +
          `• \`/add <task title>\` — prompt to choose Today or Inbox\n` +
          `• \`/add today <task title>\` — add directly to Today\n` +
          `• \`/add inbox <task title>\` — add directly to Inbox\n\n` +
          `_Example:_ \`/add Review roadmap\``
      );
      return;
    }

    // Direct shortcut: /add today <title>
    if (/^today\s+/i.test(raw)) {
      const title = raw.replace(/^today\s+/i, '').trim();
      const todayStr = getTodayDateString();
      await taskService.createTask({ title, scheduledDate: todayStr });
      await useTasksStore.getState().loadTasks();
      await this.sendMessage(token, chatId, `✓ *Added to Today's Tasks*\n\n"${title}"`);
      return;
    }

    // Direct shortcut: /add inbox <title>
    if (/^inbox\s+/i.test(raw)) {
      const title = raw.replace(/^inbox\s+/i, '').trim();
      await taskService.createTask({ title, scheduledDate: null });
      await useTasksStore.getState().loadTasks();
      await this.sendMessage(token, chatId, `✓ *Added to Inbox Backlog*\n\n"${title}"`);
      return;
    }

    // Interactive choice: prompt Today vs Inbox buttons
    const draftId = `d_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.pendingDraftTasks.set(draftId, raw);

    const keyboard = {
      inline_keyboard: [
        [
          { text: 'Add to Today', callback_data: `add_dest:today:${draftId}` },
          { text: 'Add to Inbox', callback_data: `add_dest:inbox:${draftId}` },
        ],
      ],
    };

    await this.sendMessage(
      token,
      chatId,
      `✦ *Choose Destination for Task*\n\n"${raw}"`,
      keyboard
    );
  }

  // -------------------------------------------------------------------------
  // 2. /habit — List all habits active for today with checklist or increment
  // -------------------------------------------------------------------------
  private async handleHabitCommand(token: string, chatId: string, editMessageId?: number): Promise<void> {
    const todayStr = getTodayDateString();
    const [allRoutines, logs] = await Promise.all([
      routineService.getAllRoutines(),
      routineService.getTodayLogs(todayStr),
    ]);

    // Only habits active today that need to be done
    const routines = allRoutines.filter((r) => routineService.isRoutineActiveOnDate(r, todayStr));

    if (routines.length === 0) {
      const emptyText = `✦ *Today's Habits*\n\nNo habits scheduled for today (${todayStr}).`;
      if (editMessageId) {
        await this.editMessageText(token, chatId, editMessageId, emptyText);
      } else {
        await this.sendMessage(token, chatId, emptyText);
      }
      return;
    }

    let text = `✦ *Today's Habits* (${todayStr})\n\n`;
    const inlineKeyboard: any[][] = [];

    routines.forEach((r, idx) => {
      const log = logs.find((l: any) => l.routineId === r.id || l.routine_id === r.id);
      const count = (log as any)?.currentCount ?? (log as any)?.current_count ?? 0;
      const isDone = Boolean(log?.completed);
      const target = r.targetCount || (r as any).target_count || 1;

      text += `${idx + 1}. ${isDone ? '[✓]' : '[ ]'} *${r.title}* (${count}/${target})\n`;

      if (target > 1) {
        // Repeating habit: option to increment (+1) or toggle complete
        inlineKeyboard.push([
          {
            text: `+1 ${r.title.length > 14 ? r.title.substring(0, 12) + '…' : r.title} (${count}/${target})`,
            callback_data: `habit_inc:${r.id}`,
          },
          {
            text: isDone ? 'Reopen' : '✓ Done',
            callback_data: `habit_toggle:${r.id}`,
          },
        ]);
      } else {
        // Boolean habit: checklist toggle
        inlineKeyboard.push([
          {
            text: `${isDone ? '↩ Reopen' : '✓ Check'}: ${r.title.length > 20 ? r.title.substring(0, 18) + '…' : r.title}`,
            callback_data: `habit_toggle:${r.id}`,
          },
        ]);
      }
    });

    const replyMarkup = inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined;

    if (editMessageId) {
      await this.editMessageText(token, chatId, editMessageId, text, replyMarkup);
    } else {
      await this.sendMessage(token, chatId, text, replyMarkup);
    }
  }

  // -------------------------------------------------------------------------
  // 3. /today — Daily summary of tasks, habits, and events
  // -------------------------------------------------------------------------
  public async handleTodayCommand(token: string, chatId: string): Promise<void> {
    const todayStr = getTodayDateString();
    const [tasks, allRoutines, logs, events] = await Promise.all([
      taskService.getTodayTasks(todayStr),
      routineService.getAllRoutines(),
      routineService.getTodayLogs(todayStr),
      calendarService.getEvents(),
    ]);

    const routines = allRoutines.filter((r) => routineService.isRoutineActiveOnDate(r, todayStr));
    const todayEvents = events.filter((e) => e.date === todayStr);
    const completedTasksCount = tasks.filter((t) => t.completed).length;
    const completedHabitsCount = routines.filter((r) => {
      const log = logs.find((l: any) => l.routineId === r.id || l.routine_id === r.id);
      return Boolean(log?.completed);
    }).length;

    let text = `✦ *Atelier Today Overview*\n_Date: ${todayStr}_\n\n`;

    // Tasks section
    text += `*Todo Tasks (${completedTasksCount}/${tasks.length}):*\n`;
    if (tasks.length === 0) {
      text += `_No tasks scheduled for today. Use /add to create one._\n`;
    } else {
      tasks.forEach((t) => {
        text += `${t.completed ? '[✓] ~' + t.title + '~' : '[ ] ' + t.title}\n`;
      });
    }
    text += '\n';

    // Habits section
    text += `*Daily Habits (${completedHabitsCount}/${routines.length}):*\n`;
    if (routines.length === 0) {
      text += `_No habits active._\n`;
    } else {
      routines.forEach((r) => {
        const log = logs.find((l: any) => l.routineId === r.id || l.routine_id === r.id);
        const count = (log as any)?.currentCount ?? (log as any)?.current_count ?? 0;
        const isDone = Boolean(log?.completed);
        const target = r.targetCount || (r as any).target_count || 1;
        text += `${isDone ? '[✓]' : '[ ]'} ${r.title} (${count}/${target})\n`;
      });
    }
    text += '\n';

    // Events section
    text += `*Scheduled Events (${todayEvents.length}):*\n`;
    if (todayEvents.length === 0) {
      text += `_No calendar events scheduled for today._\n`;
    } else {
      todayEvents.forEach((e) => {
        text += `• ${e.startTime || ''}${e.endTime ? ' - ' + e.endTime : ''} | *${e.title}* [${e.category || 'Event'}]\n`;
      });
    }

    // Quick completion action buttons for open tasks
    const openTasks = tasks.filter((t) => !t.completed).slice(0, 4);
    const inlineKeyboard = openTasks.map((t) => [
      {
        text: `✓ Done: ${t.title.length > 22 ? t.title.substring(0, 20) + '…' : t.title}`,
        callback_data: `todo_toggle:${t.id}`,
      },
    ]);

    await this.sendMessage(
      token,
      chatId,
      text,
      inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined
    );
  }

  // -------------------------------------------------------------------------
  // 4. /schedule — Weekly schedule with details & recurring blocks
  // -------------------------------------------------------------------------
  private async handleScheduleCommand(token: string, chatId: string): Promise<void> {
    const recurringBlocks = calendarService.getRecurringWeeklyBlocks();
    const events = await calendarService.getEvents();

    const daysMap: Record<number, string> = {
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
      0: 'Sunday',
    };

    let text = `✦ *Atelier Weekly Schedule*\n\n`;

    // Group recurring blocks by day
    for (const dayNum of [1, 2, 3, 4, 5, 6, 0]) {
      const dayName = daysMap[dayNum];
      const dayBlocks = recurringBlocks.filter((b) => b.dayOfWeek === dayNum);
      if (dayBlocks.length > 0) {
        text += `*${dayName}:*\n`;
        dayBlocks.forEach((b) => {
          const start = b.startFormatted || b.timeSlot;
          const end = b.endFormatted || '';
          text += `• ${start}${end ? ' - ' + end : ''} | *${b.title}* [${b.category || 'Block'}]\n`;
        });
        text += '\n';
      }
    }

    // Upcoming calendar events for current week
    if (events.length > 0) {
      const upcoming = events.slice(0, 5);
      text += `*Upcoming Calendar Events:*\n`;
      upcoming.forEach((e) => {
        text += `• ${e.date || ''} ${e.startTime || ''} | *${e.title}*\n`;
      });
    }

    await this.sendMessage(token, chatId, text);
  }

  // -------------------------------------------------------------------------
  // 5. /inbox — List all todo tasks in inbox
  // -------------------------------------------------------------------------
  private async handleInboxCommand(token: string, chatId: string, editMessageId?: number): Promise<void> {
    const inboxTasks = await taskService.getInboxTasks();

    if (inboxTasks.length === 0) {
      const emptyText = `✦ *Inbox Backlog*\n\nInbox is empty. No unscheduled tasks.`;
      if (editMessageId) {
        await this.editMessageText(token, chatId, editMessageId, emptyText);
      } else {
        await this.sendMessage(token, chatId, emptyText);
      }
      return;
    }

    let text = `✦ *Inbox Backlog* (${inboxTasks.length} tasks)\n\n`;
    inboxTasks.forEach((t, idx) => {
      text += `${idx + 1}. *${t.title}*\n`;
    });
    text += `\n_Tap button below to move any task to Today._`;

    // Quick move buttons for first 5 inbox tasks
    const inlineKeyboard = inboxTasks.slice(0, 5).map((t) => [
      {
        text: `-> Move to Today: ${t.title.length > 20 ? t.title.substring(0, 18) + '…' : t.title}`,
        callback_data: `move_task:${t.id}`,
      },
    ]);

    const replyMarkup = inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined;

    if (editMessageId) {
      await this.editMessageText(token, chatId, editMessageId, text, replyMarkup);
    } else {
      await this.sendMessage(token, chatId, text, replyMarkup);
    }
  }

  // -------------------------------------------------------------------------
  // 6. /todo — List today tasks with subtasks and checklist toggle
  // -------------------------------------------------------------------------
  private async handleTodoCommand(token: string, chatId: string, editMessageId?: number): Promise<void> {
    const todayStr = getTodayDateString();
    const tasks = await taskService.getTodayTasks(todayStr);

    if (tasks.length === 0) {
      const emptyText = `✦ *Today's Todo Tasks*\n\nNo tasks scheduled for today. Use /add to add a task.`;
      if (editMessageId) {
        await this.editMessageText(token, chatId, editMessageId, emptyText);
      } else {
        await this.sendMessage(token, chatId, emptyText);
      }
      return;
    }

    let text = `✦ *Today's Todo Tasks* (${todayStr})\n\n`;
    const inlineKeyboard: any[][] = [];

    tasks.forEach((t, idx) => {
      const isDone = t.completed;
      text += `${idx + 1}. ${isDone ? '[✓] ~' + t.title + '~' : '[ ] *' + t.title + '*'}\n`;

      // Render subtasks
      if (t.subtasks && t.subtasks.length > 0) {
        t.subtasks.forEach((sub: TaskSubtask) => {
          text += `    └ ${sub.completed ? '[✓] ~' + sub.title + '~' : '[ ] ' + sub.title}\n`;
        });
      }

      // Action button for task
      const actionRow: any[] = [
        {
          text: isDone ? `↩ Reopen: ${t.title.slice(0, 16)}` : `✓ Done: ${t.title.slice(0, 16)}`,
          callback_data: `todo_toggle:${t.id}`,
        },
      ];

      // If task has incomplete subtasks, offer quick subtask check button
      const openSubtask = t.subtasks?.find((s) => !s.completed);
      if (openSubtask && !isDone) {
        actionRow.push({
          text: `✓ Subtask: ${openSubtask.title.slice(0, 12)}`,
          callback_data: `subtask_toggle:${t.id}:${openSubtask.id}`,
        });
      }

      inlineKeyboard.push(actionRow);
    });

    const replyMarkup = inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined;

    if (editMessageId) {
      await this.editMessageText(token, chatId, editMessageId, text, replyMarkup);
    } else {
      await this.sendMessage(token, chatId, text, replyMarkup);
    }
  }

  // -------------------------------------------------------------------------
  // 7. /help — Full command guide & reminder schedule
  // -------------------------------------------------------------------------
  private async handleHelpCommand(token: string, chatId: string): Promise<void> {
    await this.sendMessage(
      token,
      chatId,
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
        `• 16:00 — Afternoon unfinished tasks & habits check-in\n` +
        `• 21:00 — Evening unfinished tasks & habits review\n` +
        `• 3h Advance — Advance alert before scheduled events & blocks`
    );
  }

  private async handleStartOrPairCommand(token: string, chatId: string, text: string): Promise<void> {
    const parts = text.split(/\s+/);
    const code = parts[1]?.trim().toUpperCase();

    if (code && code.startsWith('ATL-')) {
      const config = await this.getConfig();
      if (!config.pairingCode || config.pairingCode.toUpperCase() !== code) {
        await this.sendMessage(
          token,
          chatId,
          `❌ *Invalid or expired pairing code.*\nPlease generate a fresh code in Atelier (Footer → Telegram).`
        );
        return;
      }

      await this.saveCredentials(token, chatId, config.botUsername || undefined);
      await this.sendMessage(
        token,
        chatId,
        `✦ *Successfully Linked to Atelier!*\n\nUse \`/help\` to view all commands.`
      );
      return;
    }

    await this.handleHelpCommand(token, chatId);
  }

  // -------------------------------------------------------------------------
  // Callback Query Engine (Interactive Buttons)
  // -------------------------------------------------------------------------
  private async handleCallbackQuery(token: string, cb: any): Promise<void> {
    const data: string = cb.data || '';
    const chatId = String(cb.message?.chat?.id || '');
    const messageId = cb.message?.message_id;

    // A. Task destination choice from /add
    if (data.startsWith('add_dest:')) {
      const [, dest, draftId] = data.split(':');
      const title = this.pendingDraftTasks.get(draftId);
      if (!title) {
        await this.answerCallback(token, cb.id, 'Draft expired. Please run /add again.');
        return;
      }
      this.pendingDraftTasks.delete(draftId);

      const scheduledDate = dest === 'today' ? getTodayDateString() : null;
      await taskService.createTask({ title, scheduledDate });
      await useTasksStore.getState().loadTasks();

      const label = dest === 'today' ? "Today's Tasks" : 'Inbox Backlog';
      await this.answerCallback(token, cb.id, `Added to ${label}`);
      if (messageId) {
        await this.editMessageText(
          token,
          chatId,
          messageId,
          `✓ *Task Added to ${label}*\n\n"${title}"`
        );
      }
      return;
    }

    // B. Habit toggle or increment
    if (data.startsWith('habit_inc:')) {
      const routineId = data.replace('habit_inc:', '');
      await routineService.updateRoutineCount(routineId, 1);
      await useRoutinesStore.getState().loadRoutines();
      await this.answerCallback(token, cb.id, '+1 count recorded!');
      if (messageId) {
        await this.handleHabitCommand(token, chatId, messageId);
      }
      return;
    }

    if (data.startsWith('habit_toggle:')) {
      const routineId = data.replace('habit_toggle:', '');
      const todayStr = getTodayDateString();
      const logs = await routineService.getTodayLogs(todayStr);
      const existing = logs.find((l: any) => l.routineId === routineId || l.routine_id === routineId);
      const nextCompleted = !existing?.completed;

      await routineService.toggleRoutine(routineId, nextCompleted);
      await useRoutinesStore.getState().loadRoutines();
      await this.answerCallback(token, cb.id, nextCompleted ? '✓ Completed!' : 'Reopened');
      if (messageId) {
        await this.handleHabitCommand(token, chatId, messageId);
      }
      return;
    }

    // C. Todo toggle (today tasks)
    if (data.startsWith('todo_toggle:')) {
      const taskId = data.replace('todo_toggle:', '');
      const todayStr = getTodayDateString();
      const tasks = await taskService.getTodayTasks(todayStr);
      const target = tasks.find((t) => t.id === taskId);
      const nextCompleted = !target?.completed;

      await taskService.toggleTask(taskId, nextCompleted);
      await useTasksStore.getState().loadTasks();
      await this.answerCallback(token, cb.id, nextCompleted ? '✓ Task done!' : 'Task reopened');
      if (messageId) {
        await this.handleTodoCommand(token, chatId, messageId);
      }
      return;
    }

    // D. Subtask toggle
    if (data.startsWith('subtask_toggle:')) {
      const parts = data.split(':');
      const taskId = parts[1];
      const subtaskId = parts[2];

      await taskService.toggleSubtask(taskId, subtaskId);
      await useTasksStore.getState().loadTasks();
      await this.answerCallback(token, cb.id, '✓ Subtask updated!');
      if (messageId) {
        await this.handleTodoCommand(token, chatId, messageId);
      }
      return;
    }

    // E. Move task from inbox to today
    if (data.startsWith('move_task:')) {
      const taskId = data.replace('move_task:', '');
      const todayStr = getTodayDateString();
      await taskService.updateTaskScheduledDate(taskId, todayStr);
      await useTasksStore.getState().loadTasks();

      await this.answerCallback(token, cb.id, '✓ Moved to Today!');
      if (messageId) {
        await this.handleInboxCommand(token, chatId, messageId);
      }
      return;
    }

    await this.answerCallback(token, cb.id);
  }

  // =========================================================================
  // Automated Reminder Engine:
  // - 06:00 Morning /today briefing
  // - 16:00 Afternoon unfinished tasks & habits check-in
  // - 21:00 Evening unfinished tasks & habits review
  // - 3 hours before scheduled event or recurring schedule block
  // =========================================================================

  private startReminderScheduler(): void {
    if (this.reminderIntervalTimer) {
      clearInterval(this.reminderIntervalTimer);
    }

    // Check every 30 seconds
    this.reminderIntervalTimer = setInterval(() => {
      void this.runScheduledRemindersCheck();
    }, 30000);
  }

  private async runScheduledRemindersCheck(): Promise<void> {
    const config = await this.getConfig();
    if (!config.isLinked || !config.botToken || !config.chatId) {
      return;
    }

    const token = config.botToken;
    const chatId = config.chatId;

    const now = new Date();
    const hours = now.getHours();
    const todayStr = getTodayDateString();

    // 1. Morning 06:00 Daily Briefing
    const key0600 = `briefing_0600_${todayStr}`;
    if (hours === 6 && !this.sentReminders.has(key0600)) {
      this.sentReminders.add(key0600);
      await this.handleTodayCommand(token, chatId);
    }

    // 2. Afternoon 16:00 Unfinished Items Check-in
    const key1600 = `checkin_1600_${todayStr}`;
    if (hours === 16 && !this.sentReminders.has(key1600)) {
      this.sentReminders.add(key1600);
      await this.sendIncompleteReminder(token, chatId, 'Afternoon Check-in (16:00)');
    }

    // 3. Evening 21:00 Unfinished Items Review
    const key2100 = `checkin_2100_${todayStr}`;
    if (hours === 21 && !this.sentReminders.has(key2100)) {
      this.sentReminders.add(key2100);
      await this.sendIncompleteReminder(token, chatId, 'Evening Review (21:00)');
    }

    // 4. 3 Hours Advance Reminder for Events
    try {
      const events = await calendarService.getEvents();
      for (const ev of events) {
        if (!ev.startTime || ev.date !== todayStr) continue;
        const [eh, em] = ev.startTime.split(':').map(Number);
        if (isNaN(eh)) continue;

        const evDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em || 0, 0);
        const diffMinutes = Math.round((evDate.getTime() - now.getTime()) / 60000);

        // Window: 170 to 185 minutes (~3 hours prior)
        const evKey = `event_3h_${ev.id}_${todayStr}`;
        if (diffMinutes >= 170 && diffMinutes <= 185 && !this.sentReminders.has(evKey)) {
          this.sentReminders.add(evKey);
          await this.sendMessage(
            token,
            chatId,
            `✦ *Upcoming Event Reminder (in 3 hours)*\n\n` +
              `• *${ev.title}*\n` +
              `• Time: ${ev.startTime}${ev.endTime ? ' - ' + ev.endTime : ''}\n` +
              `• Category: ${ev.category || 'General'}\n` +
              (ev.description ? `• Details: ${ev.description}\n` : '')
          );
        }
      }
    } catch (e) {
      console.warn('[TelegramScheduler] Event check error:', e);
    }

    // 5. 3 Hours Advance Reminder for Recurring Schedule Blocks
    try {
      const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
      const blocks = calendarService.getRecurringWeeklyBlocks();
      for (const block of blocks) {
        if (block.dayOfWeek !== currentDayOfWeek) continue;
        const timeSlot = block.startFormatted || block.timeSlot;
        if (!timeSlot) continue;

        const [bh, bm] = timeSlot.split(':').map(Number);
        if (isNaN(bh)) continue;

        const bDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), bh, bm || 0, 0);
        const diffMinutes = Math.round((bDate.getTime() - now.getTime()) / 60000);

        const bKey = `schedule_3h_${block.id}_${todayStr}`;
        if (diffMinutes >= 170 && diffMinutes <= 185 && !this.sentReminders.has(bKey)) {
          this.sentReminders.add(bKey);
          await this.sendMessage(
            token,
            chatId,
            `✦ *Upcoming Schedule Reminder (in 3 hours)*\n\n` +
              `• *${block.title}*\n` +
              `• Time: ${block.startFormatted || block.timeSlot}${block.endFormatted ? ' - ' + block.endFormatted : ''}\n` +
              `• Category: ${block.category || 'Schedule'}`
          );
        }
      }
    } catch (e) {
      console.warn('[TelegramScheduler] Schedule block check error:', e);
    }
  }

  private async sendIncompleteReminder(token: string, chatId: string, label: string): Promise<void> {
    const todayStr = getTodayDateString();
    const [tasks, allRoutines, logs] = await Promise.all([
      taskService.getTodayTasks(todayStr),
      routineService.getAllRoutines(),
      routineService.getTodayLogs(todayStr),
    ]);

    const routines = allRoutines.filter((r) => routineService.isRoutineActiveOnDate(r, todayStr));
    const pendingTasks = tasks.filter((t) => !t.completed);
    const pendingHabits = routines.filter((r) => {
      const log = logs.find((l: any) => l.routineId === r.id || l.routine_id === r.id);
      return !log?.completed;
    });

    if (pendingTasks.length === 0 && pendingHabits.length === 0) {
      return;
    }

    let text = `✦ *${label}*\n\nYou have unfinished items for today:\n\n`;
    if (pendingTasks.length > 0) {
      text += `*Remaining Tasks (${pendingTasks.length}):*\n`;
      pendingTasks.forEach((t) => {
        text += `• ${t.title}\n`;
      });
      text += '\n';
    }

    if (pendingHabits.length > 0) {
      text += `*Remaining Habits (${pendingHabits.length}):*\n`;
      pendingHabits.forEach((r) => {
        const log = logs.find((l: any) => l.routineId === r.id || l.routine_id === r.id);
        const count = (log as any)?.currentCount ?? (log as any)?.current_count ?? 0;
        const target = r.targetCount || (r as any).target_count || 1;
        text += `• ${r.title} (${count}/${target})\n`;
      });
      text += '\n';
    }

    text += `_Use /todo or /habit to check them off._`;

    await this.sendMessage(token, chatId, text);
  }
}

export const telegramService = new TelegramService();

// Clean up background polling loop on Vite Hot Module Replacement (HMR)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    telegramService.stopPolling();
  });
}
