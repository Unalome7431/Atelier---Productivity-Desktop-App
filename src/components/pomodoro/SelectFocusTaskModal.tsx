import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useTasksStore } from '@/stores/useTasksStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { ActiveFocusTarget } from '@/types';
import { cn } from '@/lib/utils';

interface SelectFocusTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelectFocusTaskModal: React.FC<SelectFocusTaskModalProps> = ({ isOpen, onClose }) => {
  const { tasks, inboxTasks } = useTasksStore();
  const { boards } = useKanbanStore();
  const { activeTaskId, bindTarget } = usePomodoroStore();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'inbox' | 'kanban'>('today');

  const handleSelect = (target: ActiveFocusTarget) => {
    bindTarget(target);
    onClose();
  };

  // Filtered today's tasks
  const filteredTodayTasks = useMemo(() => {
    const uncompleted = tasks.filter((t) => !t.completed);
    if (!query.trim()) return uncompleted;
    const q = query.toLowerCase();
    return uncompleted.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, query]);

  // Filtered inbox tasks
  const filteredInboxTasks = useMemo(() => {
    const uncompleted = inboxTasks.filter((t) => !t.completed);
    if (!query.trim()) return uncompleted;
    const q = query.toLowerCase();
    return uncompleted.filter((t) => t.title.toLowerCase().includes(q));
  }, [inboxTasks, query]);

  // Filtered kanban cards
  const kanbanCards = useMemo(() => {
    const list: {
      cardId: string;
      cardTitle: string;
      boardTitle: string;
      columnTitle: string;
    }[] = [];
    boards.forEach((board) => {
      board.columns.forEach((col) => {
        // Skip done column
        if (col.id === 'done' || col.title.toLowerCase().includes('complete')) return;
        const cardsInCol = board.cards.filter((c) => c.columnId === col.id);
        cardsInCol.forEach((card) => {
          list.push({
            cardId: card.id,
            cardTitle: card.title,
            boardTitle: board.title,
            columnTitle: col.title,
          });
        });
      });
    });

    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (item) =>
        item.cardTitle.toLowerCase().includes(q) || item.boardTitle.toLowerCase().includes(q)
    );
  }, [boards, query]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Focus Task"
      description="Bind an active task or Kanban card to your header Pomodoro focus session."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4 pt-2">
        {/* Search input */}
        <div className="flex items-center gap-2 bg-surface border border-border rounded-md px-3 py-2 text-ui-rg-sm">
          <Search className="w-4 h-4 text-secondaryGray shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search today's queue, inbox, or kanban..."
            className="flex-1 bg-transparent text-primaryDark placeholder:text-midGray outline-none"
          />
        </div>

