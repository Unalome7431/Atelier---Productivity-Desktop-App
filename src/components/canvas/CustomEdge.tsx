import React, { useState, memo } from 'react';
import { EdgeProps, getBezierPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import { X, Edit2 } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';

export const CustomEdge: React.FC<EdgeProps> = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    data,
    selected,
  }) => {
    const { deleteEdge, updateEdgeLabel } = useCanvasStore();
    const [isEditing, setIsEditing] = useState(false);
    const [labelText, setLabelText] = useState((label as string) || '');

    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const strokeColor = (data?.stroke as string) || '#A5B4FC';

    const handleSaveLabel = () => {
      setIsEditing(false);
      updateEdgeLabel(id, labelText);
    };

    return (
      <>
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            stroke: strokeColor,
            strokeWidth: selected ? 2.5 : 1.75,
            ...style,
          }}
        />

        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan group/edge"
          >
            {isEditing ? (
              <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-float border border-border">
                <input
                  type="text"
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel()}
                  placeholder="Edge label..."
                  className="text-[11px] font-mono font-medium px-2 py-0.5 outline-none w-24 bg-transparent text-primaryDark"
                  autoFocus
                />
                <button
                  onClick={handleSaveLabel}
                  className="px-2 py-0.5 bg-primaryDark text-bg text-[10px] font-semibold rounded-full"
                >
                  Set
                </button>
              </div>
            ) : label ? (
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/95 border border-border/80 text-primaryDark/80 font-mono text-[10.5px] font-medium tracking-tight shadow-xs hover:shadow-subtle transition-all cursor-pointer select-none">
                <span onDoubleClick={() => setIsEditing(true)}>{label as string}</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover/edge:opacity-100 hover:text-primaryDark transition-opacity"
                  title="Edit label"
                >
                  <Edit2 className="w-2.5 h-2.5 text-secondaryGray" />
                </button>
                <button
                  onClick={() => deleteEdge(id)}
                  className="opacity-0 group-hover/edge:opacity-100 hover:text-rose-600 transition-opacity ml-0.5"
                  title="Delete connector"
                >
                  <X className="w-3 h-3 text-secondaryGray hover:text-rose-600" />
                </button>
              </div>
            ) : (
              <div className="opacity-0 group-hover/edge:opacity-100 flex items-center gap-1 bg-white/90 p-1 rounded-full border border-border shadow-xs transition-opacity">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 hover:text-primaryDark rounded-full text-secondaryGray text-[10px] font-mono px-1.5"
                  title="Add label"
                >
                  + Label
                </button>
                <button
                  onClick={() => deleteEdge(id)}
                  className="p-1 hover:text-rose-600 rounded-full text-secondaryGray"
                  title="Delete connector"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

CustomEdge.displayName = 'CustomEdge';
