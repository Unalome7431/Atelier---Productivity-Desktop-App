import { create } from 'zustand';
import { Task } from '@/types';
import { taskService } from '@/services/taskService';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  loadTasks: () => Promise<void>;
  addTask: (title: string, category?: string, time?: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await taskService.getTodayTasks();
      set({ tasks, isLoading: false });
    } catch (err) {
      console.error('Failed to load tasks:', err);
      set({ isLoading: false });
    }
  },

  addTask: async (title: string, category = '#work', time?: string) => {
    const newTask = await taskService.createTask(title, category, time);
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },

  toggleTask: async (taskId: string) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const nextDone = !task.completed;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: nextDone } : t
      ),
    }));

    await taskService.toggleTask(taskId, nextDone);
  },
}));
