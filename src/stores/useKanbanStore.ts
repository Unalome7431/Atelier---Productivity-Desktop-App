import { create } from 'zustand';
import {
  KanbanBoard,
  KanbanCard,
  KanbanColumn,
  KanbanChecklistItem,
  DomainTagOption,
} from '@/types';
import { kanbanService } from '@/services/kanbanService';
import { getUniqueTitle } from '@/lib/utils';

const DEFAULT_DOMAIN_TAGS: DomainTagOption[] = [];

function loadStoredCustomTags(): DomainTagOption[] {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('atelier_kanban_custom_tags');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const legacyDefaults = new Set([
            'docs',
            'design',
            'engineering',
            'research',
            'qa',
            'content',
            'backend',
          ]);
          return parsed.filter(
            (t: any) => t && t.label && !legacyDefaults.has(String(t.label).toLowerCase())
          );
        }
      }
    } catch {
      // ignore
    }
  }
  return DEFAULT_DOMAIN_TAGS;
}

interface KanbanState {
  boards: KanbanBoard[];
  activeBoardId?: string;
  isLoading: boolean;
  selectedCardId: string | null;
  isDrawerOpen: boolean;
  searchQuery: string;
  selectedTagFilter: string | null;
  customTags: DomainTagOption[];

  // Board operations
  loadBoards: () => Promise<void>;
  setActiveBoardId: (boardId: string) => void;
  createBoard: (title?: string, colorTag?: string) => Promise<string>;
  renameBoard: (boardId: string, title: string) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;

  // Column operations
  addColumn: (boardId: string, title: string, themeId?: string) => Promise<KanbanColumn>;
  reorderColumns: (boardId: string, orderedColumnIds: string[]) => Promise<void>;
  renameColumn: (boardId: string, columnId: string, newTitle: string) => Promise<void>;
  deleteColumn: (boardId: string, columnId: string, fallbackColumnId?: string) => Promise<void>;

