// Phase 11 E2E Offline Sync Queue Integrity & High-Load Node Simulation Tests

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

import { syncService } from '../services/syncService';
import { db } from '../db/database';
import { formatCanvasNodes } from '../stores/useCanvasStore';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function runQualityAssuranceTests() {
  console.log('=== ATELIER PHASE 11: QUALITY ASSURANCE & POLISH VERIFICATION ===\n');

  await db.init();

  // Test 1: Offline Sync Queue Enqueue & Mutation Integrity
  console.log('--- Test 1: Offline Sync Queue Enqueue & Mutation Integrity ---');
  const initialPending = await syncService.getPendingMutationsCount();

  await syncService.enqueueMutation('tasks', 'tsk_qa_1', 'INSERT', {
    id: 'tsk_qa_1',
    title: 'Offline Quality Check Task',
    status: 'todo',
  });

  await syncService.enqueueMutation('notes', 'note_qa_1', 'UPDATE', {
    id: 'note_qa_1',
    title: 'Offline Architecture Decision',
    categoryColor: '#D0F8E3',
  });

  const countAfterEnqueue = await syncService.getPendingMutationsCount();
  assert(
    countAfterEnqueue === initialPending + 2,
    `Sync queue registered 2 pending mutations (got: ${countAfterEnqueue})`
  );

  const pendingList = await syncService.getPendingMutations();
  const taskMutation = pendingList.find((m) => m.entity_id === 'tsk_qa_1');
  assert(Boolean(taskMutation), 'Task mutation exists in offline client queue');
  assert(taskMutation?.operation === 'INSERT', 'Task mutation operation is INSERT');

  // Test 2: Sync Queue Batch Resolution
  console.log('\n--- Test 2: Sync Queue Batch Processing & Resolution ---');
  await syncService.pushPendingMutations();
  const countAfterPush = await syncService.getPendingMutationsCount();
  assert(countAfterPush === 0, 'Pending mutations successfully resolved to 0 after sync push');

  // Test 3: High-Scale Spatial Canvas Node Simulation (500+ Nodes)
  console.log('\n--- Test 3: High-Scale Spatial Canvas Node Simulation (500+ Nodes) ---');
  const syntheticNodes: any[] = [];
  for (let i = 0; i < 500; i++) {
    syntheticNodes.push({
      id: `node_synth_${i}`,
      type: i % 4 === 0 ? 'kanban' : i % 3 === 0 ? 'note' : 'simple_text',
      position: { x: (i % 25) * 200, y: Math.floor(i / 25) * 150 },
      data: {
        title: `Card ${i}`,
        text: `Synthetic high-scale load node content #${i}`,
      },
    });
  }

  const startTime = performance.now();
  const formattedNodes = formatCanvasNodes(syntheticNodes);
  const duration = performance.now() - startTime;

  assert(formattedNodes.length === 500, `Successfully formatted 500 spatial canvas nodes in memory`);
  assert(duration < 50, `Node formatting and layering engine rendered 500 nodes in ${duration.toFixed(2)}ms (< 50ms)`);

  // Test 4: Section Layering Guarantee with High Volume
  console.log('\n--- Test 4: Section Container Layering Guarantee ---');
  const mixedNodes = [
    { id: 'node_c1', type: 'simple_text', position: { x: 10, y: 10 }, data: { title: 'Card 1' } },
    { id: 'node_s1', type: 'section', position: { x: 0, y: 0 }, data: { title: 'Section Root' } },
    { id: 'node_c2', type: 'kanban', position: { x: 20, y: 20 }, data: { title: 'Card 2' } },
  ];
  const sorted = formatCanvasNodes(mixedNodes);
  assert(sorted[0].type === 'section', 'Section container always ordered first (zIndex base) to prevent visual obscuring');

  console.log('\nAll Phase 11 Quality Assurance tests PASSED successfully!');
}

runQualityAssuranceTests().catch((err) => {
  console.error('Test run failed:', err);
  throw err;
});
