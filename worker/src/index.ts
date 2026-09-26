import { webhookCallback } from 'grammy';
import { Env } from './types';
import { createBot } from './bot';
import { handleMorningCron } from './cron';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health Check & Root Ping
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          app: 'Atelier Telegram Companion Worker',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          botUsername: env.TELEGRAM_BOT_USERNAME || 'AtelierProductivityBot',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Webhook endpoint
    if (request.method === 'POST') {
      // Validate optional secret token header from Telegram
      if (env.WEBHOOK_SECRET) {
        const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
        if (secret !== env.WEBHOOK_SECRET) {
          return new Response('Unauthorized secret token', { status: 403 });
        }
      }

      if (!env.TELEGRAM_BOT_TOKEN) {
        return new Response('TELEGRAM_BOT_TOKEN environment variable not configured', {
          status: 500,
        });
      }

      const bot = createBot(env);
      const handler = webhookCallback(bot, 'cloudflare-mod');
      return handler(request);
    }

    return new Response('Method Not Allowed', { status: 405 });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('[CronTrigger] Running scheduled morning agenda delivery...', event.cron);
    ctx.waitUntil(handleMorningCron(env));
  },
};
