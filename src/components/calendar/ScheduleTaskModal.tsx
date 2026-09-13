import React, { useState, useEffect } from 'react';
import { Task } from '@/types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

interface ScheduleTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  defaultDate: string;
  onConfirmSchedule: (task: Task, date: string, startTime: string, durationMinutes: number) => void;
}

export const ScheduleTaskModal: React.FC<ScheduleTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  defaultDate,
  onConfirmSchedule,
}) => {
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(60);

  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    }
  }, [defaultDate, isOpen]);

  if (!task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmSchedule(task, date, startTime, durationMinutes);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Task Time-Box"
      description={`Allocate dedicated focus time on the calendar for "${task.title}".`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="p-3 bg-bg border border-border rounded-card select-none">
          <span className="font-mono text-mono-xs text-secondaryGray uppercase block mb-1">
            Target Task
          </span>
          <p className="font-sans font-bold text-ui-bold-sm text-primaryDark">{task.title}</p>
          {task.description && (
            <p className="text-ui-rg-xs text-secondaryGray mt-1">{task.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Scheduled Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Start Time
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Duration
          </label>
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
            className="bg-bg border border-border rounded-md px-3 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
          >
            <option value={30}>30 Minutes</option>
            <option value={45}>45 Minutes</option>
            <option value={60}>1 Hour (60 Min)</option>
            <option value={90}>1.5 Hours (90 Min)</option>
            <option value={120}>2 Hours (120 Min)</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="mint" size="sm">
            Confirm Time-Box
          </Button>
        </div>
      </form>
    </Modal>
  );
};
