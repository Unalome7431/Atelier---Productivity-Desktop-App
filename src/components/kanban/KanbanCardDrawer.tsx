import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Clock,
  CheckSquare,
  ArrowRight,
  Trash2,
  Plus,
  Tag,
  Check,
} from 'lucide-react';
import { KanbanBoard } from '@/types';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { Button } from '@/components/common/Button';
import { getTagStyle, PASTEL_TAG_COLORS } from '@/lib/tagStyles';
import { cn } from '@/lib/utils';

interface KanbanCardDrawerProps {
  cardId: string | null;
  board: KanbanBoard;
  isOpen: boolean;
  onClose: () => void;
  onSendToToday: (cardId: string, title: string) => void;
}

export const KanbanCardDrawer: React.FC<KanbanCardDrawerProps> = ({
  cardId,
  board,
  isOpen,
  onClose,
  onSendToToday,
}) => {
  const {
    updateCard,
    deleteCard,
    toggleChecklistItem,
    addChecklistItem,
    deleteChecklistItem,
    getAvailableTags,
    createCustomTag,
  } = useKanbanStore();
  const { activeTaskId, bindTarget, unbindTarget } = usePomodoroStore();

  const card = board.cards.find((c) => c.id === cardId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tagLabel, setTagLabel] = useState('');
  const [tagColor, setTagColor] = useState<string | undefined>(undefined);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  // Custom tag creation inline state
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('mint');

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setDueDate(card.dueDate || '');
      setTagLabel(card.tagLabel || '');
      setTagColor(card.tagColor || undefined);
      setIsConfirmDelete(false);
      setIsCreatingTag(false);
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const currentColumn = board.columns.find((col) => col.id === card.columnId) || board.columns[0];
  const isCurrentFocus = activeTaskId === card.id;

  const handleTitleBlur = () => {
    if (title.trim() && title !== card.title) {
      updateCard(card.id, { title: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== (card.description || '')) {
      updateCard(card.id, { description });
    }
  };

  const handleDueDateChange = (date: string) => {
    setDueDate(date);
    updateCard(card.id, { dueDate: date || undefined });
  };

  const handleTagToggle = (tag: string, color?: string) => {
    if (tagLabel.toLowerCase() === tag.toLowerCase()) {
      setTagLabel('');
      setTagColor(undefined);
      updateCard(card.id, { tagLabel: undefined, tagColor: undefined });
    } else {
      setTagLabel(tag);
      setTagColor(color);
      updateCard(card.id, { tagLabel: tag, tagColor: color });
    }
  };

  const handleSaveCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newTagName.trim()) return;
    const created = createCustomTag(newTagName.trim(), newTagColor);
    setTagLabel(created.label);
    setTagColor(created.color);
    updateCard(card.id, { tagLabel: created.label, tagColor: created.color });
    setNewTagName('');
    setIsCreatingTag(false);
  };

  const handleColumnChange = (columnId: string) => {
    updateCard(card.id, { columnId });
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    addChecklistItem(card.id, newChecklistText.trim());
    setNewChecklistText('');
  };

  const handleToggleFocus = () => {
    if (isCurrentFocus) {
      unbindTarget();
    } else {
      bindTarget({
        id: card.id,
        title: card.title,
        type: 'kanban',
        boardTitle: board.title,
        columnTitle: currentColumn.title,
      });
    }
  };

  const handleDeleteCard = () => {
    if (!isConfirmDelete) {
      setIsConfirmDelete(true);
      return;
    }
    deleteCard(card.id);
    onClose();
  };

  const checklist = card.checklist || [];
  const completedCount = checklist.filter((i) => i.completed).length;
  const checklistPercent =
    checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  const availableTags = getAvailableTags();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-primaryDark/20 backdrop-blur-[2px] z-50 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-Over Drawer Container */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 w-[500px] max-w-full bg-bg border-l border-border shadow-modal z-50 flex flex-col justify-between',
          'transform transition-transform duration-300 ease-in-out select-none'
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-white flex items-start justify-between">
          <div className="flex flex-col gap-1.5 flex-1 pr-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-mono-uppercase text-midGray uppercase">
                {board.title}
              </span>
              <span className="text-secondaryGray/40 text-xs">•</span>
              <span className="font-mono text-mono-uppercase text-primaryDark font-semibold uppercase">
                {currentColumn.title}
              </span>
            </div>

            {/* Column Selector Pills */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {board.columns.map((col) => (
                <button
                  key={col.id}
                  onClick={() => handleColumnChange(col.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-sans transition-all cursor-pointer border',
                    card.columnId === col.id
                      ? 'bg-primaryDark text-white border-primaryDark font-medium shadow-xs'
                      : 'bg-surface hover:bg-border text-secondaryGray hover:text-primaryDark border-transparent'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: col.dotColor || '#9CA3AF' }}
                    />
                    <span>{col.title}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-secondaryGray hover:text-primaryDark hover:bg-surface transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Editable Title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider">
              Card Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Card title..."
              className="font-display font-bold text-[20px] text-primaryDark bg-transparent border-b border-border/80 focus:border-primaryDark pb-1.5 outline-none transition-colors"
            />
          </div>

          {/* Metadata: Customizable Domain Tag */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider flex items-center gap-1.5">
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
              <div className="p-3 bg-white rounded-2xl border border-border flex flex-col gap-2.5 animate-fade-in shadow-xs">
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
                    placeholder="e.g. Mobile, Core, Platform..."
                    className="flex-1 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-primaryDark outline-none focus:border-primaryDark"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSaveCustomTag}
                    disabled={!newTagName.trim()}
                  >
                    Create & Apply
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

            {/* Tag Selection Chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {availableTags.length === 0 && !isCreatingTag && (
                <span className="text-xs text-secondaryGray italic py-0.5">
                  No custom tags yet. Click "Custom Tag" to create one.
                </span>
              )}
              {availableTags.map((tag) => {
                const isSelected = tagLabel.toLowerCase() === tag.label.toLowerCase();
                return (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => handleTagToggle(tag.label, tag.color)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-sans transition-all cursor-pointer border flex items-center gap-1.5',
                      isSelected
                        ? cn(
                            'ring-2 ring-primaryDark/40 font-semibold shadow-xs',
                            getTagStyle(tag.label, tagColor || tag.color)
                          )
                        : 'bg-white hover:bg-surface text-secondaryGray hover:text-primaryDark border-border/80'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{tag.label}</span>
                  </button>
                );
              })}

              {tagLabel && (
                <button
                  type="button"
                  onClick={() => handleTagToggle(tagLabel)}
                  className="px-2 py-1 text-[11px] font-mono text-secondaryGray hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear Tag
                </button>
              )}
            </div>
          </div>

          {/* Due Date & Time Reference */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-secondaryGray" />
                <span>Due Date & Time</span>
              </label>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => handleDueDateChange('')}
                  className="text-[11px] font-mono text-secondaryGray hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="bg-white border border-border rounded-xl px-3.5 py-2 text-xs font-mono text-primaryDark outline-none focus:border-primaryDark shadow-2xs"
            />
          </div>

          {/* Description Markdown */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              rows={4}
              placeholder="Add context, specs, research links, or acceptance criteria..."
              className="w-full bg-white border border-border rounded-2xl p-3.5 text-xs font-sans text-primaryDark leading-relaxed outline-none focus:border-primaryDark shadow-2xs resize-none"
            />
          </div>

          {/* Interactive Checklist */}
          <div className="bg-white rounded-2xl p-4 border border-border flex flex-col gap-3 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-secondaryGray" />
                <span className="font-display font-bold text-sm text-primaryDark">
                  Sub-tasks & Checklist
                </span>
              </div>
              <span className="font-mono text-mono-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {completedCount} / {checklist.length} ({checklistPercent}%)
              </span>
            </div>

            {/* Checklist Progress Bar */}
            {checklist.length > 0 && (
              <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden border border-border/60">
                <div
                  className="bg-pastel-mint-dot h-full rounded-full transition-all duration-300"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>
            )}

            {/* Checklist Items */}
            <div className="flex flex-col gap-1.5 mt-1">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="group/item flex items-center justify-between p-2 rounded-xl hover:bg-surface/80 transition-colors"
                >
                  <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleChecklistItem(card.id, item.id)}
                      className="w-4 h-4 rounded text-accent-mauve accent-primaryDark cursor-pointer"
                    />
                    <span
                      className={cn(
                        'text-xs font-sans transition-colors break-words select-text',
                        item.completed ? 'line-through text-secondaryGray/70' : 'text-primaryDark'
                      )}
                    >
                      {item.title}
                    </span>
                  </label>

                  <button
                    onClick={() => deleteChecklistItem(card.id, item.id)}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-secondaryGray hover:text-rose-600 transition-opacity cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Checklist Item Form */}
            <form onSubmit={handleAddChecklist} className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Add new subtask item... (Press Enter)"
                className="flex-1 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs font-sans text-primaryDark outline-none focus:border-primaryDark"
              />
              <Button type="submit" variant="ghost" size="sm" className="shrink-0 gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Send to Today's Queue */}
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => onSendToToday(card.id, card.title)}
            >
              <ArrowRight className="w-3.5 h-3.5 text-secondaryGray" />
              <span>Send to Today's Queue</span>
            </Button>

            {/* Set as Focus */}
            <Button
              variant={isCurrentFocus ? 'mint' : 'lavender'}
              size="sm"
              className="gap-2"
              onClick={handleToggleFocus}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCurrentFocus ? 'Focusing' : 'Focus Session'}</span>
            </Button>
          </div>

          {/* Delete Card */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-1.5 transition-colors',
              isConfirmDelete
                ? 'bg-rose-50 text-rose-600 font-semibold'
                : 'text-rose-600 hover:bg-rose-50'
            )}
            onClick={handleDeleteCard}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isConfirmDelete ? 'Confirm?' : 'Delete'}</span>
          </Button>
        </div>
      </aside>
    </>
  );
};
