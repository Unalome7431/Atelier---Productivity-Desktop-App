import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Callout } from '@/components/notes/CalloutExtension';
import { CustomMention } from '@/components/notes/MentionExtension';
import { MentionList, MentionListRef } from '@/components/notes/MentionList';
import { FloatingBubbleMenu } from '@/components/notes/FloatingBubbleMenu';
import { EditorToolbar } from '@/components/notes/EditorToolbar';
import { BacklinksSection } from '@/components/notes/BacklinksSection';
import { NoteHeader } from '@/components/notes/NoteHeader';
import { useNotesStore } from '@/stores/useNotesStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { useTasksStore } from '@/stores/useTasksStore';
import { useAppStore } from '@/stores/useAppStore';
import { MentionItem, NavigationTab } from '@/types';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/common/Button';

export const NotesView: React.FC = () => {
  const {
    notes,
    activeNoteId,
    loadNotes,
    updateNote,
    createNote,
    backlinks,
    isSaving,
    lastSavedAt,
    setActiveNoteId,
  } = useNotesStore();

  const { setActiveCanvasId } = useCanvasStore();
  const { setActiveBoardId, openCardDrawer } = useKanbanStore();
  const { setActiveTab } = useAppStore();

  const [mentionState, setMentionState] = useState<{
    isOpen: boolean;
    items: MentionItem[];
    rect: DOMRect | null;
  }>({
    isOpen: false,
    items: [],
    rect: null,
  });

  const mentionListRef = useRef<MentionListRef | null>(null);
  const suggestionPropsRef = useRef<any>(null);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHtmlRef = useRef<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || notes[0];
  }, [notes, activeNoteId]);

  // Flush any pending unsaved html directly into store & DB
  const flushSave = useCallback(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
    if (pendingHtmlRef.current !== null && activeNote) {
      updateNote(activeNote.id, { content: pendingHtmlRef.current });
      pendingHtmlRef.current = null;
    }
  }, [activeNote, updateNote]);

  // Clean unmount flush
  useEffect(() => {
    return () => {
      flushSave();
    };
  }, [flushSave]);

  // Mention configuration
  const mentionSuggestion = useMemo(
    () => ({
      items: ({ query }: { query: string }) => {
        const q = query.toLowerCase();
        const items: MentionItem[] = [];

        // 1. Kanban Cards
        const boards = useKanbanStore.getState().boards;
        for (const b of boards) {
          for (const c of b.cards) {
            if (!q || c.title.toLowerCase().includes(q)) {
              items.push({
                id: c.id,
                type: 'card',
                title: c.title,
                subtitle: `Board: ${b.title}`,
                containerId: b.id,
              });
            }
          }
        }

        // 2. Canvases
        const canvases = useCanvasStore.getState().canvases;
        for (const c of canvases) {
          if (!q || c.title.toLowerCase().includes(q)) {
            items.push({
              id: c.id,
              type: 'canvas',
              title: c.title,
              subtitle: 'Spatial Canvas',
              containerId: c.id,
            });
          }
        }

        // 3. Daily Tasks
        const todayTasks = useTasksStore.getState().tasks;
        const inboxTasks = useTasksStore.getState().inboxTasks;
        const allTasks = [...todayTasks, ...inboxTasks];
        for (const t of allTasks) {
          if (!q || t.title.toLowerCase().includes(q)) {
            items.push({
              id: t.id,
              type: 'task',
              title: t.title,
              subtitle: t.scheduledDate ? "Today's Task" : 'Inbox Backlog',
            });
          }
        }

        // 4. Other Notes
        const allNotes = useNotesStore.getState().notes;
        const curId = useNotesStore.getState().activeNoteId;
        for (const n of allNotes) {
          if (n.id !== curId && (!q || n.title.toLowerCase().includes(q))) {
            items.push({
              id: n.id,
              type: 'note',
              title: n.title,
              subtitle: n.folder || 'Note',
              containerId: n.id,
            });
          }
        }

        return items.slice(0, 8);
      },

      render: () => {
        return {
          onStart: (props: any) => {
            suggestionPropsRef.current = props;
            setMentionState({
              isOpen: true,
              items: props.items,
              rect: props.clientRect?.() || null,
            });
          },
          onUpdate: (props: any) => {
            suggestionPropsRef.current = props;
            setMentionState((prev) => ({
              ...prev,
              items: props.items,
              rect: props.clientRect?.() || prev.rect,
            }));
          },
          onKeyDown: (props: any) => {
            suggestionPropsRef.current = props;
            if (props.event.key === 'Escape') {
              setMentionState((prev) => ({ ...prev, isOpen: false }));
              return true;
            }
            return mentionListRef.current?.onKeyDown(props) || false;
          },
          onExit: () => {
            suggestionPropsRef.current = null;
            setMentionState((prev) => ({ ...prev, isOpen: false }));
          },
        };
      },
    }),
    []
  );

  const handleContentUpdate = useCallback(
    (html: string) => {
      if (!activeNote) return;
      pendingHtmlRef.current = html;
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

      // Fast 200ms debounce for zero perceived lag
      autosaveTimeoutRef.current = setTimeout(() => {
        flushSave();
      }, 200);
    },
    [activeNote, flushSave]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Callout,
      CustomMention.configure({
        suggestion: mentionSuggestion,
      }),
      Placeholder.configure({
        placeholder: 'Start writing specifications, architecture decisions, or type @ to link entities...',
      }),
    ],
    content: activeNote?.content || '',
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none min-h-[360px] py-4',
      },
    },
    onUpdate: ({ editor: e }) => {
      handleContentUpdate(e.getHTML());
    },
    onBlur: () => {
      flushSave();
    },
  });

  // Synchronize editor content when active note switches
  useEffect(() => {
    if (editor && activeNote) {
      flushSave();
      const currentHtml = editor.getHTML();
      if (currentHtml !== activeNote.content) {
        editor.commands.setContent(activeNote.content || '', { emitUpdate: false });
      }
    }
  }, [activeNote?.id, editor]);

  // Click handler on mention chips inside editor
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('.atelier-mention');
    if (!target) return;

    const entityType = target.getAttribute('data-entity-type');
    const entityId = target.getAttribute('data-id');
    const containerId = target.getAttribute('data-container-id');

    if (!entityType || !entityId) return;

    if (entityType === 'canvas') {
      setActiveCanvasId(entityId);
      setActiveTab('canvas' as NavigationTab);
    } else if (entityType === 'card') {
      if (containerId) {
        setActiveBoardId(containerId);
      }
      openCardDrawer(entityId);
      setActiveTab('kanban' as NavigationTab);
    } else if (entityType === 'task') {
      setActiveTab('cockpit' as NavigationTab);
    } else if (entityType === 'note') {
      setActiveNoteId(entityId);
    }
  };

  const handleCreateNew = async () => {
    await createNote({
      title: 'New Specification',
      categoryColor: '#EEEDFD',
    });
  };

  if (!activeNote && notes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-bg h-full select-none">
        <div className="w-12 h-12 rounded-2xl bg-accent-indigo flex items-center justify-center text-indigo-700 shadow-xs">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="font-display font-bold text-display-3 text-primaryDark">No Notes Yet</h3>
        <p className="font-sans text-xs text-secondaryGray max-w-sm text-center">
          Create your first technical specification, architecture record, or project log.
        </p>
        <Button variant="primary" size="sm" onClick={handleCreateNew} className="gap-1.5 mt-2">
          <Plus className="w-3.5 h-3.5" />
          <span>Create Note</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-bg overflow-hidden relative">
      {/* Floating Bubble Menu on Selection */}
      <FloatingBubbleMenu editor={editor} />

      {/* Floating Mention Autocomplete Suggestion Popup */}
      {mentionState.isOpen && mentionState.rect && (
        <div
          style={{
            position: 'fixed',
            top: `${Math.min(window.innerHeight - 300, mentionState.rect.bottom + 6)}px`,
            left: `${Math.min(window.innerWidth - 320, Math.max(10, mentionState.rect.left))}px`,
            zIndex: 100,
          }}
        >
          <MentionList
            ref={mentionListRef}
            items={mentionState.items}
            command={(item) => {
              if (suggestionPropsRef.current?.command) {
                suggestionPropsRef.current.command({
                  id: item.id,
                  label: item.title,
                  entityType: item.type,
                  containerId: item.containerId,
                });
              }
              setMentionState((prev) => ({ ...prev, isOpen: false }));
            }}
          />
        </div>
      )}

      {/* Main Document Workspace Canvas */}
      <div className="flex-1 overflow-y-auto w-full p-6 md:p-10 lg:p-12">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {/* Note Header (matching Figma Note A + CANVAS A badge) */}
          {activeNote && <NoteHeader note={activeNote} />}

          {/* Top Sticky/Docked Formatting Toolbar (matching Figma) */}
          <EditorToolbar editor={editor} isSaving={isSaving} lastSavedAt={lastSavedAt} />

          {/* Tiptap Rich Text Content Area */}
          <div onClick={handleEditorClick} className="relative">
            <EditorContent editor={editor} />
          </div>

          {/* Bidirectional Backlinks Section */}
          <BacklinksSection backlinks={backlinks} />
        </div>
      </div>
    </div>
  );
};
