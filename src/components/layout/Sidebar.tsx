import React, { useEffect } from 'react';
import { LayoutDashboard, Calendar, Layers, KanbanSquare, FileText, Settings } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { SidebarCanvasShelf } from './sidebar/SidebarCanvasShelf';
import { SidebarKanbanShelf } from './sidebar/SidebarKanbanShelf';
import { SidebarNotesShelf } from './sidebar/SidebarNotesShelf';
import { NavigationTab } from '@/types';
import { cn } from '@/lib/utils';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();
  const { loadCanvases } = useCanvasStore();
  const { loadBoards } = useKanbanStore();
  const { loadNotes } = useNotesStore();

  useEffect(() => {
    loadCanvases();
    loadBoards();
    loadNotes();
  }, [loadCanvases, loadBoards, loadNotes]);

  const menuItems: NavItem[] = [
    { id: 'cockpit', label: 'Daily Cockpit', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  const workspaceItems: NavItem[] = [
    { id: 'canvas', label: 'Spatial Canvas', icon: Layers },
    { id: 'kanban', label: 'Kanban Board', icon: KanbanSquare },
    { id: 'notes', label: 'Notes & Docs', icon: FileText },
  ];

  return (
    <aside className="w-56 h-screen flex flex-col justify-between border-r border-border bg-surface select-none p-3.5 z-20">
      {/* Brand Wordmark & Nav List */}
      <div className="flex flex-col gap-6">
        {/* Top Wordmark & Logo */}
        <div className="flex items-center justify-between px-2 pt-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primaryDark flex items-center justify-center shadow-subtle overflow-hidden p-1">
              <img src="/favicon.svg" alt="Atelier" className="w-full h-full object-contain" />
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

          {/* Multi-Canvas Manager Shelf */}
          {activeTab === 'canvas' && <SidebarCanvasShelf />}

          {/* Kanban Board Manager Shelf */}
          {activeTab === 'kanban' && <SidebarKanbanShelf />}

          {/* Notes Shelf */}
          {activeTab === 'notes' && <SidebarNotesShelf />}
        </div>
      </div>

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
