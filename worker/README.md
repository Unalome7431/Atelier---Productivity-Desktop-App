# Atelier Telegram Serverless Worker & grammY Bot Companion

This Cloudflare Worker powers the **bi-directional Telegram companion bot** for Atelier (Personal Desktop Operating System).

---

## Capabilities

1. **Remote Quick Capture:**
   - `/todo <title>` — Automatically captures a task into Today's Queue or Inbox.
   - `/kanban <board> <title>` — Drops a card into the specified Kanban board's *Planned* column.
   - `/note <text>` — Captures an inbox note into your Knowledge Notes document store.
2. **On-Demand Briefings & Focus Status:**
   - `/agenda` — On-demand morning agenda briefing with today's habits, scheduled tasks, and interactive `[✓ Complete]` inline buttons.
   - `/focus` — Live status of your Pomodoro daily cycle target and intervals.
3. **One-Time Desktop Pairing:**
   - `/pair <code>` — Instant pairing via a 15-minute one-time code (`ATL-XXX`) generated in Atelier Desktop Settings.
4. **Automated Morning Cron Briefing:**
   - Scheduled daily at 08:00 AM user local time (default: 01:00 UTC) via Cloudflare Cron Triggers, delivering an interactive agenda card directly to your phone.

---

## Telegram Configuration Guide

### 1. Create your Bot via `@BotFather`
1. Open Telegram and message [@BotFather](https://t.me/BotFather).
2. Send `/newbot`.
3. Give your bot a friendly name (e.g. `My Atelier Assistant`).
4. Give your bot a username ending in `bot` (e.g. `my_atelier_personal_bot`).
5. Copy the generated **HTTP API Bot Token** (e.g. `7819283401:AAH_q981249...`).

### 2. Configure Command Menu in `@BotFather`
1. Send `/setcommands` to [@BotFather].
2. Select your newly created bot.
3. Paste the following command list:
```text
start - Start bot and show commands
pair - Link with desktop app (/pair <code>)
todo - Quick capture a task to Today (/todo <title>)
kanban - Add card to Kanban board (/kanban <board> <title>)
note - Quick capture a note to Inbox (/note <text>)
agenda - Show today's agenda, tasks and habits
focus - Check Pomodoro daily target and focus status
help - Show complete command documentation
```

### 3. Find Your Telegram Chat ID
1. Search for [@userinfobot](https://t.me/userinfobot) or [@myidbot](https://t.me/myidbot) on Telegram.
2. Click **Start**.
3. Copy your numeric **Id** (e.g. `149208412`).

---

## Cloudflare Worker Deployment

### 1. Prerequisites
- Node.js >= 18
- Cloudflare account with [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed.

### 2. Setup Secrets
In the `worker` directory, run:
```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
# Paste your Bot Token from @BotFather

npx wrangler secret put DATABASE_URL
# Paste your PostgreSQL connection string (Neon, Supabase, or self-hosted)

npx wrangler secret put WEBHOOK_SECRET
# (Optional) Any random secret string for header authentication
```

### 3. Deploy
```bash
npm run deploy
```
Wrangler will output your live worker URL:
`https://atelier-telegram-bot.<your-subdomain>.workers.dev`

### 4. Register the Webhook with Telegram
Make a simple POST/GET request to Telegram's `setWebhook` endpoint:
```bash
curl -F "url=https://atelier-telegram-bot.<your-subdomain>.workers.dev" \
     -F "secret_token=<YOUR_WEBHOOK_SECRET>" \
     "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook"
```

You are ready! Open your Telegram bot and type `/start`.
