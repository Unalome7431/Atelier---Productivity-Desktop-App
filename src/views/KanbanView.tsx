import React, { useEffect, useState } from 'react';
import { Plus, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { useTasksStore } from '@/stores/useTasksStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { getTodayDateString, cn } from '@/lib/utils';

export const KanbanView: React.FC = () => {
  const { boards, activeBoardId, loadBoards, moveCard, addCard } = useKanbanStore();
  const { addTask } = useTasksStore();
  const { activeTaskId, bindTarget } = usePomodoroStore();

  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState('planned');
  const [cardTitle, setCardTitle] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];

  const handleOpenAddCard = (colId: string) => {
    setTargetColumnId(colId);
    setIsNewCardModalOpen(true);
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim() || !activeBoard) return;
    await addCard(activeBoard.id, targetColumnId, cardTitle.trim());
    setCardTitle('');
    setIsNewCardModalOpen(false);
  };

  const handleSendToCockpit = async (cardId: string, title: string) => {
    await addTask({
      title,
      iconType: 'code',
      timeTag: 'Today',
      scheduledDate: getTodayDateString(),
      sourceKanbanCardId: cardId,
    });
    setToastMessage(`Sent "${title}" to Today's Queue!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!activeBoard) return null;

  return (
    <div className="flex-1 overflow-x-auto p-8 flex flex-col gap-6 bg-bg h-full">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-mono-uppercase text-midGray uppercase">
            Execution Board
          </span>
          <h2 className="font-display font-bold text-display-2 text-primaryDark mt-1">
            {activeBoard.title}
          </h2>
        </div>
        <Button
          variant="primary"
          size="md"
          className="gap-2"
          onClick={() => handleOpenAddCard('planned')}
        >
          <Plus className="w-4 h-4" />
          <span>New Card</span>
        </Button>
      </div>

      {toastMessage && (
        <div className="bg-[#D1FAE5] border border-emerald-300 text-emerald-950 px-4 py-2 rounded-xl text-ui-rg-xs font-mono font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex gap-6 items-start flex-1 min-h-0">
        {activeBoard.columns.map((column) => {
          const colCards = activeBoard.cards.filter((c) => c.columnId === column.id);

          const dotColors: Record<string, string> = {
            planned: 'bg-accent-mauve',
            in_progress: 'bg-accent-blue',
            review: 'bg-accent-purple',
            done: 'bg-accent-green',
          };

          return (
            <div
              key={column.id}
              className="w-80 bg-surface rounded-panel border border-border p-4 flex flex-col gap-3 shadow-card max-h-full"
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      dotColors[column.id] || 'bg-primaryDark'
                    }`}
                  />
                  <span className="font-display font-bold text-display-6 text-primaryDark">
                    {column.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-mono-xs text-midGray">{colCards.length}</span>
                  <button
                    onClick={() => handleOpenAddCard(column.id)}
                    className="w-5 h-5 rounded-full text-secondaryGray hover:text-primaryDark hover:bg-bg flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
                {colCards.map((card) => (
                  <div
                    key={card.id}
                    className={cn(
                      'p-4 rounded-card bg-bg border shadow-subtle flex flex-col gap-2 group transition-all',
                      activeTaskId === card.id
                        ? 'border-[#C5BDAF] bg-[#EBE7FF]/15 ring-1 ring-accent-indigo/40'
                        : 'border-border'
                    )}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          bindTarget({
                            id: card.id,
                            title: card.title,
                            type: 'kanban',
                            boardTitle: activeBoard.title,
                            columnTitle: column.title,
                          });
                          setToastMessage(`Bound "${card.title}" to Pomodoro focus!`);
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                        title="Set as Pomodoro Focus"
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded font-mono transition-all cursor-pointer flex items-center gap-1',
                          activeTaskId === card.id
                            ? 'bg-[#EBE7FF] text-primaryDark font-bold opacity-100'
                            : 'opacity-0 group-hover:opacity-100 text-secondaryGray hover:text-accent-indigo hover:bg-surface'
                        )}
                      >
                        <Sparkles className="w-3 h-3 text-accent-indigo shrink-0" />
                        <span>{activeTaskId === card.id ? 'Focusing' : 'Focus'}</span>
                      </button>
                      <button
                        onClick={() => handleSendToCockpit(card.id, card.title)}
                        title="Send to Today's Cockpit"
                        className="opacity-0 group-hover:opacity-100 text-xs text-secondaryGray hover:text-primaryDark transition-opacity cursor-pointer font-mono"
                      >
                        → Today
                      </button>
                    </div>
                    <h4 className="font-sans font-semibold text-ui-bold-sm text-primaryDark">
                      {card.title}
                    </h4>
                    {card.description && (
                      <p className="text-ui-rg-xs text-secondaryGray">{card.description}</p>
                    )}

                    {/* Quick Move Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-mono-tag font-mono text-midGray">
                      <span>Move to:</span>
                      <div className="flex gap-1">
                        {activeBoard.columns
                          .filter((c) => c.id !== column.id)
                          .map((target) => (
                            <button
                              key={target.id}
                              onClick={() => moveCard(card.id, target.id)}
                              className="hover:text-primaryDark px-1 py-0.5 rounded bg-surface hover:bg-border transition-colors cursor-pointer"
                            >
                              {target.title.substring(0, 3)}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Kanban Card Modal */}
      <Modal
        isOpen={isNewCardModalOpen}
        onClose={() => setIsNewCardModalOpen(false)}
        title="Add Kanban Card"
        description={`Add a new roadmap item to column "${activeBoard.columns.find((c) => c.id === targetColumnId)?.title}".`}
      >
        <form onSubmit={handleCreateCard} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Card Title
            </label>
            <input
              type="text"
              autoFocus
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              placeholder="e.g. Design serverless webhook gateway..."
              className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewCardModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add Card
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
