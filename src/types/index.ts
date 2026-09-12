export type NavigationTab = 'cockpit' | 'calendar' | 'canvas' | 'kanban' | 'notes';

export interface Routine {
  id: string;
  title: string;
  description?: string;
  category?: string;
  cadence: 'daily' | 'weekdays' | 'custom';
  customDays?: number[]; // 0 = Sun, 1 = Mon, ...
  icon?: string;
  color?: string;
  targetCount?: number; // e.g. 1 for boolean check, 4 for 4-step habit (e.g. 4 glasses)
  orderIndex?: number;
  createdAt: string;
}

export interface RoutineLog {
  id: string;
  routineId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  currentCount?: number;
  completedAt?: string;
}

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category?: string;
  iconType?: 'flame' | 'chat' | 'mail' | 'code' | 'default';
  timeTag?: string; // e.g. '11:30', 'Today', 'Later'
  scheduledDate?: string | null; // YYYY-MM-DD (null = Inbox backlog)
  scheduledTime?: string; // e.g. '09:00 AM'
  completed: boolean;
  completedAt?: string;
  orderIndex: number;
  subtasks?: TaskSubtask[];
  pomodoroCyclesEstimated?: number;
  pomodoroCyclesCompleted?: number;
  sourceKanbanCardId?: string;
  sourceKanbanBoardTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveFocusTarget {
  id: string;
  title: string;
  type: 'task' | 'kanban';
  boardTitle?: string;
  columnTitle?: string;
  timeTag?: string;
}

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  targetCyclesDaily: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

export interface PomodoroState extends PomodoroSettings {
  mode: 'focus' | 'shortBreak' | 'longBreak';
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  activeTaskId?: string;
  activeTarget?: ActiveFocusTarget | null;
  completedCyclesToday: number;
}

export interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  tags?: string[];
  dueDate?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  colorAccent?: string;
  orderIndex: number;
}

export interface KanbanBoard {
  id: string;
  title: string;
  columns: KanbanColumn[];
  cards: KanbanCard[];
}

export interface CanvasNodeData {
  label: string;
  type: 'note' | 'task' | 'kanban' | 'text' | 'group';
  content?: string;
  color?: string;
  referenceId?: string;
}

export interface CanvasNodeItem {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: CanvasNodeData;
}

export interface CanvasEdgeItem {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface CanvasDocument {
  id: string;
  title: string;
  nodes: CanvasNodeItem[];
  edges: CanvasEdgeItem[];
  updatedAt: string;
}

export interface NoteDocument {
  id: string;
  title: string;
  content: string; // HTML or Markdown
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  category: 'meeting' | 'focus' | 'personal' | 'deadline' | 'review';
  startTime: string; // HH:mm or ISO
  endTime: string; // HH:mm or ISO
  date: string; // YYYY-MM-DD
  description?: string;
  location?: string;
  colorAccent?: 'lavender' | 'mint' | 'sand' | 'blue';
}

export interface RecurringWeeklyBlock {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  timeSlot: string; // e.g. "09:00", "10:00", "11:00", "14:00", "16:00"
  title: string;
  startFormatted: string; // e.g. "09:00"
  endFormatted: string; // e.g. "09:45"
  category: 'meeting' | 'focus' | 'review' | 'build' | 'planning';
  colorAccent: 'lavender' | 'mint' | 'sand' | 'blue';
}

export interface SyncStatus {
  state: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt?: string;
  pendingMutationsCount: number;
}
