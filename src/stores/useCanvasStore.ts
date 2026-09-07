import { create } from 'zustand';
import { CanvasDocument } from '@/types';
import { canvasService } from '@/services/canvasService';

interface CanvasState {
  canvases: CanvasDocument[];
  activeCanvasId?: string;
  isLoading: boolean;
  loadCanvases: () => Promise<void>;
  updateNodes: (nodes: any[]) => Promise<void>;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvases: [],
  activeCanvasId: undefined,
  isLoading: false,

  loadCanvases: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const canvases = await canvasService.getCanvases();
      set({
        canvases,
        activeCanvasId: canvases[0]?.id,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load canvases:', err);
      set({ isLoading: false });
    }
  },

  updateNodes: async (nodes: any[]) => {
    const { activeCanvasId, canvases } = get();
    if (!activeCanvasId) return;

    set({
      canvases: canvases.map((c) =>
        c.id === activeCanvasId ? { ...c, nodes } : c
      ),
    });

    await canvasService.saveCanvasNodes(activeCanvasId, nodes);
  },
}));
