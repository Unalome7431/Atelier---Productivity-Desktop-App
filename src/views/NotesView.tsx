import React, { useEffect, useState } from 'react';
import { Plus, Pin, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useNotesStore } from '@/stores/useNotesStore';

export const NotesView: React.FC = () => {
  const { notes, activeNoteId, loadNotes, setActiveNoteId, createNote } = useNotesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    await createNote(noteTitle.trim(), 'Start writing thoughts, docs, or architecture notes...');
    setNoteTitle('');
    setIsNewNoteModalOpen(false);
  };

  return (
    <div className="flex-1 flex h-full bg-bg">
      {/* Notes Sidebar List */}
      <div className="w-72 border-r border-border bg-surface p-4 flex flex-col gap-4 select-none">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-display-4 text-primaryDark">Notes & Docs</h3>
          <Button
            variant="primary"
            size="icon"
            className="w-7 h-7"
            onClick={() => setIsNewNoteModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Notes */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-midGray" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-bg border border-border rounded-pill pl-8 pr-3 py-1.5 text-ui-rg-xs text-primaryDark placeholder:text-midGray outline-none focus:border-[#C5BDAF]"
          />
        </div>

        {/* Note List */}
        <div className="flex flex-col gap-2 overflow-y-auto">
          {filteredNotes.map((note) => {
            const isSelected = activeNote?.id === note.id;
            return (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`p-3 rounded-card border shadow-subtle flex flex-col gap-1 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-accent-indigo border-indigo-200/80 font-medium'
                    : 'bg-bg border-border hover:bg-surface'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-semibold text-ui-bold-sm text-primaryDark line-clamp-1">
                    {note.title}
                  </span>
                  {note.isPinned && (
                    <Pin className="w-3 h-3 text-indigo-700 fill-indigo-700 shrink-0 ml-1" />
                  )}
                </div>
                <p className="text-ui-rg-xs text-secondaryGray line-clamp-2">{note.content}</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant="default" size="xs">
                    {note.tags[0] || '#doc'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Body */}
      {activeNote ? (
        <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div>
            <span className="font-mono text-mono-xs text-midGray uppercase">
              Last updated{' '}
              {new Date(activeNote.updatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              • Local SQLite
            </span>
            <h1 className="font-display font-bold text-display-2 text-primaryDark mt-2">
              {activeNote.title}
            </h1>
          </div>

          <div className="text-secondaryGray text-ui-rg-sm leading-relaxed space-y-4 font-sans">
            <p>{activeNote.content}</p>
            <div className="p-4 rounded-lg bg-surface border border-border">
              <h4 className="font-display font-semibold text-display-6 text-primaryDark mb-1">
                ✦ Local & Cloud Persistence
              </h4>
              <p className="text-ui-rg-xs text-secondaryGray">
                All changes made to this document write directly to local SQLite and are queued with
                monotonic timestamps for remote sync.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-secondaryGray text-ui-rg-sm">
          Select or create a note to begin editing.
        </div>
      )}

      {/* New Note Modal */}
      <Modal
        isOpen={isNewNoteModalOpen}
        onClose={() => setIsNewNoteModalOpen(false)}
        title="Create Knowledge Note"
        description="Add a new documentation file to your studio repository."
      >
        <form onSubmit={handleCreateNote} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Note Title
            </label>
            <input
              type="text"
              autoFocus
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="e.g. Supabase Edge Functions Architecture..."
              className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsNewNoteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Note
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
