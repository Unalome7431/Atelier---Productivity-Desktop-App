import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Sparkles,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sun,
  KanbanSquare,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Task } from '@/types';
import { cn } from '@/lib/utils';

export interface CockpitTaskCardProps {
  task: Task;
  activeTaskTab: 'today' | 'inbox';
  isExpanded: boolean;
  isDraggedOver: boolean;
  isCurrentFocus: boolean;
  onToggleExpansion: () => void;
  onToggleTask: (task: Task) => void;
  onMoveToInbox: (taskId: string) => void;
  onMoveToToday: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onBindFocus: () => void;
  onUnbindFocus: () => void;
}

export const CockpitTaskCard: React.FC<CockpitTaskCardProps> = ({
  task,
  activeTaskTab,
  isExpanded,
  isDraggedOver,
  isCurrentFocus,
  onToggleExpansion,
  onToggleTask,
  onMoveToInbox,
  onMoveToToday,
  onDeleteTask,
  onToggleSubtask,
  onAddSubtask,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onBindFocus,
  onUnbindFocus,
}) => {
  const [subtaskInput, setSubtaskInput] = useState('');
  const subtasks = task.subtasks || [];
  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      onAddSubtask(task.id, subtaskInput.trim());
      setSubtaskInput('');
    }
  };

  return (
    <div
      draggable={activeTaskTab === 'today'}
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragOver={(e) => onDragOver(e, task.id)}
      onDrop={(e) => onDrop(e, task.id)}
      onDragEnd={onDragEnd}
      className={cn(
        'p-3.5 rounded-card bg-bg border transition-all flex flex-col gap-2.5 group relative shadow-subtle',
        isCurrentFocus
          ? 'border-border-focus bg-accent-indigo/15 ring-1 ring-accent-indigo/40'
          : 'border-border/80',
        isDraggedOver && 'border-primaryDark border-2 shadow-md',
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
            onClick={() => onToggleTask(task)}
            className={cn(
              'w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer flex-shrink-0',
              task.completed
                ? 'bg-primaryDark border-primaryDark text-white'
                : 'border-border bg-surface hover:border-midGray'
            )}
          >
            {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>

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
                  <KanbanSquare className="w-3 h-3" />
                  <span>Kanban</span>
                </span>
              )}
            </div>

            {/* Subtasks Progress chip if subtasks exist */}
            {subtasks.length > 0 && (
              <button
                onClick={onToggleExpansion}
                className="flex items-center gap-1 font-mono text-[11px] text-secondaryGray hover:text-primaryDark mt-0.5 text-left w-fit cursor-pointer"
              >
                <span>
                  {completedSubtasksCount}/{subtasks.length} subtasks completed
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
          {/* Active Focus Pill or Cycle count */}
          {isCurrentFocus ? (
            <button
              onClick={onUnbindFocus}
              title="Currently bound focus task. Click to unbind."
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-accent-indigo border border-pastel-lavender-border text-indigo-950 font-mono text-[10px] font-bold cursor-pointer hover:bg-rose-50 hover:text-rose-900 hover:border-rose-200 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-indigo-700 fill-indigo-700/20 shrink-0" />
              <span>Focusing</span>
            </button>
          ) : task.pomodoroCyclesCompleted && task.pomodoroCyclesCompleted > 0 ? (
            <span
              title={`${task.pomodoroCyclesCompleted} of ${task.pomodoroCyclesEstimated || 1} focus cycles completed`}
              className="font-mono text-[10px] px-2 py-0.5 rounded-pill bg-purple-50 text-purple-900 border border-purple-200/80 flex items-center gap-1"
            >
              <Sparkles className="w-2.5 h-2.5 text-indigo-700" />
              <span>
                {task.pomodoroCyclesCompleted}/{task.pomodoroCyclesEstimated || 1}
              </span>
            </span>
          ) : null}

          {/* Context actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Quick Focus Button if not current focus */}
            {!isCurrentFocus && !task.completed && (
              <button
                onClick={onBindFocus}
                title="Bind to Pomodoro Focus Bar"
                className="text-xs text-secondaryGray hover:text-primaryDark hover:bg-surface p-1 rounded transition-colors cursor-pointer flex items-center gap-1 font-mono"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Focus</span>
              </button>
            )}
            {activeTaskTab === 'today' ? (
              <button
                onClick={() => onMoveToInbox(task.id)}
                title="Move to Daily Inbox"
                className="text-xs text-secondaryGray hover:text-primaryDark p-1 rounded hover:bg-surface transition-colors cursor-pointer font-mono"
              >
                → Inbox
              </button>
            ) : (
              <button
                onClick={() => onMoveToToday(task.id)}
                title="Move to Today's Queue"
                className="text-xs text-secondaryGray hover:text-primaryDark p-1 rounded hover:bg-surface transition-colors cursor-pointer flex items-center gap-1 font-mono"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Today</span>
              </button>
            )}

            {/* Toggle subtasks expansion if none yet, to add first subtask */}
            {subtasks.length === 0 && (
              <button
                onClick={onToggleExpansion}
                title="Add subtask"
                className="text-xs text-secondaryGray hover:text-primaryDark p-1 rounded hover:bg-surface transition-colors cursor-pointer font-mono"
              >
                + Subtask
              </button>
            )}

            <button
              onClick={() => onDeleteTask(task.id)}
              title="Delete task"
              className="text-midGray hover:text-rose-600 p-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Subtasks Section */}
      {isExpanded && (
        <div className="mt-1 pt-2 border-t border-border/70 flex flex-col gap-1.5 pl-9 pr-2">
          {subtasks.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-surface transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => onToggleSubtask(task.id, sub.id)}
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
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              placeholder="+ Add subtask and press Enter..."
              className="flex-1 bg-surface border border-border rounded-md px-2.5 py-1 text-ui-rg-xs text-primaryDark placeholder:text-midGray outline-none focus:border-border-focus"
            />
            <Button type="button" variant="secondary" size="xs" onClick={handleAddSubtask}>
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
