import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { RecurringWeeklyBlock } from '@/types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

interface ScheduleBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: RecurringWeeklyBlock | null; // null = Add new; non-null = Adjust existing
  defaultDay?: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  defaultHour?: string; // "HH:00"
  onSave: (data: Omit<RecurringWeeklyBlock, 'id'>, existingId?: string) => void;
  onDelete?: (blockId: string) => void;
}

export const ScheduleBlockModal: React.FC<ScheduleBlockModalProps> = ({
  isOpen,
  onClose,
  block,
  defaultDay = 1,
  defaultHour = '09:00',
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(defaultDay);
  const [startTime, setStartTime] = useState(defaultHour);
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState<RecurringWeeklyBlock['category']>('focus');
  const [colorAccent, setColorAccent] = useState<RecurringWeeklyBlock['colorAccent']>('mint');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setDayOfWeek(block.dayOfWeek);
      setStartTime(block.startFormatted || '09:00');
      setEndTime(block.endFormatted || '10:00');
      setCategory(block.category || 'focus');
      setColorAccent(block.colorAccent || 'mint');
      setDescription(block.description || '');
    } else {
      setTitle('');
      setDayOfWeek(defaultDay);
      setStartTime(defaultHour);
      const nextH = Math.min(23, parseInt(defaultHour.split(':')[0], 10) + 1);
      setEndTime(`${String(nextH).padStart(2, '0')}:00`);
      setCategory('focus');
      setColorAccent('mint');
      setDescription('');
    }
  }, [block, defaultDay, defaultHour, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(
      {
        title: title.trim(),
        dayOfWeek: dayOfWeek as any,
        startFormatted: startTime,
        endFormatted: endTime,
        timeSlot: startTime,
        category,
        colorAccent,
        description: description.trim() || undefined,
      },
      block?.id
    );
    onClose();
  };

  const handleDelete = () => {
    if (block && onDelete) {
      onDelete(block.id);
      onClose();
    }
  };

  const isEditing = Boolean(block);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Adjust Schedule Block' : 'Add Schedule Block'}
      description={
        isEditing
          ? 'Modify time, day, or color for this repeatable schedule block.'
          : 'Create a repeatable schedule block for classes, work, or routines.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Block Title
          </label>
          <input
            type="text"
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Architecture Studio, CS 101, Deep Work..."
            className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus"
          />
        </div>

        {/* Day & Category */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Day of Week
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
              className="bg-bg border border-border rounded-md px-3 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                const cat = e.target.value as RecurringWeeklyBlock['category'];
                setCategory(cat);
                if (cat === 'class') setColorAccent('blue');
                else if (cat === 'work' || cat === 'build') setColorAccent('mint');
                else if (cat === 'meeting' || cat === 'planning') setColorAccent('lavender');
                else if (cat === 'review') setColorAccent('sand');
              }}
              className="bg-bg border border-border rounded-md px-3 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus"
            >
              <option value="class">Class / Lecture</option>
              <option value="work">Work Schedule</option>
              <option value="focus">Deep Focus</option>
              <option value="build">Project Build</option>
              <option value="meeting">Team Meeting</option>
              <option value="planning">Planning & Strategy</option>
              <option value="review">Review & Triage</option>
            </select>
          </div>
        </div>

        {/* Start & End Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Start Time
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              End Time
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus font-mono"
            />
          </div>
        </div>

        {/* Color Accent */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Color Accent
            </label>
            <span className="font-mono text-mono-xs text-secondaryGray font-medium">
              {[
                { id: 'mint', label: 'Mint' },
                { id: 'lavender', label: 'Lavender' },
                { id: 'sand', label: 'Sand' },
                { id: 'blue', label: 'Sky Blue' },
                { id: 'mauve', label: 'Mauve' },
                { id: 'rose', label: 'Rose Pink' },
                { id: 'amber', label: 'Amber' },
              ].find((c) => c.id === colorAccent)?.label || 'Mint'}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {[
              {
                id: 'mint',
                label: 'Mint',
                dot: '#10B981',
                bg: 'bg-accent-green',
                border: 'border-emerald-300',
              },
              {
                id: 'lavender',
                label: 'Lavender',
                dot: '#818CF8',
                bg: 'bg-accent-indigo',
                border: 'border-indigo-300',
              },
              {
                id: 'sand',
                label: 'Sand',
                dot: '#F59E0B',
                bg: 'bg-[#EFE9DC]',
                border: 'border-[#DDD5C8]',
              },
              {
                id: 'blue',
                label: 'Sky Blue',
                dot: '#0284C7',
                bg: 'bg-accent-blue',
                border: 'border-sky-300',
              },
              {
                id: 'mauve',
                label: 'Mauve',
                dot: '#9D174D',
                bg: 'bg-[#F3E8EE]',
                border: 'border-[#DFC5D6]',
              },
              {
                id: 'rose',
                label: 'Rose Pink',
                dot: '#E11D48',
                bg: 'bg-[#FED7E8]',
                border: 'border-[#F472B6]',
              },
              {
                id: 'amber',
                label: 'Amber',
                dot: '#D97706',
                bg: 'bg-[#FEF3C7]',
                border: 'border-[#FCD34D]',
              },
            ].map((c) => {
              const isSelected = colorAccent === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorAccent(c.id as any)}
                  className={`w-7 h-7 rounded-full cursor-pointer transition-all hover:scale-110 border flex items-center justify-center relative ${
                    c.bg
                  } ${c.border} ${
                    isSelected
                      ? 'ring-2 ring-primaryDark ring-offset-2 scale-110 shadow-xs'
                      : 'opacity-85 hover:opacity-100'
                  }`}
                  title={c.label}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: c.dot }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Notes / Location (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Room 402 / Remote / Studio 3"
            className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-sans font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Block</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {isEditing ? 'Save Changes' : 'Add Schedule Block'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
