import React, { useMemo, useState } from 'react';
import {
  ListFilter,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  CheckSquare,
} from 'lucide-react';
import { Eyebrow } from '@/components/common/Badge';
import { CalendarEvent, Task } from '@/types';
import { CreateTaskModal } from '@/components/cockpit/CreateTaskModal';
import { cn } from '@/lib/utils';

interface SelectedDateAgendaProps {
  selectedDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  tasks?: Task[];
  onOpenAddAgenda: (date?: string) => void;
  onDeleteEvent: (id: string) => void;
  onDropTask: (task: Task, date: string) => void;
  onUnscheduleTask?: (taskId: string) => void;
  onQuickAddTask?: (title: string, date: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  isTaskDrawerOpen?: boolean;
  onToggleTaskDrawer?: () => void;
  queueTasksCount?: number;
  headerControls?: React.ReactNode;
}

export const SelectedDateAgenda: React.FC<SelectedDateAgendaProps> = ({
  selectedDate,
  events,
  tasks = [],
  onOpenAddAgenda,
  onDeleteEvent,
  onDropTask,
  onUnscheduleTask,
  onQuickAddTask: _onQuickAddTask,
  onAddSubtask,
  isTaskDrawerOpen,
  onToggleTaskDrawer,
  queueTasksCount,
  headerControls,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({});

  // Selected date events sorted by startTime
  const selectedDateEvents = useMemo(() => {
    return events
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, selectedDate]);

  // Selected date scheduled tasks
  const selectedDateTasks = useMemo(() => {
    return tasks.filter((t) => t.scheduledDate === selectedDate);
  }, [tasks, selectedDate]);

  // Formatted date string, e.g. "Wednesday, Sep 9"
  const formattedSelectedDateHeading = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return selectedDate;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    try {
      const raw =
        e.dataTransfer.getData('application/json') ||
        e.dataTransfer.getData('text/plain') ||
        e.dataTransfer.getData('text');
      if (raw) {
        const task: Task = JSON.parse(raw);
        if (task && task.id) {
          onDropTask(task, selectedDate);
        }
      }
    } catch (err) {
      console.error('Failed to parse dropped task on agenda:', err);
    }
  };

  const getEventCardStyle = (item: CalendarEvent) => {
    if (item.colorAccent === 'mint' || item.category === 'focus') {
      return 'bg-accent-green/45 border-emerald-300/60';
    }
    if (item.colorAccent === 'blue' || item.category === 'personal') {
      return 'bg-accent-blue/50 border-sky-200/70';
    }
    if (item.colorAccent === 'sand') {
      return 'bg-[#EFE9DC] border-[#DDD5C8] text-[#4F483D]';
    }
    if (item.colorAccent === 'mauve' || item.category === 'deadline') {
      return 'bg-[#F3E8EE] border-[#DFC5D6] text-[#4A2D40]';
    }
    if (item.colorAccent === 'rose') {
      return 'bg-[#FED7E8] border-[#F472B6]/60 text-[#831843]';
    }
    if (item.colorAccent === 'amber') {
      return 'bg-[#FEF3C7] border-[#F59E0B]/50 text-[#78350F]';
    }
    if (item.colorAccent === 'emerald') {
      return 'bg-[#D1FAE5] border-[#10B981]/50 text-[#064E3B]';
    }
    return 'bg-accent-indigo/60 border-indigo-200/60';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'bg-surface border border-border rounded-panel p-6 shadow-card flex flex-col justify-between h-full gap-5 transition-colors relative',
        isDragOver && 'border-emerald-500 ring-2 ring-emerald-400/40 bg-accent-green/10'
      )}
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <ListFilter className="w-3.5 h-3.5 text-secondaryGray" />
              <Eyebrow>SELECTED DATE</Eyebrow>
            </div>
            <h3 className="font-display font-bold text-display-3 text-primaryDark tracking-tight">
              {formattedSelectedDateHeading}
            </h3>
          </div>
          {headerControls && (
            <div className="shrink-0 ml-2">{headerControls}</div>
          )}
        </div>

        {/* Drop zone alert when dragging */}
        {isDragOver && (
          <div className="p-2.5 rounded-xl bg-accent-green/60 border border-emerald-400 text-center select-none animate-in fade-in duration-100">
            <span className="font-mono text-mono-xs font-bold text-emerald-950">
              Drop task to schedule for {formattedSelectedDateHeading}
            </span>
          </div>
        )}

