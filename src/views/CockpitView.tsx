import React, { useEffect, useState } from 'react';
import { CheckCircle2, Flame, Plus, Sparkles, Clock, Calendar as CalendarIcon, Check } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { SegmentedBar } from '@/components/common/SegmentedBar';
import { Modal } from '@/components/common/Modal';
import { useRoutinesStore } from '@/stores/useRoutinesStore';
import { useTasksStore } from '@/stores/useTasksStore';

export const CockpitView: React.FC = () => {
  const { routines, todayLogs, streakDays, loadRoutines, toggleRoutine } = useRoutinesStore();
  const { tasks, loadTasks, addTask, toggleTask } = useTasksStore();

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('#work');
  const [taskTime, setTaskTime] = useState('10:00 AM');

  useEffect(() => {
    loadRoutines();
    loadTasks();
  }, [loadRoutines, loadTasks]);

  const completedRoutinesCount = routines.filter((r) =>
    todayLogs.some((l) => l.routineId === r.id && l.completed)
  ).length;

  const routineCompletionPct = routines.length > 0
    ? Math.round((completedRoutinesCount / routines.length) * 100)
    : 0;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await addTask(taskTitle.trim(), taskCategory, taskTime);
    setTaskTitle('');
    setIsNewTaskModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 bg-bg max-w-7xl mx-auto w-full">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-mono-uppercase text-midGray uppercase">
            Today • Sunday, Sep 6
          </span>
          <h2 className="font-display font-bold text-display-1 text-primaryDark mt-1">
            Good morning, Creator.
          </h2>
          <p className="text-secondaryGray text-ui-rg-sm mt-0.5">
            You have {routines.length} habits and {tasks.length} tasks scheduled for deep focus today.
          </p>
        </div>
        <Button
          variant="mint"
          size="md"
          className="gap-2 shadow-subtle"
          onClick={() => setIsNewTaskModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </Button>
      </div>

      {/* Routine Progress Card & Habits Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Habit Completion Card */}
        <div className="p-5 rounded-card bg-surface border border-border flex flex-col justify-between shadow-card">
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-display-5 text-primaryDark">
              Daily Habits Cadence
            </span>
            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-pill border border-amber-200/60 font-mono text-mono-xs font-semibold">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span>{streakDays}-day streak</span>
            </div>
          </div>
          <div className="my-4 flex flex-col gap-2">
            <div className="flex items-baseline justify-between font-mono text-mono-xs">
              <span className="text-secondaryGray">Completion</span>
              <span className="font-bold text-primaryDark">{routineCompletionPct}%</span>
            </div>
            <SegmentedBar
              totalSegments={routines.length || 4}
              completedSegments={completedRoutinesCount}
            />
          </div>
          <p className="text-ui-rg-xs text-secondaryGray">
            {completedRoutinesCount} of {routines.length} routines completed today. Keep up the rhythm!
          </p>
        </div>

        {/* Focus Time Card */}
        <div className="p-5 rounded-card bg-surface border border-border flex flex-col justify-between shadow-card">
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-display-5 text-primaryDark">
              Focus Time
            </span>
            <Clock className="w-4 h-4 text-secondaryGray" />
          </div>
          <div className="my-2">
            <span className="font-display font-bold text-display-1 text-primaryDark">
              2.5 hrs
            </span>
            <p className="text-ui-rg-xs text-secondaryGray mt-1">
              5 pomodoro cycles recorded
            </p>
          </div>
          <div className="flex gap-1.5">
            <Badge variant="mint">#deepwork</Badge>
            <Badge variant="lavender">#coding</Badge>
          </div>
        </div>

        {/* Up Next in Calendar */}
        <div className="p-5 rounded-card bg-surface border border-border flex flex-col justify-between shadow-card">
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-display-5 text-primaryDark">
              Next Scheduled Block
            </span>
            <CalendarIcon className="w-4 h-4 text-secondaryGray" />
          </div>
          <div className="my-2">
            <span className="font-display font-semibold text-display-5 text-primaryDark">
              Architecture & API Design
            </span>
            <p className="text-ui-rg-xs text-secondaryGray mt-0.5">
              10:30 AM – 11:45 AM (Focus Block)
            </p>
          </div>
          <Badge variant="sky">Deep Work Block</Badge>
        </div>
      </div>

      {/* Routine Tracker & Today's Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit List */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-mauve" />
              <h3 className="font-display font-bold text-display-4 text-primaryDark">
                Daily Routines
              </h3>
            </div>
            <span className="font-mono text-mono-xs text-midGray uppercase">Auto-reset 00:00</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {routines.map((routine) => {
              const isDone = todayLogs.some(
                (l) => l.routineId === routine.id && l.completed
              );
              return (
                <div
                  key={routine.id}
                  onClick={() => toggleRoutine(routine.id)}
                  className="flex items-center justify-between p-3 rounded-md bg-bg border border-border/80 hover:border-[#D8D2C5] transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <button
                      className={`w-5 h-5 rounded-sm flex items-center justify-center border transition-all ${
                        isDone
                          ? 'bg-primaryDark border-primaryDark text-bg'
                          : 'border-border bg-surface'
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span
                      className={`text-ui-rg-sm font-medium ${
                        isDone ? 'line-through text-midGray' : 'text-primaryDark'
                      }`}
                    >
                      {routine.title}
                    </span>
                  </div>
                  <Badge variant={isDone ? 'default' : 'lavender'}>
                    {routine.category}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tactical Tasks Queue */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-display-4 text-primaryDark">
              Today's Task Queue
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-ui-rg-xs"
              onClick={() => setIsNewTaskModalOpen(true)}
            >
              + Add Task
            </Button>
          </div>

          <div className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="flex items-center justify-between p-3 rounded-md bg-bg border border-border/80 hover:border-[#D8D2C5] transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <button
                    className={`w-5 h-5 rounded-sm flex items-center justify-center border transition-all ${
                      task.completed
                        ? 'bg-primaryDark border-primaryDark text-bg'
                        : 'border-border bg-surface'
                    }`}
                  >
                    {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <span
                    className={`text-ui-rg-sm font-medium ${
                      task.completed ? 'line-through text-midGray' : 'text-primaryDark'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {task.scheduledTime && (
                    <span className="font-mono text-mono-xs text-secondaryGray">
                      {task.scheduledTime}
                    </span>
                  )}
                  <Badge variant="mint">{task.category}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Task Entry Modal */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title="Add Tactical Task"
        description="Quickly capture a focused task for today's queue."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Task Title
            </label>
            <input
              type="text"
              autoFocus
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Finalize SQLite sync engine contract..."
              className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Category Tag
              </label>
              <input
                type="text"
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
                placeholder="#work"
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Time Block
              </label>
              <input
                type="text"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                placeholder="10:00 AM"
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
