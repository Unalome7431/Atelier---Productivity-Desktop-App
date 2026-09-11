import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useRoutinesStore } from '@/stores/useRoutinesStore';

export interface CreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAY_LABELS = [
  { day: 0, label: 'S' },
  { day: 1, label: 'M' },
  { day: 2, label: 'T' },
  { day: 3, label: 'W' },
  { day: 4, label: 'T' },
  { day: 5, label: 'F' },
  { day: 6, label: 'S' },
];

export const CreateRoutineModal: React.FC<CreateRoutineModalProps> = ({ isOpen, onClose }) => {
  const { addRoutine } = useRoutinesStore();

  const [title, setTitle] = useState('');
  const [cadence, setCadence] = useState<'daily' | 'weekdays' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]); // Default Mon, Wed, Fri
  const [targetCount, setTargetCount] = useState(1);

  const toggleCustomDay = (dayIndex: number) => {
    if (customDays.includes(dayIndex)) {
      setCustomDays(customDays.filter((d) => d !== dayIndex));
    } else {
      setCustomDays([...customDays, dayIndex].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addRoutine({
      title: title.trim(),
      category: '',
      cadence,
      customDays: cadence === 'custom' ? customDays : [],
      targetCount: Math.max(1, Number(targetCount) || 1),
      icon: 'default',
      color: 'mint',
    });

    setTitle('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Daily Routine"
      description="Define a recurring discipline with custom cadence and targets."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Habit Title
          </label>
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 20-min Morning Movement, Code review..."
            className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
          />
        </div>

        {/* Cadence Rules */}
        <div className="flex flex-col gap-2 p-3 bg-surface/70 border border-border rounded-panel">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Cadence & Schedule
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'daily', label: 'Everyday' },
              { id: 'weekdays', label: 'Mon – Fri' },
              { id: 'custom', label: 'Custom Days' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCadence(opt.id as any)}
                className={`py-2 px-3 rounded-pill text-ui-rg-xs font-medium border transition-all cursor-pointer ${
                  cadence === opt.id
                    ? 'bg-primaryDark text-bg border-primaryDark shadow-xs'
                    : 'bg-bg text-secondaryGray border-border hover:text-primaryDark'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {cadence === 'custom' && (
            <div className="flex items-center justify-between pt-2 border-t border-border/70 mt-1">
              <span className="font-mono text-mono-tag text-midGray">Active Days:</span>
              <div className="flex gap-1.5">
                {DAY_LABELS.map(({ day, label }) => {
                  const isSelected = customDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleCustomDay(day)}
                      className={`w-7 h-7 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-accent-green text-emerald-950 border border-emerald-400/40 shadow-xs'
                          : 'bg-bg text-secondaryGray border border-border hover:border-midGray'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Daily Target Count (Boolean vs Multi-Step e.g. 4 glasses) */}
        <div className="flex items-center justify-between p-3 bg-bg border border-border rounded-md">
          <div>
            <span className="font-sans text-ui-md-sm font-semibold text-primaryDark block">
              Daily Target Repetitions
            </span>
            <span className="font-mono text-mono-tag text-secondaryGray block">
              1 for standard checkmark, or 2+ for quantity counters (e.g. 4 glasses of water)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={12}
              value={targetCount}
              onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-16 bg-surface border border-border rounded-md px-2.5 py-1 text-center font-mono font-bold text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Add Routine
          </Button>
        </div>
      </form>
    </Modal>
  );
};
