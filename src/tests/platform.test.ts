import { formatShortcut } from '../lib/platform';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

console.log('=== ATELIER PLATFORM & OS SHORTCUT TEST SUITE ===\n');

// 1. Default Node environment (non-Mac / Windows / Linux)
console.log('--- Test 1: Non-Mac OS Detection (Windows/Linux) ---');
assert(formatShortcut('⌘K') === 'Ctrl K', '"⌘K" formats to "Ctrl K" on non-Mac');
assert(formatShortcut('⌘1') === 'Ctrl 1', '"⌘1" formats to "Ctrl 1" on non-Mac');
assert(
  formatShortcut('Bold (⌘B)') === 'Bold (Ctrl B)',
  '"Bold (⌘B)" formats to "Bold (Ctrl B)" on non-Mac'
);
assert(formatShortcut('Space') === 'Space', '"Space" is unchanged');

// 2. Simulated Mac environment
console.log('\n--- Test 2: Simulated Mac OS Detection ---');
const originalWindow = (globalThis as any).window;
const originalNav = (globalThis as any).navigator;

(globalThis as any).window = {
  navigator: {
    platform: 'MacIntel',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
};
(globalThis as any).navigator = (globalThis as any).window.navigator;

assert(formatShortcut('⌘K') === 'CMD K', '"⌘K" formats to "CMD K" on simulated Mac');
assert(formatShortcut('⌘1') === 'CMD 1', '"⌘1" formats to "CMD 1" on simulated Mac');
assert(
  formatShortcut('Bold (⌘B)') === 'Bold (CMD B)',
  '"Bold (⌘B)" formats to "Bold (CMD B)" on simulated Mac'
);

// Restore globals
(globalThis as any).window = originalWindow;
(globalThis as any).navigator = originalNav;

console.log('\nAll Platform & OS shortcut formatting tests PASSED successfully!');
