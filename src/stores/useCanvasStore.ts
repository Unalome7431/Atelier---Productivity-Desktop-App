import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as xyflowAddEdge,
  reconnectEdge,
  MarkerType,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { CanvasDocument, CanvasViewport } from '@/types';
import { canvasService } from '@/services/canvasService';

export type CanvasToolType = 'select' | 'text' | 'kanban' | 'note' | 'media' | 'section';

export function formatCanvasNodes(rawNodes: any[]): Node[] {
  // Ensure section containers come first so they render underneath cards
  const sorted = [...(rawNodes || [])].sort((a, b) => {
    const aIsSec = a.type === 'section' || a.type === 'group';
    const bIsSec = b.type === 'section' || b.type === 'group';
    if (aIsSec && !bIsSec) return -1;
    if (!aIsSec && bIsSec) return 1;
    return 0;
  });

  return sorted.map((n) => ({
    id: n.id,
    type: n.type || 'simple_text',
    position: n.position || { x: 0, y: 0 },
    width: n.width,
    height: n.height,
    zIndex: n.type === 'section' || n.type === 'group' ? 0 : 10,
    data: n.data || {},
    style: n.style,
  }));
}

export function formatCanvasEdges(rawEdges: any[]): Edge[] {
  return (rawEdges || []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle || null,
    targetHandle: e.targetHandle || null,
    label: e.label,
    type: 'custom',
    data: e.data || {},
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: (e.data?.stroke as string) || '#A5B4FC',
      width: 14,
      height: 14,
    },
  }));
}

interface CanvasState {
  canvases: CanvasDocument[];
  activeCanvasId?: string;
  isLoading: boolean;
  gridEnabled: boolean;
  zoomLevel: number;
  activeTool: CanvasToolType;
  isFullscreen: boolean;
  isConnecting: boolean;

  // Live nodes & edges for the active canvas
  nodes: Node[];
  edges: Edge[];

  loadCanvases: () => Promise<void>;
  setActiveCanvasId: (id: string) => void;
  setGridEnabled: (enabled: boolean) => void;
  setZoomLevel: (zoom: number) => void;
  setActiveTool: (tool: CanvasToolType) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setIsConnecting: (isConnecting: boolean) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onReconnect: (oldEdge: Edge, newConnection: Connection) => void;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  createCanvas: (title?: string) => Promise<string>;
  renameCanvas: (id: string, title: string) => Promise<void>;
  deleteCanvas: (id: string) => Promise<void>;

  updateViewport: (viewport: CanvasViewport) => void;

  addNode: (node: any) => Promise<void>;
  updateNodeData: (nodeId: string, patch: Record<string, any>) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;

  addEdge: (edge: any) => Promise<void>;
  deleteEdge: (edgeId: string) => Promise<void>;
  updateEdgeLabel: (edgeId: string, label: string) => Promise<void>;
}

