import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Calendar,
  Layers,
  KanbanSquare,
  FileText,
  Settings,
  Flame,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { NavigationTab } from '@/types';
import { cn } from '@/lib/utils';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

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
      {/* Brand Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-2 pt-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primaryDark flex items-center justify-center text-bg shadow-sm">
              <Sparkles className="w-4 h-4 text-accent-green" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-primaryDark">
              Atelier
            </span>
          </div>
          <div className="flex items-center gap-1 bg-amber-100/80 border border-amber-200/60 px-2 py-0.5 rounded-full text-amber-900 text-xs font-mono font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>5d</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex flex-col gap-5">
          {/* MENU Section */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-semibold tracking-wider text-midGray uppercase px-2 mb-1">
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
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl font-sans text-sm font-medium transition-all text-left group',
                    isActive
                      ? 'bg-accent-indigo text-primaryDark font-semibold shadow-xs'
                      : 'text-secondaryGray hover:text-primaryDark hover:bg-[#EAE4D7]/60'
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
            <span className="text-[10px] font-mono font-semibold tracking-wider text-midGray uppercase px-2 mb-1">
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
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl font-sans text-sm font-medium transition-all text-left group',
                    isActive
                      ? 'bg-accent-indigo text-primaryDark font-semibold shadow-xs'
                      : 'text-secondaryGray hover:text-primaryDark hover:bg-[#EAE4D7]/60'
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
        </div>
      </div>

      {/* Footer Settings & Studio Info */}
      <div className="flex flex-col gap-2 pt-3 border-t border-border/80">
        <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl font-sans text-sm font-medium text-secondaryGray hover:text-primaryDark hover:bg-[#EAE4D7]/60 transition-all text-left">
          <Settings className="w-4 h-4" />
          <span>Preferences</span>
        </button>
      </div>
    </aside>
  );
};
