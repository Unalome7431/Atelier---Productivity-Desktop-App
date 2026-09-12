import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Search,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { PomodoroSettingsModal } from '@/components/pomodoro/PomodoroSettingsModal';
import { SelectFocusTaskModal } from '@/components/pomodoro/SelectFocusTaskModal';
import { FocusTaskDrawer } from '@/components/pomodoro/FocusTaskDrawer';
import { formatTime, cn } from '@/lib/utils';

export const TopHeader: React.FC = () => {
  const { setCommandPaletteOpen } = useAppStore();
  const {
    mode,
    remainingSeconds,
    isRunning,
    completedCyclesToday,
    targetCyclesDaily,
    activeTarget,
    play,
    pause,
    reset,
    skipCycle,
    tick,
    setMode,
    unbindTarget,
    checkMidnightRollover,
  } = usePomodoroStore();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSelectTaskModalOpen, setIsSelectTaskModalOpen] = useState(false);
  const [isFocusDrawerOpen, setIsFocusDrawerOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  const modeMenuRef = useRef<HTMLDivElement>(null);

  // Timer interval for Pomodoro tick
  useEffect(() => {
    let timer: number | undefined;
    if (isRunning) {
      timer = window.setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, tick]);

  // Live clock interval & midnight rollover check
  useEffect(() => {
    const clockTimer = window.setInterval(() => {
      setCurrentTime(new Date());
      checkMidnightRollover();
    }, 1000);
    return () => clearInterval(clockTimer);
  }, [checkMidnightRollover]);

  // Close mode dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    };
    if (isModeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModeDropdownOpen]);

  const modeLabels: Record<string, string> = {
    focus: 'FOCUS',
    shortBreak: 'SHORT BREAK',
    longBreak: 'LONG BREAK',
  };

  // Format header date pill: "WEDNESDAY · 17 APR"
  const formattedDatePill = useMemo(() => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    const dayName = days[currentTime.getDay()];
    const dateNum = currentTime.getDate();
    const monthName = months[currentTime.getMonth()];
    return `${dayName} · ${dateNum} ${monthName}`;
  }, [currentTime]);

  // Format header live clock: "09:42 AM"
  const formattedClockPill = useMemo(() => {
    let hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const padMin = minutes < 10 ? `0${minutes}` : minutes;
    const padHours = hours < 10 ? `0${hours}` : hours;
    return `${padHours}:${padMin} ${ampm}`;
  }, [currentTime]);

  return (
    <>
      <header className="h-14 border-b border-border bg-bg/90 px-6 flex items-center justify-between select-none z-10">
        {/* Left: Global Search & Command Trigger */}
        <div className="flex items-center gap-3">
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
        </div>

        {/* Center: Integrated Pomodoro Focus Bar */}
        <div className="flex items-center gap-3 bg-surface border border-border px-3.5 py-1.5 rounded-pill shadow-subtle">
          {/* Mode Selector Pill with Dropdown */}
          <div className="relative" ref={modeMenuRef}>
            <button
              type="button"
              onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-pill hover:bg-bg/80 transition-colors cursor-pointer"
              title="Click to change focus mode"
            >
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
              <ChevronDown className="w-3 h-3 text-secondaryGray" />
            </button>

            {isModeDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-surface border border-border rounded-panel shadow-float py-1.5 z-50 flex flex-col">
                <button
                  type="button"
                  onClick={() => {
                    setMode('focus');
                    setIsModeDropdownOpen(false);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-left text-mono-xs font-mono transition-colors flex items-center justify-between cursor-pointer',
                    mode === 'focus'
                      ? 'bg-[#EBE7FF] text-primaryDark font-bold'
                      : 'hover:bg-bg text-secondaryGray hover:text-primaryDark'
                  )}
                >
                  <span>Focus (25m)</span>
                  {mode === 'focus' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('shortBreak');
                    setIsModeDropdownOpen(false);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-left text-mono-xs font-mono transition-colors flex items-center justify-between cursor-pointer',
                    mode === 'shortBreak'
                      ? 'bg-[#EBE7FF] text-primaryDark font-bold'
                      : 'hover:bg-bg text-secondaryGray hover:text-primaryDark'
                  )}
                >
                  <span>Short Break (5m)</span>
                  {mode === 'shortBreak' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-indigo" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('longBreak');
                    setIsModeDropdownOpen(false);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-left text-mono-xs font-mono transition-colors flex items-center justify-between cursor-pointer',
                    mode === 'longBreak'
                      ? 'bg-[#EBE7FF] text-primaryDark font-bold'
                      : 'hover:bg-bg text-secondaryGray hover:text-primaryDark'
                  )}
                >
                  <span>Long Break (15m)</span>
                  {mode === 'longBreak' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-indigo" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Digital Countdown Timer */}
          <span className="font-mono font-bold text-mono-lg text-primaryDark tracking-tight">
            {formatTime(remainingSeconds)}
          </span>

          {/* Timer Controls: Play/Pause, Reset, Skip */}
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
            <button
              onClick={() => skipCycle()}
              title="Skip Cycle"
              className="w-6 h-6 rounded-full text-secondaryGray hover:text-primaryDark hover:bg-border/60 flex items-center justify-center transition-all cursor-pointer"
            >
              <SkipForward className="w-3 h-3" />
            </button>
          </div>

          {/* Cycle Progress Dots / Dashes */}
          <div
            className="flex items-center gap-1.5 pl-1.5 border-l border-border/80"
            title={`${completedCyclesToday} of ${targetCyclesDaily} daily cycles completed`}
          >
            {Array.from({ length: targetCyclesDaily }).map((_, i) => {
              const isCompleted = i < completedCyclesToday;
              return (
                <span
                  key={i}
                  className={cn(
                    'w-3.5 h-1.5 rounded-full transition-colors',
                    isCompleted ? 'bg-primaryDark' : 'bg-border'
                  )}
                />
              );
            })}
          </div>

          {/* Hairline Divider */}
          <div className="w-[1px] h-4 bg-border/80" />

          {/* Task Binding Capsule */}
          {activeTarget ? (
            <div className="flex items-center gap-1 bg-[#EBE7FF]/70 hover:bg-[#EBE7FF] border border-[#D5CEF5] px-2.5 py-0.5 rounded-pill transition-colors group">
              <button
                type="button"
                onClick={() => setIsFocusDrawerOpen(true)}
                className="flex items-center gap-1.5 max-w-[210px] cursor-pointer"
                title="View & manage active focus task"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent-indigo fill-accent-indigo/30 shrink-0" />
                <span className="font-sans font-medium text-ui-rg-xs text-primaryDark truncate">
                  Current Focus: {activeTarget.title}
                </span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  unbindTarget();
                }}
                title="Unbind task from focus timer"
                className="w-4 h-4 rounded-full text-secondaryGray hover:text-primaryDark hover:bg-black/5 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSelectTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-bg border border-border/80 text-secondaryGray hover:text-primaryDark hover:border-border transition-all cursor-pointer group"
              title="Bind an active task or card to this focus session"
            >
              <Sparkles className="w-3 h-3 text-secondaryGray group-hover:text-accent-indigo transition-colors" />
              <span className="font-sans text-ui-rg-xs">Select focus task</span>
            </button>
          )}

          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title="Pomodoro Preferences"
            className="w-6 h-6 rounded-full text-secondaryGray hover:text-primaryDark hover:bg-border/60 flex items-center justify-center transition-all cursor-pointer ml-0.5"
          >
            <SlidersHorizontal className="w-3 h-3" />
          </button>
        </div>

        {/* Right: Live Date & Clock Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#D1FAE5]/60 border border-emerald-300/60 px-3.5 py-1.5 rounded-pill shadow-xs">
            <span className="font-mono text-mono-xs font-bold text-emerald-950 tracking-wider">
              {formattedDatePill}
            </span>
            <span className="text-emerald-700/60 font-mono text-xs">·</span>
            <span className="font-mono text-mono-xs font-bold text-emerald-950">
              {formattedClockPill}
            </span>
          </div>
        </div>
      </header>

      {/* Pomodoro Modals & Drawers */}
      <PomodoroSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <SelectFocusTaskModal
        isOpen={isSelectTaskModalOpen}
        onClose={() => setIsSelectTaskModalOpen(false)}
      />

      <FocusTaskDrawer
        isOpen={isFocusDrawerOpen}
        onClose={() => setIsFocusDrawerOpen(false)}
        onSwitchTask={() => {
          setIsFocusDrawerOpen(false);
          setIsSelectTaskModalOpen(true);
        }}
      />
    </>
  );
};
