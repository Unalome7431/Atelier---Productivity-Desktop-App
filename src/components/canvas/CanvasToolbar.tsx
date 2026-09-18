import React, { useState, useMemo, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Type,
  CheckSquare,
  FileEdit,
  Image as ImageIcon,
  SquareDashed,
  Search,
  X,
  Plus,
  KanbanSquare,
  FileText,
} from 'lucide-react';
import { useCanvasStore, CanvasToolType } from '@/stores/useCanvasStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { KanbanBoard, NoteDocument } from '@/types';
import { cn } from '@/lib/utils';

export const CanvasToolbar: React.FC = () => {
  const { screenToFlowPosition } = useReactFlow();
  const { activeTool, setActiveTool, addNode } = useCanvasStore();
  const { notes, loadNotes } = useNotesStore();
  const { boards, loadBoards } = useKanbanStore();

  const [pickerType, setPickerType] = useState<'note' | 'kanban' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Preload notes and boards on toolbar mount
  useEffect(() => {
    if (notes.length === 0) loadNotes();
    if (boards.length === 0) loadBoards();
  }, [notes.length, boards.length, loadNotes, loadBoards]);

  // Handle Escape key to close popup menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pickerType) {
        setPickerType(null);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pickerType]);

  const getCenterFlow = () => {
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
    return centerFlow;
  };

  const handleToolClick = (tool: CanvasToolType) => {
    // If clicking Kanban or Note, toggle the reference popup menu instead of auto-spawning
    if (tool === 'kanban') {
      setActiveTool('select');
      setSearchQuery('');
      setPickerType((prev) => (prev === 'kanban' ? null : 'kanban'));
      return;
    }

    if (tool === 'note') {
      setActiveTool('select');
      setSearchQuery('');
      setPickerType((prev) => (prev === 'note' ? null : 'note'));
      return;
    }

    // Otherwise close any open popup and spawn the direct tool
    setPickerType(null);
    setActiveTool('select');

    const centerFlow = getCenterFlow();
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

  // Add Kanban Node for specifically selected board
  const handleSelectBoard = (targetBoard: KanbanBoard) => {
    const centerFlow = getCenterFlow();
    const nodeId = `node_${Date.now()}`;
    const boardCards = targetBoard.cards || [];
    const completedCards = boardCards.filter(
      (c) => Boolean(c.completedAt) || c.columnId === 'complete' || c.columnId === 'done'
    ).length;

    addNode({
      id: nodeId,
      type: 'kanban',
      position: centerFlow,
      data: {
        title: targetBoard.title,
        badge: 'KANBAN',
        boardId: targetBoard.id,
        color: targetBoard.colorTag || '#DEE5FD',
        items: boardCards.slice(0, 4).map((c) => ({
          id: c.id,
          title: c.title,
          completed: Boolean(c.completedAt) || c.columnId === 'complete' || c.columnId === 'done',
        })),
        completedCount: completedCards,
        totalCount: boardCards.length,
      },
    });

    setPickerType(null);
    setSearchQuery('');
  };

  // Add Note Node for specifically selected note
  const handleSelectNote = (targetNote: NoteDocument) => {
    const centerFlow = getCenterFlow();
    const nodeId = `node_${Date.now()}`;
    const plainSnippet = targetNote.content
      ? targetNote.content
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 140)
      : 'Linked note document in Atelier.';

    addNode({
      id: nodeId,
      type: 'note',
      position: centerFlow,
      data: {
        title: targetNote.title,
        referenceId: targetNote.id,
        content: plainSnippet,
        badge: targetNote.folder?.toUpperCase() || 'NOTE',
        color: targetNote.categoryColor || '#D1FBE3',
      },
    });

    setPickerType(null);
    setSearchQuery('');
  };

  // Filtered lists for popup menu
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const q = searchQuery.toLowerCase();
    return boards.filter((b) => b.title.toLowerCase().includes(q));
  }, [boards, searchQuery]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || (n.folder && n.folder.toLowerCase().includes(q))
    );
  }, [notes, searchQuery]);

  const tools: Array<{ id: CanvasToolType; label: string; icon: React.ElementType }> = [
    { id: 'text', label: 'Text Note', icon: Type },
    { id: 'kanban', label: 'Kanban Card', icon: CheckSquare },
    { id: 'note', label: 'Linked Doc', icon: FileEdit },
    { id: 'media', label: 'Media Item', icon: ImageIcon },
    { id: 'section', label: 'Section Area', icon: SquareDashed },
  ];

  return (
    <>
      {/* Floating Tool Palette */}
      <div className="absolute top-24 left-6 z-20 flex flex-col items-center bg-white/95 rounded-2xl p-1.5 shadow-float border border-border gap-1 backdrop-blur-xs">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive =
            activeTool === t.id ||
            (pickerType === 'kanban' && t.id === 'kanban') ||
            (pickerType === 'note' && t.id === 'note');

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

      {/* Popup Menu to Choose Which Note or Kanban to Reference */}
      {pickerType && (
        <>
          {/* Backdrop for closing popup when clicking elsewhere */}
          <div
            className="fixed inset-0 z-25 bg-transparent"
            onClick={() => {
              setPickerType(null);
              setSearchQuery('');
            }}
          />

          {/* Anchored Popup Menu beside Toolbar */}
          <div className="absolute top-24 left-[76px] z-30 w-84 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-float border border-border flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150 select-none">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-2">
                {pickerType === 'kanban' ? (
                  <div className="w-6 h-6 rounded-lg bg-[#EBE7FF] flex items-center justify-center text-[#4338CA]">
                    <KanbanSquare className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-[#D1FAE5] flex items-center justify-center text-[#065F46]">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-sans text-xs font-bold text-primaryDark">
                    {pickerType === 'kanban' ? 'Choose Kanban Board' : 'Choose Knowledge Note'}
                  </span>
                  <span className="font-mono text-[10px] text-secondaryGray">
                    {pickerType === 'kanban'
                      ? 'Select board to place on canvas'
                      : 'Select note document to link'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPickerType(null);
                  setSearchQuery('');
                }}
                className="p-1 text-secondaryGray hover:text-primaryDark rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                title="Close menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-surface rounded-xl border border-border/70 text-xs">
              <Search className="w-3.5 h-3.5 text-secondaryGray shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={pickerType === 'kanban' ? 'Search boards...' : 'Search notes...'}
                autoFocus
                className="w-full bg-transparent outline-none text-xs font-sans text-primaryDark placeholder:text-secondaryGray/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-secondaryGray hover:text-primaryDark cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* List of items to reference */}
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-0.5">
              {pickerType === 'kanban' ? (
                filteredBoards.length === 0 ? (
                  <div className="py-6 text-center text-xs text-secondaryGray italic">
                    No matching boards found
                  </div>
                ) : (
                  filteredBoards.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSelectBoard(b)}
                      className="w-full p-2 rounded-xl hover:bg-surface border border-transparent hover:border-border/60 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: b.colorTag || '#818CF8' }}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-sans text-xs font-semibold text-primaryDark truncate group-hover:text-primaryDark">
                            {b.title}
                          </span>
                          <span className="font-mono text-[10px] text-secondaryGray">
                            {b.cards?.length || 0} cards · {b.columns?.length || 0} columns
                          </span>
                        </div>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-secondaryGray opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))
                )
              ) : filteredNotes.length === 0 ? (
                <div className="py-6 text-center text-xs text-secondaryGray italic">
                  No matching notes found
                </div>
              ) : (
                filteredNotes.map((n) => {
                  const plain = n.content
                    ? n.content
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/&nbsp;/g, ' ')
                        .trim()
                        .slice(0, 50)
                    : 'Empty note document';

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleSelectNote(n)}
                      className="w-full p-2 rounded-xl hover:bg-surface border border-transparent hover:border-border/60 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                          style={{ backgroundColor: n.categoryColor || '#EEEDFD' }}
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-sans text-xs font-semibold text-primaryDark truncate group-hover:text-primaryDark">
                              {n.title}
                            </span>
                            {n.folder && (
                              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-surface text-secondaryGray border border-border/60 uppercase shrink-0">
                                {n.folder}
                              </span>
                            )}
                          </div>
                          <span className="font-sans text-[11px] text-secondaryGray truncate">
                            {plain}
                          </span>
                        </div>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-secondaryGray opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
