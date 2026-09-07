import React, { useEffect } from 'react';
import { Search, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const TopHeader: React.FC = () => {
  const { activeTab, setCommandPaletteOpen } = useAppStore();
  const { mode, remainingSeconds, isRunning, completedCyclesToday, play, pause, reset, tick } =
    usePomodoroStore();

  useEffect(() => {
    let timer: number | undefined;
    if (isRunning) {
      timer = window.setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, tick]);

  const titles: Record<string, string> = {
    cockpit: 'Daily Cockpit',
    calendar: 'Schedule & Calendar',
    canvas: 'Spatial Ideation Canvas',
    kanban: 'Project Kanban',
    notes: 'Knowledge Notes & Docs',
  };

  const modeLabels = {
    focus: 'FOCUS',
    shortBreak: 'SHORT BREAK',
    longBreak: 'LONG BREAK',
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
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              mode === 'focus' ? 'bg-accent-green' : 'bg-accent-indigo',
              isRunning && 'animate-pulse'
            )}
          />
          <span className="font-mono text-mono-xs font-bold text-primaryDark">
            {modeLabels[mode]}
          </span>
        </div>

        <span className="font-mono font-bold text-mono-lg text-primaryDark">
          {formatTime(remainingSeconds)}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => (isRunning ? pause() : play())}
            title={isRunning ? 'Pause Timer' : 'Start Session'}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-subtle',
              isRunning
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                : 'bg-primaryDark text-bg hover:bg-[#1a1918]'
            )}
          >
            {isRunning ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>
          <button
            onClick={() => reset()}
            title="Reset Timer"
            className="w-6 h-6 rounded-full text-secondaryGray hover:text-primaryDark hover:bg-border/60 flex items-center justify-center transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Cycle Progress Dots */}
        <div className="flex items-center gap-1.5 pl-1 border-l border-border/80">
          {Array.from({ length: 4 }).map((_, i) => {
            const isCompleted = i < completedCyclesToday;
            return (
              <span
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  isCompleted ? 'bg-primaryDark' : 'bg-border'
                )}
                title={`Cycle ${i + 1} of 4`}
              />
            );
          })}
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
