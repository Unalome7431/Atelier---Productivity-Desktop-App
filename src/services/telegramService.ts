import { db } from '@/db/database';
import { syncService } from './syncService';

export interface TelegramConfigState {
  chatId: string | null;
  botToken: string | null;
  botUsername: string | null;
  pairingCode: string | null;
  pairingCodeExpiresAt: string | null;
  isLinked: boolean;
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

  async getConfig(): Promise<TelegramConfigState> {
    await db.init();
    const rows = await db.select<any>('SELECT * FROM workspace_config LIMIT 1');
    const localToken = localStorage.getItem(TelegramService.STORAGE_TOKEN_KEY);
    const localUsername = localStorage.getItem(TelegramService.STORAGE_USERNAME_KEY);

    if (rows.length === 0) {
      return {
        chatId: null,
        botToken: localToken || null,
        botUsername: localUsername || null,
        pairingCode: null,
        pairingCodeExpiresAt: null,
        isLinked: false,
      };
    }

    const row = rows[0];
    const isCodeExpired = row.pairing_code_expires_at
      ? new Date(row.pairing_code_expires_at).getTime() < Date.now()
      : true;

    return {
      chatId: row.telegram_chat_id || null,
      botToken: localToken || null,
      botUsername: localUsername || null,
      pairingCode: isCodeExpired ? null : row.pairing_code || null,
      pairingCodeExpiresAt: row.pairing_code_expires_at || null,
      isLinked: Boolean(row.telegram_chat_id),
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
    if (cleanToken) {
      localStorage.setItem(TelegramService.STORAGE_TOKEN_KEY, cleanToken);
    } else {
      localStorage.removeItem(TelegramService.STORAGE_TOKEN_KEY);
    }

    if (botUsername) {
      localStorage.setItem(TelegramService.STORAGE_USERNAME_KEY, botUsername.trim().replace(/^@/, ''));
    }

    const cleanChatId = chatId ? chatId.trim() : null;
    const now = new Date().toISOString();

    const existing = await db.select<any>('SELECT id FROM workspace_config LIMIT 1');
    if (existing.length === 0) {
      const configId = 'cfg_default';
      await db.execute(
        `INSERT INTO workspace_config (id, user_name, telegram_chat_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [configId, 'Creator', cleanChatId, now, now]
      );
      await syncService.enqueueMutation('workspace_config', configId, 'INSERT', {
        id: configId,
        user_name: 'Creator',
        telegram_chat_id: cleanChatId,
        created_at: now,
        updated_at: now,
      });
    } else {
      const configId = existing[0].id;
      await db.execute(
        `UPDATE workspace_config SET telegram_chat_id = ?, updated_at = ? WHERE id = ?`,
        [cleanChatId, now, configId]
      );
      await syncService.enqueueMutation('workspace_config', configId, 'UPDATE', {
        telegram_chat_id: cleanChatId,
        updated_at: now,
      });
    }
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
        `Your personal Telegram companion bot is active and linked.\n\n` +
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
    await db.init();
    localStorage.removeItem(TelegramService.STORAGE_TOKEN_KEY);
    localStorage.removeItem(TelegramService.STORAGE_USERNAME_KEY);
    const now = new Date().toISOString();
    const existing = await db.select<any>('SELECT id FROM workspace_config LIMIT 1');
    if (existing.length > 0) {
      const configId = existing[0].id;
      await db.execute(
        `UPDATE workspace_config SET telegram_chat_id = ?, pairing_code = ?, pairing_code_expires_at = ?, updated_at = ? WHERE id = ?`,
        [null, null, null, now, configId]
      );
      await syncService.enqueueMutation('workspace_config', configId, 'UPDATE', {
        telegram_chat_id: null,
        pairing_code: null,
        pairing_code_expires_at: null,
        updated_at: now,
      });
    }
  }
}

export const telegramService = new TelegramService();
