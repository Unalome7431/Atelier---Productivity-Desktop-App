import React, { useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Viewport,
  useReactFlow,
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
    setActiveTool,
    addNode,
  } = useCanvasStore();

  const { screenToFlowPosition } = useReactFlow();

  const activeCanvas = useMemo(() => {
    return canvases.find((c) => c.id === activeCanvasId) || canvases[0];
  }, [canvases, activeCanvasId]);

  // Initial load
  useEffect(() => {
    loadCanvases();
  }, [loadCanvases]);

  // Viewport pan/zoom change listener
  const onMoveEnd = useCallback(
    (_event: any, viewport: Viewport) => {
      updateViewport(viewport);
    },
    [updateViewport]
  );

  // Click directly on canvas pane when a tool is active to place a node
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (activeTool === 'select') return;

      let pos = { x: 300, y: 200 };
      try {
        if (typeof screenToFlowPosition === 'function') {
          pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        }
      } catch {
        pos = { x: 300, y: 200 };
      }

      const nodeId = `node_${Date.now()}`;

      if (activeTool === 'text') {
        addNode({
          id: nodeId,
          type: 'simple_text',
          position: pos,
          data: {
            title: 'New Idea',
            content: 'Add your thoughts or diagram notes here.',
            color: '#EEEDFD',
          },
        });
      } else if (activeTool === 'kanban') {
        addNode({
          id: nodeId,
          type: 'kanban',
          position: pos,
          data: {
            title: 'Sprint Deliverables',
            badge: 'KANBAN',
            color: '#DEE5FD',
            items: [
              { id: '1', title: 'Define interface contract', completed: false },
              { id: '2', title: 'Implement local repository', completed: false },
            ],
            completedCount: 0,
            totalCount: 2,
          },
        });
      } else if (activeTool === 'note') {
        addNode({
          id: nodeId,
          type: 'note',
          position: pos,
          data: {
            title: 'Document Reference',
            content: 'Links directly to a Knowledge Note document in Atelier.',
            badge: 'DOC',
            color: '#D1FBE3',
          },
        });
      } else if (activeTool === 'media') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
              const result = uploadEvent.target?.result as string;
              addNode({
                id: nodeId,
                type: 'media',
                position: pos,
                data: { imageUrl: result },
              });
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } else if (activeTool === 'section') {
        addNode({
          id: nodeId,
          type: 'section',
          position: pos,
          width: 550,
          height: 360,
          data: {
            sectionTitle: 'New Area',
            bgColor: 'rgba(245, 241, 232, 0.5)',
          },
        });
      }

      setActiveTool('select');
    },
    [activeTool, screenToFlowPosition, setActiveTool, addNode]
  );

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