        {/* Part 1: Setting up Events */}
        <div className="flex flex-col gap-2.5 bg-bg/50 border border-border/80 rounded-2xl p-3.5 flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-secondaryGray" />
              <span className="font-mono text-mono-xs font-bold text-primaryDark uppercase tracking-wider">
                Events
              </span>
              <span className="font-mono text-[10px] text-secondaryGray bg-surface px-1.5 py-0.2 rounded-full border border-border/60">
                {selectedDateEvents.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenAddAgenda(selectedDate)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-surface border border-border-hover text-primaryDark text-[11px] font-sans font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Add event on this date"
            >
              <Plus className="w-3 h-3" />
              <span>Add Event</span>
            </button>
          </div>

          {/* Events List */}
          <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-0.5">
            {selectedDateEvents.length === 0 ? (
              <div className="py-4 px-2 rounded-xl bg-surface/60 border border-dashed border-border text-center flex flex-col items-center justify-center gap-1.5 text-secondaryGray flex-1 min-h-[90px]">
                <CalendarIcon className="w-4 h-4 text-midGray" />
                <span className="text-[11px] font-sans">No events scheduled for this day</span>
              </div>
            ) : (
              selectedDateEvents.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'p-2.5 rounded-xl border shadow-subtle flex flex-col gap-1 transition-all group select-none',
                    getEventCardStyle(item)
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-mono-xs text-primaryDark">
                      {item.startTime} – {item.endTime}
                    </span>

                    <button
                      type="button"
                      onClick={() => onDeleteEvent(item.id)}
                      className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded text-secondaryGray hover:text-rose-700 transition-all flex items-center justify-center cursor-pointer"
                      title="Delete event"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-sans font-bold text-xs text-primaryDark leading-snug">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-[11px] text-secondaryGray mt-0.5 leading-tight line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Part 2: Schedule Tasks */}
        <div className="flex flex-col gap-2.5 bg-bg/50 border border-border/80 rounded-2xl p-3.5 flex-1 min-h-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-secondaryGray" />
              <span className="font-mono text-mono-xs font-bold text-primaryDark uppercase tracking-wider">
                Scheduled Tasks
              </span>
              <span className="font-mono text-[10px] text-secondaryGray bg-surface px-1.5 py-0.2 rounded-full border border-border/60">
                {selectedDateTasks.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {onToggleTaskDrawer && (
                <button
                  type="button"
                  onClick={onToggleTaskDrawer}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-sans font-semibold transition-colors cursor-pointer shadow-2xs',
                    isTaskDrawerOpen
                      ? 'bg-primaryDark text-white border-transparent font-bold'
                      : 'bg-white hover:bg-surface border-border-hover text-primaryDark'
                  )}
                  title="Open tasks queue to schedule tasks"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>Tasks Queue</span>
                  {typeof queueTasksCount === 'number' && (
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-black/5 text-primaryDark ml-0.5 font-bold">
                      {queueTasksCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCreateTaskModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primaryDark hover:opacity-90 border border-transparent text-white text-[11px] font-sans font-semibold transition-colors cursor-pointer shadow-2xs"
                title="Add task for this date"
              >
                <Plus className="w-3 h-3" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Tasks List — Non-interactable, task name only */}
          <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
            {selectedDateTasks.length === 0 ? (
              <div className="py-4 px-2 rounded-xl bg-surface/60 border border-dashed border-border text-center flex flex-col items-center justify-center gap-1 text-secondaryGray flex-1 min-h-[90px]">
                <CalendarIcon className="w-4 h-4 text-midGray" />
                <span className="text-[11px] font-sans">No tasks scheduled for this date</span>
                <span className="text-[10px] font-mono text-midGray">
                  Drag tasks from the queue to schedule
                </span>
              </div>
            ) : (
              selectedDateTasks.map((task) => {
                const subtasks = task.subtasks || [];
                const isExpanded = Boolean(expandedSubtasks[task.id]);

                return (
                  <div
                    key={task.id}
                    className="px-3 py-2 bg-white border border-border/80 rounded-xl shadow-2xs flex flex-col gap-1.5 group select-none hover:border-border-hover transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans text-xs font-medium text-primaryDark block truncate flex-1 min-w-0">
                        {task.title}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Subtasks expander / add button */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSubtasks((prev) => ({
                              ...prev,
                              [task.id]: !prev[task.id],
                            }))
                          }
                          className={cn(
                            'flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                            subtasks.length > 0
                              ? 'text-secondaryGray hover:text-primaryDark hover:bg-surface'
                              : 'text-secondaryGray/70 hover:text-primaryDark hover:bg-surface'
                          )}
                          title={subtasks.length > 0 ? 'View subtasks' : 'Add subtask'}
                        >
                          {subtasks.length > 0 ? (
                            <>
                              <span>
                                {subtasks.length} subtask{subtasks.length === 1 ? '' : 's'}
                              </span>
                              <ChevronDown
                                className={cn(
                                  'w-2.5 h-2.5 transition-transform ml-0.5',
                                  isExpanded && 'rotate-180'
                                )}
                              />
                            </>
                          ) : (
                            <>
                              <Plus className="w-2.5 h-2.5" />
                              <span>Subtask</span>
                            </>
                          )}
                        </button>

                        {/* Unschedule button so user can manage date assignment */}
                        {onUnscheduleTask && (
                          <button
                            type="button"
                            onClick={() => onUnscheduleTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface text-secondaryGray hover:text-rose-600 transition-opacity cursor-pointer"
                            title="Remove from this date (move back to inbox)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Subtasks view & add form (Non-interactable list, only task/subtask names) */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5">
                        {subtasks.length > 0 && (
                          <div className="flex flex-col gap-1 pl-1">
                            {subtasks.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center gap-1.5 text-[11px] font-sans text-secondaryGray select-none"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-midGray shrink-0" />
                                <span className="truncate flex-1">{sub.title}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Form to add new subtask */}
                        {onAddSubtask && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const val = (subtaskInputs[task.id] || '').trim();
                              if (!val) return;
                              onAddSubtask(task.id, val);
                              setSubtaskInputs((prev) => ({ ...prev, [task.id]: '' }));
                            }}
                            className="flex items-center gap-1.5 mt-0.5"
                          >
                            <input
                              type="text"
                              autoFocus
                              value={subtaskInputs[task.id] || ''}
                              onChange={(e) =>
                                setSubtaskInputs((prev) => ({
                                  ...prev,
                                  [task.id]: e.target.value,
                                }))
                              }
                              placeholder="Add subtask..."
                              className="flex-1 bg-surface border border-border rounded-lg px-2 py-0.5 text-xs text-primaryDark outline-none focus:border-primaryDark"
                            />
                            <button
                              type="submit"
                              disabled={!(subtaskInputs[task.id] || '').trim()}
                              className="px-2 py-0.5 rounded-lg bg-primaryDark text-white text-[10px] font-semibold disabled:opacity-40 cursor-pointer shrink-0"
                            >
                              Add
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Task Creation Modal — same rich popup as To Do List */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        scheduledDate={selectedDate}
      />
    </div>
  );
};
