import React, { useState, useEffect, useMemo } from 'react';
import { Download, Pin, Trash2, ChevronDown, Check, Plus, Folder, X, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ExportModal } from './ExportModal';
import { NoteDocument } from '@/types';
import { useNotesStore } from '@/stores/useNotesStore';
import { cn } from '@/lib/utils';

export interface NoteHeaderProps {
  note: NoteDocument;
}

const PASTEL_COLORS = [
  { label: 'Lavender', value: '#EEEDFD', dot: '#818CF8' },
  { label: 'Mint', value: '#D0F8E3', dot: '#34D399' },
  { label: 'Sky Blue', value: '#D7E3FF', dot: '#60A5FA' },
  { label: 'Sand', value: '#F5F0E6', dot: '#FBBF24' },
  { label: 'Rose Pink', value: '#FED7E8', dot: '#F472B6' },
];

/**
 * Top floating action bar containing Folder Management, Color Selector, Pinning, Export, and Delete.
 */
export const NoteHeaderActions: React.FC<NoteHeaderProps> = ({ note }) => {
  const { updateNote, deleteNote, togglePinNote, getFolders, createFolder } = useNotesStore();

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const [folderSearch, setFolderSearch] = useState('');
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const folders = getFolders();
  const filteredFolders = useMemo(() => {
    if (!folderSearch.trim()) return folders;
    const q = folderSearch.toLowerCase().trim();
    return folders.filter((f) => f.toLowerCase().includes(q));
  }, [folders, folderSearch]);

  const handleSelectFolder = (folderName?: string) => {
    updateNote(note.id, { folder: folderName, category: folderName });
    setIsFolderMenuOpen(false);
    setFolderSearch('');
  };

  const handleCreateFolder = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = (newFolderName || folderSearch).trim();
    if (!trimmed) return;
    createFolder(trimmed);
    updateNote(note.id, { folder: trimmed, category: trimmed });
    setNewFolderName('');
    setFolderSearch('');
    setIsCreatingFolder(false);
    setIsFolderMenuOpen(false);
  };

  const handleSelectColor = (colorValue: string) => {
    updateNote(note.id, { categoryColor: colorValue });
    setIsColorMenuOpen(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap select-none w-full">
      {/* Left: Folder Management, Color, Pinning */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Folder Pill Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsFolderMenuOpen(!isFolderMenuOpen);
              setFolderSearch('');
            }}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-sans font-medium transition-colors cursor-pointer',
              note.folder
                ? 'bg-surface hover:bg-white text-primaryDark border-border shadow-2xs'
                : 'bg-surface/50 hover:bg-surface text-secondaryGray hover:text-primaryDark border-border/70 border-dashed'
            )}
          >
            <Folder className="w-3 h-3 text-secondaryGray" />
            <span>{note.folder || 'Add to Folder'}</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {isFolderMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-border shadow-float rounded-2xl p-2 z-40 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-1 border-b border-border/50 pb-1">
                <span className="text-[10px] font-mono font-bold text-midGray uppercase">
                  Folder
                </span>
                <span className="text-[10px] font-mono text-secondaryGray">
                  {folders.length} custom
                </span>
              </div>

              {/* Folder Search input */}
              {folders.length > 2 && (
                <div className="relative">
                  <Search className="w-3 h-3 text-secondaryGray absolute left-2 top-2" />
                  <input
                    type="text"
                    autoFocus
                    value={folderSearch}
                    onChange={(e) => setFolderSearch(e.target.value)}
                    placeholder="Search folders..."
                    className="w-full bg-surface border border-border rounded-lg pl-6 pr-2 py-1 text-xs text-primaryDark outline-none focus:border-primaryDark"
                  />
                </div>
              )}

              <div className="flex flex-col gap-0.5 max-h-44 overflow-y-auto">
                {folders.length === 0 ? (
                  <div className="px-2 py-2 text-center text-[11px] font-sans text-secondaryGray">
                    No custom folders yet. Create one below.
                  </div>
                ) : filteredFolders.length === 0 ? (
                  <div className="px-2 py-2 text-center text-[11px] font-sans text-secondaryGray">
                    No matching folders.
                  </div>
                ) : (
                  filteredFolders.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleSelectFolder(f)}
                      className={cn(
                        'flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-sans text-left transition-colors cursor-pointer',
                        note.folder === f
                          ? 'bg-surface font-semibold text-primaryDark'
                          : 'text-secondaryGray hover:text-primaryDark hover:bg-bg'
                      )}
                    >
                      <span className="truncate">{f}</span>
                      {note.folder === f && <Check className="w-3 h-3 text-indigo-700" />}
                    </button>
                  ))
                )}

                {note.folder && (
                  <button
                    type="button"
                    onClick={() => handleSelectFolder(undefined)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-sans text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-t border-border/40 mt-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Remove from folder</span>
                  </button>
                )}
              </div>

              {isCreatingFolder ? (
                <form
                  onSubmit={handleCreateFolder}
                  className="p-1 flex items-center gap-1 border-t border-border/50 mt-1"
                >
                  <input
                    type="text"
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateFolder();
                      }
                      if (e.key === 'Escape') {
                        setIsCreatingFolder(false);
                      }
                    }}
                    placeholder="Folder name..."
                    className="flex-1 min-w-0 bg-bg border border-border rounded-lg px-2 py-1 text-xs text-primaryDark outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-lg bg-primaryDark hover:opacity-90 text-white text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="p-1 rounded-lg text-secondaryGray hover:text-primaryDark cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-sans text-secondaryGray hover:text-primaryDark hover:bg-bg transition-colors cursor-pointer border-t border-border/50 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Folder</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pastel Color Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface hover:bg-white text-secondaryGray hover:text-primaryDark border border-border text-xs transition-colors cursor-pointer shadow-2xs"
            title="Change note pastel color"
          >
            <div
              className="w-3 h-3 rounded-full border border-black/10"
              style={{ backgroundColor: note.categoryColor || '#EEEDFD' }}
            />
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {isColorMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-border shadow-float rounded-2xl p-1.5 z-30 flex flex-col gap-1">
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-midGray uppercase">
                Color
              </div>
              {PASTEL_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handleSelectColor(c.value)}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-sans text-left transition-colors cursor-pointer',
                    note.categoryColor === c.value
                      ? 'bg-surface font-semibold text-primaryDark'
                      : 'text-secondaryGray hover:text-primaryDark hover:bg-bg'
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: c.value }}
                  />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pin Status */}
        <button
          type="button"
          onClick={() => togglePinNote(note.id)}
          title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
          className={cn(
            'p-1.5 rounded-full transition-colors cursor-pointer',
            note.isPinned
              ? 'bg-accent-indigo text-indigo-900'
              : 'text-secondaryGray hover:text-primaryDark hover:bg-surface'
          )}
        >
          <Pin className={cn('w-3.5 h-3.5', note.isPinned && 'fill-indigo-900')} />
        </button>
      </div>

      {/* Right Actions: Export, Delete */}
      <div className="flex items-center gap-2">
        {/* Export Pill Button */}
        <button
          type="button"
          onClick={() => setIsExportOpen(true)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-sans font-medium transition-colors cursor-pointer shadow-2xs',
            'bg-surface hover:bg-white text-primaryDark border-border'
          )}
        >
          <Download className="w-3 h-3 text-secondaryGray" />
          <span>Export</span>
        </button>

        {/* Delete Action */}
        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          title="Delete note"
          className="p-2 rounded-full text-secondaryGray hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Export Modal */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} note={note} />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Move Note to Trash"
        description="Are you sure you want to move this note to the Trash Bin? You can restore it anytime within 30 days in Setting."
      >
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="secondary" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              await deleteNote(note.id);
              setIsDeleteModalOpen(false);
            }}
          >
            Move to Trash
          </Button>
        </div>
      </Modal>
    </div>
  );
};

/**
 * Non-floating large Note Title input that stays in the document flow.
 */
export const NoteTitleInput: React.FC<{ note: NoteDocument }> = ({ note }) => {
  const { updateNote } = useNotesStore();
  const [titleInput, setTitleInput] = useState(note.title);

  useEffect(() => {
    setTitleInput(note.title);
  }, [note.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitleInput(val);
    updateNote(note.id, { title: val });
  };

  return (
    <div className="w-full">
      <input
        type="text"
        value={titleInput}
        onChange={handleTitleChange}
        placeholder="Untitled Note"
        className="w-full font-display font-bold text-display-2 text-primaryDark tracking-tight bg-transparent outline-none border-b border-transparent hover:border-border/60 focus:border-indigo-300 transition-colors"
      />
    </div>
  );
};

/**
 * Combined header component for backward compatibility.
 */
export const NoteHeader: React.FC<NoteHeaderProps> = ({ note }) => {
  return (
    <div className="flex flex-col gap-4 select-none pb-4 border-b border-border/60">
      <NoteHeaderActions note={note} />
      <NoteTitleInput note={note} />
    </div>
  );
};
