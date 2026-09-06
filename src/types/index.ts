export type NavigationTab = 'cockpit' | 'calendar' | 'canvas' | 'kanban' | 'notes';

export interface Routine {
  id: string;
  title: string;
  description?: string;
  category: string;
  cadence: 'daily' | 'weekdays' | 'custom';
  customDays?: number[]; // 0 = Sun, 1 = Mon, ...
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface RoutineLog {
  id: string;
  routineId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string; // e.g. '#work', '#personal', '#health'
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // e.g. '09:00 AM'
  completed: boolean;
  completedAt?: string;
  orderIndex: number;
  subtasks?: { id: string; title: string; completed: boolean }[];
  pomodoroCyclesEstimated?: number;
  pomodoroCyclesCompleted?: number;
  sourceKanbanCardId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PomodoroState {
  mode: 'focus' | 'shortBreak' | 'longBreak';
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  activeTaskId?: string;
  completedCyclesToday: number;
  targetCyclesDaily: number;
}

export interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  tags: string[];
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
  tags: string[];
  isPinned?: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  category: 'meeting' | 'focus' | 'personal' | 'deadline';
  startTime: string; // ISO string or HH:mm
  endTime: string;
  date: string; // YYYY-MM-DD
  description?: string;
  location?: string;
}

export interface SyncStatus {
  state: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt?: string;
  pendingMutationsCount: number;
}
