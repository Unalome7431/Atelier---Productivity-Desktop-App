import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { COLUMN_THEMES, ColumnThemeOption } from '@/lib/tagStyles';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardTitle: string;
  onAddColumn: (title: string, themeId: string) => Promise<void>;
}

export const AddColumnModal: React.FC<AddColumnModalProps> = ({
  isOpen,
  onClose,
  boardTitle,
  onAddColumn,
}) => {
  const [title, setTitle] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState('blue');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddColumn(title.trim(), selectedThemeId);
      setTitle('');
      setSelectedThemeId('blue');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTheme = COLUMN_THEMES.find((t) => t.id === selectedThemeId) || COLUMN_THEMES[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Custom Column"
      description={`Add a new workflow lane to "${boardTitle}".`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans text-xs">
        {/* Title Input */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Column Title *
          </label>
          <input
            type="text"
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Backlog, Testing, Deployment, Blocked..."
            className="bg-bg border border-border rounded-xl px-3.5 py-2 text-sm text-primaryDark outline-none focus:border-primaryDark"
          />
        </div>

        {/* Theme Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Pastel Color Theme
          </label>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {COLUMN_THEMES.map((theme: ColumnThemeOption) => {
              const isSelected = selectedThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer',
                    isSelected
                      ? 'border-primaryDark bg-white shadow-xs font-semibold'
                      : 'border-border/80 bg-surface/50 hover:bg-surface text-secondaryGray'
                  )}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: theme.previewColor }}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </span>
                  <span className="text-xs text-primaryDark truncate">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Lane Preview */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="font-mono text-mono-xs text-secondaryGray uppercase">Lane Preview</span>
          <div
            className={cn(
              'rounded-2xl border p-3 flex items-center justify-between shadow-2xs transition-colors',
              selectedTheme.bgTint,
              selectedTheme.borderClass
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedTheme.dotColor }}
              />
              <span className="font-display font-bold text-sm text-primaryDark">
                {title.trim() || 'Custom Column Name'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/80 border border-border/80 font-mono text-[10px] text-secondaryGray">
              0
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border mt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Create Column'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
