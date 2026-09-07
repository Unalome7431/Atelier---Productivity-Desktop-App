import React, { useState } from 'react';
import { Flame, MessageSquare, Mail, Code, CheckCircle2, Plus, X } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useTasksStore } from '@/stores/useTasksStore';
import { getTodayDateString } from '@/lib/utils';

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDestination?: 'today' | 'inbox';
}

const ICON_OPTIONS = [
  {
    id: 'flame',
    label: 'Urgent / Fire',
    icon: Flame,
    color: 'text-amber-600 bg-rose-50 border-rose-200',
  },
  {
    id: 'chat',
    label: 'Communication',
    icon: MessageSquare,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    id: 'mail',
    label: 'Feedback / Review',
    icon: Mail,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    id: 'code',
    label: 'Deep Dev / Code',
    icon: Code,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    id: 'default',
    label: 'General Task',
    icon: CheckCircle2,
    color: 'text-secondaryGray bg-surface border-border',
  },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  defaultDestination = 'today',
}) => {
  const { addTask, addSubtask } = useTasksStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('#backend');
  const [iconType, setIconType] = useState<'flame' | 'chat' | 'mail' | 'code' | 'default'>('flame');
  const [timeTag, setTimeTag] = useState('Today');
  const [destination, setDestination] = useState<'today' | 'inbox'>(defaultDestination);
  const [subtasksInput, setSubtasksInput] = useState<string[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const handleAddSubtaskDraft = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasksInput([...subtasksInput, newSubtaskText.trim()]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtaskDraft = (index: number) => {
    setSubtasksInput(subtasksInput.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const scheduledDate = destination === 'today' ? getTodayDateString() : null;
    const newTask = await addTask({
      title: title.trim(),
      category: category.trim() || '#work',
      iconType,
      timeTag: timeTag.trim() || (destination === 'today' ? 'Today' : 'Backlog'),
      scheduledDate,
    });

    // Add subtasks if any
    for (const sub of subtasksInput) {
      await addSubtask(newTask.id, sub);
    }

    setTitle('');
    setSubtasksInput([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={destination === 'today' ? "Add to Today's Task Queue" : 'Capture to Inbox Backlog'}
      description="Quickly capture a tactical action item with sub-steps and time chips."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Task Description
          </label>
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Finalize API module contract, Prepare handoff..."
            className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
          />
        </div>

        {/* Destination Toggle */}
        <div className="flex items-center gap-2 p-1 bg-surface border border-border rounded-pill">
          <button
            type="button"
            onClick={() => {
              setDestination('today');
              if (timeTag === 'Backlog') setTimeTag('Today');
            }}
            className={`flex-1 py-1.5 px-3 rounded-pill text-xs font-medium transition-all cursor-pointer ${
              destination === 'today'
                ? 'bg-primaryDark text-bg shadow-xs'
                : 'text-secondaryGray hover:text-primaryDark'
            }`}
          >
            ☀️ Today's Queue
          </button>
          <button
            type="button"
            onClick={() => {
              setDestination('inbox');
              setTimeTag('Backlog');
            }}
            className={`flex-1 py-1.5 px-3 rounded-pill text-xs font-medium transition-all cursor-pointer ${
              destination === 'inbox'
                ? 'bg-primaryDark text-bg shadow-xs'
                : 'text-secondaryGray hover:text-primaryDark'
            }`}
          >
            📥 Daily Inbox / Backlog
          </button>
        </div>

        {/* Category & Time Chip */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Category Tag
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="#backend, #team, #product"
              className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Time / Deadline Chip
            </label>
            <input
              type="text"
              value={timeTag}
              onChange={(e) => setTimeTag(e.target.value)}
              placeholder="e.g. 11:30, Today, Later, 2:00 PM"
              className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>
        </div>

        {/* Icon Type Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Visual Category Icon
          </label>
          <div className="grid grid-cols-5 gap-2">
            {ICON_OPTIONS.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = iconType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIconType(opt.id as any)}
                  title={opt.label}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? `${opt.color} ring-2 ring-primaryDark/20 shadow-xs scale-105`
                      : 'bg-bg border-border text-secondaryGray hover:border-midGray'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span className="text-[10px] font-mono mt-1 tracking-tight truncate max-w-full">
                    {opt.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-steps Checklist */}
        <div className="flex flex-col gap-2 p-3 bg-surface/60 border border-border rounded-panel">
          <div className="flex items-center justify-between">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Sub-steps / Checklist (Optional)
            </label>
            <span className="font-mono text-mono-tag text-midGray">
              {subtasksInput.length} steps added
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtaskDraft();
                }
              }}
              placeholder="Add step and press enter..."
              className="flex-1 bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-xs text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={handleAddSubtaskDraft}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </Button>
          </div>

          {subtasksInput.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1 max-h-32 overflow-y-auto">
              {subtasksInput.map((sub, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-2.5 py-1 rounded-md bg-bg border border-border text-ui-rg-xs text-primaryDark"
                >
                  <span className="truncate">{sub}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtaskDraft(idx)}
                    className="text-midGray hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
