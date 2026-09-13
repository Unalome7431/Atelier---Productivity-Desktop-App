// Mock browser globals for Node test environment before service imports
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};

import { noteService } from '../services/noteService';
import { canvasService } from '../services/canvasService';
import { kanbanService } from '../services/kanbanService';
import { useNotesStore } from '../stores/useNotesStore';
import { db } from '../db/database';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function runNotesTests() {
  console.log('=== ATELIER KNOWLEDGE NOTES & DOCUMENTATION TEST SUITE ===\n');

  // Initialize database
  await db.init();

  // -------------------------------------------------------------
  // Test 1: Note Seeding & Figma Alignment
  // -------------------------------------------------------------
  console.log('--- Test 1: Note Seeding & Figma Alignment ---');
  const seededNotes = await noteService.getNotes();
  assert(seededNotes.length >= 3, `Seeded at least 3 default notes (got: ${seededNotes.length})`);

  // Note A checks
  const noteA = seededNotes.find((n) => n.id === 'n_note_a');
  assert(Boolean(noteA), 'Note A exists in seeded notes');
  assert(noteA?.title === 'Note A', `Note A title is "Note A" (got: ${noteA?.title})`);
  assert(noteA?.canvasTitle === 'CANVAS A', `Note A linked canvas title is "CANVAS A" (got: ${noteA?.canvasTitle})`);
  assert(noteA?.canvasId === 'canvas_a', `Note A linked canvas ID is "canvas_a" (got: ${noteA?.canvasId})`);
  assert(noteA?.categoryColor === '#EEEDFD', `Note A category color is Lavender #EEEDFD (got: ${noteA?.categoryColor})`);
  assert(noteA?.folder === undefined, `Note A starts clean with no pre-made folder (got: ${noteA?.folder})`);
  assert(Boolean(noteA?.isPinned), 'Note A is pinned to top');
  assert(Boolean(noteA?.content.includes('DECISION RECORD · 04')), 'Note A contains Decision Record callout');
  assert(Boolean(noteA?.content.includes('Use typed resource envelopes for all MVP endpoints.')), 'Note A contains Decision Record thesis title');
  assert(Boolean(noteA?.content.includes('Objective')), 'Note A contains Objective H2 heading');
  assert(Boolean(noteA?.content.includes('Delivery scope')), 'Note A contains Delivery scope H2 heading');

  // Note B checks
  const noteB = seededNotes.find((n) => n.id === 'n_note_b');
  assert(Boolean(noteB), 'Note B exists in seeded notes');
  assert(noteB?.title === 'Note B', `Note B title is "Note B" (got: ${noteB?.title})`);
  assert(noteB?.categoryColor === '#D0F8E3', `Note B category color is Mint #D0F8E3 (got: ${noteB?.categoryColor})`);
  assert(noteB?.folder === undefined, `Note B starts clean with no pre-made folder (got: ${noteB?.folder})`);
  assert(Boolean(noteB?.content.includes('REFERENCE')), 'Note B contains Reference callout');

  // Note C checks
  const noteC = seededNotes.find((n) => n.id === 'n_note_c');
  assert(Boolean(noteC), 'Note C exists in seeded notes');
  assert(noteC?.title === 'Note C', `Note C title is "Note C" (got: ${noteC?.title})`);
  assert(noteC?.categoryColor === '#D7E3FF', `Note C category color is Sky Blue #D7E3FF (got: ${noteC?.categoryColor})`);
  assert(noteC?.folder === undefined, `Note C starts clean with no pre-made folder (got: ${noteC?.folder})`);
  assert(Boolean(noteC?.content.includes('CAUTION')), 'Note C contains Caution callout');

  // -------------------------------------------------------------
  // Test 2: Note CRUD Operations
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Note CRUD Operations ---');
  const createdNote = await noteService.createNote({
    title: 'GraphQL Subscription Protocol',
    content: '<p>Real-time event push using WebSocket transports.</p>',
    categoryColor: '#D7E3FF',
    canvasId: 'c_canvas_b',
    canvasTitle: 'CANVAS B',
    isPinned: false,
  });

  assert(Boolean(createdNote.id), 'createNote returns new note with ID');
  assert(createdNote.title === 'GraphQL Subscription Protocol', 'Created note has correct title');
  assert(createdNote.folder === undefined, 'Created note starts clean without default folder');
  assert(createdNote.categoryColor === '#D7E3FF', 'Created note has Sky Blue color');
  assert(createdNote.canvasTitle === 'CANVAS B', 'Created note has linked canvas title');

  // Update note
  await noteService.updateNote(createdNote.id, {
    title: 'Webhooks & WebSocket Subscriptions',
    folder: 'Custom Sprint',
    categoryColor: '#F5F0E6',
    isPinned: true,
  });

  const updatedNotes = await noteService.getNotes();
  const foundUpdated = updatedNotes.find((n) => n.id === createdNote.id);
  assert(foundUpdated?.title === 'Webhooks & WebSocket Subscriptions', 'updateNote persists title');
  assert(foundUpdated?.folder === 'Custom Sprint', 'updateNote persists custom folder change');
  assert(foundUpdated?.categoryColor === '#F5F0E6', 'updateNote persists color change');
  assert(foundUpdated?.isPinned === true, 'updateNote persists pin status');

  // Delete note
  await noteService.deleteNote(createdNote.id);
  const afterDelete = await noteService.getNotes();
  assert(!afterDelete.some((n) => n.id === createdNote.id), 'deleteNote successfully deletes note');

  // -------------------------------------------------------------
  // Test 3: Bidirectional Backlinks Engine
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Bidirectional Backlinks Engine ---');
  // Seed canvas and kanban data
  await canvasService.getCanvases();
  await kanbanService.getBoards();

  // Test Note A backlinks: linked canvas canvas_a
  const backlinksA = await noteService.getBacklinks('n_note_a', 'Note A', 'canvas_a');
  assert(backlinksA.length >= 1, `Note A has at least 1 backlink reference (got: ${backlinksA.length})`);
  const canvasBacklink = backlinksA.find((b) => b.type === 'canvas');
  assert(Boolean(canvasBacklink), 'Note A backlink includes tethered Canvas A');
  assert(canvasBacklink?.targetId === 'canvas_a', `Canvas backlink targetId is canvas_a (got: ${canvasBacklink?.targetId})`);

  // Test n_arch backlinks: node_b2 in Canvas B references n_arch
  const backlinksArch = await noteService.getBacklinks('n_arch', 'System Architecture & Offline Sync Protocol', 'canvas_a');
  assert(backlinksArch.length >= 1, `n_arch note has backlink references (got: ${backlinksArch.length})`);
  assert(backlinksArch.some((b) => b.type === 'canvas'), 'n_arch has canvas backlink from Canvas node');

  // Test cross-note mention backlink
  const referencingNote = await noteService.createNote({
    title: 'Deployment & CI Roadmap',
    content: '<p>Depends heavily on @Note A and the offline database contract.</p>',
  });

  const backlinksAfterMention = await noteService.getBacklinks('n_note_a', 'Note A', 'canvas_a');
  assert(
    backlinksAfterMention.some((b) => b.type === 'note' && b.targetId === referencingNote.id),
    'Bidirectional backlink successfully detects cross-note mention'
  );

  await noteService.deleteNote(referencingNote.id);

  // -------------------------------------------------------------
  // Test 4: Zustand Notes Store Engine
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Zustand Notes Store Engine ---');
  const store = useNotesStore.getState();

  await store.loadNotes();
  const storeNotes = useNotesStore.getState().notes;
  assert(storeNotes.length >= 3, `Store loaded notes successfully (got: ${storeNotes.length})`);
  assert(Boolean(useNotesStore.getState().activeNoteId), 'Store has active note selected');

  // Folders start clean without pre-made system defaults
  const initialFolders = useNotesStore.getState().getFolders();
  assert(!initialFolders.includes('Architecture'), 'Folders list starts without hardcoded Architecture folder');
  assert(!initialFolders.includes('Engineering'), 'Folders list starts without hardcoded Engineering folder');
  assert(!initialFolders.includes('Guides'), 'Folders list starts without hardcoded Guides folder');

  // Create custom user folder
  useNotesStore.getState().createFolder('Infrastructure');
  const foldersAfterCreate = useNotesStore.getState().getFolders();
  assert(foldersAfterCreate.includes('Infrastructure'), 'createFolder registers new user custom folder in list');

  // Set active folder
  useNotesStore.getState().setActiveFolder('Infrastructure');
  assert(useNotesStore.getState().activeFolder === 'Infrastructure', 'setActiveFolder updates activeFolder');
  useNotesStore.getState().setActiveFolder(undefined);
  assert(useNotesStore.getState().activeFolder === undefined, 'setActiveFolder(undefined) clears filter');

  // Search query
  useNotesStore.getState().setSearchQuery('architecture');
  assert(useNotesStore.getState().searchQuery === 'architecture', 'setSearchQuery updates query');
  useNotesStore.getState().setSearchQuery('');

  // Optimistic update
  const targetNote = storeNotes[0];
  const updatePromise = useNotesStore.getState().updateNote(targetNote.id, {
    categoryColor: '#D0F8E3',
    folder: 'Infrastructure',
  });
  // Verify state is updated synchronously / optimistically without waiting for updatePromise
  const noteSync = useNotesStore.getState().notes.find((n) => n.id === targetNote.id);
  assert(noteSync?.categoryColor === '#D0F8E3', 'updateNote updates categoryColor optimistically in 0ms');
  assert(noteSync?.folder === 'Infrastructure', 'updateNote updates folder optimistically in 0ms');
  await updatePromise;

  // Clean up folder
  await useNotesStore.getState().deleteFolder('Infrastructure');
  assert(!useNotesStore.getState().getFolders().includes('Infrastructure'), 'deleteFolder removes custom folder');
  const noteAfterFolderDelete = useNotesStore.getState().notes.find((n) => n.id === targetNote.id);
  assert(noteAfterFolderDelete?.folder === undefined, 'Deleting custom folder safely unfiles note');

  // Pin toggle
  const testPinNote = storeNotes[0];
  const originalPin = testPinNote.isPinned;
  await useNotesStore.getState().togglePinNote(testPinNote.id);
  const noteAfterToggle = useNotesStore.getState().notes.find((n) => n.id === testPinNote.id);
  assert(noteAfterToggle?.isPinned === !originalPin, 'togglePinNote toggles pin state');
  // Revert toggle
  await useNotesStore.getState().togglePinNote(testPinNote.id);

  // Create via store
  const storeCreated = await useNotesStore.getState().createNote({
    title: 'Store Created Specification',
    categoryColor: '#FED7E8',
  });
  assert(useNotesStore.getState().activeNoteId === storeCreated.id, 'createNote in store sets activeNoteId to new note');
  assert(useNotesStore.getState().notes.some((n) => n.id === storeCreated.id), 'New note exists in store notes list');
  assert(storeCreated.folder === undefined, 'New note starts clean with no folder');

  await useNotesStore.getState().deleteNote(storeCreated.id);
  assert(!useNotesStore.getState().notes.some((n) => n.id === storeCreated.id), 'deleteNote in store removes note');

  console.log('\nAll Knowledge Notes & Documentation engine tests PASSED successfully!');
}

runNotesTests().catch((err) => {
  console.error(err);
  throw err;
});
