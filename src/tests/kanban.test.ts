// Mock browser globals for Node test environment before service imports
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

import { kanbanService } from '../services/kanbanService';
import { taskService } from '../services/taskService';
import { useKanbanStore } from '../stores/useKanbanStore';
import { getInitialRank, getRankBetween, compareRanks } from '../lib/lexorank';
import { getTagStyle, PASTEL_TAG_COLORS } from '../lib/tagStyles';
import { formatDueDateTime, getDuePresetIso } from '../lib/dateTimeUtils';
import { db } from '../db/database';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function runKanbanTests() {
  console.log('=== ATELIER LONG-TERM KANBAN BOARD TEST SUITE ===\n');

  // Initialize DB
  await db.init();

  // -------------------------------------------------------------
  // Test 1: Lexorank / Fractional Indexing Engine
  // -------------------------------------------------------------
  console.log('--- Test 1: Lexorank / Fractional Indexing Engine ---');

  const rank0 = getInitialRank(0);
  const rank1 = getInitialRank(1);
  const rank2 = getInitialRank(2);
  assert(rank0 === '1000.000000', `Initial rank 0 is 1000.000000 (got: ${rank0})`);
  assert(rank1 === '2000.000000', `Initial rank 1 is 2000.000000 (got: ${rank1})`);
  assert(rank2 === '3000.000000', `Initial rank 2 is 3000.000000 (got: ${rank2})`);

  // Insert before first item
  const beforeFirst = getRankBetween(null, rank0);
  assert(
    parseFloat(beforeFirst) < parseFloat(rank0) && parseFloat(beforeFirst) > 0,
    `Rank before first is between 0 and 1000: ${beforeFirst}`
  );
  assert(
    beforeFirst === '500.000000',
    `Insert before 1000 yields 500.000000 (got: ${beforeFirst})`
  );

  // Insert after last item
  const afterLast = getRankBetween(rank2, null);
  assert(
    parseFloat(afterLast) > parseFloat(rank2),
    `Rank after last is greater than 3000: ${afterLast}`
  );
  assert(afterLast === '4000.000000', `Insert after 3000 yields 4000.000000 (got: ${afterLast})`);

  // Insert between two items
  const between0and1 = getRankBetween(rank0, rank1);
  assert(
    between0and1 === '1500.000000',
    `Midpoint between 1000 and 2000 is 1500.000000 (got: ${between0and1})`
  );

  const betweenMidAndNext = getRankBetween(between0and1, rank1);
  assert(
    betweenMidAndNext === '1750.000000',
    `Midpoint between 1500 and 2000 is 1750.000000 (got: ${betweenMidAndNext})`
  );

  // Compare ranks
  assert(compareRanks(rank0, rank1) < 0, 'compareRanks(1000, 2000) is negative');
  assert(compareRanks(rank1, rank0) > 0, 'compareRanks(2000, 1000) is positive');
  assert(compareRanks(rank0, rank0) === 0, 'compareRanks(1000, 1000) is zero');

  // -------------------------------------------------------------
  // Test 2: Multi-Board Architecture & Default Seeding
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Multi-Board Architecture & Default Seeding ---');

  await kanbanService.seedDefaultBoards();
  const boards = await kanbanService.getBoards();
  assert(boards.length >= 3, `Seeded at least 3 default boards (got: ${boards.length})`);

  const boardA = boards.find((b) => b.id === 'board_default' || b.title === 'Project A');
  assert(Boolean(boardA), 'Project A board exists in seeded boards');
  assert(boardA!.title === 'Project A', `Board A title is "Project A" (got: ${boardA?.title})`);
  assert(
    boardA!.linkedCanvasTitle === 'CANVAS A',
    `Board A is linked to "CANVAS A" (got: ${boardA?.linkedCanvasTitle})`
  );

  const boardB = boards.find((b) => b.id === 'board_b' || b.title === 'Project B');
  assert(Boolean(boardB), 'Project B board exists in seeded boards');

  const boardC = boards.find((b) => b.id === 'board_c' || b.title === 'Project C');
  assert(Boolean(boardC), 'Project C board exists in seeded boards');

  // Verify default columns
  assert(
    boardA!.columns.length === 4,
    `Board has 4 default columns (got: ${boardA!.columns.length})`
  );
  const colTitles = boardA!.columns.map((c) => c.title);
  assert(
    colTitles.includes('Planned') &&
      colTitles.includes('In progress') &&
      colTitles.includes('Review') &&
      colTitles.includes('Complete'),
    'Board contains Planned, In progress, Review, Complete columns'
  );

  // Create new board
  const newBoard = await kanbanService.createBoard(
    'Marketing Sprint',
    '#F472B6',
    'canvas_1',
    'CANVAS A'
  );
  assert(newBoard.title === 'Marketing Sprint', `Created new board: ${newBoard.title}`);
  assert(newBoard.colorTag === '#F472B6', 'New board has custom pastel color tag');

  // Rename board
  await kanbanService.renameBoard(newBoard.id, 'Q4 Growth Roadmap');
  const refreshedBoards = await kanbanService.getBoards();
  const renamedBoard = refreshedBoards.find((b) => b.id === newBoard.id);
  assert(renamedBoard?.title === 'Q4 Growth Roadmap', 'Board renamed to "Q4 Growth Roadmap"');

  // Delete board
  await kanbanService.deleteBoard(newBoard.id);
  const afterDeleteBoards = await kanbanService.getBoards();
  assert(
    !afterDeleteBoards.some((b) => b.id === newBoard.id),
    'Deleted board successfully removed'
  );

  // -------------------------------------------------------------
  // Test 3: Card Anatomy & Figma Alignment
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Card Anatomy & Figma Alignment ---');

  const projectACards = boardA!.cards;
  assert(
    projectACards.length >= 10,
    `Project A has at least 10 seeded cards (got: ${projectACards.length})`
  );

  // Check card: Finalize API module contract
  const apiCard = projectACards.find((c) => c.title === 'Finalize API module contract');
  assert(Boolean(apiCard), 'Found "Finalize API module contract" card');
  assert(apiCard!.columnId === 'planned', 'API card is in Planned column');
  assert(!apiCard!.tagLabel, `API card has no default system tag (got: ${apiCard?.tagLabel})`);
  assert(
    Boolean(apiCard!.dueDate && apiCard!.dueDate.includes('T')),
    `API card has ISO due timestamp (got: ${apiCard?.dueDate})`
  );
  const formattedApiDue = formatDueDateTime(apiCard!.dueDate);
  assert(
    formattedApiDue.formatted.length > 0 && formattedApiDue.hasTime,
    'API card due datetime formats properly'
  );
  assert(
    Array.isArray(apiCard!.checklist) && apiCard!.checklist.length === 5,
    `API card has 5 checklist items (got: ${apiCard?.checklist?.length})`
  );
  const apiCompletedCount = apiCard!.checklist?.filter((i) => i.completed).length;
  assert(
    apiCompletedCount === 3,
    `API card has 3/5 checklist items completed (got: ${apiCompletedCount}/5)`
  );

  // Check card: Design tokens sync engine
  const designCard = projectACards.find((c) => c.title === 'Design tokens sync engine');
  assert(Boolean(designCard), 'Found "Design tokens sync engine" card');
  assert(designCard!.columnId === 'in_progress', 'Design card is in In progress column');
  assert(
    Boolean(designCard!.dueDate && designCard!.dueDate.includes('T')),
    `Design card has ISO due timestamp (got: ${designCard?.dueDate})`
  );
  const formattedDesignDue = formatDueDateTime(designCard!.dueDate);
  assert(formattedDesignDue.isToday, 'Design card due date correctly indicates today');

  // Check card in Complete column
  const completedCard = projectACards.find((c) => c.title === 'Set up synced task status');
  assert(Boolean(completedCard), 'Found "Set up synced task status" card');
  assert(
    completedCard!.columnId === 'done' || completedCard!.columnId === 'complete',
    'Completed card is in Complete column'
  );
  assert(
    completedCard!.completedAt === 'Completed today',
    `Completed card has completedAt "Completed today" (got: ${completedCard?.completedAt})`
  );

  // -------------------------------------------------------------
  // Test 4: Card Lifecycle & Drag-and-Drop Fractional Reordering
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Card Lifecycle & Drag-and-Drop Fractional Reordering ---');

  // Add new card
  const testCard = await kanbanService.addCard({
    boardId: boardA!.id,
    columnId: 'planned',
    title: 'Test Webhook Integration',
    description: 'Verify HMAC payload signature verification',
    tagLabel: 'Engineering',
    dueDate: 'Next week',
    checklist: [
      { id: 'sub_1', title: 'Draft HMAC hashing function', completed: true },
      { id: 'sub_2', title: 'Write replay protection tests', completed: false },
    ],
  });

  assert(Boolean(testCard && testCard.id), 'Successfully added new card');
  assert(testCard.title === 'Test Webhook Integration', 'Card title matches input');
  assert(testCard.tagLabel === 'Engineering', 'Card domain tag is Engineering');

  // Move card to In progress with fractional rank
  const newRank = getRankBetween('1000.000000', '2000.000000'); // 1500.000000
  await kanbanService.moveCard(testCard.id, 'in_progress', newRank);

  let freshBoards = await kanbanService.fetchBoards();
  let freshCard = freshBoards
    .find((b) => b.id === boardA!.id)
    ?.cards.find((c) => c.id === testCard.id);

  assert(freshCard?.columnId === 'in_progress', 'Card moved to in_progress column');
  assert(
    freshCard?.positionRank === '1500.000000',
    `Card assigned fractional rank 1500.000000 (got: ${freshCard?.positionRank})`
  );

  // Move card to Complete column (should auto-populate completed_at)
  await kanbanService.moveCard(testCard.id, 'done');
  freshBoards = await kanbanService.fetchBoards();
  freshCard = freshBoards.find((b) => b.id === boardA!.id)?.cards.find((c) => c.id === testCard.id);

  assert(
    freshCard?.completedAt === 'Completed today',
    'Moving card to Complete lane sets completedAt to "Completed today"'
  );

  // Move card back out of Complete lane (should clear completed_at)
  await kanbanService.moveCard(testCard.id, 'in_progress');
  freshBoards = await kanbanService.fetchBoards();
  freshCard = freshBoards.find((b) => b.id === boardA!.id)?.cards.find((c) => c.id === testCard.id);

  assert(!freshCard?.completedAt, 'Moving card out of Complete lane clears completedAt');

  // -------------------------------------------------------------
  // Test 5: Subtask Checklist Operations
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Subtask Checklist Operations ---');

  // Toggle checklist item
  await kanbanService.toggleChecklistItem(testCard.id, 'sub_2');
  freshBoards = await kanbanService.fetchBoards();
  freshCard = freshBoards.find((b) => b.id === boardA!.id)?.cards.find((c) => c.id === testCard.id);

  const sub2 = freshCard?.checklist?.find((i) => i.id === 'sub_2');
  assert(sub2?.completed === true, 'sub_2 item successfully toggled to completed: true');

  // Add checklist item
  await kanbanService.addChecklistItem(testCard.id, 'Benchmark payload throughput');
  freshBoards = await kanbanService.fetchBoards();
  freshCard = freshBoards.find((b) => b.id === boardA!.id)?.cards.find((c) => c.id === testCard.id);

  assert(
    freshCard?.checklist?.length === 3,
    `Checklist item added; total length is 3 (got: ${freshCard?.checklist?.length})`
  );

  // Delete checklist item
  await kanbanService.deleteChecklistItem(testCard.id, 'sub_1');
  freshBoards = await kanbanService.fetchBoards();
  freshCard = freshBoards.find((b) => b.id === boardA!.id)?.cards.find((c) => c.id === testCard.id);

  assert(
    freshCard?.checklist?.length === 2 && !freshCard.checklist.some((i) => i.id === 'sub_1'),
    'Checklist item sub_1 successfully deleted'
  );

  // -------------------------------------------------------------
  // Test 6: Bridge to Daily Cockpit Queue
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Bridge to Daily Cockpit Queue ---');

  const { taskId, taskTitle } = await kanbanService.sendToTodayQueue(testCard.id);
  assert(Boolean(taskId), `Generated today task ID: ${taskId}`);
  assert(taskTitle === testCard.title, `Task title matches Kanban card: ${taskTitle}`);

  const todayTasks = await taskService.getTodayTasks();
  const bridgedTask = todayTasks.find((t) => t.id === taskId);
  assert(Boolean(bridgedTask), 'Bridged task exists in Today Tasks queue');
  assert(
    bridgedTask?.sourceKanbanCardId === testCard.id,
    'Bridged task contains sourceKanbanCardId link'
  );
  assert(
    bridgedTask?.subtasks?.length === 2,
    `Bridged task copied 2 subtasks from Kanban card (got: ${bridgedTask?.subtasks?.length})`
  );

  // Clean up test card
  await kanbanService.deleteCard(testCard.id);
  freshBoards = await kanbanService.fetchBoards();
  assert(
    !freshBoards.some((b) => b.cards.some((c) => c.id === testCard.id)),
    'Test card deleted successfully'
  );

  // -------------------------------------------------------------
  // Test 7: Kanban Zustand Store Engine
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Kanban Zustand Store Engine ---');

  const store = useKanbanStore.getState();
  await store.loadBoards();

  const storeBoards = useKanbanStore.getState().boards;
  assert(storeBoards.length >= 3, `Store loaded ${storeBoards.length} boards`);

  const activeId = useKanbanStore.getState().activeBoardId;
  assert(Boolean(activeId), `Store has active board ID: ${activeId}`);

  // Test Drawer toggle in store
  assert(useKanbanStore.getState().isDrawerOpen === false, 'Drawer initially closed');
  store.openCardDrawer('c_planned_1');
  assert(useKanbanStore.getState().isDrawerOpen === true, 'openCardDrawer opens drawer');
  assert(
    useKanbanStore.getState().selectedCardId === 'c_planned_1',
    'selectedCardId is c_planned_1'
  );
  store.closeCardDrawer();
  assert(useKanbanStore.getState().isDrawerOpen === false, 'closeCardDrawer closes drawer');

  // Test Search & Tag Filters
  store.setSearchQuery('API');
  assert(useKanbanStore.getState().searchQuery === 'API', 'setSearchQuery updates query');
  store.setSelectedTagFilter('Docs');
  assert(
    useKanbanStore.getState().selectedTagFilter === 'Docs',
    'setSelectedTagFilter updates tag'
  );

  // Reset filters
  store.setSearchQuery('');
  store.setSelectedTagFilter(null);

  // -------------------------------------------------------------
  // Test 8: Custom Domain Tag Engine
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Custom Domain Tag Engine ---');

  // Verify customTags store list starts empty (no default domain tags)
  assert(
    useKanbanStore.getState().customTags.length === 0,
    'customTags store list starts empty without system default tags'
  );

  // Create custom domain tag
  const createdTag = store.createCustomTag('Infrastructure', 'blue');
  assert(createdTag.label === 'Infrastructure', 'Created custom tag with label "Infrastructure"');
  assert(createdTag.color === 'blue', 'Created custom tag with color "blue"');

  const tagsAfterCreate = store.getAvailableTags();
  assert(
    tagsAfterCreate.some((t) => t.label === 'Infrastructure'),
    'getAvailableTags() contains newly created "Infrastructure" tag'
  );

  // Tag style derivation
  const blueStyle = getTagStyle('Infrastructure', 'blue');
  assert(
    blueStyle.includes(PASTEL_TAG_COLORS.blue.bg) &&
      blueStyle.includes(PASTEL_TAG_COLORS.blue.text) &&
      blueStyle.includes(PASTEL_TAG_COLORS.blue.border),
    'Blue tag style maps correctly to Aura UI pastel tokens'
  );

  const fallbackStyle = getTagStyle('ArbitraryUserCategory');
  assert(fallbackStyle.length > 0, 'Deterministic fallback style generated for arbitrary tag');

  // Delete custom domain tag
  store.deleteCustomTag('Infrastructure');
  const tagsAfterDelete = store.getAvailableTags();
  assert(
    !tagsAfterDelete.some((t) => t.label === 'Infrastructure'),
    'deleteCustomTag() removes tag from available list'
  );

  // -------------------------------------------------------------
  // Test 9: Custom Column Workflow Engine
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Custom Column Workflow Engine ---');

  const initialCols =
    useKanbanStore.getState().boards.find((b) => b.id === boardA!.id)?.columns || [];
  const initialCount = initialCols.length;
  assert(initialCount === 4, `Board A starts with 4 columns (got: ${initialCount})`);

  // Add custom column: QA Testing
  const newCol = await useKanbanStore.getState().addColumn(boardA!.id, 'QA Testing', 'pink');
  assert(newCol.title === 'QA Testing', `Added column with title: ${newCol.title}`);
  assert(newCol.dotColor === '#F43F5E', 'Column assigned rose pink dotColor');

  const colsAfterAdd =
    useKanbanStore.getState().boards.find((b) => b.id === boardA!.id)?.columns || [];
  assert(colsAfterAdd.length === initialCount + 1, 'Board columns count incremented by 1');
  assert(
    colsAfterAdd.some((c) => c.id === newCol.id),
    'New column exists in active board columns'
  );

  // Add card to this new custom column
  const cardInCustomCol = await useKanbanStore
    .getState()
    .addCard(boardA!.id, newCol.id, 'Verify end-to-end webhook delivery');
  assert(cardInCustomCol.columnId === newCol.id, 'Card created inside new custom column');

  // Rename custom column
  await useKanbanStore.getState().renameColumn(boardA!.id, newCol.id, 'Staging & Verification');
  const colsAfterRename =
    useKanbanStore.getState().boards.find((b) => b.id === boardA!.id)?.columns || [];
  const renamedCol = colsAfterRename.find((c) => c.id === newCol.id);
  assert(
    renamedCol?.title === 'Staging & Verification',
    `Renamed column title is "Staging & Verification" (got: ${renamedCol?.title})`
  );

  // Delete custom column and verify cards move to fallback column (e.g. planned)
  await useKanbanStore.getState().deleteColumn(boardA!.id, newCol.id, 'planned');
  const colsAfterDelete =
    useKanbanStore.getState().boards.find((b) => b.id === boardA!.id)?.columns || [];
  assert(
    !colsAfterDelete.some((c) => c.id === newCol.id),
    'Custom column removed from board columns'
  );

  const freshBoardsAfterColDelete = await kanbanService.fetchBoards();
  const boardAFresh = freshBoardsAfterColDelete.find((b) => b.id === boardA!.id);
  const reallocatedCard = boardAFresh?.cards.find((c) => c.id === cardInCustomCol.id);
  assert(
    reallocatedCard?.columnId === 'planned',
    'Cards in deleted column safely moved to fallback column (planned)'
  );

  // -------------------------------------------------------------
  // Test 10: Due Date & Time Telegram Reminder Reference
  // -------------------------------------------------------------
  console.log('\n--- Test 10: Due Date & Time Telegram Reminder Reference ---');

  const todayIso = getDuePresetIso('today_eod');
  assert(todayIso.includes('T17:00'), `getDuePresetIso("today_eod") sets 17:00 (got: ${todayIso})`);

  const tomorrowIso = getDuePresetIso('tomorrow_morning');
  assert(
    tomorrowIso.includes('T09:00'),
    `getDuePresetIso("tomorrow_morning") sets 09:00 (got: ${tomorrowIso})`
  );

  const fridayIso = getDuePresetIso('this_friday');
  assert(
    fridayIso.includes('T17:00'),
    `getDuePresetIso("this_friday") sets 17:00 (got: ${fridayIso})`
  );

  // Format tests
  const todayStatus = formatDueDateTime(todayIso);
  assert(todayStatus.isToday === true, 'todayStatus.isToday is true');
  assert(
    todayStatus.formatted.startsWith('Today 17:00'),
    `todayStatus formatted is "Today 17:00" (got: ${todayStatus.formatted})`
  );

  const tomorrowStatus = formatDueDateTime(tomorrowIso);
  assert(tomorrowStatus.isTomorrow === true, 'tomorrowStatus.isTomorrow is true');
  assert(
    tomorrowStatus.formatted.startsWith('Tomorrow 09:00'),
    `tomorrowStatus formatted is "Tomorrow 09:00" (got: ${tomorrowStatus.formatted})`
  );

  // Overdue status test (2 days ago)
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 2);
  const overdueStatus = formatDueDateTime(pastDate.toISOString());
  assert(overdueStatus.isOverdue === true, 'Past date evaluates to isOverdue: true');

  // Add card with exact timestamp reference
  const timedCard = await useKanbanStore.getState().addCard({
    boardId: boardA!.id,
    columnId: 'planned',
    title: 'Deploy Telegram Bot Webhook Worker',
    dueDate: fridayIso,
  });
  assert(timedCard.dueDate === fridayIso, 'Card created with exact ISO reminder time reference');
  await useKanbanStore.getState().deleteCard(timedCard.id);

  console.log('\nAll 50 Long-Term Kanban Board engine tests PASSED successfully!');
}

runKanbanTests().catch((err) => {
  console.error('Test execution failed:', err);
  throw err;
});
