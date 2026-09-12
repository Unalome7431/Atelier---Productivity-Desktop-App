import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  GripVertical,
  Trash2,
  CheckCircle2,
  Circle,
  Plus,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useAppStore } from '@/stores/useAppStore';
import { CanvasNodeData } from '@/types';
import { cn } from '@/lib/utils';

export const KanbanNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = (data || {}) as CanvasNodeData;
  const { updateNodeData, deleteNode, isConnecting } = useCanvasStore();
  const { setActiveTab } = useAppStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState<string>(
    nodeData.title || nodeData.label || 'Release readiness'
  );
  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentColor = nodeData.color || '#DEE5FD';
  const items: Array<{ id: string; title: string; completed: boolean }> = Array.isArray(
    nodeData.items
  )
    ? nodeData.items
    : [
        { id: '1', title: 'Stabilize API responses', completed: true },
        { id: '2', title: 'Prepare beta cohort update', completed: false },
      ];

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = typeof nodeData.totalCount === 'number' ? nodeData.totalCount : items.length;

  const handleToggleItem = (itemId: string) => {
    const updated = items.map((it) =>
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );
    updateNodeData(id, {
      items: updated,
      completedCount: updated.filter((i) => i.completed).length,
    });
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    const newItem = {
      id: `item_${Date.now()}`,
      title: newItemText.trim(),
      completed: false,
    };
    const updated = [...items, newItem];
    updateNodeData(id, {
      items: updated,
      totalCount: updated.length,
      completedCount: updated.filter((i) => i.completed).length,
    });
    setNewItemText('');
    setIsAddingItem(false);
  };

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    updateNodeData(id, { title });
  };

  const handleJumpToBoard = () => {
    setActiveTab('kanban');
  };

  return (
    <div
      style={{ backgroundColor: currentColor }}
      className={cn(
        'group relative min-w-[270px] max-w-[340px] rounded-2xl p-5 transition-all duration-150',
        'border border-border/80 shadow-subtle hover:shadow-float',
        selected && 'ring-2 ring-primaryDark/30'
      )}
    >
      {/* 4 Directional Connection Handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className={cn(
          'w-2.5 h-2.5 bg-white border-2 border-primaryDark/60 hover:border-primaryDark shadow-xs transition-colors !rounded-full cursor-crosshair',
          isConnecting
            ? '!opacity-100 !bg-accent-indigo border-indigo-600'
            : 'opacity-0 group-hover:opacity-100'
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={cn(
          'w-2.5 h-2.5 bg-white border-2 border-primaryDark/60 hover:border-primaryDark shadow-xs transition-colors !rounded-full cursor-crosshair',
          isConnecting
            ? '!opacity-100 !bg-accent-indigo border-indigo-600'
            : 'opacity-0 group-hover:opacity-100'
        )}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={cn(
          'w-2.5 h-2.5 bg-white border-2 border-primaryDark/60 hover:border-primaryDark shadow-xs transition-colors !rounded-full cursor-crosshair',
          isConnecting
            ? '!opacity-100 !bg-accent-indigo border-indigo-600'
            : 'opacity-0 group-hover:opacity-100'
        )}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className={cn(
          'w-2.5 h-2.5 bg-white border-2 border-primaryDark/60 hover:border-primaryDark shadow-xs transition-colors !rounded-full cursor-crosshair',
          isConnecting
            ? '!opacity-100 !bg-accent-indigo border-indigo-600'
            : 'opacity-0 group-hover:opacity-100'
        )}
      />

      {/* Header with KANBAN Badge & Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/95 text-primaryDark font-mono text-[10px] font-bold tracking-wider uppercase shadow-xs">
            {nodeData.badge || 'KANBAN'}
          </span>
          {nodeData.boardId && (
            <button
              onClick={handleJumpToBoard}
              title="Open full Kanban Board"
              className="nodrag p-1 text-secondaryGray hover:text-primaryDark transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 text-secondaryGray/70">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Color"
            className="p-1 hover:text-primaryDark hover:bg-black/5 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteNode(id)}
            title="Delete card"
            className="p-1 hover:text-rose-600 hover:bg-black/5 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="p-1 text-secondaryGray/60 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Color Palette Popover */}
      {showColorPicker && (
        <div className="absolute top-10 right-2 z-20 flex items-center gap-1 bg-white p-1.5 rounded-full shadow-float border border-border">
          {['#DEE5FD', '#EEEDFD', '#D1FBE3', '#F5F0E6', '#FED7E8'].map((bg) => (
            <button
              key={bg}
              onClick={() => {
                updateNodeData(id, { color: bg });
                setShowColorPicker(false);
              }}
              style={{ backgroundColor: bg }}
              className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform cursor-pointer"
            />
          ))}
        </div>
      )}

      {/* Card Title */}
      {isEditingTitle ? (
        <div className="flex items-center gap-1 mb-3 nodrag">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-display font-bold text-[16px] text-primaryDark bg-white/80 px-2.5 py-1 rounded-md border border-border/80 outline-none"
            autoFocus
          />
          <button
            onClick={handleSaveTitle}
            className="px-2.5 py-1 bg-primaryDark text-bg rounded-md text-xs font-semibold"
          >
            Save
          </button>
        </div>
      ) : (
        <h3
          onDoubleClick={() => setIsEditingTitle(true)}
          className="font-display font-bold text-[17px] text-primaryDark tracking-tight mb-3 cursor-text select-none"
        >
          {nodeData.title || nodeData.label || 'Release readiness'}
        </h3>
      )}

      {/* Checklist Items */}
      <div className="flex flex-col gap-2 mb-3.5 nodrag">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleToggleItem(item.id)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/40 transition-colors cursor-pointer group/item select-none"
          >
            {item.completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-secondaryGray/60 flex-shrink-0" />
            )}
            <span
              className={cn(
                'font-sans text-[13px] leading-tight select-none',
                item.completed ? 'text-secondaryGray line-through' : 'text-primaryDark font-medium'
              )}
            >
              {item.title}
            </span>
          </div>
        ))}

        {isAddingItem ? (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="New checklist item..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              className="flex-1 text-[12px] bg-white/80 px-2 py-1 rounded border border-border outline-none font-sans"
              autoFocus
            />
            <button
              onClick={handleAddItem}
              className="px-2 py-1 bg-primaryDark text-bg text-[11px] font-semibold rounded cursor-pointer"
            >
              Add
            </button>
            <button
              onClick={() => setIsAddingItem(false)}
              className="px-2 py-1 text-[11px] text-secondaryGray cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingItem(true)}
            className="flex items-center gap-1.5 text-left text-[12px] text-secondaryGray hover:text-primaryDark p-1 rounded hover:bg-white/30 transition-colors font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add item</span>
          </button>
        )}
      </div>

      {/* Footer Progress Tracker */}
      <div className="flex items-center justify-between pt-2 border-t border-black/5 text-[12px] font-sans text-secondaryGray">
        <span>
          {completedCount}/{totalCount} complete
        </span>
        <div className="w-20 h-1.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full bg-primaryDark transition-all duration-300 rounded-full"
            style={{
              width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
});

KanbanNode.displayName = 'KanbanNode';
