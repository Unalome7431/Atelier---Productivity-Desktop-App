import { create } from 'zustand';
import { NoteDocument, BacklinkItem } from '@/types';
import { noteService } from '@/services/noteService';

const FOLDERS_STORAGE_KEY = 'atelier_note_folders';

const LEGACY_FOLDER_NAMES = new Set([
  'architecture',
  'engineering',
  'guides',
  'studio logs',
  'general',
  'pinned',
]);

function loadStoredFolders(): string[] {
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any legacy pre-made folders
        const clean = parsed.filter(
          (f: any) =>
            typeof f === 'string' && f.trim() && !LEGACY_FOLDER_NAMES.has(f.trim().toLowerCase())
        );
        persistStoredFolders(clean);
        return clean;
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return [];
}

function persistStoredFolders(folders: string[]) {
  try {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  } catch {
    // Ignore storage write error
  }
}

interface NotesState {
  notes: NoteDocument[];
  folders: string[];
  activeNoteId?: string;
  activeFolder?: string;
  searchQuery: string;
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt?: string;
  backlinks: BacklinkItem[];

  loadNotes: () => Promise<void>;
  setActiveNoteId: (id: string) => void;
  setActiveFolder: (folder?: string) => void;
  setSearchQuery: (query: string) => void;
  createNote: (params?: {
    title?: string;
    content?: string;
    folder?: string;
    categoryColor?: string;
    canvasId?: string;
    canvasTitle?: string;
    isPinned?: boolean;
  }) => Promise<NoteDocument>;
  updateNote: (id: string, updates: Partial<NoteDocument>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;
  loadBacklinks: (noteId: string) => Promise<void>;
  getFolders: () => string[];
  createFolder: (name: string) => string;
  deleteFolder: (name: string) => Promise<void>;
  renameFolder: (oldName: string, newName: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  folders: loadStoredFolders(),
  activeNoteId: undefined,
  activeFolder: undefined,
  searchQuery: '',
  isLoading: false,
  isSaving: false,
  lastSavedAt: undefined,
  backlinks: [],

  loadNotes: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const notes = await noteService.getNotes();
      const current = get().activeNoteId;
      const nextActive = current && notes.some((n) => n.id === current) ? current : notes[0]?.id;

      // Merge user custom folders with notes that have folders
      const cleanCustomFolders = get().folders.filter(
        (f) => !LEGACY_FOLDER_NAMES.has(f.toLowerCase())
      );
      const mergedFolders = new Set(cleanCustomFolders);
      for (const n of notes) {
        if (n.folder && !LEGACY_FOLDER_NAMES.has(n.folder.toLowerCase())) {
          mergedFolders.add(n.folder);
        }
      }
      const finalFolders = Array.from(mergedFolders).sort();
      persistStoredFolders(finalFolders);

      set({
        notes,
        folders: finalFolders,
        activeNoteId: nextActive,
        isLoading: false,
      });

      if (nextActive) {
        get().loadBacklinks(nextActive);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
      set({ isLoading: false });
    }
  },

  setActiveNoteId: (id: string) => {
    set({ activeNoteId: id });
    get().loadBacklinks(id);
  },

  setActiveFolder: (folder?: string) => {
    set({ activeFolder: folder === 'all' ? undefined : folder });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  createNote: async (params = {}) => {
    const chosenFolder = params.folder !== undefined ? params.folder : get().activeFolder;

    if (chosenFolder) {
      get().createFolder(chosenFolder);
    }

    const newNote = await noteService.createNote({
      title: params.title || 'Untitled Note',
      content:
        params.content ||
        '<p>Start writing documentation, architecture decisions, or meeting notes...</p>',
      folder: chosenFolder || undefined,
      categoryColor: params.categoryColor || '#EEEDFD',
      canvasId: params.canvasId,
      canvasTitle: params.canvasTitle,
      isPinned: params.isPinned || false,
    });

    set((state) => ({
      notes: [newNote, ...state.notes],
      activeNoteId: newNote.id,
      backlinks: [],
    }));

    return newNote;
  },

  updateNote: async (id: string, updates: Partial<NoteDocument>) => {
    const now = new Date().toISOString();

    // 1. Optimistic Local-First state update (0ms UI latency)
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: now } : n)),
      isSaving: true,
    }));

    if (updates.folder) {
      get().createFolder(updates.folder);
    }

    try {
      // 2. Background database persistence
      await noteService.updateNote(id, updates);
      set({
        isSaving: false,
        lastSavedAt: now,
      });
    } catch (err) {
      console.error('Failed to update note in DB:', err);
      set({ isSaving: false });
    }
  },

  deleteNote: async (id: string) => {
    set((state) => {
      const remaining = state.notes.filter((n) => n.id !== id);
      const nextActive = state.activeNoteId === id ? remaining[0]?.id : state.activeNoteId;
      return {
        notes: remaining,
        activeNoteId: nextActive,
      };
    });

    try {
      await noteService.deleteNote(id);
    } catch (err) {
      console.error('Failed to delete note:', err);
    }

    const currentActive = get().activeNoteId;
    if (currentActive) {
      get().loadBacklinks(currentActive);
    }
  },

  togglePinNote: async (id: string) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const newPinned = !note.isPinned;
    await get().updateNote(id, { isPinned: newPinned });
  },

  loadBacklinks: async (noteId: string) => {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note) {
      set({ backlinks: [] });
      return;
    }
    const backlinks = await noteService.getBacklinks(note.id, note.title, note.canvasId);
    set({ backlinks });
  },

  getFolders: () => {
    const all = new Set<string>();
    for (const f of get().folders) {
      if (f && !LEGACY_FOLDER_NAMES.has(f.toLowerCase())) {
        all.add(f);
      }
    }
    for (const note of get().notes) {
      if (note.folder && !LEGACY_FOLDER_NAMES.has(note.folder.toLowerCase())) {
        all.add(note.folder);
      }
    }
    return Array.from(all).sort();
  },

  createFolder: (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || LEGACY_FOLDER_NAMES.has(trimmed.toLowerCase())) return '';

    const current = get().folders.filter((f) => !LEGACY_FOLDER_NAMES.has(f.toLowerCase()));
    if (!current.includes(trimmed)) {
      const next = [...current, trimmed].sort();
      persistStoredFolders(next);
      set({ folders: next });
    }
    return trimmed;
  },

  deleteFolder: async (name: string) => {
    const trimmed = name.trim();
    const next = get().folders.filter((f) => f.toLowerCase() !== trimmed.toLowerCase());
    persistStoredFolders(next);
    set({ folders: next });

    // Unfile all notes previously in this folder
    const notesToUpdate = get().notes.filter(
      (n) => n.folder?.toLowerCase() === trimmed.toLowerCase()
    );
    for (const n of notesToUpdate) {
      await get().updateNote(n.id, { folder: undefined });
    }

    if (get().activeFolder?.toLowerCase() === trimmed.toLowerCase()) {
      set({ activeFolder: undefined });
    }
  },

  renameFolder: async (oldName: string, newName: string) => {
    const oldTrimmed = oldName.trim();
    const newTrimmed = newName.trim();
    if (!newTrimmed || oldTrimmed === newTrimmed) return;

    const next = get()
      .folders.filter((f) => !LEGACY_FOLDER_NAMES.has(f.toLowerCase()))
      .map((f) => (f.toLowerCase() === oldTrimmed.toLowerCase() ? newTrimmed : f))
      .sort();
    persistStoredFolders(next);
    set({ folders: next });

    // Update all notes in this folder
    const notesToUpdate = get().notes.filter(
      (n) => n.folder?.toLowerCase() === oldTrimmed.toLowerCase()
    );
    for (const n of notesToUpdate) {
      await get().updateNote(n.id, { folder: newTrimmed });
    }

    if (get().activeFolder?.toLowerCase() === oldTrimmed.toLowerCase()) {
      set({ activeFolder: newTrimmed });
    }
  },
}));
