import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GripVertical, Trash2, Palette, Check } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { CanvasNodeData } from '@/types';
import { cn } from '@/lib/utils';

const PASTEL_COLORS = [
  { label: 'Lavender', bg: '#EEEDFD', border: '#DCD9FA' },
  { label: 'Mint', bg: '#D1FBE3', border: '#B5F1CE' },
  { label: 'Almond', bg: '#F5F0E6', border: '#E7DFD1' },
  { label: 'Rose', bg: '#FED7E8', border: '#F8BFD6' },
  { label: 'Periwinkle', bg: '#DEE5FD', border: '#CBD8FC' },
];

export const SimpleTextNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = (data || {}) as CanvasNodeData;
  const { updateNodeData, deleteNode, isConnecting } = useCanvasStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState<string>(nodeData.title || nodeData.label || 'Note');
  const [content, setContent] = useState<string>(nodeData.content || '');
  const [badge, setBadge] = useState<string>(nodeData.badge || '');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentColor = nodeData.color || '#EEEDFD';

  const handleSave = () => {
    setIsEditing(false);
    updateNodeData(id, {
      title,
      content,
      badge: badge.trim() ? badge.trim().toUpperCase() : undefined,
    });
  };

  const handleColorChange = (color: string) => {
    updateNodeData(id, { color });
    setShowColorPicker(false);
  };

  return (
    <div
      style={{ backgroundColor: currentColor }}
      className={cn(
        'group relative min-w-[220px] max-w-[320px] rounded-2xl p-4 transition-all duration-150',
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

      {/* Header with Badge & Drag Handle */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {(nodeData.badge || isEditing) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/90 text-primaryDark font-mono text-[10px] font-bold tracking-wider uppercase shadow-xs">
              {isEditing ? (
                <input
                  type="text"
                  value={badge}
                  placeholder="BADGE"
                  onChange={(e) => setBadge(e.target.value)}
                  className="bg-transparent border-none outline-none w-16 uppercase text-[10px] font-mono font-bold"
                />
              ) : (
                nodeData.badge
              )}
            </span>
          )}
        </div>

        {/* Action Controls & Drag Handle */}
        <div className="flex items-center gap-1 text-secondaryGray/70">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Change color"
            className="p-1 hover:text-primaryDark hover:bg-black/5 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteNode(id)}
            title="Delete node"
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
          {PASTEL_COLORS.map((c) => (
            <button
              key={c.bg}
              onClick={() => handleColorChange(c.bg)}
              style={{ backgroundColor: c.bg }}
              className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
            >
              {currentColor === c.bg && <Check className="w-3 h-3 text-primaryDark/70" />}
            </button>
          ))}
        </div>
      )}

      {/* Body & Content */}
      {isEditing ? (
        <div className="flex flex-col gap-2 nodrag">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Node title"
            className="w-full font-display font-bold text-[15px] text-primaryDark bg-white/70 px-2 py-1 rounded border border-border/80 outline-none"
            autoFocus
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Note content..."
            rows={3}
            className="w-full font-sans text-[13px] text-primaryDark bg-white/70 px-2 py-1.5 rounded border border-border/80 outline-none resize-none leading-relaxed"
          />
          <div className="flex justify-end gap-1.5 mt-1">
            <button
              onClick={() => setIsEditing(false)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium text-secondaryGray hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 rounded-full text-[11px] font-semibold bg-primaryDark text-bg hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div onDoubleClick={() => setIsEditing(true)} className="flex flex-col gap-1 cursor-text">
          <h4 className="font-display font-bold text-[15px] text-primaryDark tracking-tight leading-snug">
            {nodeData.title || nodeData.label || 'Untitled Note'}
          </h4>
          {nodeData.content && (
            <p className="font-sans text-[13px] text-primaryDark/80 leading-relaxed whitespace-pre-wrap mt-0.5">
              {nodeData.content}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

SimpleTextNode.displayName = 'SimpleTextNode';
