import { create } from 'zustand';
import { NavigationTab, SyncStatus } from '@/types';

interface AppState {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'cockpit',
  setActiveTab: (tab) => set({ activeTab: tab }),
  syncStatus: {
    state: 'synced',
    pendingMutationsCount: 0,
    lastSyncedAt: new Date().toISOString(),
  },
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
}));
