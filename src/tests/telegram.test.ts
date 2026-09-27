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
  if (url.includes('/sendMessage') || url.includes('/editMessageText') || url.includes('/setMyCommands') || url.includes('/deleteWebhook') || url.includes('/answerCallbackQuery')) {
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
import { taskService } from '../services/taskService';
import { routineService } from '../services/routineService';
import { calendarService } from '../services/calendarService';
import { getTodayDateString } from '../lib/utils';
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

  // Test 7: Command 1 — /add (Today vs Inbox)
  console.log('\n--- Test 7: Command /add (Today and Inbox Destination Options) ---');
  const todayStr = getTodayDateString();
  const createdTodayTask = await taskService.createTask({
    title: 'Telegram Today Task Test',
    scheduledDate: todayStr,
  });
  assert(createdTodayTask.scheduledDate === todayStr, 'Task added to Today has scheduledDate set');

  const createdInboxTask = await taskService.createTask({
    title: 'Telegram Inbox Task Test',
    scheduledDate: null,
  });
  assert(createdInboxTask.scheduledDate === null, 'Task added to Inbox has null scheduledDate');

  // Test 8: Command 2 — /habit (Only habits active for today, toggle & increment)
  console.log("\n--- Test 8: Command /habit (Only Today's Active Habits, Toggle & Increment) ---");
  await routineService.seedDefaultRoutines();
  const allRoutines = await routineService.getAllRoutines();
  assert(allRoutines.length > 0, 'Routines exist in database');
  const todayActiveRoutines = allRoutines.filter((r) => routineService.isRoutineActiveOnDate(r, todayStr));
  assert(todayActiveRoutines.length > 0, 'Only active routines for today are selected');
  const firstRoutine = todayActiveRoutines[0];
  const toggledLog = await routineService.toggleRoutine(firstRoutine.id, true);
  assert(toggledLog.completed === true, 'Habit checklist toggles to completed');
  const incrementedLog = await routineService.updateRoutineCount(firstRoutine.id, 1);
  assert((incrementedLog.currentCount || 0) >= 1, 'Repeating habit increments count successfully');

  // Test 9: Command 3 — /today (Daily tasks, habits, events)
  console.log('\n--- Test 9: Command /today (Today Tasks, Habits & Events) ---');
  await taskService.seedDefaultTasks();
  const todayTasks = await taskService.getTodayTasks(todayStr);
  assert(todayTasks.length > 0, 'Today tasks retrieved for /today overview');
  const events = await calendarService.getEvents();
  assert(events !== undefined, 'Calendar events accessible for /today overview');

  // Test 10: Command 4 — /schedule (Weekly schedule blocks)
  console.log('\n--- Test 10: Command /schedule (Weekly Schedule Details) ---');
  const recurringBlocks = calendarService.getRecurringWeeklyBlocks();
  assert(recurringBlocks.length >= 5, 'Weekly recurring schedule blocks loaded for /schedule');

  // Test 11: Command 5 — /inbox (Inbox backlog tasks)
  console.log('\n--- Test 11: Command /inbox (Inbox Backlog List) ---');
  const inboxTasks = await taskService.getInboxTasks();
  assert(inboxTasks.some((t) => t.id === createdInboxTask.id), 'Created inbox task found in /inbox query');

  // Test 12: Command 6 — /todo (Today tasks and subtasks checklist)
  console.log('\n--- Test 12: Command /todo (Today Tasks & Subtasks Checklist) ---');
  await taskService.addSubtask(createdTodayTask.id, 'Subtask 1');
  await taskService.toggleTask(createdTodayTask.id, true);
  const reloadedTodayTasks = await taskService.getTodayTasks(todayStr);
  const foundTask = reloadedTodayTasks.find((t) => t.id === createdTodayTask.id);
  assert(foundTask?.completed === true, 'Task completed status toggles correctly for /todo checklist');

  // Test 13: Unlink & Cleanup
  console.log('\n--- Test 13: Unlink Telegram Chat ---');
  await telegramService.unlink();
  const unlinkedConfig = await telegramService.getConfig();
  assert(unlinkedConfig.isLinked === false, 'isLinked is false after unlink');
  assert(unlinkedConfig.chatId === null, 'chatId is null after unlink');
  assert(unlinkedConfig.botToken === null, 'botToken is cleared after unlink');

  // Test 14: Polling engine lifecycle
  console.log('\n--- Test 14: Long-Polling Engine Lifecycle ---');
  assert(telegramService.isPollingActive() === false, 'Polling initially inactive without token');
  await telegramService.saveCredentials('7819283401:AAH_test_token', '987654321');
  assert(telegramService.isPollingActive() === true, 'Polling starts automatically when credentials saved');
  telegramService.stopPolling();
  assert(telegramService.isPollingActive() === false, 'Polling stops on stopPolling()');

  console.log('\nAll 14 Telegram companion bot engine tests PASSED successfully!');
}

runTelegramTests().catch((err) => {
  console.error('Test run failed:', err);
  throw err;
});
