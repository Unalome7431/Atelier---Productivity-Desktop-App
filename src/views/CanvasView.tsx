import React, { useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Viewport,
  Node,
} from '@xyflow/react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { SimpleTextNode } from '@/components/canvas/SimpleTextNode';
import { KanbanNode } from '@/components/canvas/KanbanNode';
import { NoteNode } from '@/components/canvas/NoteNode';
import { MediaNode } from '@/components/canvas/MediaNode';
import { SectionNode } from '@/components/canvas/SectionNode';
import { CustomEdge } from '@/components/canvas/CustomEdge';
import { CanvasHeader } from '@/components/canvas/CanvasHeader';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { CanvasLinkedDrawer } from '@/components/canvas/CanvasLinkedDrawer';
import { useNotesStore } from '@/stores/useNotesStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { cn } from '@/lib/utils';

const CanvasFlowInner: React.FC = () => {
  const {
    canvases,
    activeCanvasId,
    loadCanvases,
    gridEnabled,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    setIsConnecting,
    updateViewport,
    isFullscreen,
    activeTool,
    setActiveSidebarNode,
  } = useCanvasStore();

  const activeCanvas = useMemo(() => {
    return canvases.find((c) => c.id === activeCanvasId) || canvases[0];
  }, [canvases, activeCanvasId]);

  // Initial load: ensure canvases, notes, and boards are ready in memory
  useEffect(() => {
    loadCanvases();
    useNotesStore.getState().loadNotes();
    useKanbanStore.getState().loadBoards();
  }, [loadCanvases]);

  // Viewport pan/zoom change listener
  const onMoveEnd = useCallback(
    (_event: any, viewport: Viewport) => {
      updateViewport(viewport);
    },
    [updateViewport]
  );

  // Pane click: deselect and close sidebars without spawning nodes
  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains('react-flow__pane')) {
        setActiveSidebarNode(null);
      }
    },
    [setActiveSidebarNode]
  );

  // Node drag stop: when a non-section node is dragged into or out of a section, update its section attachment
  const onNodeDragStop = useCallback((_event: MouseEvent | TouchEvent, node: Node) => {
    if (node.type === 'section' || node.type === 'group') return;
    const { nodes, updateNodeData } = useCanvasStore.getState();
    const sections = nodes.filter((n) => n.type === 'section' || n.type === 'group');
    let targetSectionId: string | undefined = undefined;

    for (const sec of sections) {
      const secLeft = sec.position.x;
      const secTop = sec.position.y;
      const secWidth =
        sec.width || (sec as any).measured?.width || (sec.data as any)?.width || 1040;
      const secHeight =
        sec.height || (sec as any).measured?.height || (sec.data as any)?.height || 600;

      const nodeW = node.width || (node as any).measured?.width || 260;
      const nodeH = node.height || (node as any).measured?.height || 160;
      const centerX = node.position.x + nodeW / 2;
      const centerY = node.position.y + nodeH / 2;

      const isInside =
        (node.position.x >= secLeft &&
          node.position.x <= secLeft + secWidth &&
          node.position.y >= secTop &&
          node.position.y <= secTop + secHeight) ||
        (centerX >= secLeft &&
          centerX <= secLeft + secWidth &&
          centerY >= secTop &&
          centerY <= secTop + secHeight);

      if (isInside) {
        targetSectionId = sec.id;
        break;
      }
    }

    const currentSectionId = (node.data as any)?.sectionId || (node.data as any)?.parentId;
    if (currentSectionId !== targetSectionId) {
      updateNodeData(node.id, {
        sectionId: targetSectionId,
        parentId: targetSectionId,
      });
    }
  }, []);

  // Memoized custom node types map
  const nodeTypes = useMemo(
    () => ({
      simple_text: SimpleTextNode,
      text: SimpleTextNode,
      kanban: KanbanNode,
      note: NoteNode,
      media: MediaNode,
      section: SectionNode,
      group: SectionNode,
    }),
    []
  );

  // Memoized custom edge types map
  const edgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
      default: CustomEdge,
    }),
    []
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-bg relative overflow-hidden p-3.5 select-none">
      {/* Outer Board Frame matching Figma */}
      <div
        className={cn(
          'flex-1 w-full h-full bg-white rounded-3xl border border-border shadow-subtle relative overflow-hidden flex flex-col transition-all duration-200',
          isFullscreen && 'fixed inset-0 z-50 rounded-none border-none p-0'
        )}
      >
        {/* Canvas Header Controls */}
        <CanvasHeader />

        {/* Floating Tool Palette */}
        <CanvasToolbar />

        {/* Core React Flow Viewport */}
        <div className="flex-1 w-full h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onReconnectStart={() => setIsConnecting(true)}
            onReconnectEnd={() => setIsConnecting(false)}
            onConnectStart={() => setIsConnecting(true)}
            onConnectEnd={() => setIsConnecting(false)}
            edgesReconnectable={true}
            reconnectRadius={40}
            onMoveEnd={onMoveEnd}
            onPaneClick={onPaneClick}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={(_event, node) => {
              if (node.type === 'note') {
                setActiveSidebarNode({ type: 'note', nodeId: node.id });
              } else if (node.type === 'kanban') {
                setActiveSidebarNode({ type: 'kanban', nodeId: node.id });
              }
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            minZoom={0.1}
            maxZoom={2.0}
            defaultViewport={activeCanvas?.viewport || { x: 80, y: 50, zoom: 0.95 }}
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            className={cn('bg-transparent', activeTool !== 'select' && 'cursor-crosshair')}
          >
            {gridEnabled && (
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1.5}
                color="#D6CFC3"
                className="opacity-70"
              />
            )}
          </ReactFlow>
        </div>

        {/* Linked Node Inspector Drawer (for Note & Kanban) */}
        <CanvasLinkedDrawer />
      </div>
    </div>
  );
};

export const CanvasView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner />
    </ReactFlowProvider>
  );
};

export default CanvasView;
