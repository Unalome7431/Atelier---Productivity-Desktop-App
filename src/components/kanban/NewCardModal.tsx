import React, { useState } from 'react';
import { Plus, Tag, Check, X, Clock } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { KanbanBoard } from '@/types';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { getTagStyle, PASTEL_TAG_COLORS } from '@/lib/tagStyles';
import { cn } from '@/lib/utils';

interface NewCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: KanbanBoard;
  targetColumnId: string;
  onCreate: (data: {
    boardId: string;
    columnId: string;
    title: string;
    description: string;
    tagLabel?: string;
    tagColor?: string;
    dueDate?: string;
  }) => Promise<void>;
}

export const NewCardModal: React.FC<NewCardModalProps> = ({
  isOpen,
  onClose,
  board,
  targetColumnId,
  onCreate,
}) => {
  const { getAvailableTags, createCustomTag } = useKanbanStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTagLabel, setSelectedTagLabel] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState('');
  const [columnId, setColumnId] = useState(targetColumnId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom tag creation inline state
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('mint');

  // Sync columnId if targetColumnId changes
  React.useEffect(() => {
    setColumnId(targetColumnId);
  }, [targetColumnId]);

  const availableTags = getAvailableTags();

  const handleSelectTag = (label: string, color?: string) => {
    if (selectedTagLabel.toLowerCase() === label.toLowerCase()) {
      setSelectedTagLabel('');
      setSelectedTagColor(undefined);
    } else {
      setSelectedTagLabel(label);
      setSelectedTagColor(color);
    }
  };

  const handleSaveCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newTagName.trim()) return;
    const created = createCustomTag(newTagName.trim(), newTagColor);
    setSelectedTagLabel(created.label);
    setSelectedTagColor(created.color);
    setNewTagName('');
    setIsCreatingTag(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        boardId: board.id,
        columnId,
        title: title.trim(),
        description: description.trim(),
        tagLabel: selectedTagLabel || undefined,
        tagColor: selectedTagColor || undefined,
        dueDate: dueDate.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setSelectedTagLabel('');
      setSelectedTagColor(undefined);
      setIsCreatingTag(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Card"
      description={`Add a strategic deliverable to "${board.title}".`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans text-xs">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Card Title *
          </label>
          <input
            type="text"
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Finalize API module contract..."
            className="bg-bg border border-border rounded-xl px-3.5 py-2 text-sm text-primaryDark outline-none focus:border-primaryDark"
          />
        </div>

        {/* Target Column Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Target Column
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {board.columns.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setColumnId(col.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer border flex items-center gap-1.5',
                  columnId === col.id
                    ? 'bg-primaryDark text-white border-primaryDark font-semibold shadow-xs'
                    : 'bg-surface hover:bg-border text-secondaryGray hover:text-primaryDark border-border/80'
                )}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: col.dotColor || '#9CA3AF' }}
                />
                <span>{col.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Customizable Domain Tag */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-secondaryGray" />
              <span>Domain Tag</span>
            </label>
            {!isCreatingTag && (
              <button
                type="button"
                onClick={() => setIsCreatingTag(true)}
                className="text-[11px] font-mono text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>Custom Tag</span>
              </button>
            )}
          </div>

          {/* Inline Custom Tag Creator */}
          {isCreatingTag && (
            <div className="p-3 bg-surface rounded-2xl border border-border flex flex-col gap-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-mono text-mono-xs font-bold text-midGray uppercase">
                  Create Domain Tag
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingTag(false)}
                  className="p-1 text-secondaryGray hover:text-primaryDark cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g. Infrastructure, DevOps, AI..."
                  className="flex-1 bg-white border border-border rounded-xl px-3 py-1.5 text-xs text-primaryDark outline-none focus:border-primaryDark"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveCustomTag}
                  disabled={!newTagName.trim()}
                >
                  Add Tag
                </Button>
              </div>

              {/* Pastel Color Picker */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="font-mono text-[10px] text-secondaryGray mr-1">Color:</span>
                {Object.entries(PASTEL_TAG_COLORS).map(([colorKey, colorVal]) => (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => setNewTagColor(colorKey)}
                    style={{ backgroundColor: colorVal.preview }}
                    className={cn(
                      'w-5 h-5 rounded-full transition-all cursor-pointer hover:scale-110 flex items-center justify-center',
                      newTagColor === colorKey
                        ? 'ring-2 ring-primaryDark ring-offset-1 scale-105'
                        : 'opacity-75 hover:opacity-100'
                    )}
                    title={colorVal.name}
                  >
                    {newTagColor === colorKey && (
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tag Chips List */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {availableTags.length === 0 && !isCreatingTag && (
              <span className="text-xs text-secondaryGray italic py-0.5">
                No custom tags yet. Click "Custom Tag" to create one.
              </span>
            )}
            {availableTags.map((tag) => {
              const isSelected = selectedTagLabel.toLowerCase() === tag.label.toLowerCase();
              return (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => handleSelectTag(tag.label, tag.color)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-sans transition-all cursor-pointer border flex items-center gap-1.5',
                    isSelected
                      ? cn(
                          'ring-2 ring-primaryDark/40 font-semibold shadow-xs',
                          getTagStyle(tag.label, tag.color)
                        )
                      : 'bg-white hover:bg-surface text-secondaryGray hover:text-primaryDark border-border/80'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{tag.label}</span>
                </button>
              );
            })}
            {selectedTagLabel && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTagLabel('');
                  setSelectedTagColor(undefined);
                }}
                className="px-2 py-1 text-[11px] font-mono text-secondaryGray hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear Tag
              </button>
            )}
          </div>
        </div>

        {/* Due Date & Time Reference */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-secondaryGray" />
              <span>Due Date & Time</span>
            </label>
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate('')}
                className="text-[11px] font-mono text-secondaryGray hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-bg border border-border rounded-xl px-3.5 py-2 text-xs font-mono text-primaryDark outline-none focus:border-primaryDark shadow-2xs"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Add brief context or acceptance criteria..."
            className="bg-bg border border-border rounded-xl px-3.5 py-2 text-xs text-primaryDark outline-none focus:border-primaryDark resize-none"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border mt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Card'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
