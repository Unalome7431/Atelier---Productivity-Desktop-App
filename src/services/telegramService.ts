import { db } from '@/db/database';
import { syncService } from './syncService';
import { taskService } from './taskService';
import { noteService } from './noteService';
import { kanbanService } from './kanbanService';
import { routineService } from './routineService';
import { useTasksStore } from '@/stores/useTasksStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { getTodayDateString } from '@/lib/utils';

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

  async generatePairingCode(): Promise<{ code: string; expiresAt: string; command: string }> {
    await db.init();
    // 6-character clean pairing code: ATL-XXX (3 random alphanumeric uppercase chars)
    const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
    const code = `ATL-${randomChars}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins validity
    const now = new Date().toISOString();

    const existing = await db.select<any>('SELECT id FROM workspace_config LIMIT 1');
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
    return {
      code,
      expiresAt,
      command: `/pair ${code}`,
    };
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
      console.warn('[TelegramService] localStorage quota reached; storing credentials in database/memory only:', e);
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
        `• Quick capture tasks: \`/todo <title>\`\n` +
        `• Add Kanban cards: \`/kanban <board> <title>\`\n` +
        `• Daily agenda: \`/agenda\`\n` +
        `• Focus status: \`/focus\``;

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

    // Clear any stale webhook so getUpdates is allowed by Telegram API
    try {
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
    } catch (err) {
      console.warn('[TelegramPolling] Could not delete webhook prior to polling:', err);
    }

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
    console.log('[TelegramPolling] Stopped desktop long-polling.');
    void this.notifyListeners();
  }

  isPollingActive(): boolean {
    return this.isPolling;
  }

  private async pollLoop(token: string): Promise<void> {
    while (this.isPolling) {
      try {
        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.lastUpdateId ? this.lastUpdateId + 1 : 0}&timeout=20`;
        const res = await fetch(url, { signal: this.abortController?.signal });
        if (!res.ok) {
          // If conflict or network error, wait a few seconds before retrying
          await new Promise((r) => setTimeout(r, 4000));
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
        if (err.name === 'AbortError') break;
        console.warn('[TelegramPolling] Polling tick error (retrying):', err);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  private async handleUpdate(token: string, update: any): Promise<void> {
    // 1. Handle incoming text messages & commands
    if (update.message?.text) {
      const msg = update.message;
      const text: string = msg.text.trim();
      const chatId = String(msg.chat.id);

      if (text.startsWith('/start')) {
        await this.handleStartCommand(token, chatId);
      } else if (text.startsWith('/help')) {
        await this.handleHelpCommand(token, chatId);
      } else if (text.startsWith('/pair')) {
        await this.handlePairCommand(token, chatId, text);
      } else if (text.startsWith('/todo')) {
        await this.handleTodoCommand(token, chatId, text);
      } else if (text.startsWith('/kanban')) {
        await this.handleKanbanCommand(token, chatId, text);
      } else if (text.startsWith('/note')) {
        await this.handleNoteCommand(token, chatId, text);
      } else if (text.startsWith('/agenda')) {
        await this.handleAgendaCommand(token, chatId);
      } else if (text.startsWith('/focus')) {
        await this.handleFocusCommand(token, chatId);
      }
      return;
    }

    // 2. Handle callback queries from inline action keyboards
    if (update.callback_query) {
      await this.handleCallbackQuery(token, update.callback_query);
    }
  }

  private async sendMessage(
    token: string,
    chatId: string,
    text: string,
    replyMarkup?: any
  ): Promise<void> {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
        }),
      });
    } catch (err) {
      console.error('[TelegramService] sendMessage error:', err);
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

  private async handleStartCommand(token: string, chatId: string): Promise<void> {
    const config = await this.getConfig();
    const isPaired = config.chatId === chatId;

    if (isPaired) {
      await this.sendMessage(
        token,
        chatId,
        `✦ *Atelier Personal Operating System*\n\n` +
          `Your desktop workspace is active and paired.\n\n` +
          `• \`/todo <title>\` — Add task to Today's queue\n` +
          `• \`/kanban <board> <title>\` — Add card to Kanban board\n` +
          `• \`/note <text>\` — Capture an inbox note\n` +
          `• \`/agenda\` — View today's agenda & routines\n` +
          `• \`/focus\` — View live Pomodoro focus status\n` +
          `• \`/help\` — Detailed command reference`
      );
    } else {
      await this.sendMessage(
        token,
        chatId,
        `✦ *Welcome to Atelier*\n\n` +
          `Your personal desktop cockpit companion bot.\n\n` +
          `To link this chat to your desktop:\n` +
          `1. Open Atelier on your computer.\n` +
          `2. Click *Telegram* in the status footer.\n` +
          `3. Click *Generate Code* (e.g. \`ATL-984\`).\n` +
          `4. Send \`/pair <code>\` right here.\n\n` +
          `_Example:_ \`/pair ATL-984\``
      );
    }
  }

  private async handleHelpCommand(token: string, chatId: string): Promise<void> {
    await this.sendMessage(
      token,
      chatId,
      `✦ *Atelier Telegram Commands*\n\n` +
        `*/pair <code>*\n` +
        `Link this chat with your desktop workspace.\n\n` +
        `*/todo <title>*\n` +
        `Schedule a task into Today's queue on your desktop.\n` +
        `_Example:_ \`/todo Finalize Q3 design sprint\`\n\n` +
        `*/kanban <board> <title>*\n` +
        `Drop a new card into a Kanban board's Planned column.\n` +
        `_Example:_ \`/kanban "Project A" Fix API contract\`\n\n` +
        `*/note <text>*\n` +
        `Save a quick reference note into your Notes Inbox.\n` +
        `_Example:_ \`/note Meeting note: soft minimalism style guide\`\n\n` +
        `*/agenda*\n` +
        `Show today's habit routines and tasks with one-tap completion buttons.\n\n` +
        `*/focus*\n` +
        `View daily Pomodoro cycle goals and active timer status.`
    );
  }

  private async handlePairCommand(token: string, chatId: string, text: string): Promise<void> {
    const parts = text.split(/\s+/);
    const code = parts[1]?.trim().toUpperCase();

    if (!code) {
      await this.sendMessage(
        token,
        chatId,
        `Please specify your pairing code.\n_Example:_ \`/pair ATL-984\`\n\nGenerate your code in Atelier: Footer → Telegram → Generate Code.`
      );
      return;
    }

    const config = await this.getConfig();
    if (!config.pairingCode || config.pairingCode.toUpperCase() !== code) {
      await this.sendMessage(
        token,
        chatId,
        `❌ *Invalid or expired pairing code.*\n\nPairing codes expire after 15 minutes. Please generate a fresh code in Atelier (Footer → Telegram).`
      );
      return;
    }

    // Save chat ID and complete pairing
    await this.saveCredentials(token, chatId, config.botUsername || undefined);

    await this.sendMessage(
      token,
      chatId,
      `✦ *Successfully Linked to Atelier!*\n\n` +
        `Your Telegram account is now paired with your workspace.\n\n` +
        `Tasks and notes you send here will immediately appear on your desktop screen.`
    );
  }

  private async handleTodoCommand(token: string, chatId: string, text: string): Promise<void> {
    const title = text.replace(/^\/todo(@\w+)?/i, '').trim();
    if (!title) {
      await this.sendMessage(
        token,
        chatId,
        'Please provide a task title.\n_Example:_ `/todo Finalize Q3 design sprint`'
      );
      return;
    }

    const todayStr = getTodayDateString();
    const task = await taskService.createTask({
      title,
      scheduledDate: todayStr,
    });

    // Refresh reactive UI in desktop app immediately
    await useTasksStore.getState().loadTasks();

    const keyboard = {
      inline_keyboard: [[{ text: '✓ Mark Done', callback_data: `done:${task.id}` }]],
    };

    await this.sendMessage(
      token,
      chatId,
      `✓ *Task Scheduled for Today*\n\n"${title}"\n\n_Added to Daily Cockpit._`,
      keyboard
    );
  }

  private async handleKanbanCommand(token: string, chatId: string, text: string): Promise<void> {
    const raw = text.replace(/^\/kanban(@\w+)?/i, '').trim();
    if (!raw) {
      await this.sendMessage(
        token,
        chatId,
        'Please provide a board name and card title.\n_Example:_ `/kanban "Project A" Fix layout regression`'
      );
      return;
    }

    let boardName = '';
    let cardTitle = raw;

    const quoted = raw.match(/^"([^"]+)"\s+(.+)$/);
    if (quoted) {
      boardName = quoted[1];
      cardTitle = quoted[2];
    } else {
      const parts = raw.split(/\s+/);
      if (parts.length > 1) {
        boardName = parts[0];
        cardTitle = parts.slice(1).join(' ');
      }
    }

    const boards = await kanbanService.getBoards();
    let board = boards.find(
      (b) => b.title.toLowerCase() === boardName.toLowerCase() || b.id === boardName
    );
    if (!board && boards.length > 0) {
      board = boards[0];
    }

    if (!board) {
      await this.sendMessage(
        token,
        chatId,
        `No Kanban boards found. Open Atelier on desktop to create a board first.`
      );
      return;
    }

    const columns = board.columns || [];
    const targetCol = columns[0];
    if (!targetCol) {
      await this.sendMessage(token, chatId, `Board *${board.title}* has no columns configured.`);
      return;
    }

    await kanbanService.addCard(board.id, targetCol.id, cardTitle);
    await useKanbanStore.getState().loadBoards();

    await this.sendMessage(
      token,
      chatId,
      `✓ *Kanban Card Created*\n\nBoard: *${board.title}*\nColumn: *${targetCol.title}*\nCard: "${cardTitle}"`
    );
  }

  private async handleNoteCommand(token: string, chatId: string, text: string): Promise<void> {
    const raw = text.replace(/^\/note(@\w+)?/i, '').trim();
    if (!raw) {
      await this.sendMessage(
        token,
        chatId,
        'Please provide note text.\n_Example:_ `/note Architectural review notes`'
      );
      return;
    }

    const title = raw.length > 40 ? raw.substring(0, 37) + '...' : raw;
    await noteService.createNote({
      title,
      content: `<p>${raw}</p>`,
      folder: 'Inbox',
      categoryColor: '#EEEDFD',
    });

    await useNotesStore.getState().loadNotes();

    await this.sendMessage(
      token,
      chatId,
      `✓ *Note Captured to Inbox*\n\n"${title}"\n\n_Available in Notes & Docs._`
    );
  }

  private async handleAgendaCommand(token: string, chatId: string): Promise<void> {
    const todayStr = getTodayDateString();
    const [routines, logs, todayTasks] = await Promise.all([
      routineService.getAllRoutines(),
      routineService.getTodayLogs(todayStr),
      taskService.getTodayTasks(todayStr),
    ]);

    let message = `✦ *Atelier Agenda for Today*\n_${todayStr}_\n\n`;

    if (routines.length > 0) {
      message += `*Daily Habits:*\n`;
      for (const r of routines) {
        const log = logs.find((l: any) => l.routineId === r.id || l.routine_id === r.id);
        const count = (log as any)?.currentCount ?? (log as any)?.current_count ?? 0;
        const isDone = log?.completed;
        message += `${isDone ? '✓' : '○'} ${r.title} (${count}/${r.targetCount || (r as any).target_count || 1})\n`;
      }
      message += `\n`;
    }

    if (todayTasks.length > 0) {
      message += `*Today's Tactical Tasks:*\n`;
      for (const t of todayTasks) {
        message += `${t.completed ? '✓ ~' + t.title + '~' : '• ' + t.title}\n`;
      }
    } else {
      message += `_No tasks scheduled for today. Add one with /todo <title>_\n`;
    }

    const openTasks = todayTasks.filter((t: any) => !t.completed).slice(0, 3);
    const inlineKeyboard = openTasks.map((t: any) => [
      {
        text: `✓ ${t.title.length > 20 ? t.title.substring(0, 18) + '…' : t.title}`,
        callback_data: `done:${t.id}`,
      },
    ]);

    await this.sendMessage(
      token,
      chatId,
      message,
      inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined
    );
  }

  private async handleFocusCommand(token: string, chatId: string): Promise<void> {
    const pomodoro = usePomodoroStore.getState();
    const mins = Math.floor(pomodoro.remainingSeconds / 60);
    const secs = pomodoro.remainingSeconds % 60;
    const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;
    const modeLabel =
      pomodoro.mode === 'focus'
        ? 'Focus Session'
        : pomodoro.mode === 'shortBreak'
          ? 'Short Break'
          : 'Long Break';

    await this.sendMessage(
      token,
      chatId,
      `✦ *Pomodoro Focus Status*\n\n` +
        `• Status: *${pomodoro.isRunning ? 'Active ▶' : 'Paused ⏸'}*\n` +
        `• Current Mode: *${modeLabel}*\n` +
        `• Time Remaining: *${timeFormatted}*\n` +
        `• Completed Today: *${pomodoro.completedCyclesToday} of ${pomodoro.targetCyclesDaily} cycles*\n` +
        `• Active Target: *${pomodoro.activeTarget?.title || 'None bound'}*`
    );
  }

  private async handleCallbackQuery(token: string, cb: any): Promise<void> {
    const data: string = cb.data || '';
    if (data.startsWith('done:')) {
      const taskId = data.replace('done:', '');
      await taskService.toggleTask(taskId, true);
      await useTasksStore.getState().loadTasks();
      await this.answerCallback(token, cb.id, '✓ Task marked as completed on desktop!');
    } else {
      await this.answerCallback(token, cb.id);
    }
  }
}

export const telegramService = new TelegramService();
