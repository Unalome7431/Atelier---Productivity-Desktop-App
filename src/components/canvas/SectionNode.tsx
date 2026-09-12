import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { Trash2, Palette, Edit2, GripHorizontal } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { CanvasNodeData } from '@/types';
import { cn } from '@/lib/utils';

export const SectionNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = (data || {}) as CanvasNodeData;
  const { updateNodeData, deleteNode, isConnecting } = useCanvasStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState<string>(
    nodeData.sectionTitle || nodeData.title || nodeData.label || 'Concept Section'
  );
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentBg = nodeData.bgColor || nodeData.color || 'rgba(245, 241, 232, 0.5)';

  const handleSaveTitle = () => {
    setIsEditing(false);
    updateNodeData(id, { sectionTitle: title });
  };

  return (
    <div
      style={{ backgroundColor: currentBg }}
      className={cn(
        'group relative w-full h-full rounded-3xl p-4 transition-all duration-150',
        'border border-border/80 shadow-xs select-none cursor-grab active:cursor-grabbing',
        selected && 'ring-2 ring-primaryDark/20 border-primaryDark/40'
      )}
    >
      {/* Node Resizer handles */}
      <NodeResizer
        minWidth={240}
        minHeight={160}
        isVisible={selected}
        lineClassName="border-primaryDark/40"
        handleClassName="h-2.5 w-2.5 bg-primaryDark border-2 border-white rounded"
      />

      {/* Connection Handles */}
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

      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1">
          <GripHorizontal className="w-4 h-4 text-secondaryGray/50 cursor-grab active:cursor-grabbing" />
          {isEditing ? (
            <div className="flex items-center gap-1.5 nodrag">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="font-mono text-xs font-bold uppercase tracking-wider text-primaryDark bg-white px-2 py-0.5 rounded border border-border outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="px-2 py-0.5 bg-primaryDark text-bg rounded text-[10px] font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <span
              onDoubleClick={() => setIsEditing(true)}
              className="font-mono text-[11px] font-bold uppercase tracking-widest text-secondaryGray hover:text-primaryDark cursor-pointer"
            >
              {nodeData.sectionTitle || nodeData.title || nodeData.label || 'Concept Section'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(!isEditing)}
            title="Edit title"
            className="p-1 hover:text-primaryDark hover:bg-black/5 rounded cursor-pointer text-secondaryGray"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Change tint"
            className="p-1 hover:text-primaryDark hover:bg-black/5 rounded cursor-pointer text-secondaryGray"
          >
            <Palette className="w-3 h-3" />
          </button>
          <button
            onClick={() => deleteNode(id)}
            title="Delete section"
            className="p-1 hover:text-rose-600 hover:bg-black/5 rounded cursor-pointer text-secondaryGray"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Color Tint Popover */}
      {showColorPicker && (
        <div className="absolute top-10 right-4 z-20 flex items-center gap-1.5 bg-white p-1.5 rounded-full shadow-float border border-border">
          {[
            'rgba(245, 241, 232, 0.5)',
            'rgba(238, 237, 253, 0.5)',
            'rgba(209, 251, 227, 0.5)',
            'rgba(222, 229, 253, 0.5)',
            'rgba(254, 215, 232, 0.5)',
          ].map((bg) => (
            <button
              key={bg}
              onClick={() => {
                updateNodeData(id, { bgColor: bg });
                setShowColorPicker(false);
              }}
              style={{ backgroundColor: bg }}
              className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform cursor-pointer"
            />
          ))}
        </div>
      )}
    </div>
  );
});

SectionNode.displayName = 'SectionNode';
