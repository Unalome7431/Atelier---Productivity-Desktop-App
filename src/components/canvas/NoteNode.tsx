import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GripVertical, Trash2, ExternalLink, Palette, Check } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useAppStore } from '@/stores/useAppStore';
import { CanvasNodeData } from '@/types';
import { cn } from '@/lib/utils';

export const NoteNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = (data || {}) as CanvasNodeData;
  const { updateNodeData, deleteNode, isConnecting } = useCanvasStore();
  const { notes, setActiveNoteId } = useNotesStore();
  const { setActiveTab } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentColor = nodeData.color || '#D1FBE3';
  const referencedNote = notes.find((n) => n.id === nodeData.referenceId);

  const displayTitle = referencedNote?.title || nodeData.title || nodeData.label || 'Linked Note';
  const displayContent =
    referencedNote?.content || nodeData.content || 'Click to link note document...';

  const handleOpenNote = () => {
    if (referencedNote) {
      setActiveNoteId(referencedNote.id);
      setActiveTab('notes');
    }
  };

  const handleSelectNote = (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (target) {
      updateNodeData(id, {
        referenceId: target.id,
        title: target.title,
        content: target.content,
        badge: target.category?.toUpperCase() || 'DOC',
      });
    }
    setIsEditing(false);
  };

  return (
    <div
      style={{ backgroundColor: currentColor }}
      className={cn(
        'group relative min-w-[240px] max-w-[320px] rounded-2xl p-4 transition-all duration-150',
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

      {/* Header with Note Badge & Controls */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/95 text-primaryDark font-mono text-[10px] font-bold tracking-wider uppercase shadow-xs">
            NOTE
          </span>
          <button
            onClick={handleOpenNote}
            title="Open note in editor"
            className="nodrag p-1 text-secondaryGray hover:text-primaryDark transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-secondaryGray/70">
          <button
            onClick={() => setIsEditing(!isEditing)}
            title="Link document"
            className="p-1 hover:text-primaryDark hover:bg-black/5 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer text-[11px] font-medium"
          >
            Link
          </button>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Color"
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
          {['#D1FBE3', '#EEEDFD', '#DEE5FD', '#F5F0E6', '#FED7E8'].map((bg) => (
            <button
              key={bg}
              onClick={() => {
                updateNodeData(id, { color: bg });
                setShowColorPicker(false);
              }}
              style={{ backgroundColor: bg }}
              className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
            >
              {currentColor === bg && <Check className="w-3 h-3 text-primaryDark/70" />}
            </button>
          ))}
        </div>
      )}

      {/* Note Switcher Dropdown */}
      {isEditing && (
        <div className="mb-2 p-2 bg-white rounded-xl border border-border shadow-float flex flex-col gap-1.5 nodrag">
          <span className="text-[11px] font-medium text-secondaryGray">
            Choose document to reference:
          </span>
          <select
            value={nodeData.referenceId || ''}
            onChange={(e) => handleSelectNote(e.target.value)}
            className="text-xs p-1.5 border border-border rounded font-sans bg-surface"
          >
            <option value="">Select a note...</option>
            {notes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
          <div className="flex justify-end">
            <button
              onClick={() => setIsEditing(false)}
              className="text-[11px] text-secondaryGray hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Title & Preview */}
      <h4
        onClick={handleOpenNote}
        className="font-display font-bold text-[15px] text-primaryDark tracking-tight leading-snug cursor-pointer hover:underline"
      >
        {displayTitle}
      </h4>

      <p className="font-sans text-[13px] text-primaryDark/80 line-clamp-3 leading-relaxed mt-1">
        {displayContent}
      </p>
    </div>
  );
});

NoteNode.displayName = 'NoteNode';
