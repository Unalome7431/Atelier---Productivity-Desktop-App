import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  GripVertical,
  Trash2,
  FileText,
  Palette,
  Check,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useAppStore } from '@/stores/useAppStore';
import { CanvasNodeData } from '@/types';
import { cn } from '@/lib/utils';

export const NoteNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = (data || {}) as CanvasNodeData;
  const { updateNodeData, deleteNode, isConnecting, setActiveSidebarNode } = useCanvasStore();
  const { notes, setActiveNoteId } = useNotesStore();
  const { setActiveTab } = useAppStore();

  const [showColorPicker, setShowColorPicker] = useState(false);

  // Link directly to the referenced note in Knowledge Notes
  const referencedNote =
    notes.find((n) => n.id === nodeData.referenceId) ||
    notes.find((n) => n.id === 'n_note_a') ||
    notes[0];

  const currentColor = referencedNote?.categoryColor || nodeData.color || '#D1FBE3';
  const displayTitle = referencedNote?.title || nodeData.title || nodeData.label || 'Linked Note';

  const previewSnippet = referencedNote?.content
    ? referencedNote.content
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
    : nodeData.content || 'Click to view linked note document in sidebar...';

  const displayBadge = referencedNote?.folder?.toUpperCase() || nodeData.badge || 'NOTE';

  const handleOpenSidebar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSidebarNode({ type: 'note', nodeId: id });
  };

  const handleMoveToNotePage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (referencedNote) {
      setActiveNoteId(referencedNote.id);
    }
    setActiveTab('notes');
  };

  return (
    <div
      onClick={handleOpenSidebar}
      style={{ backgroundColor: currentColor }}
      className={cn(
        'group relative min-w-[250px] max-w-[320px] rounded-2xl p-4 transition-all duration-150 cursor-pointer',
        'border border-border/80 shadow-subtle hover:shadow-float',
        selected && 'ring-2 ring-primaryDark/40'
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
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-primaryDark font-mono text-[9px] font-bold tracking-wider uppercase shadow-xs">
            <FileText className="w-2.5 h-2.5 text-secondaryGray" />
            {displayBadge}
          </span>
          <span className="text-[10px] font-mono text-secondaryGray/70 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>view</span>
            <ArrowUpRight className="w-2.5 h-2.5" />
          </span>
        </div>

        <div className="flex items-center gap-1 text-secondaryGray/70">
          <button
            type="button"
            onClick={handleMoveToNotePage}
            title="Open full Note page"
            className="p-1 hover:text-primaryDark hover:bg-black/5 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(!showColorPicker);
            }}
            title="Color"
            className="p-1 hover:text-primaryDark hover:bg-black/5 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Palette className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(id);
            }}
            title="Delete node"
            className="p-1 hover:text-rose-600 hover:bg-black/5 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-secondaryGray/60 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Color Palette Popover */}
      {showColorPicker && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-10 right-2 z-20 flex items-center gap-1 bg-white p-1.5 rounded-full shadow-float border border-border"
        >
          {['#D1FBE3', '#EEEDFD', '#DEE5FD', '#F5F0E6', '#FED7E8'].map((bg) => (
            <button
              key={bg}
              type="button"
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

      {/* Title & Preview */}
      <h4 className="font-display font-bold text-[15px] text-primaryDark tracking-tight leading-snug group-hover:text-primaryDark/90">
        {displayTitle}
      </h4>

      <p className="font-sans text-[12px] text-primaryDark/75 line-clamp-3 leading-relaxed mt-1.5">
        {previewSnippet}
      </p>
    </div>
  );
});

NoteNode.displayName = 'NoteNode';