// Debounce timer maps for node, edge, and viewport autosaves
let saveNodesTimeout: ReturnType<typeof setTimeout> | null = null;
let saveEdgesTimeout: ReturnType<typeof setTimeout> | null = null;
let saveViewportTimeout: ReturnType<typeof setTimeout> | null = null;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvases: [],
  activeCanvasId: undefined,
  isLoading: false,
  gridEnabled: true,
  zoomLevel: 0.95,
  activeTool: 'select',
  isFullscreen: false,
  isConnecting: false,
  nodes: [],
  edges: [],

  loadCanvases: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const canvases = await canvasService.getCanvases();
      const currentActive = get().activeCanvasId;
      const targetActive = canvases.some((c) => c.id === currentActive)
        ? currentActive
        : canvases[0]?.id;

      const activeDoc = canvases.find((c) => c.id === targetActive) || canvases[0];

      set({
        canvases,
        activeCanvasId: targetActive,
        nodes: activeDoc ? formatCanvasNodes(activeDoc.nodes) : [],
        edges: activeDoc ? formatCanvasEdges(activeDoc.edges) : [],
        zoomLevel: activeDoc?.viewport?.zoom || 0.95,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load canvases:', err);
      set({ isLoading: false });
    }
  },

  setActiveCanvasId: (id: string) => {
    const { canvases, activeCanvasId, nodes, edges } = get();
    if (id === activeCanvasId) return;

    // Persist current in-memory nodes/edges to canvases list
    const updatedCanvases = canvases.map((c) =>
      c.id === activeCanvasId ? { ...c, nodes: nodes as any, edges: edges as any } : c
    );

    const target = updatedCanvases.find((c) => c.id === id);
    if (!target) return;

    set({
      activeCanvasId: id,
      canvases: updatedCanvases,
      nodes: formatCanvasNodes(target.nodes),
      edges: formatCanvasEdges(target.edges),
      zoomLevel: target.viewport?.zoom || 0.95,
    });
  },

  setGridEnabled: (enabled: boolean) => {
    set({ gridEnabled: enabled });
  },

  setZoomLevel: (zoom: number) => {
    set({ zoomLevel: zoom });
  },

  setActiveTool: (tool: CanvasToolType) => {
    set({ activeTool: tool });
  },

  setIsFullscreen: (fullscreen: boolean) => {
    set({ isFullscreen: fullscreen });
  },

  setIsConnecting: (isConnecting: boolean) => {
    set({ isConnecting });
  },

  setNodes: (nodes: Node[]) => {
    set({ nodes });
  },

  setEdges: (edges: Edge[]) => {
    set({ edges });
  },

  onNodesChange: (changes: NodeChange[]) => {
    const { nodes, activeCanvasId, canvases } = get();

    // When dragging a section area, dynamically propagate the movement delta to all enclosed/child nodes
    const expandedChanges: NodeChange[] = [...changes];
    const movedChildIds = new Set<string>();

    for (const change of changes) {
      if (change.type === 'position' && change.position && !(change as any).resizing) {
        const secNode = nodes.find(
          (n) => n.id === change.id && (n.type === 'section' || n.type === 'group')
        );

        if (secNode) {
          const dx = change.position.x - secNode.position.x;
          const dy = change.position.y - secNode.position.y;

          if (dx !== 0 || dy !== 0) {
            const secLeft = secNode.position.x;
            const secTop = secNode.position.y;
            const secWidth =
              secNode.width ||
              (secNode as any).measured?.width ||
              (secNode.data as any)?.width ||
              1040;
            const secHeight =
              secNode.height ||
              (secNode as any).measured?.height ||
              (secNode.data as any)?.height ||
              600;
            const secRight = secLeft + secWidth;
            const secBottom = secTop + secHeight;

            for (const child of nodes) {
              if (
                child.id !== secNode.id &&
                child.type !== 'section' &&
                child.type !== 'group' &&
                !movedChildIds.has(child.id) &&
                !changes.some((c) => 'id' in c && c.id === child.id)
              ) {
                const isExplicitChild =
                  (child as any).parentId === secNode.id ||
                  (child.data as any)?.parentId === secNode.id;
                const isInsideBounds =
                  child.position.x >= secLeft - 20 &&
                  child.position.x <= secRight + 20 &&
                  child.position.y >= secTop - 20 &&
                  child.position.y <= secBottom + 20;

                if (isExplicitChild || isInsideBounds) {
                  movedChildIds.add(child.id);
                  expandedChanges.push({
                    id: child.id,
                    type: 'position',
                    position: {
                      x: child.position.x + dx,
                      y: child.position.y + dy,
                    },
                  });
                }
              }
            }
          }
        }
      }
    }

    const updatedNodes = applyNodeChanges(expandedChanges, nodes);

    set({
      nodes: updatedNodes,
      canvases: canvases.map((c) =>
        c.id === activeCanvasId ? { ...c, nodes: updatedNodes as any } : c
      ),
    });

    if (activeCanvasId) {
      if (saveNodesTimeout) clearTimeout(saveNodesTimeout);
      saveNodesTimeout = setTimeout(() => {
        canvasService.saveCanvasNodes(activeCanvasId, updatedNodes).catch((err) => {
          console.error('Debounced node autosave failed:', err);
        });
      }, 600);
    }
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const { edges, activeCanvasId, canvases } = get();
    const updatedEdges = applyEdgeChanges(changes, edges);

    set({
      edges: updatedEdges,
      canvases: canvases.map((c) =>
        c.id === activeCanvasId ? { ...c, edges: updatedEdges as any } : c
      ),
    });

    if (activeCanvasId) {
      if (saveEdgesTimeout) clearTimeout(saveEdgesTimeout);
      saveEdgesTimeout = setTimeout(() => {
        canvasService.saveCanvasEdges(activeCanvasId, updatedEdges).catch((err) => {
          console.error('Debounced edge autosave failed:', err);
        });
      }, 600);
    }
  },

  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const { edges, activeCanvasId, canvases } = get();
    const newEdge: Edge = {
      id: `e_${connection.source}_${connection.target}_${Date.now()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      label: 'depends on',
      type: 'custom',
      data: { stroke: '#A5B4FC' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#A5B4FC',
        width: 14,
        height: 14,
      },
    };

    const updatedEdges = xyflowAddEdge(newEdge, edges);

    set({
      edges: updatedEdges,
      canvases: canvases.map((c) =>
        c.id === activeCanvasId ? { ...c, edges: updatedEdges as any } : c
      ),
    });

    if (activeCanvasId) {
      canvasService.saveCanvasEdges(activeCanvasId, updatedEdges).catch(console.error);
    }
  },

  onReconnect: (oldEdge: Edge, newConnection: Connection) => {
    if (!newConnection.source || !newConnection.target) return;

    const { edges, activeCanvasId, canvases } = get();
    const updatedEdges = reconnectEdge(oldEdge, newConnection, edges, { shouldReplaceId: false });

    set({
      edges: updatedEdges,
      canvases: canvases.map((c) =>
        c.id === activeCanvasId ? { ...c, edges: updatedEdges as any } : c
      ),
      isConnecting: false,
    });

    if (activeCanvasId) {
      canvasService.saveCanvasEdges(activeCanvasId, updatedEdges).catch((err) => {
        console.error('Failed to save reconnected edges:', err);
      });
    }
  },

  createCanvas: async (title?: string) => {
    const count = get().canvases.length;
    const defaultTitle = title || `Canvas ${String.fromCharCode(65 + count)}`;
    const created = await canvasService.createCanvas(defaultTitle);

    set((state) => ({
      canvases: [...state.canvases, created],
      activeCanvasId: created.id,
      nodes: [],
      edges: [],
      zoomLevel: 1,
    }));

    return created.id;
  },

  renameCanvas: async (id: string, title: string) => {
    set((state) => ({
      canvases: state.canvases.map((c) => (c.id === id ? { ...c, title } : c)),
    }));
    await canvasService.renameCanvas(id, title);
  },

  deleteCanvas: async (id: string) => {
    const { canvases, activeCanvasId } = get();
    if (canvases.length <= 1) return;

    const filtered = canvases.filter((c) => c.id !== id);
    const nextActive = activeCanvasId === id ? filtered[0]?.id : activeCanvasId;
    const nextTarget = filtered.find((c) => c.id === nextActive) || filtered[0];

    set({
      canvases: filtered,
      activeCanvasId: nextActive,
      nodes: nextTarget ? formatCanvasNodes(nextTarget.nodes) : [],
      edges: nextTarget ? formatCanvasEdges(nextTarget.edges) : [],
    });

    await canvasService.deleteCanvas(id);
  },

  updateViewport: (viewport: CanvasViewport) => {
    const { activeCanvasId, canvases } = get();
    if (!activeCanvasId) return;

    set({
      zoomLevel: viewport.zoom,
      canvases: canvases.map((c) => (c.id === activeCanvasId ? { ...c, viewport } : c)),
    });

    if (saveViewportTimeout) clearTimeout(saveViewportTimeout);
    saveViewportTimeout = setTimeout(() => {
      canvasService.saveCanvasViewport(activeCanvasId, viewport).catch((err) => {
        console.error('Debounced viewport autosave failed:', err);
      });
    }, 800);
  },

  addNode: async (node: any) => {
    const { activeCanvasId, canvases, nodes } = get();
    if (!activeCanvasId) return;

    const formattedNode: Node = {
      id: node.id || `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: node.type || 'simple_text',
      position: node.position || { x: 300, y: 200 },
      width: node.width,
      height: node.height,
      data: node.data || {},
      style: node.style,
    };

    const updatedNodes = [...nodes, formattedNode];

    set({
      nodes: updatedNodes,
      canvases: canvases.map((c) =>
        c.id === activeCanvasId ? { ...c, nodes: updatedNodes as any } : c
      ),
    });

    await canvasService.saveCanvasNodes(activeCanvasId, updatedNodes);
  },

  updateNodeData: async (nodeId: string, patch: Record<string, any>) => {
    const { activeCanvasId, canvases, nodes } = get();
    if (!activeCanvasId) return;

    const updatedNodes = nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
    );

    set({
      nodes: updatedNodes,
      canvases: canvases.map((c) =>
        c.id === activeCanvasId ? { ...c, nodes: updatedNodes as any } : c
      ),
    });

    await canvasService.saveCanvasNodes(activeCanvasId, updatedNodes);
  },

  deleteNode: async (nodeId: string) => {
    const { activeCanvasId, canvases, nodes, edges } = get();
    if (!activeCanvasId) return;

    const updatedNodes = nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);

    set({
      nodes: updatedNodes,
      edges: updatedEdges,
      canvases: canvases.map((c) =>
        c.id === activeCanvasId
          ? { ...c, nodes: updatedNodes as any, edges: updatedEdges as any }
          : c
      ),
    });

    await canvasService.saveCanvasNodes(activeCanvasId, updatedNodes);
    await canvasService.saveCanvasEdges(activeCanvasId, updatedEdges);
  },

  addEdge: async (edge: any) => {
    const { activeCanvasId, canvases, edges } = get();
    if (!activeCanvasId) return;

    const formattedEdge: Edge = {
      id: edge.id || `edge_${Date.now()}`,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
      label: edge.label,
      type: 'custom',
      data: edge.data || { stroke: '#A5B4FC' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: (edge.data?.stroke as string) || '#A5B4FC',
        width: 14,
        height: 14,
      },
    };

    const updatedEdges = [...edges, formattedEdge];

    set({
      edges: updatedEdges,
      canvases: canvases.map((c) =>
        c.id === activeCanvasId ? { ...c, edges: updatedEdges as any } : c
      ),
    });

    await canvasService.saveCanvasEdges(activeCanvasId, updatedEdges);
  },

  deleteEdge: async (edgeId: string) => {
    const { activeCanvasId, canvases, edges } = get();
    if (!activeCanvasId) return;

    const updatedEdges = edges.filter((e) => e.id !== edgeId);

    set({
      edges: updatedEdges,
      canvases: canvases.map((c) =>
        c.id === activeCanvasId ? { ...c, edges: updatedEdges as any } : c
      ),
    });

    await canvasService.saveCanvasEdges(activeCanvasId, updatedEdges);
  },

  updateEdgeLabel: async (edgeId: string, label: string) => {
    const { activeCanvasId, canvases, edges } = get();
    if (!activeCanvasId) return;

    const updatedEdges = edges.map((e) => (e.id === edgeId ? { ...e, label } : e));

    set({
      edges: updatedEdges,
      canvases: canvases.map((c) =>
        c.id === activeCanvasId ? { ...c, edges: updatedEdges as any } : c
      ),
    });

    await canvasService.saveCanvasEdges(activeCanvasId, updatedEdges);
  },
}));
