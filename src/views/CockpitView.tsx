import React, { useEffect, useState, useMemo } from 'react';
import {
  Check,
  CheckCircle2,
  Flame,
  Plus,
  Sparkles,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Inbox,
  Sun,
  Minus,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { SegmentedBar } from '@/components/common/SegmentedBar';
import { CircularProgress } from '@/components/cockpit/CircularProgress';
import { CreateRoutineModal } from '@/components/cockpit/CreateRoutineModal';
import { CreateTaskModal } from '@/components/cockpit/CreateTaskModal';
import { AllRoutinesModal, getStreakBadgeStyle } from '@/components/cockpit/AllRoutinesModal';
import { useRoutinesStore } from '@/stores/useRoutinesStore';
import { useTasksStore } from '@/stores/useTasksStore';
import { getTodayDateString, cn } from '@/lib/utils';
import { Task } from '@/types';

export const CockpitView: React.FC = () => {
  const {
    routines,
    todayLogs,
    streakDays,
    individualStreaks,
    loadRoutines,
    toggleRoutine,
    incrementRoutine,
    decrementRoutine,
    deleteRoutine,
  } = useRoutinesStore();

  const {
    tasks,
    inboxTasks,
    loadTasks,
    toggleTask,
    reorderTasks,
    moveTaskToInbox,
    moveTaskToToday,
    addSubtask,
    toggleSubtask,
    deleteTask,
  } = useTasksStore();

  // Modals state
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAllRoutinesModalOpen, setIsAllRoutinesModalOpen] = useState(false);
  const [activeTaskTab, setActiveTaskTab] = useState<'today' | 'inbox'>('today');

  // Subtasks expansion state
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<Record<string, string>>({});

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  // Live Date & Time for Header Pill (matching Figma: "WEDNESDAY · 17 APR  09:42 AM")
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    loadRoutines();
    loadTasks();
  }, [loadRoutines, loadTasks]);

  // Live clock interval & Midnight date change detection
  useEffect(() => {
    let lastDateStr = getTodayDateString();
    const interval = window.setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Auto-instantiation check when crossing midnight
      const currentDateStr = getTodayDateString();
      if (currentDateStr !== lastDateStr) {
        lastDateStr = currentDateStr;
        loadRoutines();
        loadTasks();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loadRoutines, loadTasks]);

  // Routines active for today based on cadence
  const todayRoutines = useMemo(() => {
    const dayOfWeek = currentTime.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    return routines.filter((r) => {
      if (r.cadence === 'weekdays') {
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      }
      if (r.cadence === 'custom') {
        return Array.isArray(r.customDays) && r.customDays.includes(dayOfWeek);
      }
      return true; // 'daily' or unspecified
    });
  }, [routines, currentTime]);

  // Routine Progress Calculations based on today's active routines
  const completedRoutinesCount = useMemo(() => {
    return todayRoutines.filter((r) => {
      const log = todayLogs.find((l) => l.routineId === r.id);
      if (!log) return false;
      return (
        Boolean(log.completed) ||
        (log.currentCount !== undefined && log.currentCount >= (r.targetCount || 1))
      );
    }).length;
  }, [todayRoutines, todayLogs]);

  const routineCompletionPct = useMemo(() => {
    if (todayRoutines.length === 0) return 0;
    return Math.round((completedRoutinesCount / todayRoutines.length) * 100);
  }, [completedRoutinesCount, todayRoutines.length]);

  // Subtask expansion toggler
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Inline add subtask handler
  const handleAddInlineSubtask = async (taskId: string) => {
    const text = newSubtaskInputs[taskId]?.trim();
    if (!text) return;
    await addSubtask(taskId, text);
    setNewSubtaskInputs((prev) => ({ ...prev, [taskId]: '' }));
  };

  // Drag and Drop reordering handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTaskId !== taskId) {
      setDragOverTaskId(taskId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    const currentList = [...tasks];
    const fromIndex = currentList.findIndex((t) => t.id === draggedTaskId);
    const toIndex = currentList.findIndex((t) => t.id === targetTaskId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const [removed] = currentList.splice(fromIndex, 1);
      currentList.splice(toIndex, 0, removed);
      reorderTasks(currentList);
    }

    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  // Icon component helper - default icon for all to-do items
  const renderTaskIcon = () => {
    return (
      <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-secondaryGray flex-shrink-0">
        <Sparkles className="w-4 h-4 text-accent-mauve" />
      </div>
    );
  };

  // Time / Deadline badge helper
  const renderTimeBadge = (task: Task) => {
    const tag = task.timeTag || task.scheduledTime;
    if (!tag) return null;

    if (tag === '11:30' || tag.includes(':')) {
      return (
        <span className="font-mono text-mono-xs font-semibold px-2.5 py-1 rounded-pill bg-rose-100/80 text-rose-900 border border-rose-200">
          {tag}
        </span>
      );
    }
    if (tag === 'Today') {
      return (
        <span className="font-mono text-mono-xs font-semibold px-2.5 py-1 rounded-pill bg-sky-100/90 text-sky-950 border border-sky-200">
          Today
        </span>
      );
    }
    if (tag === 'Later') {
      return (
        <span className="font-mono text-mono-xs font-semibold px-2.5 py-1 rounded-pill bg-indigo-100/80 text-indigo-950 border border-indigo-200">
          Later
        </span>
      );
    }
    return (
      <span className="font-mono text-mono-xs font-semibold px-2.5 py-1 rounded-pill bg-surface text-secondaryGray border border-border">
        {tag}
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 bg-bg max-w-7xl mx-auto w-full">
      {/* Main Dual-Card Grid matching Figma ("Habit tracker" on Left, "To-do list" on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT PRIMARY CARD: Routine progress                                       */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-surface rounded-panel border border-border p-6 shadow-card flex flex-col gap-5">
          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display font-bold text-xl text-primaryDark">Habit tracker</h2>
              <p className="text-secondaryGray text-ui-rg-xs mt-0.5">
                Check in your active habits & daily disciplines.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setIsAllRoutinesModalOpen(true)}
                className="font-mono text-mono-xs"
              >
                View All
              </Button>
              {/* Lavender rounded square add button */}
              <button
                onClick={() => setIsRoutineModalOpen(true)}
                title="Add Routine Habit"
                className="w-8 h-8 rounded-lg bg-accent-indigo hover:bg-accent-indigo/80 text-primaryDark border border-indigo-200 flex items-center justify-center transition-all cursor-pointer shadow-subtle active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Routine Metrics Overview Row */}
          <div className="p-4 rounded-xl bg-bg border border-border/80 flex items-center gap-5">
            <CircularProgress
              percentage={routineCompletionPct}
              size={80}
              strokeWidth={7}
              colorClass="stroke-accent-green"
              sublabel="Done"
            />
            <div className="flex-1 flex flex-col justify-center gap-2">
              <div className="flex items-center justify-between">
                <span className="font-sans font-semibold text-ui-md-sm text-primaryDark">
                  Habit Consistency
                </span>
                <div
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-0.5 rounded-pill border font-mono text-mono-xs font-semibold shadow-xs transition-colors',
                    getStreakBadgeStyle(streakDays).badge
                  )}
                >
                  <Flame className={cn('w-3.5 h-3.5', getStreakBadgeStyle(streakDays).flame)} />
                  <span>{streakDays}-day streak</span>
                </div>
              </div>
              <SegmentedBar
                totalSegments={todayRoutines.length || 1}
                completedSegments={completedRoutinesCount}
                activeColor="bg-accent-green"
              />
              <div className="flex items-center justify-between font-mono text-mono-xs text-secondaryGray">
                <span>
                  {completedRoutinesCount} of {todayRoutines.length} completed
                </span>
                <span className="text-midGray">Reset 00:00</span>
              </div>
            </div>
          </div>

          {/* Routine List */}
          <div className="flex flex-col gap-3">
            {todayRoutines.length === 0 ? (
              <div className="p-8 rounded-xl bg-bg border border-dashed border-border text-center flex flex-col items-center justify-center gap-1.5">
                <p className="font-sans font-medium text-ui-md-sm text-primaryDark">
                  No routines scheduled for today
                </p>
                <p className="text-ui-rg-xs text-secondaryGray">
                  Add daily habits or check your cadence rules.
                </p>
              </div>
            ) : (
              todayRoutines.map((routine) => {
                const log = todayLogs.find((l) => l.routineId === routine.id);
                const isDone =
                  Boolean(log?.completed) ||
                  (log?.currentCount !== undefined &&
                    log.currentCount >= (routine.targetCount || 1));
                const currentCount = log?.currentCount || 0;
                const targetCount = routine.targetCount || 1;
                const isCounterHabit = targetCount > 1;
                const routineStreak = individualStreaks[routine.id] || 0;
                const routineStreakStyle = getStreakBadgeStyle(routineStreak);

                return (
                  <div
                    key={routine.id}
                    className="p-3.5 rounded-xl bg-bg border border-border/80 hover:border-[#D8D2C5] transition-all flex flex-col gap-2.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span
                          className={cn(
                            'font-sans font-semibold text-ui-md-sm',
                            isDone ? 'line-through text-midGray' : 'text-primaryDark'
                          )}
                        >
                          {routine.title}
                        </span>
                        <div
                          className={cn(
                            'flex items-center gap-0.5 px-2 py-0.2 rounded-pill border font-mono text-[10px] font-semibold shadow-xs',
                            routineStreakStyle.badge
                          )}
                          title={`${routineStreak}-day habit streak`}
                        >
                          <Flame className={cn('w-3 h-3', routineStreakStyle.flame)} />
                          <span>{routineStreak}d</span>
                        </div>
                      </div>

                      {/* Right action / status */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isCounterHabit ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-mono-xs font-bold text-primaryDark mr-1">
                              {currentCount}/{targetCount}
                            </span>
                            <button
                              onClick={() => decrementRoutine(routine.id)}
                              disabled={currentCount <= 0}
                              title="Decrement"
                              className="w-6 h-6 rounded-md bg-surface border border-border flex items-center justify-center text-secondaryGray hover:text-primaryDark disabled:opacity-30 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => incrementRoutine(routine.id)}
                              disabled={currentCount >= targetCount}
                              title="Increment"
                              className="w-6 h-6 rounded-md bg-accent-green border border-emerald-300 flex items-center justify-center text-emerald-950 font-bold hover:brightness-95 disabled:opacity-30 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleRoutine(routine.id)}
                            className={cn(
                              'w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-pointer shadow-subtle',
                              isDone
                                ? 'bg-primaryDark border-primaryDark text-bg'
                                : 'border-border bg-surface hover:border-midGray'
                            )}
                          >
                            {isDone && <Check className="w-4 h-4 stroke-[2.5]" />}
                          </button>
                        )}

                        {/* Delete Habit button on hover */}
                        <button
                          onClick={() => deleteRoutine(routine.id)}
                          title="Delete Routine"
                          className="opacity-0 group-hover:opacity-100 text-midGray hover:text-rose-600 p-1 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar for Counter Habit (e.g. Hydration 3/4) */}
                    {isCounterHabit && (
                      <div className="w-full bg-border/70 rounded-pill h-2 overflow-hidden">
                        <div
                          className="bg-accent-green h-full rounded-pill transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.round((currentCount / targetCount) * 100))}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PRIMARY CARD: To-do list                                            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-surface rounded-panel border border-border p-6 shadow-card flex flex-col gap-5">
          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display font-bold text-xl text-primaryDark">To-do list</h2>
              <p className="text-secondaryGray text-ui-rg-xs mt-0.5">
                Complete the planned work for this session.
              </p>
            </div>
            {/* Soft-mint rounded square add button */}
            <button
              onClick={() => setIsTaskModalOpen(true)}
              title="Add Tactical Task"
              className="w-8 h-8 rounded-lg bg-accent-green hover:bg-accent-green/80 text-emerald-950 border border-emerald-300 flex items-center justify-center transition-all cursor-pointer shadow-subtle active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs: Today's Tactical Queue vs Daily Inbox Backlog */}
          <div className="flex items-center gap-2 border-b border-border/80 pb-3">
            <button
              onClick={() => setActiveTaskTab('today')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-pill font-sans text-ui-rg-xs font-semibold transition-all cursor-pointer',
                activeTaskTab === 'today'
                  ? 'bg-primaryDark text-bg shadow-xs'
                  : 'text-secondaryGray hover:text-primaryDark hover:bg-bg'
              )}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Today's Queue</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-pill font-mono text-[10px]',
                  activeTaskTab === 'today'
                    ? 'bg-white/20 text-bg'
                    : 'bg-surface border border-border text-secondaryGray'
                )}
              >
                {tasks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTaskTab('inbox')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-pill font-sans text-ui-rg-xs font-semibold transition-all cursor-pointer',
                activeTaskTab === 'inbox'
                  ? 'bg-primaryDark text-bg shadow-xs'
                  : 'text-secondaryGray hover:text-primaryDark hover:bg-bg'
              )}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Daily Inbox</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-pill font-mono text-[10px]',
                  activeTaskTab === 'inbox'
                    ? 'bg-white/20 text-bg'
                    : 'bg-surface border border-border text-secondaryGray'
                )}
              >
                {inboxTasks.length}
              </span>
            </button>
          </div>

          {/* Task Items List */}
          <div className="flex flex-col gap-3">
            {activeTaskTab === 'today' && tasks.length === 0 && (
              <div className="p-8 rounded-xl bg-bg border border-dashed border-border text-center flex flex-col items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-accent-mauve" />
                <p className="font-sans font-medium text-ui-md-sm text-primaryDark">
                  Your Today Queue is clear!
                </p>
                <p className="text-ui-rg-xs text-secondaryGray max-w-sm">
                  Add tactical tasks or move items from your Daily Inbox to plan today's focus.
                </p>
                <Button
                  variant="mint"
                  size="sm"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="mt-2 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Task</span>
                </Button>
              </div>
            )}

            {activeTaskTab === 'inbox' && inboxTasks.length === 0 && (
              <div className="p-8 rounded-xl bg-bg border border-dashed border-border text-center flex flex-col items-center justify-center gap-2">
                <Inbox className="w-6 h-6 text-secondaryGray" />
                <p className="font-sans font-medium text-ui-md-sm text-primaryDark">
                  Daily Inbox is empty.
                </p>
                <p className="text-ui-rg-xs text-secondaryGray max-w-sm">
                  Quickly dump unassigned ideas, incoming requests, or backlog items here anytime.
                </p>
                <Button
                  variant="mint"
                  size="sm"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="mt-2 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Task</span>
                </Button>
              </div>
            )}

            {/* Render List for Active Tab */}
            {(activeTaskTab === 'today' ? tasks : inboxTasks).map((task) => {
              const isExpanded = expandedTaskIds.has(task.id);
              const subtasks = task.subtasks || [];
              const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

              return (
                <div
                  key={task.id}
                  draggable={activeTaskTab === 'today'}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={(e) => handleDragOver(e, task.id)}
                  onDrop={(e) => handleDrop(e, task.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'p-3.5 rounded-card bg-bg border border-border/80 transition-all flex flex-col gap-2.5 group relative shadow-subtle',
                    dragOverTaskId === task.id && 'border-primaryDark border-2 shadow-md',
                    task.completed && 'opacity-75 bg-bg/70'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Drag Handle (for Today's Queue) */}
                      {activeTaskTab === 'today' && (
                        <div
                          title="Drag to reorder day sequence"
                          className="text-midGray hover:text-primaryDark cursor-grab active:cursor-grabbing p-0.5 flex-shrink-0"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                      )}

                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={cn(
                          'w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer flex-shrink-0',
                          task.completed
                            ? 'bg-primaryDark border-primaryDark text-bg'
                            : 'border-border bg-surface hover:border-midGray'
                        )}
                      >
                        {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      {/* Icon Circle */}
                      {renderTaskIcon()}

                      {/* Title & Subtasks trigger */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-sans font-semibold text-ui-md-sm truncate',
                              task.completed ? 'line-through text-midGray' : 'text-primaryDark'
                            )}
                          >
                            {task.title}
                          </span>

                          {/* Source Kanban Badge if linked */}
                          {task.sourceKanbanCardId && (
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-pill bg-purple-100 text-purple-900 border border-purple-200 flex-shrink-0 flex items-center gap-1">
                              <LayoutDashboard className="w-3 h-3" />
                              <span>Kanban</span>
                            </span>
                          )}
                        </div>

                        {/* Subtasks Progress chip if subtasks exist */}
                        {subtasks.length > 0 && (
                          <button
                            onClick={() => toggleTaskExpansion(task.id)}
                            className="flex items-center gap-1 font-mono text-[11px] text-secondaryGray hover:text-primaryDark mt-0.5 text-left w-fit cursor-pointer"
                          >
                            <span>
                              {completedSubtasksCount}/{subtasks.length} steps completed
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Chips & Action Controls */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Time chip (e.g. 11:30, Today, Later) */}
                      {renderTimeBadge(task)}

                      {/* Context actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {activeTaskTab === 'today' ? (
                          <button
                            onClick={() => moveTaskToInbox(task.id)}
                            title="Move to Daily Inbox"
                            className="text-xs text-secondaryGray hover:text-primaryDark p-1 rounded hover:bg-surface transition-colors cursor-pointer font-mono"
                          >
                            → Inbox
                          </button>
                        ) : (
                          <button
                            onClick={() => moveTaskToToday(task.id)}
                            title="Move to Today's Queue"
                            className="text-xs text-emerald-800 bg-accent-green/80 hover:bg-accent-green px-2 py-0.5 rounded-pill font-mono font-medium transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Sun className="w-3 h-3" />
                            <span>Today</span>
                          </button>
                        )}

                        {/* Toggle subtasks expansion if none yet, to add first subtask */}
                        {subtasks.length === 0 && (
                          <button
                            onClick={() => toggleTaskExpansion(task.id)}
                            title="Add sub-steps"
                            className="text-xs text-secondaryGray hover:text-primaryDark p-1 rounded hover:bg-surface transition-colors cursor-pointer font-mono"
                          >
                            + Step
                          </button>
                        )}

                        <button
                          onClick={() => deleteTask(task.id)}
                          title="Delete task"
                          className="text-midGray hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Sub-steps Section */}
                  {isExpanded && (
                    <div className="mt-1 pt-2 border-t border-border/70 flex flex-col gap-1.5 pl-9 pr-2">
                      {subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-surface transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              onClick={() => toggleSubtask(task.id, sub.id)}
                              className={cn(
                                'w-4 h-4 rounded flex items-center justify-center border transition-all cursor-pointer',
                                sub.completed
                                  ? 'bg-primaryDark border-primaryDark text-bg'
                                  : 'border-border bg-bg hover:border-midGray'
                              )}
                            >
                              {sub.completed && <Check className="w-3 h-3" />}
                            </button>
                            <span
                              className={cn(
                                'text-ui-rg-xs',
                                sub.completed ? 'line-through text-midGray' : 'text-primaryDark'
                              )}
                            >
                              {sub.title}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Inline Input to add more subtasks */}
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={newSubtaskInputs[task.id] || ''}
                          onChange={(e) =>
                            setNewSubtaskInputs((prev) => ({ ...prev, [task.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddInlineSubtask(task.id);
                            }
                          }}
                          placeholder="+ Add sub-step and press Enter..."
                          className="flex-1 bg-surface border border-border rounded-md px-2.5 py-1 text-ui-rg-xs text-primaryDark placeholder:text-midGray outline-none focus:border-[#C5BDAF]"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          onClick={() => handleAddInlineSubtask(task.id)}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateRoutineModal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
      />
      <AllRoutinesModal
        isOpen={isAllRoutinesModalOpen}
        onClose={() => setIsAllRoutinesModalOpen(false)}
        onOpenCreate={() => setIsRoutineModalOpen(true)}
      />
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultDestination={activeTaskTab}
      />
    </div>
  );
};
