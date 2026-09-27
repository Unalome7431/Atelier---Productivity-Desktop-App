import React, { useEffect, useState, useMemo } from 'react';
import {
  Check,
  Flame,
  Plus,
  Sparkles,
  Trash2,
  Inbox,
  Sun,
  Minus,
  KanbanSquare,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { SegmentedBar } from '@/components/common/SegmentedBar';
import { CircularProgress } from '@/components/cockpit/CircularProgress';
import { CreateRoutineModal } from '@/components/cockpit/CreateRoutineModal';
import { CreateTaskModal } from '@/components/cockpit/CreateTaskModal';
import { AllRoutinesModal, getStreakBadgeStyle } from '@/components/cockpit/AllRoutinesModal';
import { CockpitTaskCard } from '@/components/cockpit/CockpitTaskCard';
import { Modal } from '@/components/common/Modal';
import { useRoutinesStore } from '@/stores/useRoutinesStore';
import { useTasksStore } from '@/stores/useTasksStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { useAppStore } from '@/stores/useAppStore';
import { Task, KanbanBoard, KanbanCard } from '@/types';
import { getTodayDateString, cn } from '@/lib/utils';

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

  const { activeTaskId, bindTarget, unbindTarget } = usePomodoroStore();
  const { setActiveTab } = useAppStore();
  const { boards, loadBoards, updateCard, setActiveBoardId } = useKanbanStore();

  // Modals state
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAllRoutinesModalOpen, setIsAllRoutinesModalOpen] = useState(false);
  const [activeTaskTab, setActiveTaskTab] = useState<'today' | 'inbox'>('today');

  // Kanban task completion prompt modal state
  interface KanbanMoveModalData {
    task: Task;
    card: KanbanCard;
    board: KanbanBoard;
  }
  const [kanbanMoveModal, setKanbanMoveModal] = useState<KanbanMoveModalData | null>(null);
  const [selectedTargetColId, setSelectedTargetColId] = useState<string>('');

  // Subtasks expansion state
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  // Live Date & Time for Header Pill (matching Figma: "WEDNESDAY · 17 APR  09:42 AM")
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    loadRoutines();
    loadTasks();
    loadBoards();
  }, [loadRoutines, loadTasks, loadBoards]);

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

  // Completion handler that prompts to move Kanban card if task is linked to Kanban
  const handleToggleTask = async (task: Task) => {
    const isCompleting = !task.completed;
    await toggleTask(task.id);

    if (isCompleting && task.sourceKanbanCardId) {
      if (boards.length === 0) {
        await loadBoards();
      }
      const allBoards = useKanbanStore.getState().boards;
      const board = allBoards.find((b) =>
        (b.cards || []).some((c) => c.id === task.sourceKanbanCardId)
      );
      const card = board?.cards.find((c) => c.id === task.sourceKanbanCardId);

      if (board && card) {
        // Prefer 'done' or 'complete' column as default, otherwise choose any column different from current
        const doneCol = board.columns.find((c) => c.id === 'done' || c.id === 'complete');
        const defaultCol =
          doneCol && doneCol.id !== card.columnId
            ? doneCol.id
            : board.columns.find((c) => c.id !== card.columnId)?.id || board.columns[0]?.id || '';
        setSelectedTargetColId(defaultCol);
        setKanbanMoveModal({ task, card, board });
      }
    }
  };

  const handleConfirmMoveToKanban = async () => {
    if (!kanbanMoveModal) return;
    const { card, board } = kanbanMoveModal;
    const targetCol = selectedTargetColId || card.columnId;
    const isDone = targetCol === 'done' || targetCol === 'complete';

    await updateCard(card.id, {
      columnId: targetCol,
      completedAt: isDone ? 'Completed today' : undefined,
    });

    setActiveBoardId(board.id);
    setActiveTab('kanban');
    setKanbanMoveModal(null);
  };

  const handleCancelMove = () => {
    setKanbanMoveModal(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 bg-bg w-full">
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
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setIsRoutineModalOpen(true)}
                className="gap-1 font-mono text-mono-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Habit</span>
              </Button>
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
                    className="p-3.5 rounded-xl bg-bg border border-border/80 hover:border-border-hover transition-all flex flex-col gap-2.5 group"
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
                              className="w-6 h-6 rounded-md bg-primaryDark border border-primaryDark flex items-center justify-center text-white font-bold hover:opacity-90 disabled:opacity-30 cursor-pointer"
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
            <Button
              variant="mint"
              size="xs"
              onClick={() => setIsTaskModalOpen(true)}
              className="gap-1 font-mono text-mono-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </Button>
          </div>

          {/* Tabs: Today's Tactical Queue vs Daily Inbox Backlog */}
          <div className="flex items-center gap-2 border-b border-border/80 pb-3">
            <button
              onClick={() => setActiveTaskTab('today')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-pill font-sans text-ui-rg-xs font-semibold transition-all cursor-pointer',
                activeTaskTab === 'today'
                  ? 'bg-primaryDark text-white shadow-xs'
                  : 'text-secondaryGray hover:text-primaryDark hover:bg-bg'
              )}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Today's Queue</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-pill font-mono text-[10px]',
                  activeTaskTab === 'today'
                    ? 'bg-white/20 text-white'
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
                  ? 'bg-primaryDark text-white shadow-xs'
                  : 'text-secondaryGray hover:text-primaryDark hover:bg-bg'
              )}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Daily Inbox</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-pill font-mono text-[10px]',
                  activeTaskTab === 'inbox'
                    ? 'bg-white/20 text-white'
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
            {(activeTaskTab === 'today' ? tasks : inboxTasks).map((task) => (
              <CockpitTaskCard
                key={task.id}
                task={task}
                activeTaskTab={activeTaskTab}
                isExpanded={expandedTaskIds.has(task.id)}
                isDraggedOver={dragOverTaskId === task.id}
                isCurrentFocus={activeTaskId === task.id}
                onToggleExpansion={() => toggleTaskExpansion(task.id)}
                onToggleTask={handleToggleTask}
                onMoveToInbox={moveTaskToInbox}
                onMoveToToday={moveTaskToToday}
                onDeleteTask={deleteTask}
                onToggleSubtask={toggleSubtask}
                onAddSubtask={(taskId, title) => addSubtask(taskId, title)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onBindFocus={() =>
                  bindTarget({
                    id: task.id,
                    title: task.title,
                    type: 'task',
                  })
                }
                onUnbindFocus={unbindTarget}
              />
            ))}
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

      {/* Kanban Task Completion: Move Card to Column Modal */}
      {kanbanMoveModal && (
        <Modal
          isOpen={Boolean(kanbanMoveModal)}
          onClose={handleCancelMove}
          title="Move Kanban Card"
          description={`"${kanbanMoveModal.task.title}" is completed! Choose a column to update its card on "${kanbanMoveModal.board.title}".`}
          maxWidth="md"
        >
          <div className="flex flex-col gap-4 font-sans text-xs">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Destination Column
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {kanbanMoveModal.board.columns.map((col) => {
                  const isSelected = selectedTargetColId === col.id;
                  const isCurrent = kanbanMoveModal.card.columnId === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSelectedTargetColId(col.id)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer',
                        isSelected
                          ? 'border-primaryDark bg-white shadow-xs font-semibold ring-1 ring-primaryDark'
                          : 'border-border/80 bg-surface/50 hover:bg-surface text-secondaryGray'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: col.dotColor || '#9CA3AF' }}
                        />
                        <span className="text-xs text-primaryDark truncate">{col.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCurrent && (
                          <span className="text-[10px] font-mono text-secondaryGray bg-border/40 px-1.5 py-0.5 rounded">
                            Current
                          </span>
                        )}
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-primaryDark text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelMove}>
                Stay in Cockpit
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmMoveToKanban}
                leftIcon={<KanbanSquare className="w-3.5 h-3.5" />}
              >
                Move & Go to Kanban
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
