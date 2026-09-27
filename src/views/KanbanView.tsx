import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Filter, Check, Layers, Search, X } from 'lucide-react';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useAppStore } from '@/stores/useAppStore';
import { KanbanColumnLane } from '@/components/kanban/KanbanColumnLane';
import { KanbanCardDrawer } from '@/components/kanban/KanbanCardDrawer';
import { NewCardModal } from '@/components/kanban/NewCardModal';
import { AddColumnModal } from '@/components/kanban/AddColumnModal';
import { getTagStyle } from '@/lib/tagStyles';
import { cn } from '@/lib/utils';

export const KanbanView: React.FC = () => {
  const {
    boards,
    activeBoardId,
    loadBoards,
    moveCard,
    addCard,
    addColumn,
    renameColumn,
    deleteColumn,
    selectedCardId,
    isDrawerOpen,
    openCardDrawer,
    closeCardDrawer,
    sendToTodayQueue,
    searchQuery,
    setSearchQuery,
    selectedTagFilter,
    setSelectedTagFilter,
    getAvailableTags,
  } = useKanbanStore();

  const { setActiveCanvasId } = useCanvasStore();
  const { setActiveTab } = useAppStore();

  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState('planned');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];

  const handleOpenAddCard = (colId: string) => {
    setTargetColumnId(colId);
    setIsNewCardModalOpen(true);
  };

  const handleCreateCardSubmit = async (data: {
    boardId: string;
    columnId: string;
    title: string;
    description: string;
    tagLabel?: string;
    tagColor?: string;
    dueDate?: string;
  }) => {
    try {
      await addCard({
        boardId: data.boardId,
        columnId: data.columnId,
        title: data.title,
        description: data.description,
        tagLabel: data.tagLabel,
        tagColor: data.tagColor,
        dueDate: data.dueDate,
      });
      setToastMessage(`Added card "${data.title}"`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error('Failed to add card:', err);
      setToastMessage(`Failed to add card: ${msg}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleSendToToday = async (cardId: string, title: string) => {
    try {
      await sendToTodayQueue(cardId);
      setToastMessage(`Sent "${title}" to Today's Queue!`);
    } catch (err) {
      console.error('Failed to send card to today queue:', err);
    } finally {
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleMoveCard = async (cardId: string, targetColumnId: string, newRank: string) => {
    await moveCard(cardId, targetColumnId, newRank);
  };

  const handleAddColumnSubmit = async (title: string, themeId: string) => {
    if (!activeBoard) return;
    try {
      const newCol = await addColumn(activeBoard.id, title, themeId);
      setToastMessage(`Created column "${newCol.title}"`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error('Failed to add column:', err);
      setToastMessage(`Failed to create column: ${msg}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleRenameColumn = async (columnId: string, newTitle: string) => {
    if (!activeBoard) return;
    await renameColumn(activeBoard.id, columnId, newTitle);
    setToastMessage(`Renamed column to "${newTitle}"`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!activeBoard) return;
    const colToDelete = activeBoard.columns.find((c) => c.id === columnId);
    await deleteColumn(activeBoard.id, columnId);
    setToastMessage(`Deleted column "${colToDelete?.title || ''}"`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleJumpToCanvas = (canvasId?: string) => {
    if (canvasId) {
      setActiveCanvasId(canvasId);
    }
    setActiveTab('canvas');
  };

  // Filtered cards per column based on searchQuery & selectedTagFilter
  const filteredCardsByColumn = useMemo(() => {
    if (!activeBoard) return {};
    const map: Record<string, typeof activeBoard.cards> = {};

    activeBoard.columns.forEach((col) => {
      let cards = (activeBoard.cards || []).filter(
        (c) =>
          c.columnId === col.id ||
          ((col.id === 'done' || col.id === 'complete') &&
            (c.columnId === 'done' || c.columnId === 'complete'))
      );

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        cards = cards.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            (c.description && c.description.toLowerCase().includes(q)) ||
            (c.tagLabel && c.tagLabel.toLowerCase().includes(q))
        );
      }

      if (selectedTagFilter) {
        cards = cards.filter(
          (c) => c.tagLabel && c.tagLabel.toLowerCase() === selectedTagFilter.toLowerCase()
        );
      }

      map[col.id] = cards;
    });

    return map;
  }, [activeBoard, searchQuery, selectedTagFilter]);

  if (!activeBoard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-bg h-full select-none">
        <div className="w-12 h-12 rounded-2xl bg-accent-blue flex items-center justify-center text-sky-800 shadow-xs">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="font-display font-bold text-display-3 text-primaryDark">No Boards Yet</h3>
        <p className="font-sans text-xs text-secondaryGray max-w-sm text-center">
          Create your first Kanban board to organize sprints, tasks, and project deliverables.
        </p>
        <button
          onClick={() => {
            useKanbanStore.getState().createBoard('Project Board', '#EEEDFD');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-full bg-primaryDark hover:opacity-90 text-white font-sans font-semibold text-xs transition-all cursor-pointer shadow-2xs hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Create Board</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto p-8 flex flex-col gap-6 bg-bg h-full select-none">
      {/* Workspace Header & Actions (Figma Style) */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Project Title & Linked Canvas Chip */}
        <div className="flex items-center gap-3.5">
          <h1 className="font-display font-bold text-[28px] leading-tight text-primaryDark">
            {activeBoard.title}
          </h1>

          {/* Linked Canvas Pill Badge */}
          {activeBoard.linkedCanvasTitle && (
            <button
              onClick={() => handleJumpToCanvas(activeBoard.linkedCanvasId)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEDFD] hover:bg-[#E0DEFC] text-[#4338CA] border border-[#D5CEF5] font-mono text-[11px] font-bold tracking-wider transition-all cursor-pointer hover:scale-105 shadow-2xs"
              title={`Jump to linked spatial canvas: ${activeBoard.linkedCanvasTitle}`}
            >
              <Layers className="w-3 h-3 text-[#4338CA]" />
              <span>{activeBoard.linkedCanvasTitle}</span>
            </button>
          )}
        </div>

        {/* Right: Filter Button & New Card Button */}
        <div className="flex items-center gap-3">
          {/* Filter Popover Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-sans text-xs font-semibold border transition-all cursor-pointer shadow-2xs',
                selectedTagFilter || searchQuery || isFilterOpen
                  ? 'bg-primaryDark text-white font-bold'
                  : 'bg-white hover:bg-surface text-primaryDark border-border-hover'
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
              {(selectedTagFilter || searchQuery) && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
              )}
            </button>

            {/* Filter Dropdown Popover */}
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl shadow-modal border border-border p-4 z-40 animate-fade-in flex flex-col gap-3 font-sans text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="font-mono text-mono-xs font-bold text-midGray uppercase">
                      Filter Cards
                    </span>
                    {(selectedTagFilter || searchQuery) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedTagFilter(null);
                        }}
                        className="text-[11px] font-mono text-rose-600 hover:underline cursor-pointer"
                      >
                        Reset All
                      </button>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-secondaryGray absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title, notes, tags..."
                      className="w-full bg-surface border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-primaryDark outline-none focus:border-primaryDark"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-secondaryGray hover:text-primaryDark"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Domain Tag Filters */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-mono-xs text-secondaryGray">Domain Tag</span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                      <button
                        onClick={() => setSelectedTagFilter(null)}
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[11px] border transition-colors cursor-pointer',
                          !selectedTagFilter
                            ? 'bg-primaryDark text-white border-primaryDark font-medium'
                            : 'bg-surface text-secondaryGray hover:text-primaryDark border-border'
                        )}
                      >
                        All
                      </button>
                      {getAvailableTags().map((tag) => {
                        const isSelected =
                          selectedTagFilter?.toLowerCase() === tag.label.toLowerCase();
                        return (
                          <button
                            key={tag.label}
                            onClick={() => setSelectedTagFilter(isSelected ? null : tag.label)}
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[11px] border transition-colors cursor-pointer',
                              isSelected
                                ? cn('font-semibold shadow-2xs', getTagStyle(tag.label, tag.color))
                                : 'bg-surface text-secondaryGray hover:text-primaryDark border-border'
                            )}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* + Add Column Button */}
          <button
            onClick={() => setIsAddColumnModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-surface text-primaryDark border border-border-hover font-sans font-semibold text-xs transition-all cursor-pointer shadow-2xs"
            title="Create custom workflow column"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add column</span>
          </button>

          {/* + New Card Button (High-affordance Mint Pill) */}
          <button
            onClick={() => handleOpenAddCard(activeBoard.columns[0]?.id || 'planned')}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primaryDark hover:opacity-90 text-white border border-transparent font-sans font-semibold text-xs transition-all cursor-pointer shadow-2xs hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>New card</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-accent-green border border-emerald-300 text-emerald-950 px-4 py-2 rounded-xl text-ui-rg-xs font-mono font-semibold flex items-center gap-2 shadow-sm animate-fade-in self-start">
          <Check className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Horizontal Columns Lane Grid */}
      <div className="flex gap-6 items-start flex-1 min-h-0 overflow-x-auto pb-4">
        {activeBoard.columns.map((column) => (
          <KanbanColumnLane
            key={column.id}
            column={column}
            cards={filteredCardsByColumn[column.id] || []}
            boardTitle={activeBoard.title}
            canDeleteColumn={activeBoard.columns.length > 1}
            onOpenAddCard={handleOpenAddCard}
            onOpenDrawer={openCardDrawer}
            onSendToToday={handleSendToToday}
            onMoveCard={handleMoveCard}
            onRenameColumn={handleRenameColumn}
            onDeleteColumn={handleDeleteColumn}
          />
        ))}

        {/* Add Column Lane Placeholder Card */}
        <button
          onClick={() => setIsAddColumnModalOpen(true)}
          className="w-[360px] min-w-[360px] max-w-[380px] h-36 rounded-3xl border-2 border-dashed border-border/80 hover:border-primaryDark/40 bg-surface/30 hover:bg-surface/70 p-5 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer group flex-shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-white group-hover:bg-primaryDark group-hover:text-white text-secondaryGray flex items-center justify-center border border-border shadow-2xs transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-xs text-secondaryGray group-hover:text-primaryDark transition-colors">
            Add New Column
          </span>
        </button>
      </div>

      {/* New Kanban Card Modal */}
      <NewCardModal
        isOpen={isNewCardModalOpen}
        onClose={() => setIsNewCardModalOpen(false)}
        board={activeBoard}
        targetColumnId={targetColumnId}
        onCreate={handleCreateCardSubmit}
      />

      {/* Add Custom Column Modal */}
      <AddColumnModal
        isOpen={isAddColumnModalOpen}
        onClose={() => setIsAddColumnModalOpen(false)}
        boardTitle={activeBoard.title}
        onAddColumn={handleAddColumnSubmit}
      />

      {/* Slide-Over Card Detail Drawer */}
      <KanbanCardDrawer
        cardId={selectedCardId}
        board={activeBoard}
        isOpen={isDrawerOpen}
        onClose={closeCardDrawer}
        onSendToToday={handleSendToToday}
      />
    </div>
  );
};
