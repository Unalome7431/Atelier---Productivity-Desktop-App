import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Layers,
  Check,
  Plus,
  Unlink,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { useTasksStore } from '@/stores/useTasksStore';
import { cn } from '@/lib/utils';

interface FocusTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchTask: () => void;
}

export const FocusTaskDrawer: React.FC<FocusTaskDrawerProps> = ({
  isOpen,
  onClose,
  onSwitchTask,
}) => {
  const { activeTarget, unbindTarget } = usePomodoroStore();
  const { tasks, inboxTasks, toggleTask, addSubtask, toggleSubtask, setTaskPomodoroEstimated } =
    useTasksStore();

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  if (!isOpen || !activeTarget) return null;

  // Find full task object if target is a cockpit task
  const currentTask =
    activeTarget.type === 'task'
      ? tasks.find((t) => t.id === activeTarget.id) ||
        inboxTasks.find((t) => t.id === activeTarget.id)
      : null;

  const handleToggleComplete = async () => {
    if (currentTask) {
      await toggleTask(currentTask.id);
      if (!currentTask.completed) {
        // Just completed the task
        setTimeout(() => {
          unbindTarget();
          onClose();
        }, 600);
      }
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !currentTask) return;
    await addSubtask(currentTask.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handleUnbind = () => {
    unbindTarget();
    onClose();
  };

  const estimatedCycles = currentTask?.pomodoroCyclesEstimated || 1;
  const completedCycles = currentTask?.pomodoroCyclesCompleted || 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25 backdrop-blur-xs animate-fade-in">
      {/* Slide-over Container */}
      <div className="w-full max-w-md bg-surface border-l border-border h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-border bg-bg/80 flex items-start justify-between">
          <div className="flex flex-col gap-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-700 fill-indigo-700/20" />
              <span className="font-mono text-mono-uppercase text-midGray uppercase">
                Active Focus Target
              </span>
            </div>
            <h2 className="font-display font-bold text-display-4 text-primaryDark leading-tight mt-1 truncate">
              {activeTarget.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-pill bg-accent-indigo border border-pastel-lavender-border text-indigo-950 text-mono-xs font-mono font-medium">
                {activeTarget.type === 'kanban'
                  ? `Kanban: ${activeTarget.boardTitle || 'Board'}`
                  : "Today's Queue"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-secondaryGray hover:text-primaryDark hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
          {/* Pomodoro Focus Progress */}
          <div className="bg-bg rounded-card border border-border p-4 shadow-subtle flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-mono-xs font-bold text-primaryDark uppercase">
                Task Focus Estimation
              </span>
              <span className="font-mono text-mono-xs font-bold text-emerald-800">
                {completedCycles} / {estimatedCycles} cycles
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-surface h-2 rounded-full overflow-hidden border border-border">
                <div
                  className="bg-accent-green h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((completedCycles / estimatedCycles) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {currentTask && (
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-ui-rg-xs text-secondaryGray">Target Pomodoros:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTaskPomodoroEstimated(currentTask.id, Math.max(1, estimatedCycles - 1))
                    }
                    className="w-6 h-6 rounded-md bg-surface border border-border text-secondaryGray hover:text-primaryDark flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <span className="font-mono text-mono-xs font-bold text-primaryDark w-4 text-center">
                    {estimatedCycles}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTaskPomodoroEstimated(currentTask.id, estimatedCycles + 1)}
                    className="w-6 h-6 rounded-md bg-surface border border-border text-secondaryGray hover:text-primaryDark flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Subtasks Checklist */}
          {currentTask && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-mono-xs font-bold text-primaryDark uppercase">
                  Sub-tasks Checklist
                </span>
                <span className="font-mono text-mono-xs text-secondaryGray">
                  {currentTask.subtasks?.filter((s) => s.completed).length || 0}/
                  {currentTask.subtasks?.length || 0}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {currentTask.subtasks && currentTask.subtasks.length > 0 ? (
                  currentTask.subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => toggleSubtask(currentTask.id, sub.id)}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-bg border border-border/80 hover:border-border cursor-pointer transition-colors group"
                    >
                      <button
                        type="button"
                        className={cn(
                          'w-4 h-4 rounded-sm border flex items-center justify-center transition-colors',
                          sub.completed
                            ? 'bg-primaryDark border-primaryDark text-bg'
                            : 'border-secondaryGray/60 group-hover:border-primaryDark'
                        )}
                      >
                        {sub.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <span
                        className={cn(
                          'text-ui-rg-xs flex-1 transition-colors',
                          sub.completed ? 'line-through text-secondaryGray' : 'text-primaryDark'
                        )}
                      >
                        {sub.title}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-ui-rg-xs text-secondaryGray py-1">
                    No subtasks yet. Break this task into subtasks below:
                  </p>
                )}

                {/* Inline Add Subtask */}
                <form onSubmit={handleAddSubtask} className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add subtask..."
                    className="flex-1 bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-xs text-primaryDark placeholder:text-midGray outline-none focus:border-border-focus"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="gap-1 px-3">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Kanban Card Details */}
          {activeTarget.type === 'kanban' && (
            <div className="bg-bg rounded-card border border-border p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-ui-rg-xs text-secondaryGray">
                <Layers className="w-4 h-4 text-indigo-700" />
                <span>Roadmap context:</span>
              </div>
              <p className="text-ui-bold-sm text-primaryDark font-medium">
                Column: {activeTarget.columnTitle || 'In Progress'}
              </p>
              <p className="text-ui-rg-xs text-secondaryGray">
                This item is synced with your Long-Term Kanban Board ({activeTarget.boardTitle}).
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-bg/80 flex flex-col gap-3">
          {currentTask && (
            <Button
              variant={currentTask.completed ? 'secondary' : 'primary'}
              size="md"
              className="w-full gap-2"
              onClick={handleToggleComplete}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{currentTask.completed ? 'Mark as Incomplete' : 'Complete Task'}</span>
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 gap-2 text-secondaryGray hover:text-primaryDark"
              onClick={() => {
                onSwitchTask();
              }}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Switch Focus</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="flex-1 gap-2 text-rose-700 hover:text-rose-900 hover:border-rose-300"
              onClick={handleUnbind}
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Unbind</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
