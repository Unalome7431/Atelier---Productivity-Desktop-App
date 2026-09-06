import React from 'react';
import { Send, Wifi } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

export const Footer: React.FC = () => {
  const { syncStatus } = useAppStore();

  return (
    <footer className="h-7 border-t border-border bg-surface px-4 flex items-center justify-between text-xs font-sans text-secondaryGray select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-green inline-block" />
          <span className="text-[11px] font-mono text-primaryDark font-medium">
            {syncStatus.state === 'synced' ? 'All changes saved' : 'Syncing...'}
          </span>
        </div>
        <span className="text-border">|</span>
        <div className="flex items-center gap-1 text-[11px] text-midGray">
          <Wifi className="w-3 h-3 text-emerald-600" />
          <span>Local SQLite Active</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px]">
        <button className="flex items-center gap-1 hover:text-primaryDark transition-colors">
          <Send className="w-3 h-3 text-sky-600" />
          <span>Telegram Bot Linked</span>
        </button>
        <span className="font-mono text-[10px] text-midGray">v0.1.0-alpha</span>
      </div>
    </footer>
  );
};
