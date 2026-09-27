import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  ExternalLink,
  FileText,
  KanbanSquare,
  CheckCircle2,
  Clock,
  Folder,
  ArrowRight,
} from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { useAppStore } from '@/stores/useAppStore';
import { CanvasNodeData } from '@/types';
import { CalloutType, CALLOUT_CONFIGS } from '@/components/notes/CalloutComponent';
import { getTagStyle } from '@/lib/tagStyles';
import { cn } from '@/lib/utils';

interface NoteContentBlock {
  type: 'html' | 'callout';
  html?: string;
  calloutType?: CalloutType;
  eyebrow?: string;
  title?: string;
  innerHtml?: string;
}

function decodeHtmlAttr(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// Custom parser to identify TipTap callouts and preserve rich HTML formatting
function parseNoteContent(rawHtml: string): NoteContentBlock[] {
  if (!rawHtml || !rawHtml.trim()) return [];

  const calloutRegex = /(<div\s+[^>]*data-type=["']callout["'][^>]*>[\s\S]*?<\/div>)/gi;
  const parts = rawHtml.split(calloutRegex);
  const blocks: NoteContentBlock[] = [];

  for (const part of parts) {
    if (!part || !part.trim()) continue;

    const calloutMatch = part.match(
      /^<div\s+([^>]*data-type=["']callout["'][^>]*)>([\s\S]*?)<\/div>$/i
    );

    if (calloutMatch) {
      const attrs = calloutMatch[1];
      const innerHtml = calloutMatch[2];

      const typeMatch =
        attrs.match(/data-callout-type=["']([^"']*)["']/i) || attrs.match(/type=["']([^"']*)["']/i);
      const eyebrowMatch = attrs.match(/data-eyebrow=["']([^"']*)["']/i);
      const titleMatch = attrs.match(/data-title=["']([^"']*)["']/i);

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

      let eyebrow = eyebrowMatch ? decodeHtmlAttr(eyebrowMatch[1].trim()) : undefined;
      let title = titleMatch ? decodeHtmlAttr(titleMatch[1].trim()) : undefined;

      // Also support legacy/custom nested title markup if present
      const innerTitleMatch = innerHtml.match(
        /<div\s+class=["']callout-title["'][^>]*>([\s\S]*?)<\/div>/i
      );
      if (innerTitleMatch && !title) {
        const fullTitle = innerTitleMatch[1].replace(/<[^>]+>/g, '').trim();
        const splitParts = fullTitle.split(/[:\-—]/);
        if (splitParts.length > 1) {
          if (!eyebrow) eyebrow = splitParts[0].trim().toUpperCase();
          title = splitParts.slice(1).join('-').trim();
        } else {
          title = fullTitle;
        }
      }

      let cleanInner = innerHtml;
      if (innerTitleMatch) {
        cleanInner = cleanInner.replace(
          /<div\s+class=["']callout-title["'][^>]*>[\s\S]*?<\/div>/i,
          ''
        );
      }

      blocks.push({
        type: 'callout',
        calloutType,
        eyebrow: eyebrow || config.defaultEyebrow,
        title: title || undefined,
        innerHtml: cleanInner ? cleanInner.trim() : '',
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

// 1:1 Callout Component matching CalloutComponent.tsx
const CalloutReadOnly: React.FC<{
  type: CalloutType;
  eyebrow?: string;
  title?: string;
  innerHtml: string;
}> = ({ type, eyebrow, title, innerHtml }) => {
  const config = CALLOUT_CONFIGS[type] || CALLOUT_CONFIGS.decision;
  const Icon = config.icon;
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
          <Icon className={cn('w-4 h-4 shrink-0', config.eyebrowClass)} />
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
  const { boards, setActiveBoardId, sendToTodayQueue } = useKanbanStore();
  const { setActiveTab } = useAppStore();

  // Find the target node on the active canvas
  const node = useMemo(() => {
    if (!activeSidebarNode) return null;
    return nodes.find((n) => n.id === activeSidebarNode.nodeId) || null;
  }, [nodes, activeSidebarNode]);

  // Always reload fresh note & board records from DB when drawer opens or active node switches
  useEffect(() => {
    useNotesStore.getState().loadNotes();
    useKanbanStore.getState().loadBoards();
  }, [activeSidebarNode?.nodeId]);

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
            <div className="w-7 h-7 rounded-lg bg-accent-green flex items-center justify-center text-pastel-mint-text shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-accent-indigo flex items-center justify-center text-pastel-lavender-text shrink-0">
              <KanbanSquare className="w-4 h-4" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[10px] font-bold text-midGray uppercase tracking-wider">
              {isNoteType ? 'LINKED NOTE · READ ONLY' : 'LINKED KANBAN · READ ONLY'}
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
          currentNote ? (
            <div className="flex flex-col gap-4">
              {/* Note Metadata Banner */}
              <div className="bg-white p-4 rounded-2xl border border-border shadow-2xs flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {currentNote.folder && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-bg text-midGray border border-border flex items-center gap-1">
                      <Folder className="w-3 h-3 text-secondaryGray" />
                      <span>{currentNote.folder}</span>
                    </span>
                  )}
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentNote.categoryColor || '#D1FBE3' }}
                  />
                </div>
                <h2 className="font-display font-bold text-lg text-primaryDark leading-snug">
                  {currentNote.title}
                </h2>
                <div className="flex items-center justify-between font-mono text-[10px] text-midGray">
                  <span>Last updated {new Date(currentNote.updatedAt).toLocaleDateString()}</span>
                  <span className="bg-bg px-2 py-0.5 rounded text-[9px] border border-border/60">
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
        // KANBAN NODE CONTENT: READ ONLY (NO CHECKLISTS, NO WRITE CONTROLS)
        // =========================================================================
        currentBoard ? (
          <div className="flex flex-col gap-3.5">
            {/* Board Header & Metrics */}
            <div className="bg-white p-3.5 rounded-2xl border border-border shadow-2xs flex flex-col gap-2">
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
                <span className="font-mono text-[10px] text-secondaryGray shrink-0 bg-surface px-2 py-0.5 rounded-full border border-border/60">
                  {currentBoard.cards.length} {currentBoard.cards.length === 1 ? 'card' : 'cards'}
                </span>
              </div>
            </div>

            {/* Columns & Deliverables List (Read Only) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="font-mono text-[10px] font-bold text-midGray uppercase tracking-wider">
                  Columns & Deliverables
                </span>
                <span className="font-mono text-[9px] text-midGray bg-white px-2 py-0.5 rounded border border-border/60">
                  READ-ONLY PREVIEW
                </span>
              </div>

              {currentBoard.columns.map((col) => {
                const colCards = currentBoard.cards.filter(
                  (c) => c.columnId === col.id || (col.id === 'done' && c.columnId === 'complete')
                );
                const sortedColCards = [...colCards].sort((a, b) => {
                  const rankA = a.positionRank != null ? parseFloat(a.positionRank) : a.orderIndex;
                  const rankB = b.positionRank != null ? parseFloat(b.positionRank) : b.orderIndex;
                  return rankA - rankB;
                });

                return (
                  <div
                    key={col.id}
                    className="bg-white rounded-2xl border border-border p-3.5 flex flex-col gap-2.5 shadow-2xs"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-0.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: col.dotColor || '#A8A29E' }}
                        />
                        <span className="font-sans text-xs font-bold text-primaryDark">
                          {col.title}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-semibold text-secondaryGray bg-surface px-2 py-0.5 rounded-full border border-border/60">
                        {sortedColCards.length}
                      </span>
                    </div>

                    {/* Cards List (Read-Only, NO Checklist) */}
                    {sortedColCards.length === 0 ? (
                      <div className="text-[11px] text-secondaryGray/70 italic px-2 py-3 border border-dashed rounded-xl text-center border-border/60">
                        No cards in this column
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {sortedColCards.map((card) => {
                          const tagStyle = getTagStyle(card.tagLabel);
                          return (
                            <div
                              key={card.id}
                              className="p-3 rounded-xl bg-surface/70 border border-border/70 flex flex-col gap-1.5 shadow-2xs hover:border-border transition-colors"
                            >
                              {/* Card Title & Tag & Today action */}
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-sans font-semibold text-primaryDark leading-snug">
                                  {card.title}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {card.tagLabel && (
                                    <span
                                      className={cn(
                                        'px-2 py-0.5 rounded-md text-[9px] font-mono font-medium',
                                        tagStyle
                                      )}
                                    >
                                      {card.tagLabel}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleSendToToday(card.id, card.title)}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-sans bg-white hover:bg-border text-secondaryGray hover:text-primaryDark transition-all flex items-center gap-0.5 cursor-pointer opacity-80 hover:opacity-100 border border-border/60"
                                    title="Copy to Today's Queue (Cockpit)"
                                  >
                                    <ArrowRight className="w-2.5 h-2.5" />
                                    <span>Today</span>
                                  </button>
                                </div>
                              </div>

                              {/* Card Description */}
                              {card.description && (
                                <p className="text-[11px] font-sans text-secondaryGray line-clamp-2 leading-relaxed">
                                  {card.description}
                                </p>
                              )}

                              {/* Due Date (Checklist deliberately omitted) */}
                              {card.dueDate && (
                                <div className="flex items-center gap-1 text-[10px] font-mono text-secondaryGray pt-0.5">
                                  <Clock className="w-3 h-3 text-secondaryGray" />
                                  <span>
                                    {card.dueDate.includes('T')
                                      ? card.dueDate.split('T')[0]
                                      : card.dueDate}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
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
