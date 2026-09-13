import React, { useState } from 'react';
import {
  MoreHorizontal,
  CheckCircle2,
  Sparkles,
  Clock,
  CheckSquare,
  ArrowRight,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { KanbanCard } from '@/types';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { getTagStyle } from '@/lib/tagStyles';
import { formatDueDateTime } from '@/lib/dateTimeUtils';
import { cn } from '@/lib/utils';

interface KanbanCardItemProps {
  card: KanbanCard;
  boardTitle: string;
  columnTitle: string;
  isCompletedColumn: boolean;
  onSendToToday: (cardId: string, title: string) => void;
  onOpenDrawer: (cardId: string) => void;
  onDragStart: (e: React.DragEvent, card: KanbanCard) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const KanbanCardItem: React.FC<KanbanCardItemProps> = ({
  card,
  boardTitle,
  columnTitle,
  isCompletedColumn,
  onSendToToday,
  onOpenDrawer,
  onDragStart,
  onDragEnd,
}) => {
  const { deleteCard } = useKanbanStore();
  const { activeTaskId, bindTarget, unbindTarget } = usePomodoroStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isCurrentFocus = activeTaskId === card.id;

  const handleToggleFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentFocus) {
      unbindTarget();
    } else {
      bindTarget({
        id: card.id,
        title: card.title,
        type: 'kanban',
        boardTitle,
        columnTitle,
      });
    }
  };

  const handleSendToTodayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSendToToday(card.id, card.title);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    deleteCard(card.id);
  };

  // Checklist computation
  const checklist = card.checklist || [];
  const hasChecklist = checklist.length > 0;
  const completedChecklistCount = checklist.filter((i) => i.completed).length;
  const checklistPercentage = hasChecklist
    ? Math.round((completedChecklistCount / checklist.length) * 100)
    : 0;

  const dueStatus = formatDueDateTime(card.dueDate);

  return (
    <div
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        onDragStart(e, card);
      }}
      onDragEnd={(e) => {
        setIsDragging(false);
        onDragEnd(e);
      }}
      onClick={() => onOpenDrawer(card.id)}
      className={cn(
        'relative bg-white rounded-2xl p-4 border transition-all select-none cursor-pointer group',
        'hover:shadow-[0_4px_16px_rgba(45,44,42,0.06)] hover:border-[#D8D2C5]',
        isDragging && 'opacity-40 scale-[0.98]',
        isCurrentFocus
          ? 'border-indigo-400 ring-2 ring-accent-indigo/60 bg-[#FAF9FF]'
          : 'border-border/80 shadow-[0_2px_8px_rgba(45,44,42,0.03)]'
      )}
    >
      {/* Top Meta Row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {card.tagLabel && (
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold border',
                getTagStyle(card.tagLabel, card.tagColor)
              )}
            >
              {card.tagLabel}
            </span>
          )}
        </div>

        {/* Top Right: Checkmark for Complete, Menu for Active */}
        {isCompletedColumn ? (
          <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        ) : (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-1 rounded-full text-secondaryGray hover:text-primaryDark hover:bg-surface/80 transition-colors cursor-pointer"
              title="Card actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Context Dropdown Menu */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-7 w-48 bg-white rounded-xl shadow-modal border border-border py-1.5 z-40 animate-fade-in flex flex-col font-sans text-xs">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenDrawer(card.id);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface text-primaryDark text-left transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-secondaryGray" />
                    <span>Open Details</span>
                  </button>

                  <button
                    onClick={(e) => {
                      setShowMenu(false);
                      handleSendToTodayClick(e);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface text-primaryDark text-left transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-secondaryGray" />
                    <span>Send to Today's Queue</span>
                  </button>

                  <button
                    onClick={(e) => {
                      setShowMenu(false);
                      handleToggleFocus(e);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface text-primaryDark text-left transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isCurrentFocus ? 'Stop Focus' : 'Set as Pomodoro Focus'}</span>
                  </button>

                  <div className="my-1 border-t border-border/60" />

                  <button
                    onClick={handleDeleteClick}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 text-rose-600 text-left transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete Card</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Card Title */}
      <h4
        className={cn(
          'font-sans font-semibold text-[14px] leading-snug text-primaryDark mb-1 transition-colors',
          isCompletedColumn && 'line-through text-secondaryGray/70 font-normal'
        )}
      >
        {card.title}
      </h4>

      {/* Sub-copy / Description */}
      {card.description && (
        <p className="text-[12px] text-secondaryGray leading-relaxed line-clamp-2 mb-2.5">
          {card.description}
        </p>
      )}

      {/* Checklist Progress Bar (Figma Style) */}
      {hasChecklist && (
        <div className="bg-[#FAF8F5] rounded-xl p-2.5 border border-border/60 mb-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-sans">
            <div className="flex items-center gap-1.5 text-secondaryGray font-medium">
              <CheckSquare className="w-3 h-3 text-secondaryGray" />
              <span>Checklist</span>
            </div>
            <span className="font-mono text-mono-xs font-semibold text-primaryDark">
              {completedChecklistCount}/{checklist.length}
            </span>
          </div>

          <div className="w-full bg-[#EFEAE1] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#34D399] h-full rounded-full transition-all duration-300"
              style={{ width: `${checklistPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Row: Dates, Recency & Context Actions */}
      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-border/40 text-[11px]">
        {/* Left: Due Date or Completed Recency */}
        <div className="shrink-0 flex items-center min-w-0">
          {isCompletedColumn ? (
            <span className="text-secondaryGray/80 font-sans text-[11px] flex items-center gap-1 whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">{card.completedAt || 'Completed'}</span>
            </span>
          ) : dueStatus.formatted ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-sans text-[11px] font-medium border shadow-2xs whitespace-nowrap',
                dueStatus.isOverdue
                  ? 'bg-[#FFE4E6] text-[#9F1239] border-[#FECDD3]'
                  : dueStatus.isToday
                    ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                    : dueStatus.isTomorrow
                      ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                      : 'bg-surface text-secondaryGray border-border'
              )}
              title={card.dueDate || undefined}
            >
              <Clock className="w-3 h-3 shrink-0 opacity-70" />
              <span>{dueStatus.formatted}</span>
            </span>
          ) : (
            <span />
          )}
        </div>

        {/* Right: Quick Action Buttons on Hover */}
        {!isCompletedColumn && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto">
            {/* Quick Pomodoro Focus Button */}
            <button
              onClick={handleToggleFocus}
              title={isCurrentFocus ? 'Stop Pomodoro Focus' : 'Set as Pomodoro Focus'}
              className={cn(
                'px-2 py-0.5 rounded-full text-[11px] font-sans transition-all flex items-center gap-1 cursor-pointer border whitespace-nowrap',
                isCurrentFocus
                  ? 'bg-accent-indigo text-indigo-950 font-semibold border-indigo-300 opacity-100'
                  : 'bg-surface hover:bg-border text-secondaryGray hover:text-primaryDark border-transparent'
              )}
            >
              <Sparkles
                className={cn(
                  'w-3 h-3 shrink-0',
                  isCurrentFocus ? 'text-indigo-600 fill-indigo-600/30' : 'text-secondaryGray'
                )}
              />
              <span>{isCurrentFocus ? 'Focusing' : 'Focus'}</span>
            </button>

            {/* Quick Send to Today's Queue */}
            <button
              onClick={handleSendToTodayClick}
              title="Send to Today's Queue in Cockpit"
              className="px-2 py-0.5 rounded-full text-[11px] font-sans bg-surface hover:bg-border text-secondaryGray hover:text-primaryDark transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>→ Today</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
