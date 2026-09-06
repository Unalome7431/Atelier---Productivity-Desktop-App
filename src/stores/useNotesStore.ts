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

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  activeNoteId: undefined,
  isLoading: false,

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await noteService.getNotes();
      set({
        notes,
        activeNoteId: notes[0]?.id,
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