        {/* Source Tabs */}
        <div className="flex items-center gap-1 border-b border-border pb-2 text-ui-rg-xs">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={cn(
              'px-3 py-1 rounded-pill font-medium transition-all cursor-pointer',
              activeTab === 'today'
                ? 'bg-primaryDark text-white'
                : 'text-secondaryGray hover:text-primaryDark hover:bg-surface'
            )}
          >
            Today's Queue ({filteredTodayTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={cn(
              'px-3 py-1 rounded-pill font-medium transition-all cursor-pointer',
              activeTab === 'inbox'
                ? 'bg-primaryDark text-white'
                : 'text-secondaryGray hover:text-primaryDark hover:bg-surface'
            )}
          >
            Daily Inbox ({filteredInboxTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className={cn(
              'px-3 py-1 rounded-pill font-medium transition-all cursor-pointer',
              activeTab === 'kanban'
                ? 'bg-primaryDark text-white'
                : 'text-secondaryGray hover:text-primaryDark hover:bg-surface'
            )}
          >
            Kanban Boards ({kanbanCards.length})
          </button>
        </div>

        {/* List of items */}
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
          {activeTab === 'today' && (
            <>
              {filteredTodayTasks.length === 0 ? (
                <div className="py-8 text-center text-ui-rg-xs text-secondaryGray">
                  No active tasks in Today's Queue.
                </div>
              ) : (
                filteredTodayTasks.map((t) => {
                  const isCurrent = activeTaskId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        handleSelect({
                          id: t.id,
                          title: t.title,
                          type: 'task',
                        })
                      }
                      className={cn(
                        'w-full text-left p-3 rounded-card border transition-all flex items-center justify-between group cursor-pointer',
                        isCurrent
                          ? 'bg-accent-indigo/50 border-accent-indigo'
                          : 'bg-surface border-border hover:border-border-hover hover:bg-bg'
                      )}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <p className="text-ui-bold-sm text-primaryDark font-medium truncate">
                          {t.title}
                        </p>
                        {(Boolean(t.subtasks?.length) || Boolean(t.pomodoroCyclesCompleted)) && (
                          <div className="flex items-center gap-2 mt-0.5 text-mono-xs font-mono text-secondaryGray">
                            {t.subtasks && t.subtasks.length > 0 && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {t.subtasks.filter((s) => s.completed).length}/{t.subtasks.length}{' '}
                                steps
                              </span>
                            )}
                            {t.pomodoroCyclesCompleted !== undefined &&
                              t.pomodoroCyclesCompleted > 0 && (
                                <span className="text-accent-mauve">
                                  {t.pomodoroCyclesCompleted} cycles done
                                </span>
                              )}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        {isCurrent ? (
                          <span className="px-2.5 py-0.5 rounded-pill bg-accent-indigo border border-pastel-lavender-border text-indigo-950 text-mono-xs font-mono font-bold">
                            Current
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-secondaryGray group-hover:text-primaryDark opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'inbox' && (
            <>
              {filteredInboxTasks.length === 0 ? (
                <div className="py-8 text-center text-ui-rg-xs text-secondaryGray">
                  No uncompleted tasks in Daily Inbox.
                </div>
              ) : (
                filteredInboxTasks.map((t) => {
                  const isCurrent = activeTaskId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        handleSelect({
                          id: t.id,
                          title: t.title,
                          type: 'task',
                        })
                      }
                      className={cn(
                        'w-full text-left p-3 rounded-card border transition-all flex items-center justify-between group cursor-pointer',
                        isCurrent
                          ? 'bg-accent-indigo/50 border-accent-indigo'
                          : 'bg-surface border-border hover:border-border-hover hover:bg-bg'
                      )}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <p className="text-ui-bold-sm text-primaryDark font-medium truncate">
                          {t.title}
                        </p>
                        <p className="text-mono-xs font-mono text-secondaryGray mt-0.5">
                          Inbox Backlog
                        </p>
                      </div>
                      <div className="shrink-0">
                        {isCurrent ? (
                          <span className="px-2.5 py-0.5 rounded-pill bg-accent-indigo border border-pastel-lavender-border text-indigo-950 text-mono-xs font-mono font-bold">
                            Current
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-secondaryGray group-hover:text-primaryDark opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'kanban' && (
            <>
              {kanbanCards.length === 0 ? (
                <div className="py-8 text-center text-ui-rg-xs text-secondaryGray">
                  No active Kanban cards found.
                </div>
              ) : (
                kanbanCards.map((item) => {
                  const isCurrent = activeTaskId === item.cardId;
                  return (
                    <button
                      key={item.cardId}
                      type="button"
                      onClick={() =>
                        handleSelect({
                          id: item.cardId,
                          title: item.cardTitle,
                          type: 'kanban',
                          boardTitle: item.boardTitle,
                          columnTitle: item.columnTitle,
                        })
                      }
                      className={cn(
                        'w-full text-left p-3 rounded-card border transition-all flex items-center justify-between group cursor-pointer',
                        isCurrent
                          ? 'bg-accent-indigo/50 border-accent-indigo'
                          : 'bg-surface border-border hover:border-border-hover hover:bg-bg'
                      )}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <p className="text-ui-bold-sm text-primaryDark font-medium truncate">
                          {item.cardTitle}
                        </p>
                        <p className="text-mono-xs font-mono text-secondaryGray mt-0.5">
                          {item.boardTitle} · {item.columnTitle}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {isCurrent ? (
                          <span className="px-2.5 py-0.5 rounded-pill bg-accent-indigo border border-pastel-lavender-border text-indigo-950 text-mono-xs font-mono font-bold">
                            Current
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-secondaryGray group-hover:text-primaryDark opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
