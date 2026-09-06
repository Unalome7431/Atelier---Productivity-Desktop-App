import React, { useState, useEffect } from 'react';
import { Send, Check, Copy, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const TelegramConfigModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [botToken, setBotToken] = useState('7819283401:AAH_q981249...');
  const [chatId, setChatId] = useState('149208412');
  const [isCopied, setIsCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-telegram-modal', handleOpen);
    return () => window.removeEventListener('open-telegram-modal', handleOpen);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText('/link 149208412');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Telegram Bot Companion"
      description="Connect your personal Telegram bot for on-the-go quick capture and morning agenda briefings."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-5 text-ui-rg-sm text-secondaryGray">
        {/* Status Card */}
        <div className="p-4 rounded-card bg-bg border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent-blue/50 flex items-center justify-center text-sky-900">
              <Send className="w-4 h-4 text-sky-700" />
            </div>
            <div>
              <span className="font-sans font-semibold text-ui-bold-sm text-primaryDark block">
                @AtelierProductivityBot
              </span>
              <span className="text-mono-tag font-mono text-midGray">
                Webhook Serverless Worker • Active
              </span>
            </div>
          </div>
          <Badge variant="mint" dot>Linked & Ready</Badge>
        </div>

        {/* Configuration inputs */}
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Bot Token (from @BotFather)
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Your Telegram Chat ID
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>
        </div>

        {/* Quick Link Helper */}
        <div className="p-3.5 rounded-lg bg-surface border border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-ui-rg-xs text-secondaryGray">
              Verification command: <code className="font-mono text-primaryDark bg-bg px-1.5 py-0.5 rounded border border-border">/link {chatId}</code>
            </span>
          </div>
          <Button variant="ghost" size="xs" onClick={handleCopy} className="gap-1">
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </Button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noreferrer"
            className="text-ui-rg-xs text-secondaryGray hover:text-primaryDark flex items-center gap-1 transition-colors"
          >
            <span>Create new bot on Telegram</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />}
            >
              {testSuccess ? 'Verified ✓' : isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
