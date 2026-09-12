import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
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

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  useEffect(() => {
    loadCanvases();
  }, [loadCanvases]);

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
                <span>+ New canvas</span>
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
