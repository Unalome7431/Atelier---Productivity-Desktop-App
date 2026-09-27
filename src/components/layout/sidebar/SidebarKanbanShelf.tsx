import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { useAppStore } from '@/stores/useAppStore';
import { NewBoardModal } from '@/components/kanban/NewBoardModal';
import { cn } from '@/lib/utils';

export const SidebarKanbanShelf: React.FC = () => {
  const { setActiveTab } = useAppStore();
  const { boards, activeBoardId, setActiveBoardId, createBoard, renameBoard, deleteBoard } =
    useKanbanStore();

  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null);
  const [renameBoardInput, setRenameBoardInput] = useState('');
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);

  const startRenameBoard = (id: string, currentTitle: string) => {
    setRenamingBoardId(id);
    setRenameBoardInput(currentTitle);
  };

  const handleFinishRenameBoard = (id: string) => {
    if (renameBoardInput.trim()) {
      renameBoard(id, renameBoardInput.trim());
    }
    setRenamingBoardId(null);
  };

  const handleCreateBoardSubmit = async (title: string, colorTag: string) => {
    const newBoardId = await createBoard(title, colorTag);
    setActiveBoardId(newBoardId);
    setActiveTab('kanban');
  };

  return (
    <div className="flex flex-col gap-1.5 pt-3 border-t border-border/60">
      <div className="flex items-center justify-between px-2">
        <span className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider">
          Kanban Board
        </span>
        <button
          onClick={() => setIsNewBoardModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white hover:bg-surface text-primaryDark border border-border-hover shadow-2xs text-[10px] font-semibold transition-colors cursor-pointer"
          title="Create new project board"
        >
          <Plus className="w-2.5 h-2.5" />
          <span>New board</span>
        </button>
      </div>

      <div className="bg-surface-warm/80 rounded-2xl p-1.5 border border-border/70 flex flex-col gap-1 max-h-44 overflow-y-auto">
        {boards.map((b) => {
          const isBoardActive = activeBoardId === b.id;
          const bgTint = b.colorTag || '#EEEDFD';
          const dotColor = b.colorTag || '#818CF8';

          return (
            <div
              key={b.id}
              onClick={() => {
                setActiveBoardId(b.id);
                setActiveTab('kanban');
              }}
              style={{
                backgroundColor: isBoardActive ? bgTint : 'transparent',
              }}
              className={cn(
                'group/board flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-sans transition-all cursor-pointer select-none',
                isBoardActive
                  ? 'text-primaryDark font-semibold shadow-xs'
                  : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                {renamingBoardId === b.id ? (
                  <input
                    type="text"
                    value={renameBoardInput}
                    onChange={(e) => setRenameBoardInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRenameBoard(b.id);
                      if (e.key === 'Escape') setRenamingBoardId(null);
                    }}
                    onBlur={() => handleFinishRenameBoard(b.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white px-1 py-0.5 rounded text-xs outline-none w-24 border border-border"
                    autoFocus
                  />
                ) : (
                  <span className="truncate">{b.title}</span>
                )}
              </div>

              <div className="opacity-0 group-hover/board:opacity-100 flex items-center gap-0.5 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRenameBoard(b.id, b.title);
                  }}
                  className="p-1 hover:text-primaryDark text-secondaryGray/70 rounded cursor-pointer"
                  title="Rename board"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
                {boards.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBoard(b.id);
                    }}
                    className="p-1 hover:text-rose-600 text-secondaryGray/70 rounded cursor-pointer"
                    title="Delete board"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <NewBoardModal
        isOpen={isNewBoardModalOpen}
        onClose={() => setIsNewBoardModalOpen(false)}
        onCreate={handleCreateBoardSubmit}
      />
    </div>
  );
};
