import React, { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { Footer } from '@/components/layout/Footer';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { TelegramConfigModal } from '@/components/layout/TelegramConfigModal';
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
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Master Main Viewport */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {renderView()}
        </main>
        <Footer />
      </div>

      {/* Global ⌘K Command Hub & Modals */}
      <CommandPalette />
      <TelegramConfigModal />
    </div>
  );
};

export default App;
