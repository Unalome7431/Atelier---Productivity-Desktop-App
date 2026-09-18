import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  ExternalLink,
  FileText,
  KanbanSquare,
  CheckCircle2,
  Circle,
  Clock,
  Folder,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  ArrowRight,
} from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { useAppStore } from '@/stores/useAppStore';
import { CanvasNodeData, KanbanCard } from '@/types';
import { CalloutType, CALLOUT_CONFIGS } from '@/components/notes/CalloutComponent';
import { getTagStyle, COLUMN_THEMES } from '@/lib/tagStyles';
import { getRankBetween, getInitialRank } from '@/lib/lexorank';
import { cn } from '@/lib/utils';

interface NoteContentBlock {
  type: 'html' | 'callout';
  html?: string;
  calloutType?: CalloutType;
  eyebrow?: string;
  title?: string;
  innerHtml?: string;
}

function parseNoteContent(rawHtml: string): NoteContentBlock[] {
  if (!rawHtml || !rawHtml.trim()) return [];

  const calloutRegex = /(<div[^>]*data-type=["']callout["'][^>]*>[\s\S]*?<\/div>)/gi;
  const parts = rawHtml.split(calloutRegex);
  const blocks: NoteContentBlock[] = [];

  for (const part of parts) {
    if (!part || !part.trim()) continue;

    if (part.match(/^<div[^>]*data-type=["']callout["']/i)) {
      const typeMatch =
        part.match(/data-callout-type=["']([^"']*)["']/i) || part.match(/type=["']([^"']*)["']/i);
      const eyebrowMatch = part.match(/data-eyebrow=["']([^"']*)["']/i);
      const titleMatch = part.match(/data-title=["']([^"']*)["']/i);
      const innerMatch = part.match(/<div[^>]*>([\s\S]*?)<\/div>/i);

      const rawType = (typeMatch ? typeMatch[1] : 'decision').toLowerCase();
      const calloutType: CalloutType =
        rawType in CALLOUT_CONFIGS
          ? (rawType as CalloutType)
          : rawType.includes('caution')
            ? 'caution'
            : rawType.includes('idea')
              ? 'idea'
              : rawType.includes('ref')
                ? 'reference'
                : 'decision';

      const config = CALLOUT_CONFIGS[calloutType] || CALLOUT_CONFIGS.decision;

      blocks.push({
        type: 'callout',
        calloutType,
        eyebrow: eyebrowMatch ? eyebrowMatch[1] : config.defaultEyebrow,
        title: titleMatch ? titleMatch[1] : '',
        innerHtml: innerMatch ? innerMatch[1].trim() : '',
      });
    } else {
      blocks.push({
        type: 'html',
        html: part.trim(),
      });
    }
  }

  return blocks;
}

const CalloutReadOnly: React.FC<{
  type: CalloutType;
  eyebrow?: string;
  title?: string;
  innerHtml: string;
}> = ({ type, eyebrow, title, innerHtml }) => {
  const config = CALLOUT_CONFIGS[type] || CALLOUT_CONFIGS.decision;
  const IconComponent = config.icon;
  const displayEyebrow = eyebrow || config.defaultEyebrow;

  return (
    <div className="my-3 select-text">
      <div
        className={cn(
          'group/callout relative rounded-2xl p-4 sm:p-5 border transition-all shadow-subtle',
          config.containerClass
        )}
      >
        {/* Top Header Row with Icon and Eyebrow */}
        <div className="flex items-center gap-2 mb-2 select-none">
          <IconComponent className={cn('w-4 h-4 shrink-0', config.eyebrowClass)} />
          <span
            className={cn(
              'font-mono text-[10px] font-bold tracking-widest uppercase',
              config.eyebrowClass
            )}
          >
            {displayEyebrow}
          </span>
        </div>

        {/* Callout Title */}
        {title && (
          <h4 className="font-display font-bold text-[16px] text-primaryDark tracking-tight mb-2 leading-snug">
            {title}
          </h4>
        )}

        {/* Callout Content Body */}
        <div
          className="callout-body font-sans text-xs text-secondaryGray leading-relaxed space-y-2 [&_p]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5"
          dangerouslySetInnerHTML={{ __html: innerHtml }}
        />
      </div>
    </div>
  );
};

export const CanvasLinkedDrawer: React.FC = () => {
  const { activeSidebarNode, setActiveSidebarNode, nodes, updateNodeData } = useCanvasStore();
  const { notes, setActiveNoteId } = useNotesStore();
  const {
    boards,
    setActiveBoardId,
    updateCard,
    addCard,
    addColumn,
    deleteCard,
    moveCard,
    sendToTodayQueue,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
  } = useKanbanStore();
  const { setActiveTab } = useAppStore();

  // Find the target node on the active canvas
  const node = useMemo(() => {
    if (!activeSidebarNode) return null;
    return nodes.find((n) => n.id === activeSidebarNode.nodeId) || null;
  }, [nodes, activeSidebarNode]);

  // Ensure notes and boards are always populated in store
  useEffect(() => {
    if (notes.length === 0) {
      useNotesStore.getState().loadNotes();
    }
    if (boards.length === 0) {
      useKanbanStore.getState().loadBoards();
    }
  }, [notes.length, boards.length]);

  // Drag and drop state for Kanban cards
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [todayToast, setTodayToast] = useState<string | null>(null);

  // Send card to today queue without removing from Kanban
  const handleSendToToday = async (cardId: string, title: string) => {
    try {
      await sendToTodayQueue(cardId);
      setTodayToast(`Added "${title}" to Today's Queue`);
      setTimeout(() => setTodayToast(null), 2500);
    } catch (err) {
      console.error('Failed to send card to today queue:', err);
    }
  };

  // Kanban write state: Adding card inline per column
  const [addingToColId, setAddingToColId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');

  // Kanban write state: Adding column inline
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColTheme, setNewColTheme] = useState('blue');

  // Kanban write state: Editing selected card inline inside drawer
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  if (!activeSidebarNode || !node) return null;

  const nodeData = (node.data || {}) as CanvasNodeData;
  const isNoteType = activeSidebarNode.type === 'note' || node.type === 'note';

  // --- Note Data Resolution ---
  const currentNote = isNoteType
    ? notes.find((n) => n.id === nodeData.referenceId) ||
      notes.find((n) => n.id === 'n_note_a') ||
      notes[0]
    : null;

  const handleSelectNote = async (noteId: string) => {
    const selected = notes.find((n) => n.id === noteId);
    if (selected && node) {
      await updateNodeData(node.id, {
        referenceId: selected.id,
        title: selected.title,
        color: selected.categoryColor || '#D1FBE3',
        badge: selected.folder?.toUpperCase() || 'NOTE',
        content: selected.content
          ? selected.content
              .replace(/<[^>]+>/g, ' ')
              .trim()
              .slice(0, 140)
          : 'Linked note document in Atelier.',
      });
    }
  };

  const handleMoveToNotePage = () => {
    if (currentNote) {
      setActiveNoteId(currentNote.id);
    }
    setActiveSidebarNode(null);
    setActiveTab('notes');
  };

  // --- Kanban Board Data Resolution ---
  const currentBoard = !isNoteType
    ? boards.find((b) => b.id === nodeData.boardId) ||
      boards.find((b) => b.id === 'board_default') ||
      boards[0]
    : null;

  const handleSelectBoard = async (boardId: string) => {
    const selected = boards.find((b) => b.id === boardId);
    if (selected && node) {
      const bCards = selected.cards || [];
      await updateNodeData(node.id, {
        boardId: selected.id,
        title: selected.title,
        color: selected.colorTag || '#DEE5FD',
        items: bCards.slice(0, 4).map((c) => ({
          id: c.id,
          title: c.title,
          completed: Boolean(c.completedAt) || c.columnId === 'complete' || c.columnId === 'done',
        })),
        completedCount: bCards.filter(
          (c) => Boolean(c.completedAt) || c.columnId === 'complete' || c.columnId === 'done'
        ).length,
        totalCount: bCards.length,
      });
    }
  };

  const handleMoveToBoardPage = () => {
    if (currentBoard) {
      setActiveBoardId(currentBoard.id);
    }
    setActiveSidebarNode(null);
    setActiveTab('kanban');
  };

  const syncNodeItems = async (board: typeof currentBoard) => {
    if (!node || !board) return;
    const bCards = board.cards || [];
    await updateNodeData(node.id, {
      items: bCards.slice(0, 4).map((c) => ({
        id: c.id,
        title: c.title,
        completed: Boolean(c.completedAt) || c.columnId === 'complete' || c.columnId === 'done',
      })),
      completedCount: bCards.filter(
        (c) => Boolean(c.completedAt) || c.columnId === 'complete' || c.columnId === 'done'
      ).length,
      totalCount: bCards.length,
    });
  };

  // Toggle card completion
  const handleToggleCard = async (card: KanbanCard) => {
    if (!currentBoard) return;
    const isDone =
      Boolean(card.completedAt) || card.columnId === 'complete' || card.columnId === 'done';
    const targetCol = isDone ? 'in_progress' : 'complete';

    await updateCard(card.id, {
      columnId: targetCol,
      completedAt: isDone ? undefined : 'Completed today',
    });

    const updatedBoard = useKanbanStore.getState().boards.find((b) => b.id === currentBoard.id);
    syncNodeItems(updatedBoard || currentBoard);
  };

  // Move card to specific column
  const handleMoveColumn = async (cardId: string, targetColId: string) => {
    if (!currentBoard) return;
    const isComplete = targetColId === 'complete' || targetColId === 'done';
    await updateCard(cardId, {
      columnId: targetColId,
      completedAt: isComplete ? 'Completed today' : undefined,
    });
    const updatedBoard = useKanbanStore.getState().boards.find((b) => b.id === currentBoard.id);
    syncNodeItems(updatedBoard || currentBoard);
  };

  // Add new card write handler
  const handleAddCardSubmit = async (colId: string) => {
    if (!newCardTitle.trim() || !currentBoard) return;
    try {
      const created = await addCard({
        boardId: currentBoard.id,
        columnId: colId,
        title: newCardTitle.trim(),
        description: newCardDesc.trim() || undefined,
      });
      setNewCardTitle('');
      setNewCardDesc('');
      setAddingToColId(null);
      setTodayToast(`Added card "${created.title}"`);
      setTimeout(() => setTodayToast(null), 2500);

      const updatedBoard = useKanbanStore.getState().boards.find((b) => b.id === currentBoard.id);
      syncNodeItems(updatedBoard || currentBoard);
    } catch (err) {
      console.error('Failed to add card:', err);
    }
  };

  // Add new column write handler
  const handleAddColumnSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newColTitle.trim() || !currentBoard) return;
    try {
      const created = await addColumn(currentBoard.id, newColTitle.trim(), newColTheme);
      setNewColTitle('');
      setIsAddingColumn(false);
      setTodayToast(`Created column "${created.title}"`);
      setTimeout(() => setTodayToast(null), 2500);

      const updatedBoard = useKanbanStore.getState().boards.find((b) => b.id === currentBoard.id);
      syncNodeItems(updatedBoard || currentBoard);
    } catch (err) {
      console.error('Failed to add column:', err);
    }
  };

  // Save card edits
  const handleSaveCardEdits = async (cardId: string) => {
    if (!editTitle.trim()) return;
    await updateCard(cardId, {
      title: editTitle.trim(),
      description: editDesc.trim(),
    });
    setExpandedCardId(null);
  };

  // Drag-and-drop handlers for moving cards within and across columns
  const handleCardDragStart = (e: React.DragEvent, card: KanbanCard) => {
    setDraggedCardId(card.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ cardId: card.id, sourceColumnId: card.columnId })
    );
  };

  const handleCardDragEnd = () => {
    setDraggedCardId(null);
    setDragOverColId(null);
    setDropIndex(null);
  };

  const handleColumnDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColId(colId);
  };

  const handleColumnDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColId(null);
      setDropIndex(null);
    }
  };

  const handleCardDragOver = (e: React.DragEvent, colId: string, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColId(colId);

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const targetIdx = e.clientY < midpoint ? index : index + 1;
    setDropIndex(targetIdx);
  };

  const handleDropOnColumn = async (
    e: React.DragEvent,
    targetColId: string,
    sortedCardsInCol: KanbanCard[]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColId(null);

    try {
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const payload = JSON.parse(rawData);
      const cardId = payload.cardId;
      if (!cardId || !currentBoard) return;

      // Exclude dragged card from calculations to prevent self-collision
      const otherCards = sortedCardsInCol.filter((c) => c.id !== cardId);

      let targetIdx = dropIndex !== null ? dropIndex : otherCards.length;
      if (targetIdx > otherCards.length) targetIdx = otherCards.length;

      let newRank: string;
      if (otherCards.length === 0) {
        newRank = getInitialRank(0);
      } else if (targetIdx === 0) {
        const nextRank = otherCards[0].positionRank || getInitialRank(0);
        newRank = getRankBetween(null, nextRank);
      } else if (targetIdx >= otherCards.length) {
        const prevRank =
          otherCards[otherCards.length - 1].positionRank || getInitialRank(otherCards.length);
        newRank = getRankBetween(prevRank, null);
      } else {
        const prevRank = otherCards[targetIdx - 1].positionRank;
        const nextRank = otherCards[targetIdx].positionRank;
        newRank = getRankBetween(prevRank, nextRank);
      }

      await moveCard(cardId, targetColId, newRank);
      const updatedBoard = useKanbanStore.getState().boards.find((b) => b.id === currentBoard.id);
      syncNodeItems(updatedBoard || currentBoard);
    } catch (err) {
      console.error('Failed to parse drag-drop payload:', err);
    } finally {
      setDraggedCardId(null);
      setDragOverColId(null);
      setDropIndex(null);
    }
  };

  // Add checklist item to card
  const handleAddSubtask = async (cardId: string) => {
    if (!newSubtaskTitle.trim()) return;
    await addChecklistItem(cardId, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  // Clean note HTML content parser for read-only presentation with 1:1 callout rendering
  const renderNoteReadonlyContent = () => {
    if (!currentNote?.content) {
      return <p className="text-secondaryGray italic text-xs">This note is currently empty.</p>;
    }

    const blocks = parseNoteContent(currentNote.content);

    return (
      <div className="flex flex-col font-sans text-primaryDark note-preview">
        {blocks.map((block, index) => {
          if (block.type === 'callout') {
            return (
              <CalloutReadOnly
                key={index}
                type={block.calloutType || 'decision'}
                eyebrow={block.eyebrow}
                title={block.title}
                innerHtml={block.innerHtml || ''}
              />
            );
          }

          return (
            <div
              key={index}
              className="note-preview text-primaryDark font-sans leading-relaxed"
              dangerouslySetInnerHTML={{ __html: block.html || '' }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[420px] max-w-[90vw] bg-surface border-l border-border shadow-float flex flex-col z-40 animate-in slide-in-from-right duration-200 select-text">
      {/* Drawer Top Header */}
      <div className="p-4 border-b border-border bg-white/90 backdrop-blur-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {isNoteType ? (
            <div className="w-7 h-7 rounded-lg bg-[#D1FAE5] flex items-center justify-center text-[#065F46] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-[#EBE7FF] flex items-center justify-center text-[#4338CA] shrink-0">
              <KanbanSquare className="w-4 h-4" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[10px] font-bold text-midGray uppercase tracking-wider">
              {isNoteType ? 'LINKED NOTE · READ ONLY' : 'LINKED KANBAN · READ & WRITE'}
            </span>
            <span className="font-display font-bold text-sm text-primaryDark truncate">
              {isNoteType ? currentNote?.title || 'Note' : currentBoard?.title || 'Kanban Board'}
            </span>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={isNoteType ? handleMoveToNotePage : handleMoveToBoardPage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg hover:bg-border text-primaryDark font-mono text-[11px] font-medium transition-colors cursor-pointer border border-border shadow-2xs"
            title={isNoteType ? 'Move to Knowledge Notes' : 'Move to Kanban Board'}
          >
            <span>{isNoteType ? 'Go to Note' : 'Go to Board'}</span>
            <ExternalLink className="w-3 h-3 text-secondaryGray" />
          </button>
          <button
            type="button"
            onClick={() => setActiveSidebarNode(null)}
            className="p-1.5 rounded-lg text-secondaryGray hover:text-primaryDark hover:bg-black/5 transition-colors cursor-pointer"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Switcher Bar */}
      <div className="px-4 py-2 bg-bg border-b border-border/80 flex items-center justify-between gap-2 shrink-0">
        <span className="font-mono text-[11px] font-medium text-secondaryGray shrink-0">
          Linked record:
        </span>
        {isNoteType ? (
          <select
            value={currentNote?.id || ''}
            onChange={(e) => handleSelectNote(e.target.value)}
            className="flex-1 text-xs font-sans p-1 bg-white border border-border rounded-lg text-primaryDark outline-none cursor-pointer truncate"
          >
            {notes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title} {n.folder ? `(${n.folder})` : ''}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={currentBoard?.id || ''}
            onChange={(e) => handleSelectBoard(e.target.value)}
            className="flex-1 text-xs font-sans p-1 bg-white border border-border rounded-lg text-primaryDark outline-none cursor-pointer truncate"
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Toast notification banner if card copied to today */}
      {todayToast && (
        <div className="mx-4 mt-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-sans flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{todayToast}</span>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {isNoteType ? (
          // =========================================================================
          // NOTE NODE CONTENT: STRICTLY READ-ONLY
          // =========================================================================
          currentNote ? (
            <div className="flex flex-col gap-3">
              {/* Note Metadata Card */}
              <div className="bg-white p-3.5 rounded-2xl border border-border shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface text-secondaryGray border border-border/60 uppercase">
                    <Folder className="w-2.5 h-2.5" />
                    {currentNote.folder || 'GENERAL'}
                  </span>
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: currentNote.categoryColor || '#EEEDFD' }}
                    title="Category color"
                  />
                </div>
                <h2 className="font-display font-bold text-lg text-primaryDark leading-snug">
                  {currentNote.title}
                </h2>
                <div className="flex items-center justify-between font-mono text-[10px] text-midGray">
                  <span>Last updated {new Date(currentNote.updatedAt).toLocaleDateString()}</span>
                  <span className="bg-[#FAF8F5] px-2 py-0.5 rounded text-[9px] border border-border/60">
                    READ-ONLY PREVIEW
                  </span>
                </div>
              </div>

              {/* Note Document Body (Read-Only) */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] font-bold text-midGray uppercase tracking-wider">
                  Document Content
                </span>
                <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs">
                  {renderNoteReadonlyContent()}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-secondaryGray">No note linked yet.</div>
          )
        ) : // =========================================================================
        // KANBAN NODE CONTENT: READ AND WRITE
        // =========================================================================
        currentBoard ? (
          <div className="flex flex-col gap-3.5">
            {/* Board Header & Metrics */}
            <div className="bg-white p-3.5 rounded-2xl border border-border shadow-2xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: currentBoard.colorTag || '#818CF8' }}
                  />
                  <h2 className="font-display font-bold text-base text-primaryDark truncate">
                    {currentBoard.title}
                  </h2>
                </div>
                <span className="font-mono text-[10px] text-secondaryGray shrink-0">
                  {currentBoard.cards.length} cards
                </span>
              </div>

              {/* Live Progress Bar */}
              {(() => {
                const total = currentBoard.cards.length;
                const completed = currentBoard.cards.filter(
                  (c) =>
                    Boolean(c.completedAt) || c.columnId === 'complete' || c.columnId === 'done'
                ).length;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] font-sans text-secondaryGray">
                      <span>Sprint deliverables</span>
                      <span className="font-mono font-medium text-primaryDark">
                        {completed}/{total} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border/60 overflow-hidden">
                      <div
                        className="h-full bg-primaryDark transition-all duration-300 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Columns Header Bar with Add Column action */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-midGray uppercase tracking-wider">
                Columns & Interactive Deliverables
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingColumn(!isAddingColumn);
                  setNewColTitle('');
                }}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-surface border border-border text-secondaryGray hover:text-primaryDark text-xs font-sans font-medium flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                title="Add a custom column to this Kanban board"
              >
                <Plus className="w-3 h-3 text-secondaryGray" />
                <span>Add column</span>
              </button>
            </div>

            {/* Inline Add Column Form */}
            {isAddingColumn && (
              <form
                onSubmit={handleAddColumnSubmit}
                className="p-3 bg-white rounded-2xl border border-indigo-200 shadow-2xs flex flex-col gap-2.5 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-mono-xs font-bold text-primaryDark uppercase">
                    New Workflow Column
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingColumn(false)}
                    className="p-1 text-secondaryGray hover:text-primaryDark cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="Column title (e.g. In Review, QA)..."
                  className="text-xs font-sans px-3 py-1.5 bg-bg border border-border rounded-xl text-primaryDark outline-none focus:border-primaryDark"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="font-mono text-[10px] text-secondaryGray mr-1">Theme:</span>
                  {COLUMN_THEMES.map((theme) => {
                    const isSelected = newColTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setNewColTheme(theme.id)}
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-sans border transition-all flex items-center gap-1 cursor-pointer',
                          isSelected
                            ? 'border-primaryDark bg-surface font-semibold text-primaryDark'
                            : 'border-border/80 bg-white text-secondaryGray hover:text-primaryDark'
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: theme.dotColor }}
                        />
                        <span>{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsAddingColumn(false)}
                    className="px-2 py-1 text-xs text-secondaryGray hover:text-primaryDark cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newColTitle.trim()}
                    className="px-3 py-1 text-xs font-semibold bg-primaryDark text-white rounded-xl hover:bg-midGray disabled:opacity-40 cursor-pointer"
                  >
                    Create Column
                  </button>
                </div>
              </form>
            )}

            {/* Columns & Cards List (Read + Write) */}
            <div className="flex flex-col gap-3">
              {currentBoard.columns.map((col) => {
                const colCards = currentBoard.cards.filter(
                  (c) => c.columnId === col.id || (col.id === 'done' && c.columnId === 'complete')
                );
                const sortedColCards = [...colCards].sort((a, b) => {
                  const rankA = a.positionRank != null ? parseFloat(a.positionRank) : a.orderIndex;
                  const rankB = b.positionRank != null ? parseFloat(b.positionRank) : b.orderIndex;
                  return rankA - rankB;
                });
                const isCompleteCol = col.id === 'complete' || col.id === 'done';
                const isAddingToThisCol = addingToColId === col.id;
                const isColumnTarget = dragOverColId === col.id;

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => handleColumnDragOver(e, col.id)}
                    onDragLeave={handleColumnDragLeave}
                    onDrop={(e) => handleDropOnColumn(e, col.id, sortedColCards)}
                    className={cn(
                      'bg-white rounded-2xl border p-3 flex flex-col gap-2 shadow-2xs transition-all duration-150',
                      isColumnTarget
                        ? 'border-indigo-400 ring-2 ring-indigo-300/40 bg-indigo-50/20'
                        : 'border-border'
                    )}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: col.dotColor || '#A8A29E' }}
                        />
                        <span className="font-sans text-xs font-bold text-primaryDark">
                          {col.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-secondaryGray">
                          {sortedColCards.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingToColId(isAddingToThisCol ? null : col.id);
                            setNewCardTitle('');
                            setNewCardDesc('');
                          }}
                          className="p-1 rounded-md text-secondaryGray hover:text-primaryDark hover:bg-surface transition-colors cursor-pointer"
                          title="Add card to column"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Add Card Form (Write Feature) */}
                    {isAddingToThisCol && (
                      <div className="p-2.5 rounded-xl bg-surface border border-border/80 flex flex-col gap-2">
                        <input
                          type="text"
                          value={newCardTitle}
                          onChange={(e) => setNewCardTitle(e.target.value)}
                          placeholder="Card title..."
                          className="text-xs font-sans p-1.5 bg-white border border-border rounded-lg text-primaryDark outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCardSubmit(col.id);
                            if (e.key === 'Escape') setAddingToColId(null);
                          }}
                        />
                        <textarea
                          value={newCardDesc}
                          onChange={(e) => setNewCardDesc(e.target.value)}
                          placeholder="Description (optional)..."
                          rows={2}
                          className="text-xs font-sans p-1.5 bg-white border border-border rounded-lg text-primaryDark outline-none resize-none"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAddingToColId(null)}
                            className="px-2 py-1 text-[11px] text-secondaryGray hover:text-primaryDark cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddCardSubmit(col.id)}
                            className="px-2.5 py-1 text-[11px] bg-primaryDark text-bg font-semibold rounded-lg hover:bg-primaryDark/90 cursor-pointer"
                          >
                            Add Card
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cards in this lane */}
                    {sortedColCards.length === 0 && !isAddingToThisCol ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingToColId(col.id);
                          setNewCardTitle('');
                          setNewCardDesc('');
                        }}
                        className={cn(
                          'w-full text-[11px] text-secondaryGray/70 italic px-2 py-3.5 border border-dashed rounded-xl text-center transition-colors cursor-pointer hover:bg-surface/50 hover:border-primaryDark/30',
                          isColumnTarget
                            ? 'border-indigo-400 bg-indigo-50/50 text-indigo-700 font-medium'
                            : 'border-border/60'
                        )}
                      >
                        {isColumnTarget ? 'Drop card here' : 'No cards in lane — click to add card'}
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {sortedColCards.map((card, idx) => {
                          const isCardDone = isCompleteCol || Boolean(card.completedAt);
                          const tagStyle = getTagStyle(card.tagLabel);
                          const isExpanded = expandedCardId === card.id;
                          const isDraggingThis = draggedCardId === card.id;
                          const showTopDropLine =
                            isColumnTarget && dropIndex === idx && !isDraggingThis;
                          const showBottomDropLine =
                            isColumnTarget &&
                            dropIndex === sortedColCards.length &&
                            idx === sortedColCards.length - 1 &&
                            !isDraggingThis;

                          return (
                            <div
                              key={card.id}
                              onDragOver={(e) => handleCardDragOver(e, col.id, idx)}
                              className="flex flex-col relative"
                            >
                              {showTopDropLine && (
                                <div className="h-1 w-full bg-indigo-500 rounded-full mb-1 animate-pulse" />
                              )}

                              <div
                                draggable={!isExpanded}
                                onDragStart={(e) => handleCardDragStart(e, card)}
                                onDragEnd={handleCardDragEnd}
                                className={cn(
                                  'p-2.5 rounded-xl bg-surface/60 hover:bg-surface border border-border/60 flex flex-col gap-2 transition-all',
                                  isDraggingThis
                                    ? 'opacity-30 scale-[0.98]'
                                    : 'hover:border-border cursor-grab active:cursor-grabbing'
                                )}
                              >
                                {/* Card Row */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <div
                                      className="text-secondaryGray/50 hover:text-primaryDark shrink-0 p-0.5"
                                      title="Drag to move card"
                                    >
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleCard(card);
                                      }}
                                      className="text-secondaryGray hover:text-primaryDark transition-colors shrink-0 cursor-pointer mt-0.5"
                                      title={isCardDone ? 'Mark as incomplete' : 'Mark as complete'}
                                    >
                                      {isCardDone ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-secondaryGray/60" />
                                      )}
                                    </button>
                                    <span
                                      onClick={() => {
                                        if (isExpanded) {
                                          setExpandedCardId(null);
                                        } else {
                                          setExpandedCardId(card.id);
                                          setEditTitle(card.title);
                                          setEditDesc(card.description || '');
                                        }
                                      }}
                                      className={cn(
                                        'text-xs font-sans cursor-pointer hover:underline truncate select-none',
                                        isCardDone
                                          ? 'text-secondaryGray line-through'
                                          : 'text-primaryDark font-medium'
                                      )}
                                    >
                                      {card.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSendToToday(card.id, card.title);
                                      }}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-sans bg-surface hover:bg-border text-secondaryGray hover:text-primaryDark transition-all flex items-center gap-0.5 cursor-pointer opacity-80 hover:opacity-100"
                                      title="Copy to Today's Queue (Cockpit)"
                                    >
                                      <ArrowRight className="w-2.5 h-2.5" />
                                      <span>Today</span>
                                    </button>

                                    {card.tagLabel && (
                                      <span
                                        className={cn(
                                          'px-1.5 py-0.5 rounded-md text-[9px] font-mono font-medium',
                                          tagStyle
                                        )}
                                      >
                                        {card.tagLabel}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isExpanded) {
                                          setExpandedCardId(null);
                                        } else {
                                          setExpandedCardId(card.id);
                                          setEditTitle(card.title);
                                          setEditDesc(card.description || '');
                                        }
                                      }}
                                      className="p-1 text-secondaryGray hover:text-primaryDark rounded cursor-pointer"
                                      title="Edit details"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-3 h-3" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Card Subtasks & Due Date Pill */}
                                {(card.checklist?.length || card.dueDate) && !isExpanded && (
                                  <div className="flex items-center gap-3 text-[10px] font-mono text-secondaryGray pl-11">
                                    {card.checklist && card.checklist.length > 0 && (
                                      <span>
                                        {card.checklist.filter((i) => i.completed).length}/
                                        {card.checklist.length} subtasks
                                      </span>
                                    )}
                                    {card.dueDate && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {card.dueDate.includes('T')
                                          ? card.dueDate.split('T')[0]
                                          : card.dueDate}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Card Expanded Edit View (Write Feature) */}
                                {isExpanded && (
                                  <div className="pt-2 border-t border-border/60 flex flex-col gap-2 pl-1">
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[10px] font-mono text-midGray uppercase">
                                        Title
                                      </label>
                                      <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="text-xs font-sans p-1.5 bg-white border border-border rounded-lg text-primaryDark outline-none"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                      <label className="text-[10px] font-mono text-midGray uppercase">
                                        Description
                                      </label>
                                      <textarea
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value)}
                                        rows={2}
                                        className="text-xs font-sans p-1.5 bg-white border border-border rounded-lg text-primaryDark outline-none resize-none"
                                      />
                                    </div>

                                    {/* Column Selector */}
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-mono text-midGray uppercase">
                                        Move Column:
                                      </span>
                                      <select
                                        value={card.columnId}
                                        onChange={(e) => handleMoveColumn(card.id, e.target.value)}
                                        className="text-xs p-1 bg-white border border-border rounded-lg text-primaryDark outline-none cursor-pointer"
                                      >
                                        {currentBoard.columns.map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.title}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Subtasks Checklist Editor */}
                                    <div className="flex flex-col gap-1.5 pt-1">
                                      <label className="text-[10px] font-mono text-midGray uppercase">
                                        Checklist Items
                                      </label>
                                      {card.checklist?.map((it) => (
                                        <div
                                          key={it.id}
                                          className="flex items-center justify-between gap-2 text-xs"
                                        >
                                          <div
                                            onClick={() => toggleChecklistItem(card.id, it.id)}
                                            className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0"
                                          >
                                            {it.completed ? (
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            ) : (
                                              <Circle className="w-3.5 h-3.5 text-secondaryGray/60 shrink-0" />
                                            )}
                                            <span
                                              className={cn(
                                                'truncate',
                                                it.completed
                                                  ? 'line-through text-secondaryGray'
                                                  : 'text-primaryDark'
                                              )}
                                            >
                                              {it.title}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => deleteChecklistItem(card.id, it.id)}
                                            className="p-1 text-secondaryGray hover:text-rose-600 rounded cursor-pointer shrink-0"
                                            title="Delete subtask"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}

                                      <div className="flex items-center gap-1 mt-1">
                                        <input
                                          type="text"
                                          value={newSubtaskTitle}
                                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                          placeholder="Add subtask..."
                                          className="flex-1 text-xs p-1 bg-white border border-border rounded text-primaryDark outline-none"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddSubtask(card.id);
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleAddSubtask(card.id)}
                                          className="px-2 py-1 bg-white hover:bg-surface border border-border text-[11px] rounded font-medium cursor-pointer"
                                        >
                                          Add
                                        </button>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-between pt-2 border-t border-border/60 mt-1">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          await deleteCard(card.id);
                                          setExpandedCardId(null);
                                        }}
                                        className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                      </button>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setExpandedCardId(null)}
                                          className="px-2 py-1 text-[11px] text-secondaryGray hover:text-primaryDark cursor-pointer"
                                        >
                                          Done
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveCardEdits(card.id)}
                                          className="px-2.5 py-1 text-[11px] bg-primaryDark text-bg font-semibold rounded-lg hover:bg-primaryDark/90 cursor-pointer"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {showBottomDropLine && (
                                <div className="h-1 w-full bg-indigo-500 rounded-full mt-1 animate-pulse" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Bottom Add Card Button */}
                    {!isAddingToThisCol && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingToColId(col.id);
                          setNewCardTitle('');
                          setNewCardDesc('');
                        }}
                        className="w-full py-1.5 px-2 rounded-xl border border-dashed border-border/80 hover:border-primaryDark/40 bg-surface/30 hover:bg-surface text-secondaryGray hover:text-primaryDark text-xs font-sans flex items-center justify-center gap-1 transition-all cursor-pointer mt-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-secondaryGray" />
                        <span>Add card</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-secondaryGray">No board linked yet.</div>
        )}
      </div>
    </div>
  );
};
