import { create } from 'zustand';
import { NoteDocument } from '@/types';
import { noteService } from '@/services/noteService';

interface NotesState {
  notes: NoteDocument[];
  activeNoteId?: string;
  isLoading: boolean;
  loadNotes: () => Promise<void>;
  setActiveNoteId: (id: string) => void;
  createNote: (title: string, content?: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeNoteId: undefined,
  isLoading: false,

  loadNotes: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const notes = await noteService.getNotes();
      // Preserve existing selection if still valid; otherwise pick first
      const current = get().activeNoteId;
      const nextActive = current && notes.some((n) => n.id === current) ? current : notes[0]?.id;
      set({
        notes,
        activeNoteId: nextActive,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load notes:', err);
      set({ isLoading: false });
    }
  },

  setActiveNoteId: (id: string) => set({ activeNoteId: id }),

  createNote: async (title: string, content = '') => {
    const newNote = await noteService.createNote(title, content);
    set((state) => ({
      notes: [newNote, ...state.notes],
      activeNoteId: newNote.id,
    }));
  },
}));
