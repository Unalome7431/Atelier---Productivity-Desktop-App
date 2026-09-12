import { create } from 'zustand';
import { Task, TaskSubtask } from '@/types';
import { taskService } from '@/services/taskService';

interface TasksState {
  tasks: Task[]; // Today's Queue
  inboxTasks: Task[]; // Unscheduled Backlog
  isLoading: boolean;
  loadTasks: () => Promise<void>;
  addTask: (params: {
    title: string;
    category?: string;
    iconType?: 'flame' | 'chat' | 'mail' | 'code' | 'default';
    scheduledDate?: string | null;
    sourceKanbanCardId?: string;
  }) => Promise<Task>;
  toggleTask: (taskId: string) => Promise<void>;
  reorderTasks: (reorderedTasks: Task[]) => Promise<void>;
  moveTaskToInbox: (taskId: string) => Promise<void>;
  moveTaskToToday: (taskId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  incrementTaskPomodoro: (taskId: string) => Promise<void>;
  setTaskPomodoroEstimated: (taskId: string, estimated: number) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  inboxTasks: [],
  isLoading: false,

  loadTasks: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const [todayTasks, inboxTasks] = await Promise.all([
        taskService.getTodayTasks(),
        taskService.getInboxTasks(),
      ]);
      set({ tasks: todayTasks, inboxTasks, isLoading: false });
    } catch (err) {
      console.error('Failed to load tasks:', err);
      set({ isLoading: false });
    }
  },

  addTask: async (params) => {
    const newTask = await taskService.createTask(params);
    if (newTask.scheduledDate) {
      set((state) => ({ tasks: [...state.tasks, newTask] }));
    } else {
      set((state) => ({ inboxTasks: [...state.inboxTasks, newTask] }));
    }
    return newTask;
  },

  toggleTask: async (taskId: string) => {
    const { tasks, inboxTasks } = get();
    const isToday = tasks.some((t) => t.id === taskId);
    const targetList = isToday ? tasks : inboxTasks;
    const task = targetList.find((t) => t.id === taskId);
    if (!task) return;

    const nextDone = !task.completed;
    if (isToday) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, completed: nextDone } : t)),
      }));
    } else {
      set((state) => ({
        inboxTasks: state.inboxTasks.map((t) =>
          t.id === taskId ? { ...t, completed: nextDone } : t
        ),
      }));
    }

    await taskService.toggleTask(taskId, nextDone);
  },

  reorderTasks: async (reorderedTasks: Task[]) => {
    set({ tasks: reorderedTasks });
    await taskService.reorderTasks(reorderedTasks.map((t) => t.id));
  },

  moveTaskToInbox: async (taskId: string) => {
    const { tasks } = get();
    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove) return;

    const updatedTask: Task = {
      ...taskToMove,
      scheduledDate: null,
    };

    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      inboxTasks: [...state.inboxTasks, updatedTask],
    }));

    await taskService.moveTaskToInbox(taskId);
  },

  moveTaskToToday: async (taskId: string) => {
    const { inboxTasks } = get();
    const taskToMove = inboxTasks.find((t) => t.id === taskId);
    if (!taskToMove) return;

    const updatedTask: Task = {
      ...taskToMove,
      scheduledDate: new Date().toISOString().split('T')[0],
    };

    set((state) => ({
      inboxTasks: state.inboxTasks.filter((t) => t.id !== taskId),
      tasks: [...state.tasks, updatedTask],
    }));

    await taskService.moveTaskToToday(taskId);
  },

  addSubtask: async (taskId: string, title: string) => {
    const updatedSubtasks: TaskSubtask[] = await taskService.addSubtask(taskId, title);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t)),
      inboxTasks: state.inboxTasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t
      ),
    }));
  },

  toggleSubtask: async (taskId: string, subtaskId: string) => {
    const updatedSubtasks: TaskSubtask[] = await taskService.toggleSubtask(taskId, subtaskId);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t)),
      inboxTasks: state.inboxTasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t
      ),
    }));
  },

  deleteTask: async (taskId: string) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      inboxTasks: state.inboxTasks.filter((t) => t.id !== taskId),
    }));
    await taskService.deleteTask(taskId);
  },

  incrementTaskPomodoro: async (taskId: string) => {
    const next = await taskService.incrementPomodoroCycle(taskId);
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, pomodoroCyclesCompleted: next } : t
      ),
      inboxTasks: state.inboxTasks.map((t) =>
        t.id === taskId ? { ...t, pomodoroCyclesCompleted: next } : t
      ),
    }));
  },

  setTaskPomodoroEstimated: async (taskId: string, estimated: number) => {
    await taskService.updatePomodoroEstimation(taskId, estimated);
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, pomodoroCyclesEstimated: estimated } : t
      ),
      inboxTasks: state.inboxTasks.map((t) =>
        t.id === taskId ? { ...t, pomodoroCyclesEstimated: estimated } : t
      ),
    }));
  },
}));
