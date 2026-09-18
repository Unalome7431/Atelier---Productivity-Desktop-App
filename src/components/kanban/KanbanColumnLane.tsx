import React, { useState } from 'react';
import { Plus, MoreHorizontal, Edit2, Trash2, Check } from 'lucide-react';
import { KanbanColumn, KanbanCard } from '@/types';
import { KanbanCardItem } from './KanbanCardItem';
import { getRankBetween, getInitialRank } from '@/lib/lexorank';
import { cn } from '@/lib/utils';

interface KanbanColumnLaneProps {
  column: KanbanColumn;
  cards: KanbanCard[];
  boardTitle: string;
  canDeleteColumn?: boolean;
  onOpenAddCard: (columnId: string) => void;
  onOpenDrawer: (cardId: string) => void;
  onSendToToday: (cardId: string, title: string) => void;
  onMoveCard: (cardId: string, targetColumnId: string, newRank: string) => void;
  onRenameColumn?: (columnId: string, newTitle: string) => void;
  onDeleteColumn?: (columnId: string) => void;
}

export const KanbanColumnLane: React.FC<KanbanColumnLaneProps> = ({
  column,
  cards,
  boardTitle,
  canDeleteColumn = true,
  onOpenAddCard,
  onOpenDrawer,
  onSendToToday,
  onMoveCard,
  onRenameColumn,
  onDeleteColumn,
}) => {
  const [isOverColumn, setIsOverColumn] = useState(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnTitleInput, setColumnTitleInput] = useState(column.title);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const isCompletedColumn = column.id === 'done' || column.id === 'complete';

  // Sort cards deterministically by positionRank / orderIndex
  const sortedCards = [...cards].sort((a, b) => {
    const rankA = a.positionRank != null ? parseFloat(a.positionRank) : a.orderIndex;
    const rankB = b.positionRank != null ? parseFloat(b.positionRank) : b.orderIndex;
    return rankA - rankB;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOverColumn(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only deactivate when leaving the column container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOverColumn(false);
      setDropIndex(null);
    }
  };

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const targetIdx = e.clientY < midpoint ? index : index + 1;
    setDropIndex(targetIdx);
    setIsOverColumn(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverColumn(false);

    try {
      const payload = JSON.parse(e.dataTransfer.getData('application/json'));
      const cardId = payload.cardId;
      if (!cardId) return;

      // Filter out dragged card from calculation to prevent self-collision
      const otherCards = sortedCards.filter((c) => c.id !== cardId);

      let targetIdx = dropIndex !== null ? dropIndex : otherCards.length;
      if (targetIdx > otherCards.length) targetIdx = otherCards.length;

      let newRank: string;
      if (otherCards.length === 0) {
        newRank = getInitialRank(0);
      } else if (targetIdx === 0) {
        // Insert before first card
        const nextRank = otherCards[0].positionRank || getInitialRank(0);
        newRank = getRankBetween(null, nextRank);
      } else if (targetIdx >= otherCards.length) {
        // Insert after last card
        const prevRank =
          otherCards[otherCards.length - 1].positionRank || getInitialRank(otherCards.length);
        newRank = getRankBetween(prevRank, null);
      } else {
        // Insert between targetIdx - 1 and targetIdx
        const prevRank = otherCards[targetIdx - 1].positionRank;
        const nextRank = otherCards[targetIdx].positionRank;
        newRank = getRankBetween(prevRank, nextRank);
      }

      onMoveCard(cardId, column.id, newRank);
    } catch (err) {
      console.error('Failed to parse drag drop payload:', err);
    } finally {
      setDropIndex(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, card: KanbanCard) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ cardId: card.id, sourceColumnId: card.columnId })
    );
  };

  const handleDragEnd = () => {
    setIsOverColumn(false);
    setDropIndex(null);
  };

  const handleFinishRename = () => {
    if (columnTitleInput.trim() && columnTitleInput.trim() !== column.title) {
      onRenameColumn?.(column.id, columnTitleInput.trim());
    } else {
      setColumnTitleInput(column.title);
    }
    setIsEditingTitle(false);
  };

  // Background tint classes matching Figma & Custom themes
  const getColumnBg = () => {
    if (column.bgTint) {
      return column.bgTint;
    }
    switch (column.id) {
      case 'planned':
        return 'bg-[#FAF7F0] border-[#E8E2D5]';
      case 'in_progress':
        return 'bg-[#F0F3FF] border-[#DCE4FF]';
      case 'review':
        return 'bg-[#F5F0FF] border-[#E7DBFF]';
      case 'done':
      case 'complete':
        return 'bg-[#ECFDF5] border-[#D1F2E2]';
      default:
        return 'bg-surface border-border';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'w-[360px] min-w-[360px] max-w-[380px] rounded-3xl border p-4 flex flex-col gap-3 shadow-[0_2px_12px_rgba(45,44,42,0.03)] transition-all flex-shrink-0 h-full max-h-full',
        getColumnBg(),
        isOverColumn && 'ring-2 ring-primaryDark/20 border-primaryDark/40'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1.5 pt-1 pb-1">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
          {/* Status Dot */}
          <span
            className="w-2.5 h-2.5 rounded-full shadow-2xs shrink-0"
            style={{ backgroundColor: column.dotColor || '#9CA3AF' }}
          />

          {/* Title or Inline Edit Input */}
          {isEditingTitle ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                type="text"
                autoFocus
                value={columnTitleInput}
                onChange={(e) => setColumnTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename();
                  if (e.key === 'Escape') {
                    setColumnTitleInput(column.title);
                    setIsEditingTitle(false);
                  }
                }}
                onBlur={handleFinishRename}
                className="bg-white px-2 py-0.5 rounded-lg text-xs font-semibold text-primaryDark outline-none border border-primaryDark w-full shadow-xs"
              />
              <button
                onClick={handleFinishRename}
                className="p-1 rounded-md bg-white hover:bg-surface text-emerald-700 cursor-pointer"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <h3
              onDoubleClick={() => setIsEditingTitle(true)}
              title="Double click to rename column"
              className="font-display font-bold text-[15px] text-primaryDark truncate cursor-pointer hover:opacity-80"
            >
              {column.title}
            </h3>
          )}

          {/* Real-time Count Badge */}
          <span className="px-2 py-0.5 rounded-full bg-white/80 border border-border/80 font-mono text-[11px] font-semibold text-secondaryGray shadow-2xs shrink-0">
            {sortedCards.length}
          </span>
        </div>

        {/* Column Actions: Quick Add & Menu */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onOpenAddCard(column.id)}
            className="w-6 h-6 rounded-full bg-white hover:bg-white/80 text-secondaryGray hover:text-primaryDark flex items-center justify-center border border-border/80 shadow-2xs transition-all cursor-pointer hover:scale-105"
            title={`Add card to ${column.title}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Column Options Menu */}
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu((prev) => !prev)}
              className="w-6 h-6 rounded-full bg-white hover:bg-white/80 text-secondaryGray hover:text-primaryDark flex items-center justify-center border border-border/80 shadow-2xs transition-all cursor-pointer"
              title="Column settings"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showColumnMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowColumnMenu(false)} />
                <div className="absolute right-0 top-7 w-40 bg-white rounded-xl shadow-modal border border-border py-1.5 z-40 animate-fade-in flex flex-col font-sans text-xs">
                  <button
                    onClick={() => {
                      setShowColumnMenu(false);
                      setIsEditingTitle(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface text-primaryDark text-left transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-secondaryGray" />
                    <span>Rename Column</span>
                  </button>

                  {canDeleteColumn && onDeleteColumn && (
                    <>
                      <div className="my-1 border-t border-border/60" />
                      <button
                        onClick={() => {
                          setShowColumnMenu(false);
                          onDeleteColumn(column.id);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 text-rose-600 text-left transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Delete Column</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cards List Lane (Scrollbar hidden via no-scrollbar) */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 min-h-[120px]">
        {sortedCards.length === 0 ? (
          <div
            className={cn(
              'flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border/70 text-center transition-colors',
              isOverColumn ? 'bg-white/60 border-primaryDark/30' : 'bg-white/20'
            )}
          >
            <p className="text-xs font-sans text-secondaryGray/80">No cards in {column.title}</p>
            <button
              onClick={() => onOpenAddCard(column.id)}
              className="mt-2 text-xs font-mono font-medium text-primaryDark hover:underline cursor-pointer"
            >
              + Add card
            </button>
          </div>
        ) : (
          sortedCards.map((card, idx) => (
            <div key={card.id} onDragOver={(e) => handleCardDragOver(e, idx)} className="relative">
              {/* Drop Insertion Line (Above card) */}
              {isOverColumn && dropIndex === idx && (
                <div className="h-1 bg-accent-mauve rounded-full my-1 animate-pulse shadow-sm" />
              )}

              <KanbanCardItem
                card={card}
                boardTitle={boardTitle}
                columnTitle={column.title}
                isCompletedColumn={isCompletedColumn}
                onSendToToday={onSendToToday}
                onOpenDrawer={onOpenDrawer}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />

              {/* Drop Insertion Line (Below last card) */}
              {isOverColumn && dropIndex === idx + 1 && idx === sortedCards.length - 1 && (
                <div className="h-1 bg-accent-mauve rounded-full my-1 animate-pulse shadow-sm" />
              )}
            </div>
          ))
        )}

        {/* Bottom Add Card Button when cards exist */}
        {sortedCards.length > 0 && (
          <button
            type="button"
            onClick={() => onOpenAddCard(column.id)}
            className="w-full py-2 px-3 rounded-2xl border border-dashed border-border/80 hover:border-primaryDark/40 bg-surface/30 hover:bg-surface text-secondaryGray hover:text-primaryDark text-xs font-sans font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1 shrink-0"
            title={`Add new card to ${column.title}`}
          >
            <Plus className="w-3.5 h-3.5 text-secondaryGray" />
            <span>Add card</span>
          </button>
        )}
      </div>
    </div>
  );
};
