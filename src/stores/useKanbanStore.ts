import { create } from 'zustand';
import { KanbanBoard } from '@/types';
import { kanbanService } from '@/services/kanbanService';

interface KanbanState {
  boards: KanbanBoard[];
  activeBoardId?: string;
  isLoading: boolean;
  loadBoards: () => Promise<void>;
  moveCard: (cardId: string, targetColumnId: string) => Promise<void>;
  addCard: (boardId: string, columnId: string, title: string, tag?: string) => Promise<void>;
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  boards: [],
  activeBoardId: undefined,
  isLoading: false,

  loadBoards: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const boards = await kanbanService.getBoards();
      set({
        boards,
        activeBoardId: boards[0]?.id,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load kanban boards:', err);
      set({ isLoading: false });
    }
  },

  moveCard: async (cardId: string, targetColumnId: string) => {
    set((state) => ({
      boards: state.boards.map((b) => ({
        ...b,
        cards: b.cards.map((c) => (c.id === cardId ? { ...c, columnId: targetColumnId } : c)),
      })),
    }));
    await kanbanService.moveCard(cardId, targetColumnId);
  },

  addCard: async (boardId: string, columnId: string, title: string, tag?: string) => {
    const newCard = await kanbanService.addCard(boardId, columnId, title, tag);
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId ? { ...b, cards: [...b.cards, newCard] } : b
      ),
    }));
  },
}));
