import React from 'react';
import { Search, Play, RotateCcw, Sparkles } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

export const TopHeader: React.FC = () => {
  const { activeTab, setCommandPaletteOpen } = useAppStore();

  const titles: Record<string, string> = {
    cockpit: 'Daily Cockpit',
    calendar: 'Schedule & Calendar',
    canvas: 'Spatial Ideation Canvas',
    kanban: 'Project Kanban',
    notes: 'Knowledge Notes & Docs',
  };

  return (
    <header className="h-14 border-b border-border bg-bg/90 px-6 flex items-center justify-between select-none z-10">
      {/* Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <h1 className="font-display font-bold text-display-3 text-primaryDark tracking-tight">
          {titles[activeTab] || 'Atelier'}
        </h1>
      </div>

      {/* Center Pomodoro Focus Pill Bar */}
      <div className="flex items-center gap-3 bg-surface border border-border px-3.5 py-1.5 rounded-pill shadow-subtle">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <span className="font-mono text-mono-xs font-bold text-primaryDark">
            FOCUS
          </span>
        </div>
        <span className="font-mono font-bold text-mono-lg text-primaryDark">
          25:00
        </span>
        <div className="flex items-center gap-1">
          <button
            title="Start Session"
            className="w-6 h-6 rounded-full bg-primaryDark text-bg flex items-center justify-center hover:bg-[#1a1918] transition-all cursor-pointer shadow-subtle"
          >
            <Play className="w-3 h-3 fill-current ml-0.5" />
          </button>
          <button
            title="Reset Timer"
            className="w-6 h-6 rounded-full text-secondaryGray hover:text-primaryDark hover:bg-border/60 flex items-center justify-center transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
        {/* Cycle Progress Dots */}
        <div className="flex items-center gap-1.5 pl-1 border-l border-border/80">
          <span className="w-2 h-2 rounded-full bg-primaryDark" />
          <span className="w-2 h-2 rounded-full bg-border" />
          <span className="w-2 h-2 rounded-full bg-border" />
          <span className="w-2 h-2 rounded-full bg-border" />
        </div>
      </div>

      {/* Global Search & Command Trigger */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-pill bg-surface border border-border text-secondaryGray hover:text-primaryDark hover:border-[#DED7C9] transition-all text-ui-rg-xs shadow-subtle cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-secondaryGray" />
          <span>Quick search or jump</span>
          <kbd className="font-mono text-mono-xs bg-bg px-1.5 py-0.5 rounded-sm border border-border text-midGray">
            ⌘K
          </kbd>
        </button>
        <div className="w-7 h-7 rounded-full bg-accent-indigo border border-indigo-200/50 flex items-center justify-center text-primaryDark font-mono font-bold text-xs shadow-subtle">
          <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
        </div>
      </div>
    </header>
  );
};
