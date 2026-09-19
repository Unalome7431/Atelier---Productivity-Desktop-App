import React, { useEffect, useState, useMemo } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Calendar,
  Layers,
  KanbanSquare,
  FileText,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Pin,
  Folder,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { NewBoardModal } from '@/components/kanban/NewBoardModal';
import { NavigationTab } from '@/types';
import { cn } from '@/lib/utils';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();
  const {
    canvases,
    activeCanvasId,
    setActiveCanvasId,
    createCanvas,
    renameCanvas,
    deleteCanvas,
    loadCanvases,
  } = useCanvasStore();

  const {
    boards,
    activeBoardId,
    setActiveBoardId,
    createBoard,
    renameBoard,
    deleteBoard,
    loadBoards,
  } = useKanbanStore();

  const {
    notes,
    activeNoteId,
    setActiveNoteId,
    createNote,
    updateNote,
    deleteNote,
    loadNotes,
    activeFolder,
    setActiveFolder,
    getFolders,
    createFolder,
    deleteFolder,
  } = useNotesStore();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null);
  const [renameBoardInput, setRenameBoardInput] = useState('');
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);

  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);
  const [renameNoteInput, setRenameNoteInput] = useState('');
  const [isCreatingSidebarFolder, setIsCreatingSidebarFolder] = useState(false);
  const [sidebarFolderName, setSidebarFolderName] = useState('');
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');

  useEffect(() => {
    loadCanvases();
    loadBoards();
    loadNotes();
  }, [loadCanvases, loadBoards, loadNotes]);

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

  const menuItems: NavItem[] = [
    { id: 'cockpit', label: 'Daily Cockpit', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  const workspaceItems: NavItem[] = [
    { id: 'canvas', label: 'Spatial Canvas', icon: Layers },
    { id: 'kanban', label: 'Kanban Board', icon: KanbanSquare },
    { id: 'notes', label: 'Notes & Docs', icon: FileText },
  ];

  const handleCreateCanvas = async () => {
    const newId = await createCanvas();
    setActiveCanvasId(newId);
    setActiveTab('canvas');
  };

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameInput(currentTitle);
  };

  const handleFinishRename = (id: string) => {
    if (renameInput.trim()) {
      renameCanvas(id, renameInput.trim());
    }
    setRenamingId(null);
  };

  const startRenameBoard = (id: string, currentTitle: string) => {
    setRenamingBoardId(id);
    setRenameBoardInput(currentTitle);
  };

  const handleFinishRenameBoard = (id: string) => {
    if (renameBoardInput.trim()) {
      renameBoard(id, renameBoardInput.trim());
    }
    setRenamingBoardId(null);
  };

  const handleCreateBoardSubmit = async (title: string, colorTag: string) => {
    const newId = await createBoard(title, colorTag);
    setActiveBoardId(newId);
    setActiveTab('kanban');
  };

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
    const trimmed = sidebarFolderName.trim();
    if (trimmed) {
      createFolder(trimmed);
      setActiveFolder(trimmed);
      setSidebarFolderName('');
      setIsCreatingSidebarFolder(false);
    }
  };

  return (
    <aside className="w-56 h-screen flex flex-col justify-between border-r border-border bg-surface select-none p-3.5 z-20">
      {/* Brand Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-2 pt-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primaryDark flex items-center justify-center text-bg shadow-subtle">
              <Sparkles className="w-4 h-4 text-accent-green" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-primaryDark">
              Atelier
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex flex-col gap-5">
          {/* MENU Section */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-mono-xs font-bold text-midGray uppercase px-2 mb-1">
              Menu
            </span>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-1.5 rounded-md font-sans text-ui-md-sm transition-all text-left group cursor-pointer',
                    isActive
                      ? 'bg-accent-indigo text-primaryDark font-semibold shadow-subtle'
                      : 'text-secondaryGray hover:text-primaryDark hover:bg-border/50'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive
                        ? 'text-primaryDark'
                        : 'text-secondaryGray group-hover:text-primaryDark'
                    )}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* WORKSPACE Section */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-mono-xs font-bold text-midGray uppercase px-2 mb-1">
              Workspace
            </span>
            {workspaceItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-1.5 rounded-md font-sans text-ui-md-sm transition-all text-left group cursor-pointer',
                    isActive
                      ? 'bg-accent-indigo text-primaryDark font-semibold shadow-subtle'
                      : 'text-secondaryGray hover:text-primaryDark hover:bg-border/50'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive
                        ? 'text-primaryDark'
                        : 'text-secondaryGray group-hover:text-primaryDark'
                    )}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Multi-Canvas Manager Shelf (Figma style) */}
          {activeTab === 'canvas' && (
            <div className="flex flex-col gap-1.5 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between px-2">
                <span className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider">
                  Canvas
                </span>
                <button
                  onClick={handleCreateCanvas}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white hover:bg-white/80 text-primaryDark border border-border shadow-xs text-[10px] font-semibold transition-colors cursor-pointer"
                  title="Create new canvas"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>New canvas</span>
                </button>
              </div>

              <div className="bg-[#F5EFE6]/80 rounded-2xl p-1.5 border border-border/70 flex flex-col gap-1 max-h-44 overflow-y-auto">
                {canvases.map((c, index) => {
                  const isCanvasActive = activeTab === 'canvas' && activeCanvasId === c.id;
                  const pastelColors = ['#EEEDFD', '#D0F8E3', '#D7E3FF', '#F5F0E6', '#FED7E8'];
                  const dotColors = ['#818CF8', '#34D399', '#60A5FA', '#FBBF24', '#F472B6'];
                  const bgTint = pastelColors[index % pastelColors.length];
                  const dotColor = dotColors[index % dotColors.length];

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setActiveCanvasId(c.id);
                        setActiveTab('canvas');
                      }}
                      style={{
                        backgroundColor: isCanvasActive ? bgTint : 'transparent',
                      }}
                      className={cn(
                        'group/canvas flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-sans transition-all cursor-pointer select-none',
                        isCanvasActive
                          ? 'text-primaryDark font-semibold shadow-xs'
                          : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dotColor }}
                        />
                        {renamingId === c.id ? (
                          <input
                            type="text"
                            value={renameInput}
                            onChange={(e) => setRenameInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFinishRename(c.id);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            onBlur={() => handleFinishRename(c.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white px-1 py-0.5 rounded text-xs outline-none w-24 border border-border"
                            autoFocus
                          />
                        ) : (
                          <span className="truncate">{c.title}</span>
                        )}
                      </div>

                      <div className="opacity-0 group-hover/canvas:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(c.id, c.title);
                          }}
                          className="p-1 hover:text-primaryDark text-secondaryGray/70 rounded cursor-pointer"
                          title="Rename"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                        {canvases.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCanvas(c.id);
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
          )}

          {/* Kanban Board Manager Shelf (Figma style) */}
          {activeTab === 'kanban' && (
            <div className="flex flex-col gap-1.5 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between px-2">
                <span className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider">
                  Kanban Board
                </span>
                <button
                  onClick={() => setIsNewBoardModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white hover:bg-white/80 text-primaryDark border border-border shadow-xs text-[10px] font-semibold transition-colors cursor-pointer"
                  title="Create new project board"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>New board</span>
                </button>
              </div>

              <div className="bg-[#F5EFE6]/80 rounded-2xl p-1.5 border border-border/70 flex flex-col gap-1 max-h-44 overflow-y-auto">
                {boards.map((b, index) => {
                  const isBoardActive = activeTab === 'kanban' && activeBoardId === b.id;
                  const pastelColors = ['#EEEDFD', '#D0F8E3', '#D7E3FF', '#F5F0E6', '#FED7E8'];
                  const bgTint = pastelColors[index % pastelColors.length];
                  const dotColor = b.colorTag || '#818CF8';

                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        setActiveBoardId(b.id);
                        setActiveTab('kanban');
                      }}
                      style={{
                        backgroundColor: isBoardActive ? bgTint : 'transparent',
                      }}
                      className={cn(
                        'group/board flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-sans transition-all cursor-pointer select-none',
                        isBoardActive
                          ? 'text-primaryDark font-semibold shadow-xs'
                          : 'text-secondaryGray hover:text-primaryDark hover:bg-white/60'
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dotColor }}
                        />
                        {renamingBoardId === b.id ? (
                          <input
                            type="text"
                            value={renameBoardInput}
                            onChange={(e) => setRenameBoardInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFinishRenameBoard(b.id);
                              if (e.key === 'Escape') setRenamingBoardId(null);
                            }}
                            onBlur={() => handleFinishRenameBoard(b.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white px-1 py-0.5 rounded text-xs outline-none w-24 border border-border"
                            autoFocus
                          />
                        ) : (
                          <span className="truncate">{b.title}</span>
                        )}
                      </div>

                      <div className="opacity-0 group-hover/board:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenameBoard(b.id, b.title);
                          }}
                          className="p-1 hover:text-primaryDark text-secondaryGray/70 rounded cursor-pointer"
                          title="Rename board"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                        {boards.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBoard(b.id);
                            }}
                            className="p-1 hover:text-rose-600 text-secondaryGray/70 rounded cursor-pointer"
                            title="Delete board"
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
          )}

          {/* Notes Manager Shelf (matching Figma Notes screen) */}
          {activeTab === 'notes' && (
            <div className="flex flex-col gap-2 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between px-2">
                <span className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider">
                  Notes
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCreateNote}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white hover:bg-white/80 text-primaryDark border border-border shadow-xs text-[10px] font-semibold transition-colors cursor-pointer"
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
                          <span className="font-mono text-[10px] text-secondaryGray">
                            {notes.length}
                          </span>
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
                                <span className="font-mono text-[10px] text-secondaryGray">
                                  {count}
                                </span>
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
              <div className="bg-[#F5EFE6]/80 rounded-2xl p-1.5 border border-border/70 flex flex-col gap-1 max-h-48 overflow-y-auto">
                {notes
                  .filter((n) => !activeFolder || n.folder === activeFolder)
                  .map((n) => {
                    const isNoteActive = activeTab === 'notes' && activeNoteId === n.id;
                    const bgTint = n.categoryColor || '#EEEDFD';

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
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: isNoteActive ? '#818CF8' : '#A8A29E' }}
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
          )}
        </div>
      </div>

      {/* New Board Modal */}
      <NewBoardModal
        isOpen={isNewBoardModalOpen}
        onClose={() => setIsNewBoardModalOpen(false)}
        onCreate={handleCreateBoardSubmit}
      />

      {/* Footer Settings */}
      <div className="flex flex-col gap-2 pt-3 border-t border-border/80">
        <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-md font-sans text-ui-rg-sm text-secondaryGray hover:text-primaryDark hover:bg-border/50 transition-all text-left cursor-pointer">
          <Settings className="w-4 h-4" />
          <span>Preferences</span>
        </button>
      </div>
    </aside>
  );
};
