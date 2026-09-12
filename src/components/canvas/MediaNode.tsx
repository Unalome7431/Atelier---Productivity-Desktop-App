import React, { useRef, memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { Trash2, Upload, RefreshCw } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { CanvasNodeData } from '@/types';
import { cn } from '@/lib/utils';

export const MediaNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = (data || {}) as CanvasNodeData;
  const { updateNodeData, deleteNode, isConnecting } = useCanvasStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        updateNodeData(id, { imageUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const hasImage = Boolean(nodeData.imageUrl);

  return (
    <div
      className={cn(
        'group relative rounded-2xl transition-all duration-150 select-none overflow-visible',
        selected && 'ring-2 ring-primaryDark/40'
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      {/* Node Resizer handles when selected */}
      <NodeResizer
        minWidth={120}
        minHeight={80}
        isVisible={selected}
        lineClassName="border-primaryDark/40"
        handleClassName="h-2.5 w-2.5 bg-primaryDark border-2 border-white rounded"
      />

      {/* 4 Directional Connection Handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className={cn(
          'w-2.5 h-2.5 bg-white border-2 border-primaryDark/60 hover:border-primaryDark shadow-xs transition-colors !rounded-full cursor-crosshair z-20',
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
          'w-2.5 h-2.5 bg-white border-2 border-primaryDark/60 hover:border-primaryDark shadow-xs transition-colors !rounded-full cursor-crosshair z-20',
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
          'w-2.5 h-2.5 bg-white border-2 border-primaryDark/60 hover:border-primaryDark shadow-xs transition-colors !rounded-full cursor-crosshair z-20',
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
          'w-2.5 h-2.5 bg-white border-2 border-primaryDark/60 hover:border-primaryDark shadow-xs transition-colors !rounded-full cursor-crosshair z-20',
          isConnecting
            ? '!opacity-100 !bg-accent-indigo border-indigo-600'
            : 'opacity-0 group-hover:opacity-100'
        )}
      />

      {/* Hidden Native File Input for Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* Image Only Display */}
      {hasImage ? (
        <div className="relative rounded-2xl overflow-hidden shadow-subtle hover:shadow-float border border-border/80 bg-surface/30">
          <img
            src={nodeData.imageUrl}
            alt="Uploaded concept"
            className="w-full h-full object-cover rounded-2xl pointer-events-none block"
            style={{
              maxHeight: nodeData.height || 360,
              maxWidth: nodeData.width || 480,
            }}
          />

          {/* Hover Actions: Replace Image & Delete */}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs p-1 rounded-full border border-border/80 shadow-subtle">
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Change image"
              className="p-1 text-secondaryGray hover:text-primaryDark hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => deleteNode(id)}
              title="Delete image"
              className="p-1 text-secondaryGray hover:text-rose-600 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Upload Zone */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-64 h-44 rounded-2xl border-2 border-dashed border-border/90 bg-surface/60 hover:bg-surface flex flex-col items-center justify-center gap-2 text-secondaryGray cursor-pointer hover:border-primaryDark/40 transition-all p-4 shadow-subtle"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs text-primaryDark">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-center">
            <div className="font-sans text-xs font-semibold text-primaryDark">Upload Image</div>
            <div className="font-sans text-[11px] text-secondaryGray mt-0.5">
              Click or drag file here
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MediaNode.displayName = 'MediaNode';
