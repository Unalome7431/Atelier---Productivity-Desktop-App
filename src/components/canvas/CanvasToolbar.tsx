import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { Type, CheckSquare, FileEdit, Image as ImageIcon, SquareDashed } from 'lucide-react';
import { useCanvasStore, CanvasToolType } from '@/stores/useCanvasStore';
import { cn } from '@/lib/utils';

export const CanvasToolbar: React.FC = () => {
  const { screenToFlowPosition } = useReactFlow();
  const { activeTool, setActiveTool, addNode } = useCanvasStore();

  const handleToolClick = (tool: CanvasToolType) => {
    setActiveTool(tool);

    let centerFlow = { x: 350, y: 240 };
    try {
      if (typeof screenToFlowPosition === 'function') {
        const computed = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        if (computed && !isNaN(computed.x) && !isNaN(computed.y)) {
          centerFlow = {
            x: computed.x - 100 + (Math.random() - 0.5) * 40,
            y: computed.y - 60 + (Math.random() - 0.5) * 40,
          };
        }
      }
    } catch {
      centerFlow = { x: 350 + (Math.random() - 0.5) * 50, y: 240 + (Math.random() - 0.5) * 50 };
    }

    const nodeId = `node_${Date.now()}`;

    if (tool === 'text') {
      addNode({
        id: nodeId,
        type: 'simple_text',
        position: centerFlow,
        data: {
          title: 'Idea Note',
          content: 'Tap to type thoughts or architectural notes.',
          color: '#EEEDFD',
        },
      });
    } else if (tool === 'kanban') {
      addNode({
        id: nodeId,
        type: 'kanban',
        position: centerFlow,
        data: {
          title: 'Checklist Card',
          badge: 'KANBAN',
          color: '#DEE5FD',
          items: [
            { id: '1', title: 'Task item 1', completed: false },
            { id: '2', title: 'Task item 2', completed: false },
          ],
          completedCount: 0,
          totalCount: 2,
        },
      });
    } else if (tool === 'note') {
      addNode({
        id: nodeId,
        type: 'note',
        position: centerFlow,
        data: {
          title: 'Document Reference',
          content: 'Links to a Knowledge Note document in Atelier.',
          badge: 'DOC',
          color: '#D1FBE3',
        },
      });
    } else if (tool === 'media') {
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
              position: centerFlow,
              data: { imageUrl: result },
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else if (tool === 'section') {
      addNode({
        id: nodeId,
        type: 'section',
        position: { x: centerFlow.x - 40, y: centerFlow.y - 40 },
        width: 550,
        height: 360,
        data: {
          sectionTitle: 'Group Container',
          bgColor: 'rgba(245, 241, 232, 0.5)',
        },
      });
    }
  };

  const tools: Array<{ id: CanvasToolType; label: string; icon: React.ElementType }> = [
    { id: 'text', label: 'Text Note', icon: Type },
    { id: 'kanban', label: 'Kanban Card', icon: CheckSquare },
    { id: 'note', label: 'Linked Doc', icon: FileEdit },
    { id: 'media', label: 'Media Item', icon: ImageIcon },
    { id: 'section', label: 'Section Area', icon: SquareDashed },
  ];

  return (
    <div className="absolute top-24 left-6 z-10 flex flex-col items-center bg-white/95 rounded-2xl p-1.5 shadow-float border border-border gap-1 backdrop-blur-xs">
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => handleToolClick(t.id)}
            title={t.label}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer',
              isActive
                ? 'bg-accent-indigo text-primaryDark shadow-xs font-bold'
                : 'text-secondaryGray hover:text-primaryDark hover:bg-black/5'
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
};
