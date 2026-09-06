import React, { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { Footer } from '@/components/layout/Footer';
import { CockpitView } from '@/views/CockpitView';
import { CalendarView } from '@/views/CalendarView';
import { CanvasView } from '@/views/CanvasView';
import { KanbanView } from '@/views/KanbanView';
import { NotesView } from '@/views/NotesView';
import { useAppStore } from '@/stores/useAppStore';

export const App: React.FC = () => {
  const { activeTab, isCommandPaletteOpen, setCommandPaletteOpen } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  const renderView = () => {
    switch (activeTab) {
      case 'cockpit':
        return <CockpitView />;
      case 'calendar':
        return <CalendarView />;
      case 'canvas':
        return <CanvasView />;
      case 'kanban':
        return <KanbanView />;
      case 'notes':
        return <NotesView />;
      default:
        return <CockpitView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-primaryDark font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {renderView()}
        </main>
        <Footer />
      </div>

      {/* Global ⌘K Command Palette Modal */}
      {isCommandPaletteOpen && (
        <div
          className="fixed inset-0 bg-primaryDark/20 z-50 flex items-start justify-center pt-24"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-surface border border-border rounded-panel shadow-modal p-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              placeholder="Search actions, views, notes, or tasks..."
              autoFocus
              className="w-full bg-bg border border-border rounded-pill px-4 py-2.5 text-ui-rg-sm text-primaryDark placeholder:text-midGray outline-none focus:border-[#C5BDAF]"
            />
            <div className="flex flex-col gap-1 text-ui-rg-xs">
              <span className="font-mono text-mono-xs text-midGray uppercase px-2">
                Quick Navigation
              </span>
              <button
                onClick={() => {
                  useAppStore.getState().setActiveTab('cockpit');
                  setCommandPaletteOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-bg text-secondaryGray hover:text-primaryDark transition-colors text-left cursor-pointer"
              >
                <span>☀️ Go to Daily Cockpit</span>
                <kbd className="font-mono text-mono-xs text-midGray">1</kbd>
              </button>
              <button
                onClick={() => {
                  useAppStore.getState().setActiveTab('canvas');
                  setCommandPaletteOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-bg text-secondaryGray hover:text-primaryDark transition-colors text-left cursor-pointer"
              >
                <span>🎨 Go to Spatial Canvas</span>
                <kbd className="font-mono text-mono-xs text-midGray">3</kbd>
              </button>
              <button
                onClick={() => {
                  useAppStore.getState().setActiveTab('kanban');
                  setCommandPaletteOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-bg text-secondaryGray hover:text-primaryDark transition-colors text-left cursor-pointer"
              >
                <span>📊 Go to Kanban Board</span>
                <kbd className="font-mono text-mono-xs text-midGray">4</kbd>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
