import React, { useState, useMemo, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  GripVertical,
  Trash2,
  Palette,
  KanbanSquare,
  ArrowUpRight,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { useAppStore } from '@/stores/useAppStore';
import { CanvasNodeData } from '@/types';
import { cn } from '@/lib/utils';

export const KanbanNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = (data || {}) as CanvasNodeData;
  const { updateNodeData, deleteNode, isConnecting, setActiveSidebarNode } = useCanvasStore();
  const { boards } = useKanbanStore();
  const { setActiveTab } = useAppStore();

  const [showColorPicker, setShowColorPicker] = useState(false);

  // Link directly to the referenced Kanban board
  const linkedBoard =
    boards.find((b) => b.id === nodeData.boardId) ||
    boards.find((b) => b.id === 'board_default') ||
    boards[0];

  const currentColor = nodeData.color || linkedBoard?.colorTag || '#DEE5FD';
  const displayTitle = nodeData.title || linkedBoard?.title || 'Project Board';

  // Resolve columns and cards from linked board
  const columns = useMemo(() => {
    return (
      linkedBoard?.columns || [
        { id: 'planned', title: 'Planned', dotColor: '#D4C5A9', orderIndex: 0 },
        { id: 'in_progress', title: 'In progress', dotColor: '#818CF8', orderIndex: 1 },
        { id: 'review', title: 'Review', dotColor: '#C084FC', orderIndex: 2 },
        { id: 'done', title: 'Complete', dotColor: '#34D399', orderIndex: 3 },
      ]
    );
  }, [linkedBoard?.columns]);

  const boardCards = useMemo(() => linkedBoard?.cards || [], [linkedBoard?.cards]);

  const totalCardsCount = useMemo(() => {
    if (boardCards.length > 0) return boardCards.length;
    return typeof nodeData.totalCount === 'number' ? nodeData.totalCount : 0;
  }, [boardCards.length, nodeData.totalCount]);

  // Compute progress bar metrics for each column
  const columnStats = useMemo(() => {
    return columns.map((col) => {
      const isDoneCol = col.id === 'done' || col.id === 'complete';
      const colCards = boardCards.filter(
        (c) =>
          c.columnId === col.id ||
          (isDoneCol && (c.columnId === 'complete' || c.columnId === 'done'))
      );

      let count = colCards.length;
      if (boardCards.length === 0 && typeof nodeData.totalCount === 'number') {
        count = isDoneCol
          ? (nodeData.completedCount ?? 0)
          : Math.max(
              0,
              Math.round(
                ((nodeData.totalCount ?? 0) - (nodeData.completedCount ?? 0)) /
                  Math.max(1, columns.length - 1)
              )
            );
      }

      const percent = totalCardsCount > 0 ? Math.round((count / totalCardsCount) * 100) : 0;

      return {
        id: col.id,
        title: col.title,
        dotColor: col.dotColor || '#818CF8',
        count,
        percent,
      };
    });
  }, [columns, boardCards, nodeData.totalCount, nodeData.completedCount, totalCardsCount]);

  const completedCardsCount = useMemo(() => {
    if (boardCards.length > 0) {
      return boardCards.filter(
        (c) => Boolean(c.completedAt) || c.columnId === 'complete' || c.columnId === 'done'
      ).length;
    }
    return typeof nodeData.completedCount === 'number' ? nodeData.completedCount : 0;
  }, [boardCards, nodeData.completedCount]);

  const handleOpenSidebar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSidebarNode({ type: 'kanban', nodeId: id });
  };

  const handleMoveToBoardPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (linkedBoard) {
      useKanbanStore.getState().setActiveBoardId(linkedBoard.id);
    }
    setActiveTab('kanban');
  };

  return (
    <div
      onClick={handleOpenSidebar}
      style={{ backgroundColor: currentColor }}
      className={cn(
        'group relative min-w-[270px] max-w-[340px] rounded-2xl p-4 transition-all duration-150 cursor-pointer',
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

      {/* Header with KANBAN Badge & Controls */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-primaryDark font-mono text-[9px] font-bold tracking-wider uppercase shadow-xs">
            <KanbanSquare className="w-2.5 h-2.5 text-secondaryGray" />
            {nodeData.badge || 'KANBAN'}
          </span>
          {linkedBoard && (
            <span className="text-[10px] font-mono text-secondaryGray/80 truncate max-w-[100px]">
              {linkedBoard.title}
            </span>
          )}
          <span className="text-[10px] font-mono text-secondaryGray/70 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-2.5 h-2.5" />
          </span>
        </div>

        <div className="flex items-center gap-1 text-secondaryGray/70">
          <button
            type="button"
            onClick={handleMoveToBoardPage}
            title="Open full Kanban Board page"
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
            title="Delete card"
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
          {['#DEE5FD', '#EEEDFD', '#D1FBE3', '#F5F0E6', '#FED7E8'].map((bg) => (
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

      {/* Card Title */}
      <h3 className="font-display font-bold text-[16px] text-primaryDark tracking-tight mb-3 select-none leading-snug">
        {displayTitle}
      </h3>

      {/* Column Progress Bars */}
      <div className="flex flex-col gap-2 mb-3 nodrag select-none">
        {columnStats.map((col) => (
          <div key={col.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-sans">
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: col.dotColor }}
                />
                <span className="font-medium text-primaryDark truncate">{col.title}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] text-secondaryGray shrink-0">
                <span>{col.count}</span>
                <span className="text-secondaryGray/60">({col.percent}%)</span>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${col.percent}%`,
                  backgroundColor: col.dotColor,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Overall Progress Tracker */}
      <div className="flex items-center justify-between pt-2.5 border-t border-black/5 text-[11px] font-sans text-secondaryGray select-none">
        <span className="font-mono text-[10px]">
          {completedCardsCount}/{totalCardsCount} completed
        </span>
        <div className="w-20 h-1.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full bg-primaryDark transition-all duration-300 rounded-full"
            style={{
              width: `${totalCardsCount > 0 ? (completedCardsCount / totalCardsCount) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
});

KanbanNode.displayName = 'KanbanNode';
