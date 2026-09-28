import { Pool } from 'pg';

export class VpsReminderEngine {
  private pool: Pool;
  private intervalTimer: any = null;
  private sentReminders = new Set<string>();

  constructor(pool: Pool) {
    this.pool = pool;
  }

  start(): void {
    if (this.intervalTimer) return;
    console.log('[VpsReminderEngine] Starting 24/7 background reminder worker...');

    // Run check immediately, then every 60 seconds
    void this.checkReminders();
    this.intervalTimer = setInterval(() => {
      void this.checkReminders();
    }, 60000);
  }

  stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private async sendMessage(token: string, chatId: string, text: string): Promise<boolean> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
      const data: any = await res.json();
      return Boolean(data && data.ok);
    } catch (err) {
      console.error('[VpsReminderEngine] Failed to dispatch Telegram message:', err);
      return false;
    }
  }

  private getTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async checkReminders(): Promise<void> {
    try {
      // 1. Fetch workspace config (bot token & chat ID)
      const cfgRes = await this.pool.query(
        'SELECT telegram_bot_token, telegram_chat_id FROM workspace_config WHERE telegram_bot_token IS NOT NULL AND telegram_chat_id IS NOT NULL LIMIT 1'
      );

      if (cfgRes.rows.length === 0) return;
      const { telegram_bot_token: token, telegram_chat_id: chatId } = cfgRes.rows[0];
      if (!token || !chatId) return;

      const now = new Date();
      const hours = now.getHours();
      const todayStr = this.getTodayDateString();

      // Clean up sent keys from previous days
      for (const key of this.sentReminders) {
        if (!key.includes(todayStr)) {
          this.sentReminders.delete(key);
        }
      }

      // 1. Morning 06:00 Daily Briefing
      const key0600 = `briefing_0600_${todayStr}`;
      if (hours === 6 && !this.sentReminders.has(key0600)) {
        this.sentReminders.add(key0600);
        await this.sendMorningBriefing(token, chatId, todayStr);
      }

      // 2. Afternoon 16:00 Unfinished Items Check-in
      const key1600 = `checkin_1600_${todayStr}`;
      if (hours === 16 && !this.sentReminders.has(key1600)) {
        this.sentReminders.add(key1600);
        await this.sendIncompleteReminder(token, chatId, todayStr, 'Afternoon Check-in (16:00)');
      }

      // 3. Evening 21:00 Unfinished Items Review
      const key2100 = `checkin_2100_${todayStr}`;
      if (hours === 21 && !this.sentReminders.has(key2100)) {
        this.sentReminders.add(key2100);
        await this.sendIncompleteReminder(token, chatId, todayStr, 'Evening Review (21:00)');
      }

      // 4. 3 Hours Advance Reminder for Calendar Events
      await this.checkUpcomingEvents(token, chatId, now, todayStr);
    } catch (err) {
      console.error('[VpsReminderEngine] Error in reminder loop:', err);
    }
  }

  private async sendMorningBriefing(token: string, chatId: string, todayStr: string): Promise<void> {
    try {
      const [tasksRes, routinesRes, eventsRes] = await Promise.all([
        this.pool.query(
          "SELECT * FROM tasks WHERE scheduled_date = $1 AND (deleted_at IS NULL) ORDER BY position_rank ASC",
          [todayStr]
        ),
        this.pool.query("SELECT * FROM routines WHERE (deleted_at IS NULL) ORDER BY position_rank ASC"),
        this.pool.query(
          "SELECT * FROM calendar_events WHERE start_time::text LIKE $1 AND (deleted_at IS NULL) ORDER BY start_time ASC",
          [`${todayStr}%`]
        ),
      ]);

      const tasks = tasksRes.rows;
      const routines = routinesRes.rows;
      const events = eventsRes.rows;

      let msg = `✦ *Atelier Morning Briefing — ${todayStr}*\n\n`;

      // Events
      msg += `*Today's Schedule & Events:*\n`;
      if (events.length === 0) {
        msg += `• No scheduled events.\n`;
      } else {
        for (const e of events) {
          const time = e.start_time ? String(e.start_time).substring(11, 16) : '';
          msg += `• ${time ? time + ' — ' : ''}*${e.title}*\n`;
        }
      }
      msg += '\n';

      // Tasks
      msg += `*Today's Queue (${tasks.length} tasks):*\n`;
      if (tasks.length === 0) {
        msg += `• No tasks scheduled for today.\n`;
      } else {
        for (const t of tasks) {
          const mark = t.status === 'done' ? '✓' : '○';
          msg += `${mark} ${t.title}\n`;
        }
      }
      msg += '\n';

      // Habits
      msg += `*Active Habits (${routines.length}):*\n`;
      if (routines.length === 0) {
        msg += `• No habits configured.\n`;
      } else {
        for (const r of routines) {
          msg += `• ${r.title}\n`;
        }
      }

      await this.sendMessage(token, chatId, msg);
    } catch (err) {
      console.error('[VpsReminderEngine] Morning briefing error:', err);
    }
  }

  private async sendIncompleteReminder(
    token: string,
    chatId: string,
    todayStr: string,
    titleLabel: string
  ): Promise<void> {
    try {
      const [tasksRes, routinesRes, logsRes] = await Promise.all([
        this.pool.query(
          "SELECT * FROM tasks WHERE scheduled_date = $1 AND status != 'done' AND (deleted_at IS NULL) ORDER BY position_rank ASC",
          [todayStr]
        ),
        this.pool.query("SELECT * FROM routines WHERE (deleted_at IS NULL) ORDER BY position_rank ASC"),
        this.pool.query(
          "SELECT * FROM routine_logs WHERE date = $1",
          [todayStr]
        ),
      ]);

      const unfinishedTasks = tasksRes.rows;
      const allRoutines = routinesRes.rows;
      const logs = logsRes.rows;

      const logMap = new Map<string, any>(logs.map((l: any) => [l.routine_id, l]));
      const unfinishedHabits = allRoutines.filter((r: any) => {
        const log = logMap.get(r.id);
        return !log || !log.completed;
      });

      if (unfinishedTasks.length === 0 && unfinishedHabits.length === 0) {
        return; // Nothing incomplete
      }

      let msg = `✦ *Atelier ${titleLabel}*\n\n`;

      if (unfinishedTasks.length > 0) {
        msg += `*Unfinished Tasks (${unfinishedTasks.length}):*\n`;
        for (const t of unfinishedTasks) {
          msg += `○ ${t.title}\n`;
        }
        msg += '\n';
      }

      if (unfinishedHabits.length > 0) {
        msg += `*Pending Habits (${unfinishedHabits.length}):*\n`;
        for (const h of unfinishedHabits) {
          msg += `• ${h.title}\n`;
        }
      }

      await this.sendMessage(token, chatId, msg);
    } catch (err) {
      console.error('[VpsReminderEngine] Incomplete check-in error:', err);
    }
  }

  private async checkUpcomingEvents(
    token: string,
    chatId: string,
    now: Date,
    todayStr: string
  ): Promise<void> {
    try {
      const eventsRes = await this.pool.query(
        "SELECT * FROM calendar_events WHERE start_time::text LIKE $1 AND (deleted_at IS NULL)",
        [`${todayStr}%`]
      );

      for (const ev of eventsRes.rows) {
        if (!ev.start_time) continue;
        const evDate = new Date(ev.start_time);
        const diffMinutes = Math.round((evDate.getTime() - now.getTime()) / 60000);

        // Window: 170 to 185 minutes (~3 hours prior)
        const evKey = `vps_event_3h_${ev.id}_${todayStr}`;
        if (diffMinutes >= 170 && diffMinutes <= 185 && !this.sentReminders.has(evKey)) {
          this.sentReminders.add(evKey);
          const timeStr = String(ev.start_time).substring(11, 16);
          await this.sendMessage(
            token,
            chatId,
            `✦ *Upcoming Event Reminder (in 3 hours)*\n\n` +
              `• *${ev.title}*\n` +
              (timeStr ? `• Time: ${timeStr}\n` : '') +
              `• Category: ${ev.event_type || 'General'}`
          );
        }
      }
    } catch (err) {
      console.error('[VpsReminderEngine] Event check error:', err);
    }
  }
}
