import React from 'react';
import { Send } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

export const Footer: React.FC = () => {
  const { syncStatus } = useAppStore();

  const handleOpenTelegram = () => {
    window.dispatchEvent(new CustomEvent('open-telegram-modal'));
  };

  return (
    <footer className="h-7 border-t border-border bg-surface px-4 flex items-center justify-between text-ui-rg-xxs font-sans text-secondaryGray select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-green inline-block" />
          <span className="text-mono-tag font-mono text-primaryDark font-medium">
            {syncStatus.state === 'synced'
              ? 'All changes saved to local & cloud'
              : 'Syncing mutations...'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-mono-tag">
        <button
          onClick={handleOpenTelegram}
          className="flex items-center gap-1.5 hover:text-primaryDark transition-colors bg-bg/80 border border-border px-2 py-0.5 rounded-pill shadow-xs cursor-pointer"
        >
          <Send className="w-3 h-3 text-sky-600" />
          <span>Telegram Sync & Config</span>
        </button>
      </div>
    </footer>
  );
};
