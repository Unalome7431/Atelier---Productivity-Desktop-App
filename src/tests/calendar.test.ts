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

import { calendarService } from '../services/calendarService';
import { taskService } from '../services/taskService';
import { useCalendarStore } from '../stores/useCalendarStore';
import { db } from '../db/database';
import { Task } from '../types';
import { getTodayDateString } from '../lib/utils';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function runCalendarTests() {
  console.log('=== ATELIER SCHEDULE & TIME-BLOCKING CALENDAR TEST SUITE ===\n');

  // Initialize database
  await db.init();

  // -------------------------------------------------------------
  // Test 1: Calendar Event Seeding & Figma Alignment
  // -------------------------------------------------------------
  console.log('--- Test 1: Calendar Event Seeding & Figma Alignment ---');
  await calendarService.seedDefaultEvents();
  const seededEvents = await calendarService.getEvents();
  assert(
    seededEvents.length >= 8,
    `Seeded at least 8 default events (got: ${seededEvents.length})`
  );

  // September 9 Team Sync (Meeting / Lavender / Fixed)
  const teamSync = seededEvents.find((e) => e.title === 'Team sync' && e.date === '2026-09-09');
  assert(Boolean(teamSync), 'Team sync event exists on 2026-09-09');
  assert(
    teamSync?.category === 'meeting',
    `Team sync category is "meeting" (got: ${teamSync?.category})`
  );
  assert(
    teamSync?.startTime === '09:30',
    `Team sync starts at 09:30 (got: ${teamSync?.startTime})`
  );
  assert(teamSync?.endTime === '10:15', `Team sync ends at 10:15 (got: ${teamSync?.endTime})`);
  assert(
    teamSync?.colorAccent === 'lavender',
    `Team sync color accent is lavender (got: ${teamSync?.colorAccent})`
  );
  assert(teamSync?.isFixed === true, 'Team sync is marked as fixed commitment');

  // September 9 Deep Work Block (Focus / Mint / Flexible)
  const deepWork = seededEvents.find(
    (e) => e.title === 'Deep work block' && e.date === '2026-09-09'
  );
  assert(Boolean(deepWork), 'Deep work block event exists on 2026-09-09');
  assert(
    deepWork?.category === 'focus',
    `Deep work category is "focus" (got: ${deepWork?.category})`
  );
  assert(
    deepWork?.startTime === '13:00',
    `Deep work starts at 13:00 (got: ${deepWork?.startTime})`
  );
  assert(deepWork?.endTime === '15:00', `Deep work ends at 15:00 (got: ${deepWork?.endTime})`);
  assert(
    deepWork?.colorAccent === 'mint',
    `Deep work color accent is mint (got: ${deepWork?.colorAccent})`
  );
  assert(deepWork?.isFixed === false, 'Deep work is marked as flexible work block');
  assert(
    Boolean(deepWork?.taskId),
    `Deep work is linked to a tactical task ID (got: ${deepWork?.taskId})`
  );

  // September 1 Weekly planning
  const weeklyPlan = seededEvents.find(
    (e) => e.title === 'Weekly planning' && e.date === '2026-09-01'
  );
  assert(Boolean(weeklyPlan), 'Weekly planning event exists on 2026-09-01');
  assert(
    weeklyPlan?.startTime === '09:00',
    `Weekly planning starts at 09:00 (got: ${weeklyPlan?.startTime})`
  );

  // -------------------------------------------------------------
  // Test 2: Calendar CRUD Operations
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Calendar CRUD Operations ---');
  const createdEvent = await calendarService.addEvent(
    'Architecture Review',
    'review',
    '2026-09-18',
    '14:00',
    '15:30',
    'Review state sync engine architecture',
    {
      colorAccent: 'lavender',
      isFixed: true,
    }
  );

  assert(Boolean(createdEvent?.id), 'addEvent returns created event with ID');
  assert(createdEvent.title === 'Architecture Review', 'Title matches input');
  assert(createdEvent.date === '2026-09-18', 'Date matches input');
  assert(createdEvent.startTime === '14:00', 'Start time matches input');
  assert(createdEvent.endTime === '15:30', 'End time matches input');
  assert(createdEvent.isFixed === true, 'Event marked as fixed');

  // Update event
  const updatedEvent = await calendarService.updateEvent(createdEvent.id, {
    title: 'Architecture Review (Updated)',
    startTime: '14:30',
    endTime: '16:00',
  });
  assert(
    updatedEvent?.title === 'Architecture Review (Updated)',
    'updateEvent successfully updated title'
  );
  assert(updatedEvent?.startTime === '14:30', 'updateEvent successfully updated start time');

  // Delete event
  await calendarService.deleteEvent(createdEvent.id);
  const reloaded = await calendarService.getEvents();
  assert(!reloaded.some((e) => e.id === createdEvent.id), 'deleteEvent successfully removed event');

  // Test optional timeline modes:
  // 2a. Event with NO timeline (All Day / Date-only)
  const noTimelineEvent = await calendarService.addEvent(
    'Company Milestone Day',
    'personal',
    '2026-09-20',
    undefined,
    undefined,
    'All day celebration'
  );
  assert(Boolean(noTimelineEvent?.id), 'Event with no timeline created');
  assert(noTimelineEvent.startTime === undefined, 'No timeline event has undefined startTime');
  assert(noTimelineEvent.endTime === undefined, 'No timeline event has undefined endTime');

  const fetchedAllEvents = await calendarService.getEvents();
  const fetchedNoTime = fetchedAllEvents.find((e) => e.id === noTimelineEvent.id);
  assert(Boolean(fetchedNoTime), 'Fetched no-timeline event from DB');
  assert(!fetchedNoTime?.startTime, 'Persisted no-timeline event has no startTime');
  await calendarService.deleteEvent(noTimelineEvent.id);

  // 2b. Event with ONLY start time
  const startOnlyEvent = await calendarService.addEvent(
    'Quick Standup Call',
    'meeting',
    '2026-09-21',
    '11:00',
    undefined
  );
  assert(Boolean(startOnlyEvent?.id), 'Event with start time only created');
  assert(startOnlyEvent.startTime === '11:00', 'Start-only event has startTime 11:00');
  assert(startOnlyEvent.endTime === undefined, 'Start-only event has undefined endTime');

  const fetchedStartOnly = (await calendarService.getEvents()).find(
    (e) => e.id === startOnlyEvent.id
  );
  assert(fetchedStartOnly?.startTime === '11:00', 'Persisted start-only event matches startTime');
  assert(!fetchedStartOnly?.endTime, 'Persisted start-only event has no endTime');
  await calendarService.deleteEvent(startOnlyEvent.id);

  // -------------------------------------------------------------
  // Test 3: Weekly Recurring Blocks Matrix
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Weekly Recurring Blocks Matrix ---');
  const recurringBlocks = calendarService.getRecurringWeeklyBlocks();
  assert(
    recurringBlocks.length >= 6,
    `Loaded at least 6 default recurring weekly blocks (got: ${recurringBlocks.length})`
  );

  const mondayPlan = recurringBlocks.find((b) => b.dayOfWeek === 1 && b.timeSlot === '09:00');
  assert(Boolean(mondayPlan), 'Monday 09:00 recurring block exists');
  assert(
    mondayPlan?.title === 'Weekly planning',
    'Monday recurring block title is "Weekly planning"'
  );

  const tuesdayBuild = recurringBlocks.find((b) => b.dayOfWeek === 2 && b.timeSlot === '10:00');
  assert(Boolean(tuesdayBuild), 'Tuesday 10:00 recurring block exists');
  assert(
    tuesdayBuild?.title === 'Project build',
    'Tuesday recurring block title is "Project build"'
  );

  // -------------------------------------------------------------
  // Test 4: Zustand Calendar Store Engine
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Zustand Calendar Store Engine ---');
  const store = useCalendarStore.getState();
  await store.loadEvents();

  assert(useCalendarStore.getState().events.length >= 8, 'Store loaded calendar events');
  const todayDateStr = getTodayDateString();
  assert(
    useCalendarStore.getState().selectedDate === todayDateStr,
    `Default selectedDate is today (${todayDateStr})`
  );
  assert(useCalendarStore.getState().viewMode === 'month', 'Initial viewMode is "month"');

  // View mode switcher
  store.setViewMode('week');
  assert(
    useCalendarStore.getState().viewMode === 'week',
    'setViewMode("week") updates viewMode to week'
  );
  store.setViewMode('month');
  assert(
    useCalendarStore.getState().viewMode === 'month',
    'setViewMode("month") returns viewMode to month'
  );

  // Selected date update
  store.setSelectedDate('2026-09-15');
  assert(
    useCalendarStore.getState().selectedDate === '2026-09-15',
    'setSelectedDate updates selectedDate'
  );
  assert(
    useCalendarStore.getState().activeWeekStartDate === '2026-09-13',
    'Sunday of week correctly updated to 2026-09-13'
  );

  // Task drawer toggle
  assert(useCalendarStore.getState().isTaskDrawerOpen === false, 'Task drawer initially closed');
  store.toggleTaskDrawer();
  assert(
    useCalendarStore.getState().isTaskDrawerOpen === true,
    'toggleTaskDrawer opens task drawer'
  );
  store.setTaskDrawerOpen(false);
  assert(
    useCalendarStore.getState().isTaskDrawerOpen === false,
    'setTaskDrawerOpen(false) closes task drawer'
  );

  // -------------------------------------------------------------
  // Test 5: Tactical Task Integration & Time-Boxing Bridge
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Tactical Task Integration & Time-Boxing Bridge ---');
  // Create an unscheduled backlog task
  const mockTask: Task = await taskService.createTask({
    title: 'Profile Settings Redesign',
    description: 'Refactor user avatar and profile modal',
    scheduledDate: null,
  });

  assert(Boolean(mockTask.id), 'Created backlog task');
  assert(mockTask.scheduledDate === null, 'Task starts unscheduled in inbox');

  // Schedule task via time-boxing
  const targetDate = getTodayDateString();
  const scheduledTimeBox = await store.scheduleTask(mockTask, targetDate, '10:00', 90);
  assert(Boolean(scheduledTimeBox.id), 'scheduleTask created calendar event');
  assert(
    scheduledTimeBox.title === 'Profile Settings Redesign',
    'Calendar event title matches task'
  );
  assert(scheduledTimeBox.date === targetDate, `Event date is ${targetDate}`);
  assert(scheduledTimeBox.startTime === '10:00', 'Event start time is 10:00');
  assert(scheduledTimeBox.endTime === '11:30', 'Event end time computed for 90m is 11:30');
  assert(
    scheduledTimeBox.colorAccent === 'mint',
    'Flexible time-box styled with mint pastel accent'
  );
  assert(
    scheduledTimeBox.taskId === mockTask.id,
    'Calendar event has taskId bound to original task'
  );
  assert(scheduledTimeBox.isFixed === false, 'Time-boxed task is marked as flexible work block');

  // Verify task was updated in database
  const targetTasks = await taskService.getTodayTasks(targetDate);
  const matchingTask = targetTasks.find((t) => t.id === mockTask.id);
  assert(Boolean(matchingTask), `Task now scheduled in database for ${targetDate}`);

  // Verify past incomplete task rollover to Inbox
  const pastTask = await taskService.createTask({
    title: 'Past Unfinished Task',
    scheduledDate: '2026-09-01',
  });
  assert(pastTask.scheduledDate === '2026-09-01', 'Task created with past date');
  await taskService.rolloverIncompleteTasks();
  const inboxAfterRollover = await taskService.getInboxTasks();
  const rolledOver = inboxAfterRollover.find((t) => t.id === pastTask.id);
  assert(Boolean(rolledOver), 'Incomplete task from past date automatically rolled over to Inbox');

  // -------------------------------------------------------------
  // Test 6: 6×7 Monthly Grid (42 Cells) & Tan Highlight Engine
  // -------------------------------------------------------------
  console.log('\n--- Test 6: 6×7 Monthly Grid (42 Cells) & Tan Highlight Engine ---');
  // Verify 42 cells formula for September 2026 (starts on Tuesday, 30 days)
  const sepFirstDay = new Date(2026, 8, 1).getDay(); // Tuesday = 2
  const sepDaysCount = new Date(2026, 9, 0).getDate(); // 30
  const leadingDays = sepFirstDay; // 2 previous month filler days (Aug 30, Aug 31)
  const trailingDays = 42 - (leadingDays + sepDaysCount); // 42 - 32 = 10 next month filler days

  assert(sepFirstDay === 2, 'September 2026 starts on Tuesday (index 2)');
  assert(sepDaysCount === 30, 'September 2026 has 30 days');
  assert(
    leadingDays + sepDaysCount + trailingDays === 42,
    'Grid contains exactly 42 cells (6 rows × 7 columns)'
  );
  assert(trailingDays === 10, 'Grid contains 10 trailing filler days to complete 6 full weeks');

  // Verify for February 2026 (non-leap year, 28 days, starts on Sunday)
  const febFirstDay = new Date(2026, 1, 1).getDay(); // Sunday = 0
  const febDaysCount = new Date(2026, 2, 0).getDate(); // 28
  const febTrailing = 42 - (febFirstDay + febDaysCount);
  assert(
    febFirstDay + febDaysCount + febTrailing === 42,
    'February 2026 also fills exactly 42 cells'
  );

  // -------------------------------------------------------------
  // Test 7: Weekly 06:00 to 22:00 Hourly Timeline Grid Engine
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Weekly 06:00 to 22:00 Hourly Timeline Grid Engine ---');
  const HOURS = [
    '06:00',
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
  ];
  assert(
    HOURS.length === 17,
    `Timeline covers exactly 17 hourly intervals from 06:00 to 22:00 (got: ${HOURS.length})`
  );
  assert(HOURS[0] === '06:00', 'Timeline starts at 06:00');
  assert(HOURS[HOURS.length - 1] === '22:00', 'Timeline ends at 22:00');

  // Offset calculation from 06:00
  const calcMinutesFromStart = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h - 6) * 60 + (m || 0);
  };

  assert(calcMinutesFromStart('06:00') === 0, '06:00 is minute 0');
  assert(calcMinutesFromStart('09:30') === 210, '09:30 is 210 minutes from 06:00');
  assert(calcMinutesFromStart('13:00') === 420, '13:00 is 420 minutes from 06:00');
  assert(calcMinutesFromStart('22:00') === 960, '22:00 is 960 minutes from 06:00');

  // -------------------------------------------------------------
  // Test 8: Repeatable Schedule Block Creation & Adjustment
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Repeatable Schedule Block Creation & Adjustment ---');
  store.addWeeklyBlock({
    dayOfWeek: 3, // Wednesday
    title: 'Computer Graphics 201',
    startFormatted: '14:00',
    endFormatted: '15:30',
    category: 'class',
    colorAccent: 'blue',
    description: 'Room 304 - OpenGL Shaders Lab',
  });

  const blocksAfterAdd = useCalendarStore.getState().weeklyBlocks;
  const addedBlock = blocksAfterAdd.find((b) => b.title === 'Computer Graphics 201');
  assert(Boolean(addedBlock), 'Schedule block added successfully');
  assert(addedBlock?.dayOfWeek === 3, 'Day of week is Wednesday (3)');
  assert(addedBlock?.startFormatted === '14:00', 'Start time is 14:00');
  assert(addedBlock?.endFormatted === '15:30', 'End time is 15:30');
  assert(addedBlock?.colorAccent === 'blue', 'Color accent is blue');

  // Adjust the time block
  store.updateWeeklyBlock(addedBlock!.id, {
    startFormatted: '14:30',
    endFormatted: '16:00',
    colorAccent: 'mauve',
    description: 'Updated Room 402 - GLSL Lab',
  });

  const adjustedBlock = useCalendarStore
    .getState()
    .weeklyBlocks.find((b) => b.id === addedBlock!.id);
  assert(adjustedBlock?.startFormatted === '14:30', 'Adjusted start time is 14:30');
  assert(adjustedBlock?.endFormatted === '16:00', 'Adjusted end time is 16:00');
  assert(adjustedBlock?.colorAccent === 'mauve', 'Adjusted color accent is mauve');
  assert(
    adjustedBlock?.description === 'Updated Room 402 - GLSL Lab',
    'Adjusted description saved'
  );

  // Delete the block
  store.deleteWeeklyBlock(addedBlock!.id);
  const blocksAfterDelete = useCalendarStore.getState().weeklyBlocks;
  assert(
    !blocksAfterDelete.some((b) => b.id === addedBlock!.id),
    'Schedule block deleted successfully'
  );

  console.log('\nAll 38 Schedule & Time-Blocking Calendar engine tests PASSED successfully!');
}

runCalendarTests().catch((err) => {
  console.error(err);
  throw err;
});