  // Card operations
  addCard: (
    boardIdOrParams:
      | string
      | {
          boardId: string;
          columnId: string;
          title: string;
          description?: string;
          tagLabel?: string;
          tagColor?: string;
          dueDate?: string;
          checklist?: KanbanChecklistItem[];
        },
    columnId?: string,
    title?: string,
    tag?: string
  ) => Promise<KanbanCard>;
  updateCard: (cardId: string, updates: Partial<KanbanCard>) => Promise<void>;
  moveCard: (cardId: string, targetColumnId: string, newRank?: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;

  // Detail drawer
  openCardDrawer: (cardId: string) => void;
  closeCardDrawer: () => void;

  // Checklist operations
  toggleChecklistItem: (cardId: string, itemId: string) => Promise<void>;
  addChecklistItem: (cardId: string, title: string) => Promise<void>;
  deleteChecklistItem: (cardId: string, itemId: string) => Promise<void>;

  // Cockpit bridge
  sendToTodayQueue: (cardId: string) => Promise<{ taskId: string; taskTitle: string }>;

  // Domain tags
  createCustomTag: (label: string, color?: string) => DomainTagOption;
  deleteCustomTag: (label: string) => void;
  getAvailableTags: () => DomainTagOption[];

  // Filters & search
  setSearchQuery: (query: string) => void;
  setSelectedTagFilter: (tag: string | null) => void;
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  boards: [],
  activeBoardId: undefined,
  isLoading: false,
  selectedCardId: null,
  isDrawerOpen: false,
  searchQuery: '',
  selectedTagFilter: null,
  customTags: loadStoredCustomTags(),

  loadBoards: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const boards = await kanbanService.getBoards();
      const currentActive = get().activeBoardId;
      const validActiveId =
        currentActive && boards.some((b) => b.id === currentActive) ? currentActive : boards[0]?.id;

      set({
        boards,
        activeBoardId: validActiveId,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load kanban boards:', err);
      set({ isLoading: false });
    }
  },

  setActiveBoardId: (boardId: string) => {
    set({ activeBoardId: boardId });
  },

  createBoard: async (title = 'New Project Board', colorTag = '#EEEDFD') => {
    const existingTitles = get().boards.map((b) => b.title);
    const uniqueTitle = getUniqueTitle(title, existingTitles);

    const newBoard = await kanbanService.createBoard(uniqueTitle, colorTag);
    set((state) => ({
      boards: [...state.boards, newBoard],
      activeBoardId: newBoard.id,
    }));
    return newBoard.id;
  },

  renameBoard: async (boardId: string, title: string) => {
    const otherTitles = get()
      .boards.filter((b) => b.id !== boardId)
      .map((b) => b.title);
    const uniqueTitle = getUniqueTitle(title, otherTitles);

    set((state) => ({
      boards: state.boards.map((b) => (b.id === boardId ? { ...b, title: uniqueTitle } : b)),
    }));
    await kanbanService.renameBoard(boardId, uniqueTitle);
  },

  deleteBoard: async (boardId: string) => {
    const state = get();
    if (state.boards.length <= 1) {
      throw new Error('Cannot delete the only remaining board.');
    }
    const remainingBoards = state.boards.filter((b) => b.id !== boardId);
    const nextActiveId =
      state.activeBoardId === boardId ? remainingBoards[0]?.id : state.activeBoardId;

    set({
      boards: remainingBoards,
      activeBoardId: nextActiveId,
      selectedCardId: null,
      isDrawerOpen: false,
    });
    await kanbanService.deleteBoard(boardId);
  },

  addColumn: async (boardId: string, title: string, themeId?: string) => {
    const newCol = await kanbanService.addColumn(boardId, title, themeId);
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId ? { ...b, columns: [...(b.columns || []), newCol] } : b
      ),
    }));
    return newCol;
  },

  reorderColumns: async (boardId: string, orderedColumnIds: string[]) => {
    set((state) => ({
      boards: state.boards.map((b) => {
        if (b.id !== boardId) return b;
        const colMap = new Map((b.columns || []).map((c) => [c.id, c]));
        const newCols: KanbanColumn[] = [];
        orderedColumnIds.forEach((id, idx) => {
          const col = colMap.get(id);
          if (col) {
            newCols.push({ ...col, orderIndex: idx });
            colMap.delete(id);
          }
        });
        colMap.forEach((col) => newCols.push({ ...col, orderIndex: newCols.length }));
        return { ...b, columns: newCols };
      }),
    }));
    await kanbanService.reorderColumns(boardId, orderedColumnIds);
  },

  renameColumn: async (boardId: string, columnId: string, newTitle: string) => {
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              columns: (b.columns || []).map((c) =>
                c.id === columnId ? { ...c, title: newTitle.trim() } : c
              ),
            }
          : b
      ),
    }));
    await kanbanService.renameColumn(boardId, columnId, newTitle);
  },

  deleteColumn: async (boardId: string, columnId: string, fallbackColumnId?: string) => {
    const activeBoard = get().boards.find((b) => b.id === boardId);
    if (!activeBoard || (activeBoard.columns || []).length <= 1) {
      throw new Error('A board must have at least one column.');
    }

    const remainingCols = (activeBoard.columns || []).filter((c) => c.id !== columnId);
    const targetFallback =
      fallbackColumnId && remainingCols.some((c) => c.id === fallbackColumnId)
        ? fallbackColumnId
        : remainingCols[0]?.id || 'planned';

    set((state) => ({
      boards: state.boards.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          columns: (b.columns || []).filter((c) => c.id !== columnId),
          cards: (b.cards || []).map((card) =>
            card.columnId === columnId ? { ...card, columnId: targetFallback } : card
          ),
        };
      }),
    }));

    await kanbanService.deleteColumn(boardId, columnId, fallbackColumnId);
  },

  addCard: async (boardIdOrParams, columnIdArg, titleArg, tagArg) => {
    const newCard = await kanbanService.addCard(boardIdOrParams, columnIdArg, titleArg, tagArg);
    const targetBoardId =
      typeof boardIdOrParams === 'object' ? boardIdOrParams.boardId : boardIdOrParams;

    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === targetBoardId ? { ...b, cards: [...(b.cards || []), newCard] } : b
      ),
    }));
    return newCard;
  },

  updateCard: async (cardId: string, updates: Partial<KanbanCard>) => {
    set((state) => ({
      boards: state.boards.map((b) => ({
        ...b,
        cards: b.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
      })),
    }));
    await kanbanService.updateCard(cardId, updates);
  },

  moveCard: async (cardId: string, targetColumnId: string, newRank?: string) => {
    const isDone = targetColumnId === 'done' || targetColumnId === 'complete';
    set((state) => ({
      boards: state.boards.map((b) => ({
        ...b,
        cards: b.cards.map((c) => {
          if (c.id === cardId) {
            return {
              ...c,
              columnId: targetColumnId,
              positionRank: newRank || c.positionRank,
              orderIndex: newRank ? parseFloat(newRank) : c.orderIndex,
              completedAt: isDone ? 'Completed today' : undefined,
            };
          }
          return c;
        }),
      })),
    }));
    await kanbanService.moveCard(cardId, targetColumnId, newRank);
  },

  deleteCard: async (cardId: string) => {
    set((state) => ({
      boards: state.boards.map((b) => ({
        ...b,
        cards: b.cards.filter((c) => c.id !== cardId),
      })),
      selectedCardId: state.selectedCardId === cardId ? null : state.selectedCardId,
      isDrawerOpen: state.selectedCardId === cardId ? false : state.isDrawerOpen,
    }));
    await kanbanService.deleteCard(cardId);
  },

  openCardDrawer: (cardId: string) => {
    set({ selectedCardId: cardId, isDrawerOpen: true });
  },

  closeCardDrawer: () => {
    set({ selectedCardId: null, isDrawerOpen: false });
  },

  toggleChecklistItem: async (cardId: string, itemId: string) => {
    set((state) => ({
      boards: state.boards.map((b) => ({
        ...b,
        cards: b.cards.map((c) => {
          if (c.id === cardId && c.checklist) {
            const updated = c.checklist.map((it) =>
              it.id === itemId ? { ...it, completed: !it.completed } : it
            );
            return { ...c, checklist: updated };
          }
          return c;
        }),
      })),
    }));
    await kanbanService.toggleChecklistItem(cardId, itemId);
  },

  addChecklistItem: async (cardId: string, title: string) => {
    await kanbanService.addChecklistItem(cardId, title);
    // Reload active board to get fresh checklist state
    const boards = await kanbanService.fetchBoards();
    set({ boards });
  },

  deleteChecklistItem: async (cardId: string, itemId: string) => {
    set((state) => ({
      boards: state.boards.map((b) => ({
        ...b,
        cards: b.cards.map((c) => {
          if (c.id === cardId && c.checklist) {
            return { ...c, checklist: c.checklist.filter((it) => it.id !== itemId) };
          }
          return c;
        }),
      })),
    }));
    await kanbanService.deleteChecklistItem(cardId, itemId);
  },

  sendToTodayQueue: async (cardId: string) => {
    return await kanbanService.sendToTodayQueue(cardId);
  },

  createCustomTag: (label: string, color?: string) => {
    const trimmed = label.trim();
    if (!trimmed) return { label: '', color: 'mint' };

    const current = get().customTags;
    const existing = current.find((t) => t.label.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (color && existing.color !== color) {
        const updated = current.map((t) =>
          t.label.toLowerCase() === trimmed.toLowerCase() ? { ...t, color } : t
        );
        set({ customTags: updated });
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('atelier_kanban_custom_tags', JSON.stringify(updated));
        }
      }
      return existing;
    }

    const newTag: DomainTagOption = { label: trimmed, color: color || 'mint' };
    const nextList = [...current, newTag];
    set({ customTags: nextList });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('atelier_kanban_custom_tags', JSON.stringify(nextList));
    }
    return newTag;
  },

  deleteCustomTag: (label: string) => {
    const nextList = get().customTags.filter((t) => t.label.toLowerCase() !== label.toLowerCase());
    set({ customTags: nextList });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('atelier_kanban_custom_tags', JSON.stringify(nextList));
    }
  },

  getAvailableTags: () => {
    return get().customTags;
  },

  setSearchQuery: (searchQuery: string) => {
    set({ searchQuery });
  },

  setSelectedTagFilter: (selectedTagFilter: string | null) => {
    set({ selectedTagFilter });
  },
}));
