import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

interface NewBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, colorTag: string) => Promise<void>;
}

export const NewBoardModal: React.FC<NewBoardModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [colorTag, setColorTag] = useState('#818CF8');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pastelOptions = [
    { color: '#818CF8', label: 'Lavender', bg: '#EEEDFD' },
    { color: '#34D399', label: 'Mint', bg: '#D0F8E3' },
    { color: '#60A5FA', label: 'Sky Blue', bg: '#D7E3FF' },
    { color: '#FBBF24', label: 'Sand', bg: '#F5F0E6' },
    { color: '#F472B6', label: 'Rose Pink', bg: '#FED7E8' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreate(title.trim(), colorTag);
      setTitle('');
      setColorTag('#818CF8');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project Board"
      description="Create a discrete Kanban roadmap board for your workspace."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans text-xs">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Board Title *
          </label>
          <input
            type="text"
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Project B, Mobile App, Architecture..."
            className="bg-bg border border-border rounded-xl px-3.5 py-2 text-sm text-primaryDark outline-none focus:border-primaryDark"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Theme Tint Color
          </label>
          <div className="flex items-center gap-3 pt-1">
            {pastelOptions.map((opt) => (
              <button
                key={opt.color}
                type="button"
                onClick={() => setColorTag(opt.color)}
                style={{ backgroundColor: opt.color }}
                className={`w-6 h-6 rounded-full cursor-pointer transition-all hover:scale-110 relative ${
                  colorTag === opt.color ? 'ring-2 ring-primaryDark ring-offset-2 scale-105' : 'opacity-85'
                }`}
                title={opt.label}
              />
            ))}
            <span className="font-mono text-mono-xs text-secondaryGray ml-1">
              {pastelOptions.find((o) => o.color === colorTag)?.label || 'Custom'}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border mt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Board'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
