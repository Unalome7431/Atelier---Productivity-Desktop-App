import React, { useState } from 'react';
import { X, GripVertical, Calendar, Inbox, CheckSquare, Clock } from 'lucide-react';
import { Task } from '@/types';
import { Eyebrow } from '@/components/common/Badge';
import { cn } from '@/lib/utils';

interface TaskIntegrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[]; // Today's tasks
  inboxTasks: Task[]; // Backlog tasks
  onSelectTaskToSchedule: (task: Task) => void;
}

export const TaskIntegrationDrawer: React.FC<TaskIntegrationDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  inboxTasks,
  onSelectTaskToSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'inbox'>('today');

  if (!isOpen) return null;

  const currentList = activeTab === 'today' ? tasks : inboxTasks;

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    const serialized = JSON.stringify(task);
    try {
      e.dataTransfer.setData('application/json', serialized);
      e.dataTransfer.setData('text/plain', serialized);
      e.dataTransfer.setData('text', serialized);
    } catch {
      e.dataTransfer.setData('text', serialized);
    }
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[360px] bg-surface border-l border-border shadow-2xl flex flex-col justify-between transition-transform duration-200 ease-in-out">
      {/* Header */}
      <div className="p-5 border-b border-border flex flex-col gap-3 bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-secondaryGray" />
            <Eyebrow>TIME-BLOCKING BRIDGE</Eyebrow>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-secondaryGray hover:text-primaryDark hover:bg-border transition-colors cursor-pointer"
            title="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="font-display font-bold text-display-3 text-primaryDark">Tactical Tasks</h3>
          <p className="text-ui-rg-xs text-secondaryGray mt-0.5">
            Drag any task onto the calendar timeline or month grid to allocate an immediate focus
            time-box.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-bg p-1 rounded-pill border border-border mt-1">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={cn(
              'flex-1 py-1 px-2.5 rounded-pill text-ui-rg-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
              activeTab === 'today'
                ? 'bg-surface text-primaryDark shadow-subtle font-bold'
                : 'text-secondaryGray hover:text-primaryDark'
            )}
          >
            <CheckSquare className="w-3 h-3" />
            <span>Today ({tasks.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={cn(
              'flex-1 py-1 px-2.5 rounded-pill text-ui-rg-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer',
              activeTab === 'inbox'
                ? 'bg-surface text-primaryDark shadow-subtle font-bold'
                : 'text-secondaryGray hover:text-primaryDark'
            )}
          >
            <Inbox className="w-3 h-3" />
            <span>Inbox ({inboxTasks.length})</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 bg-bg/50">
        {currentList.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center gap-2 text-secondaryGray select-none">
            <Inbox className="w-8 h-8 text-midGray stroke-[1.5]" />
            <p className="font-sans text-ui-rg-sm font-medium text-primaryDark">
              No tasks in this queue
            </p>
            <span className="text-ui-rg-xs text-secondaryGray">
              {activeTab === 'today'
                ? "Add tasks in the Daily Cockpit to prioritize them for today's queue."
                : 'Capture unscheduled ideas in the Cockpit Inbox backlog.'}
            </span>
          </div>
        ) : (
          currentList.map((task) => {
            const subtasksCount = task.subtasks?.length || 0;
            const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;

            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                className="p-3 bg-surface hover:bg-surface/90 border border-border hover:border-border-hover rounded-card shadow-subtle flex flex-col gap-2 transition-all cursor-grab active:cursor-grabbing group select-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <GripVertical className="w-4 h-4 text-midGray group-hover:text-primaryDark mt-0.5 shrink-0 transition-colors pointer-events-none" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans font-medium text-ui-rg-sm text-primaryDark leading-tight line-clamp-2">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-ui-rg-xs text-secondaryGray line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectTaskToSchedule(task)}
                    className="shrink-0 text-ui-rg-xs font-mono font-medium px-2 py-1 rounded-pill bg-bg border border-border hover:bg-surface-alt text-primaryDark transition-colors shadow-xs"
                    title="Schedule time-box directly"
                  >
                    Schedule
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-secondaryGray pl-6">
                  {subtasksCount > 0 ? (
                    <span className="text-secondaryGray">
                      {completedSubtasks}/{subtasksCount} subtasks
                    </span>
                  ) : (
                    <span className="text-midGray">Direct action</span>
                  )}

                  {task.scheduledDate ? (
                    <span className="px-1.5 py-0.2 rounded bg-accent-green/60 text-emerald-950 text-[10px] font-mono">
                      {task.scheduledDate}
                    </span>
                  ) : (
                    <span className="text-midGray text-[10px]">Unscheduled</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-border bg-surface select-none">
        <div className="flex items-center gap-2 text-ui-rg-xs text-secondaryGray">
          <Calendar className="w-3.5 h-3.5 shrink-0 text-secondaryGray" />
          <span>Dragging automatically binds the task to a focus time block.</span>
        </div>
      </div>
    </div>
  );
};
