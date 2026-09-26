// Telegram Companion Bot Engine Automated Verification Test Suite

const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};

(globalThis as any).fetch = async (url: string) => {
  if (url.includes('/getMe')) {
    return {
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          id: 123456789,
          is_bot: true,
          first_name: 'Atelier Test Bot',
          username: 'AtelierTestBot',
        },
      }),
    };
  }
  if (url.includes('/sendMessage')) {
    return {
      ok: true,
      json: async () => ({
        ok: true,
        result: { message_id: 1 },
      }),
    };
  }
  return {
    ok: false,
    json: async () => ({ ok: false, description: 'Unknown endpoint' }),
  };
};

import { telegramService } from '../services/telegramService';
import { db } from '../db/database';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function runTelegramTests() {
  console.log('=== ATELIER TELEGRAM COMPANION BOT TEST SUITE ===\n');

  await db.init();

  // Test 1: Initial state
  console.log('--- Test 1: Initial Configuration State ---');
  const initialConfig = await telegramService.getConfig();
  assert(initialConfig.isLinked === false, 'Initially not linked');
  assert(initialConfig.pairingCode === null, 'No initial pairing code');

  // Test 2: Generate Pairing Code
  console.log('\n--- Test 2: One-Time Pairing Code Generation ---');
  const pairingRes = await telegramService.generatePairingCode();
  assert(Boolean(pairingRes.code), 'Pairing code generated');
  assert(pairingRes.code.startsWith('ATL-'), 'Pairing code uses ATL- prefix');
  assert(pairingRes.code.length === 7, 'Pairing code is 7 characters (ATL-XXX)');
  assert(pairingRes.command === `/pair ${pairingRes.code}`, 'Command string formatted correctly');

  const now = Date.now();
  const expiresTimestamp = new Date(pairingRes.expiresAt).getTime();
  const diffMinutes = Math.round((expiresTimestamp - now) / (60 * 1000));
  assert(diffMinutes >= 14 && diffMinutes <= 15, 'Pairing code valid for 15 minutes');

  // Test 3: Retrieve Config with Active Pairing Code
  console.log('\n--- Test 3: Active Pairing Code Retrieval ---');
  const configAfterPairing = await telegramService.getConfig();
  assert(configAfterPairing.pairingCode === pairingRes.code, 'Pairing code persisted in workspace_config');
  assert(Boolean(configAfterPairing.pairingCodeExpiresAt), 'Expiration timestamp preserved');

  // Test 4: Save Direct Credentials
  console.log('\n--- Test 4: Save Bot Credentials & Chat ID ---');
  await telegramService.saveCredentials('7819283401:AAH_test_token', '987654321', 'MyTestBot');
  const configWithCredentials = await telegramService.getConfig();
  assert(configWithCredentials.isLinked === true, 'isLinked is true when chat ID is saved');
  assert(configWithCredentials.chatId === '987654321', 'Chat ID matches saved value');
  assert(configWithCredentials.botToken === '7819283401:AAH_test_token', 'Bot token saved in storage');
  assert(configWithCredentials.botUsername === 'MyTestBot', 'Bot username saved in storage');

  // Test 5: Verify Bot Token API
  console.log('\n--- Test 5: Verify Bot Token API Mock ---');
  const verifyRes = await telegramService.verifyBotToken('7819283401:AAH_test_token');
  assert(verifyRes.ok === true, 'verifyBotToken succeeds on valid response');
  assert(verifyRes.bot?.username === 'AtelierTestBot', 'Detected bot username correctly');

  // Test 6: Send Test Notification API Mock
  console.log('\n--- Test 6: Send Test Notification Mock ---');
  const testMsgRes = await telegramService.sendTestNotification('7819283401:AAH_test_token', '987654321');
  assert(testMsgRes.ok === true, 'sendTestNotification succeeds');

  // Test 7: Unlink
  console.log('\n--- Test 7: Unlink Telegram Chat ---');
  await telegramService.unlink();
  const unlinkedConfig = await telegramService.getConfig();
  assert(unlinkedConfig.isLinked === false, 'isLinked is false after unlink');
  assert(unlinkedConfig.chatId === null, 'chatId is null after unlink');
  assert(unlinkedConfig.botToken === null, 'botToken is cleared after unlink');

  // Test 8: Polling engine lifecycle
  console.log('\n--- Test 8: Long-Polling Engine Lifecycle ---');
  assert(telegramService.isPollingActive() === false, 'Polling initially inactive without token');
  await telegramService.saveCredentials('7819283401:AAH_test_token', '987654321');
  assert(telegramService.isPollingActive() === true, 'Polling starts automatically when credentials saved');
  telegramService.stopPolling();
  assert(telegramService.isPollingActive() === false, 'Polling stops on stopPolling()');

  console.log('\nAll 16 Telegram companion bot engine tests PASSED successfully!');
}

runTelegramTests().catch((err) => {
  console.error('Test run failed:', err);
  throw err;
});
