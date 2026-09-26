import React, { useState, useEffect } from 'react';
import { Task } from '@/types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

interface ScheduleTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  defaultDate: string;
  onConfirmSchedule: (task: Task, date: string) => void;
}

export const ScheduleTaskModal: React.FC<ScheduleTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  defaultDate,
  onConfirmSchedule,
}) => {
  const [date, setDate] = useState(defaultDate);

  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    }
  }, [defaultDate, isOpen]);

  if (!task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmSchedule(task, date);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Task"
      description={`Choose what date to schedule "${task.title}".`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="p-3.5 bg-bg border border-border rounded-card select-none">
          <span className="font-mono text-mono-xs text-secondaryGray uppercase block mb-1">
            Target Task
          </span>
          <p className="font-sans font-bold text-ui-bold-sm text-primaryDark">{task.title}</p>
          {task.description && (
            <p className="text-ui-rg-xs text-secondaryGray mt-1">{task.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Scheduled Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="mint" size="sm">
            Add Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
