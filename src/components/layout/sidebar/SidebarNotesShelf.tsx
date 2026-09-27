import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Pin, Folder, ChevronDown, Search, X } from 'lucide-react';
import { useNotesStore } from '@/stores/useNotesStore';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

export const SidebarNotesShelf: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();
  const {
    notes,
    activeNoteId,
    setActiveNoteId,
    createNote,
    updateNote,
    deleteNote,
    activeFolder,
    setActiveFolder,
    getFolders,
    createFolder,
    deleteFolder,
  } = useNotesStore();

  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);
  const [renameNoteInput, setRenameNoteInput] = useState('');
  const [isCreatingSidebarFolder, setIsCreatingSidebarFolder] = useState(false);
  const [sidebarFolderName, setSidebarFolderName] = useState('');
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');

  const sidebarFolders = getFolders();
  const filteredSidebarFolders = useMemo(() => {
    if (!folderSearchQuery.trim()) return sidebarFolders;
    const q = folderSearchQuery.toLowerCase().trim();
    return sidebarFolders.filter((f) => f.toLowerCase().includes(q));
  }, [sidebarFolders, folderSearchQuery]);

  const activeFolderCount = useMemo(() => {
    if (!activeFolder) return notes.length;
    return notes.filter((n) => n.folder?.toLowerCase() === activeFolder.toLowerCase()).length;
  }, [notes, activeFolder]);

  const handleCreateNote = async () => {
    const newNote = await createNote({
      title: 'New Note',
      folder: activeFolder || 'General',
      categoryColor: '#EEEDFD',
    });
    setActiveNoteId(newNote.id);
    setActiveTab('notes');
  };

  const startRenameNote = (id: string, currentTitle: string) => {
    setRenamingNoteId(id);
    setRenameNoteInput(currentTitle);
  };

  const handleFinishRenameNote = (id: string) => {
    if (renameNoteInput.trim()) {
      updateNote(id, { title: renameNoteInput.trim() });
    }
    setRenamingNoteId(null);
  };

  const handleCreateSidebarFolder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = sidebarFolderName.trim();
    if (clean) {
      createFolder(clean);
      setActiveFolder(clean);
      setSidebarFolderName('');
      setIsCreatingSidebarFolder(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
      <div className="flex items-center justify-between px-2">
        <span className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider">
          Notes
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white hover:bg-surface text-primaryDark border border-border-hover shadow-2xs text-[10px] font-semibold transition-colors cursor-pointer"
            title="Create new note"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>New note</span>
          </button>
        </div>
      </div>

      {/* Folder Selector Dropdown with Search */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsFolderDropdownOpen(!isFolderDropdownOpen);
            setFolderSearchQuery('');
            setIsCreatingSidebarFolder(false);
          }}
          className={cn(
            'w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs font-sans transition-all cursor-pointer shadow-2xs group',
            activeFolder
              ? 'bg-white border-primaryDark/30 text-primaryDark font-medium'
              : 'bg-white/70 hover:bg-white border-border/80 text-secondaryGray hover:text-primaryDark'
          )}
          title="Filter notes by folder"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Folder className="w-3.5 h-3.5 text-secondaryGray group-hover:text-primaryDark shrink-0" />
            <span className="truncate max-w-[100px]">{activeFolder || 'All Folders'}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {activeFolder && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveFolder(undefined);
                }}
                className="p-0.5 rounded-full hover:bg-black/5 text-secondaryGray hover:text-primaryDark"
                title="Clear folder filter"
              >
                <X className="w-2.5 h-2.5" />
              </span>
            )}
            <span className="font-mono text-[9px] text-secondaryGray bg-surface px-1.5 py-0.2 rounded-full border border-border/60">
              {activeFolderCount}
            </span>
            <ChevronDown
              className={cn(
                'w-3 h-3 text-secondaryGray transition-transform',
                isFolderDropdownOpen && 'rotate-180'
              )}
            />
          </div>
        </button>

        {/* Dropdown Popover */}
        {isFolderDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => {
                setIsFolderDropdownOpen(false);
                setIsCreatingSidebarFolder(false);
                setFolderSearchQuery('');
              }}
            />
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-border shadow-float rounded-2xl p-2 z-40 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-100 font-sans text-xs">
              {/* Search Mechanic */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-secondaryGray absolute left-2.5 top-2" />
                <input
                  type="text"
                  autoFocus
                  value={folderSearchQuery}
                  onChange={(e) => setFolderSearchQuery(e.target.value)}
                  placeholder="Search folders..."
                  className="w-full bg-surface border border-border rounded-xl pl-7 pr-6 py-1 text-xs text-primaryDark outline-none focus:border-primaryDark"
                />
                {folderSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setFolderSearchQuery('')}
                    className="absolute right-2 top-2 text-secondaryGray hover:text-primaryDark"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Folders List */}
              <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto pr-0.5">
                {/* All Notes Option */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveFolder(undefined);
                    setIsFolderDropdownOpen(false);
                    setFolderSearchQuery('');
                  }}
                  className={cn(
                    'flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-sans text-left transition-colors cursor-pointer',
                    !activeFolder
                      ? 'bg-surface font-semibold text-primaryDark'
                      : 'text-secondaryGray hover:text-primaryDark hover:bg-bg'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Folder className="w-3.5 h-3.5 text-secondaryGray shrink-0" />
                    <span className="truncate">All Notes</span>
                  </div>
                  <span className="font-mono text-[10px] text-secondaryGray">{notes.length}</span>
                </button>

                {/* Filtered Folders */}
                {filteredSidebarFolders.map((f) => {
                  const count = notes.filter(
                    (n) => n.folder?.toLowerCase() === f.toLowerCase()
                  ).length;
                  const isSelected = activeFolder?.toLowerCase() === f.toLowerCase();
                  return (
                    <div
                      key={f}
                      onClick={() => {
                        setActiveFolder(f);
                        setIsFolderDropdownOpen(false);
                        setFolderSearchQuery('');
                      }}
                      className={cn(
                        'group/item flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-sans transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-surface font-semibold text-primaryDark'
                          : 'text-secondaryGray hover:text-primaryDark hover:bg-bg'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Folder className="w-3.5 h-3.5 text-secondaryGray shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-[10px] text-secondaryGray">{count}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFolder(f);
                          }}
                          className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:text-rose-600 rounded text-secondaryGray transition-opacity cursor-pointer"
                          title={`Delete folder "${f}"`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Empty search results & create folder button */}
                {folderSearchQuery.trim() &&
                  !filteredSidebarFolders.some(
                    (f) => f.toLowerCase() === folderSearchQuery.trim().toLowerCase()
                  ) && (
                    <button
                      type="button"
                      onClick={() => {
                        createFolder(folderSearchQuery.trim());
                        setActiveFolder(folderSearchQuery.trim());
                        setFolderSearchQuery('');
                        setIsFolderDropdownOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-sans text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer mt-0.5 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="truncate">Create "{folderSearchQuery.trim()}"</span>
                    </button>
                  )}
              </div>

              {/* Quick Add Folder at bottom of dropdown */}
              {isCreatingSidebarFolder ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateSidebarFolder();
                    setIsFolderDropdownOpen(false);
                  }}
                  className="pt-1.5 border-t border-border/60 flex items-center gap-1"
                >
                  <input
                    type="text"
                    autoFocus
                    value={sidebarFolderName}
                    onChange={(e) => setSidebarFolderName(e.target.value)}
                    placeholder="Folder name..."
                    className="flex-1 bg-surface border border-border rounded-lg px-2 py-1 text-xs text-primaryDark outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsCreatingSidebarFolder(false);
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!sidebarFolderName.trim()}
                    className="px-2 py-1 rounded-lg bg-primaryDark text-white text-[11px] font-semibold disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingSidebarFolder(false)}
                    className="p-1 text-secondaryGray hover:text-primaryDark cursor-pointer shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreatingSidebarFolder(true)}
                  className="pt-1.5 border-t border-border/60 flex items-center gap-1 text-[11px] font-mono font-medium text-secondaryGray hover:text-primaryDark cursor-pointer px-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New folder</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Notes List with Figma Pastel Pills */}
      <div className="bg-surface-warm/80 rounded-2xl p-1.5 border border-border/70 flex flex-col gap-1 max-h-48 overflow-y-auto">
        {notes
          .filter((n) => !activeFolder || n.folder === activeFolder)
          .map((n) => {
            const isNoteActive = activeTab === 'notes' && activeNoteId === n.id;
            const bgTint = n.categoryColor || '#EEEDFD';
            const dotColor = n.categoryColor || '#818CF8';

            return (
              <div
                key={n.id}
                onClick={() => {
                  setActiveNoteId(n.id);
                  setActiveTab('notes');
                }}
                style={{
                  backgroundColor: isNoteActive ? bgTint : 'transparent',
                }}
                className={cn(
                  'group/note flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-sans transition-all cursor-pointer select-none',
                  isNoteActive
                    ? 'text-primaryDark font-semibold shadow-xs'
                    : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 border border-black/10"
                    style={{ backgroundColor: dotColor }}
                  />
                  {renamingNoteId === n.id ? (
                    <input
                      type="text"
                      value={renameNoteInput}
                      onChange={(e) => setRenameNoteInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishRenameNote(n.id);
                        if (e.key === 'Escape') setRenamingNoteId(null);
                      }}
                      onBlur={() => handleFinishRenameNote(n.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white px-1 py-0.5 rounded text-xs outline-none w-24 border border-border"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{n.title}</span>
                      {n.isPinned && (
                        <Pin className="w-2.5 h-2.5 text-indigo-700 fill-indigo-700 shrink-0" />
                      )}
                    </div>
                  )}
                </div>

                <div className="opacity-0 group-hover/note:opacity-100 flex items-center gap-0.5 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRenameNote(n.id, n.title);
                    }}
                    className="p-1 hover:text-primaryDark text-secondaryGray/70 rounded cursor-pointer"
                    title="Rename"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  {notes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(n.id);
                      }}
                      className="p-1 hover:text-rose-600 text-secondaryGray/70 rounded cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
