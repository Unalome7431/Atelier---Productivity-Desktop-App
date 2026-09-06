import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Calendar,
  Layers,
  KanbanSquare,
  FileText,
  Play,
  CheckCircle2,
  Plus,
  Send,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { NavigationTab } from '@/types';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Focus' | 'Settings';
  icon: React.ElementType;
  shortcut?: string;
  perform: () => void;
}

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setActiveTab } = useAppStore();
  const { isRunning, play, pause, reset } = usePomodoroStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: 'nav-cockpit',
        title: 'Go to Daily Cockpit',
        category: 'Navigation',
        icon: LayoutDashboard,
        shortcut: '⌘1',
        perform: () => setActiveTab('cockpit' as NavigationTab),
      },
      {
        id: 'nav-calendar',
        title: 'Go to Schedule & Calendar',
        category: 'Navigation',
        icon: Calendar,
        shortcut: '⌘2',
        perform: () => setActiveTab('calendar' as NavigationTab),
      },
      {
        id: 'nav-canvas',
        title: 'Go to Spatial Concept Canvas',
        category: 'Navigation',
        icon: Layers,
        shortcut: '⌘3',
        perform: () => setActiveTab('canvas' as NavigationTab),
      },
      {
        id: 'nav-kanban',
        title: 'Go to Project Kanban Board',
        category: 'Navigation',
        icon: KanbanSquare,
        shortcut: '⌘4',
        perform: () => setActiveTab('kanban' as NavigationTab),
      },
      {
        id: 'nav-notes',
        title: 'Go to Notes & Documentation',
        category: 'Navigation',
        icon: FileText,
        shortcut: '⌘5',
        perform: () => setActiveTab('notes' as NavigationTab),
      },
      {
        id: 'action-focus-toggle',
        title: isRunning ? 'Pause Focus Session' : 'Start Focus Session (25m)',
        category: 'Focus',
        icon: Play,
        shortcut: 'Space',
        perform: () => (isRunning ? pause() : play()),
      },
      {
        id: 'action-focus-reset',
        title: 'Reset Focus Timer',
        category: 'Focus',
        icon: RotateCcw,
        perform: () => reset(),
      },
      {
        id: 'action-new-task',
        title: 'Add New Tactical Task to Today',
        category: 'Actions',
        icon: Plus,
        shortcut: 'T',
        perform: () => {
          setActiveTab('cockpit');
        },
      },
      {
        id: 'action-telegram',
        title: 'Configure Telegram Bot Sync',
        category: 'Settings',
        icon: Send,
        perform: () => {
          // Open Telegram modal
          window.dispatchEvent(new CustomEvent('open-telegram-modal'));
        },
      },
      {
        id: 'action-mark-done',
        title: 'Complete Current Active Task',
        category: 'Actions',
        icon: CheckCircle2,
        perform: () => {},
      },
    ],
    [setActiveTab, isRunning, play, pause, reset]
  );

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower)
    );
  }, [query, commands]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCommandPaletteOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].perform();
          setCommandPaletteOpen(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, filteredCommands, selectedIndex, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-primaryDark/25 z-50 flex items-start justify-center pt-20 px-4"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-panel shadow-modal flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-bg">
          <Search className="w-4 h-4 text-secondaryGray" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search views, notes, or habits..."
            className="flex-1 bg-transparent text-primaryDark placeholder:text-midGray text-ui-rg-sm outline-none font-sans"
          />
          <kbd className="font-mono text-mono-xs bg-surface border border-border px-2 py-0.5 rounded-sm text-midGray">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-ui-rg-xs text-secondaryGray">
              No matching actions found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.perform();
                    setCommandPaletteOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-md text-left transition-all cursor-pointer select-none',
                    isSelected
                      ? 'bg-accent-indigo text-primaryDark font-medium shadow-subtle'
                      : 'text-secondaryGray hover:text-primaryDark hover:bg-bg'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-bg text-primaryDark'
                          : 'bg-bg/80 text-secondaryGray'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-ui-md-sm text-primaryDark">
                        {cmd.title}
                      </span>
                      <span className="text-mono-tag text-midGray ml-2 font-mono uppercase">
                        [{cmd.category}]
                      </span>
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="font-mono text-mono-xs bg-bg border border-border px-1.5 py-0.5 rounded-sm text-midGray">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-surface border-t border-border/80 flex items-center justify-between text-mono-tag font-mono text-midGray">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Atelier Command Hub</span>
        </div>
      </div>
    </div>
  );
};
