import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Trash2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { telegramService, TelegramConfigState } from '@/services/telegramService';
import { cn } from '@/lib/utils';

export const TelegramConfigModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<TelegramConfigState | null>(null);

  // Form inputs
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [botUsername, setBotUsername] = useState('');

  // Pairing code state
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingExpiresAt, setPairingExpiresAt] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Test connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const [showInstructions, setShowInstructions] = useState(false);

  const loadCurrentConfig = useCallback(async () => {
    const cfg = await telegramService.getConfig();
    setConfig(cfg);
    setBotToken(cfg.botToken || '');
    setChatId(cfg.chatId || '');
    setBotUsername(cfg.botUsername || '');
    setPairingCode(cfg.pairingCode);
    setPairingExpiresAt(cfg.pairingCodeExpiresAt);
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      void loadCurrentConfig();
    };
    window.addEventListener('open-telegram-modal', handleOpen);
    return () => window.removeEventListener('open-telegram-modal', handleOpen);
  }, [loadCurrentConfig]);

  const handleGeneratePairingCode = async () => {
    setIsGeneratingCode(true);
    try {
      const res = await telegramService.generatePairingCode();
      setPairingCode(res.code);
      setPairingExpiresAt(res.expiresAt);
      await loadCurrentConfig();
    } catch (err: any) {
      console.error('Failed to generate pairing code:', err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyPairingCommand = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(`/pair ${pairingCode}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveAndVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setVerifyMessage(null);
    setTestResult(null);

    try {
      if (botToken.trim()) {
        const verify = await telegramService.verifyBotToken(botToken.trim());
        if (!verify.ok) {
          setVerifyMessage(`Token error: ${verify.error}`);
          setIsVerifying(false);
          return;
        }
        const detectedUsername = verify.bot?.username || botUsername;
        setBotUsername(detectedUsername);
        await telegramService.saveCredentials(botToken.trim(), chatId.trim(), detectedUsername);
        setVerifyMessage(`Verified: @${detectedUsername}`);
      } else {
        await telegramService.saveCredentials('', chatId.trim());
        setVerifyMessage('Saved credentials.');
      }
      await loadCurrentConfig();
    } catch (err: any) {
      setVerifyMessage(`Save failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const tokenToSend = botToken.trim() || config?.botToken;
    const chatToSend = chatId.trim() || config?.chatId;

    if (!tokenToSend || !chatToSend) {
      setTestResult({
        ok: false,
        message: 'Both Bot Token and Chat ID are required to send a test message.',
      });
      setIsTesting(false);
      return;
    }

    const res = await telegramService.sendTestNotification(tokenToSend, chatToSend);
    if (res.ok) {
      setTestResult({
        ok: true,
        message: 'Test message delivered successfully to your Telegram chat!',
      });
    } else {
      setTestResult({
        ok: false,
        message: res.error || 'Failed to deliver message via Telegram.',
      });
    }
    setIsTesting(false);
  };

  const handleUnlink = async () => {
    await telegramService.unlink();
    setChatId('');
    setBotToken('');
    setBotUsername('');
    setPairingCode(null);
    setPairingExpiresAt(null);
    setTestResult(null);
    setVerifyMessage(null);
    await loadCurrentConfig();
  };

  const isLinked = Boolean(config?.isLinked || config?.chatId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Telegram Bot Companion"
      description="Connect your personal Telegram bot for on-the-go quick capture and daily agenda briefings."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-5 text-ui-rg-sm text-secondaryGray">
        {/* Status Card */}
        <div className="p-4 rounded-card bg-bg border border-border flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-accent-blue/50 flex items-center justify-center text-sky-900 shrink-0">
              <Send className="w-4 h-4 text-sky-700" />
            </div>
            <div className="min-w-0">
              <span className="font-sans font-semibold text-ui-bold-sm text-primaryDark block truncate">
                {botUsername ? `@${botUsername}` : '@AtelierProductivityBot'}
              </span>
              <span className="text-mono-tag font-mono text-midGray block truncate">
                {isLinked ? `Chat ID: ${config?.chatId}` : 'No Telegram chat paired yet'}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Badge variant={isLinked ? 'mint' : 'outline'} dot>
              {isLinked ? 'Linked & Ready' : 'Pending Link'}
            </Badge>
          </div>
        </div>

        {/* Method 1: One-Time Pairing Code */}
        <div className="p-4 rounded-2xl bg-surface border border-border/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-primaryDark" />
              <span className="font-mono text-mono-xs font-bold text-primaryDark uppercase tracking-wider">
                Option A: Fast Pairing Code
              </span>
            </div>

            <Button
              variant="secondary"
              size="xs"
              onClick={handleGeneratePairingCode}
              disabled={isGeneratingCode}
              className="gap-1 shadow-2xs cursor-pointer"
            >
              <RefreshCw className={cn('w-3 h-3', isGeneratingCode && 'animate-spin')} />
              <span>{pairingCode ? 'Refresh Code' : 'Generate Code'}</span>
            </Button>
          </div>

          <p className="text-ui-rg-xs text-secondaryGray">
            Generate a 15-minute one-time code and send it to your bot to automatically bind your
            account.
          </p>

          {pairingCode ? (
            <div className="flex items-center justify-between bg-bg border border-border rounded-xl p-3">
              <div className="flex flex-col">
                <span className="font-mono text-xs text-secondaryGray">Command to send:</span>
                <span className="font-mono text-base font-bold text-primaryDark tracking-wider">
                  /pair {pairingCode}
                </span>
                {pairingExpiresAt && (
                  <span className="font-mono text-[10px] text-midGray mt-0.5">
                    Valid until {new Date(pairingExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleCopyPairingCommand}
                className="gap-1.5 cursor-pointer shadow-subtle"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy /pair'}</span>
              </Button>
            </div>
          ) : (
            <div className="py-2.5 px-3 bg-bg/60 border border-dashed border-border rounded-xl text-center text-ui-rg-xs text-secondaryGray">
              Click "Generate Code" to create a fresh 15-minute pairing code.
            </div>
          )}
        </div>

        {/* Method 2: Direct Bot Token & Chat ID Configuration */}
        <form onSubmit={handleSaveAndVerify} className="p-4 rounded-2xl bg-surface border border-border/80 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primaryDark" />
              <span className="font-mono text-mono-xs font-bold text-primaryDark uppercase tracking-wider">
                Option B: Direct Bot Credentials
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-1 text-[11px] font-mono text-indigo-700 hover:underline cursor-pointer"
            >
              <HelpCircle className="w-3 h-3" />
              <span>{showInstructions ? 'Hide Setup Guide' : 'Setup Guide'}</span>
            </button>
          </div>

          {/* Setup Guide Accordion */}
          {showInstructions && (
            <div className="p-3 bg-bg border border-border rounded-xl text-ui-rg-xs text-secondaryGray flex flex-col gap-2 animate-in fade-in duration-100">
              <div className="font-mono font-bold text-primaryDark uppercase text-[10px]">
                How to set up your Telegram Bot in 2 minutes:
              </div>
              <ol className="list-decimal list-inside flex flex-col gap-1 text-[12px] leading-relaxed">
                <li>
                  Open Telegram and search for{' '}
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-indigo-700 font-semibold inline-flex items-center gap-0.5 hover:underline"
                  >
                    @BotFather <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>Send <code className="font-mono text-primaryDark bg-surface px-1 rounded">/newbot</code>, choose a name and a username ending in <code className="font-mono text-primaryDark bg-surface px-1 rounded">bot</code>.</li>
                <li>Copy the provided HTTP API token and paste it into the <strong>Bot Token</strong> field below.</li>
                <li>
                  To find your <strong>Chat ID</strong>, search for{' '}
                  <a
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-indigo-700 font-semibold inline-flex items-center gap-0.5 hover:underline"
                  >
                    @userinfobot <ExternalLink className="w-2.5 h-2.5" />
                  </a>{' '}
                  and click Start. Paste your numeric ID into the <strong>Chat ID</strong> field.
                </li>
              </ol>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Bot Token (from @BotFather)
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="e.g. 7819283401:AAH_q981249..."
                className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus font-mono text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Your Personal Chat ID
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="e.g. 149208412"
                className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus font-mono text-xs"
              />
            </div>
          </div>

          {verifyMessage && (
            <div className="flex items-center gap-1.5 text-ui-rg-xs text-primaryDark font-mono bg-bg p-2 rounded-lg border border-border">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{verifyMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={isVerifying}
              className="cursor-pointer"
            >
              {isVerifying ? 'Verifying...' : 'Save Credentials'}
            </Button>
          </div>
        </form>

        {/* Test Connection Alert & Feedback */}
        {testResult && (
          <div
            className={cn(
              'p-3 rounded-xl border flex items-center gap-2 text-ui-rg-xs',
              testResult.ok
                ? 'bg-accent-green/20 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            )}
          >
            {testResult.ok ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{testResult.message}</span>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="gap-1.5 cursor-pointer shadow-subtle"
            >
              <Send className={cn('w-3.5 h-3.5', isTesting && 'animate-pulse')} />
              <span>{isTesting ? 'Sending test...' : 'Send Test Notification'}</span>
            </Button>

            {isLinked && (
              <button
                type="button"
                onClick={handleUnlink}
                className="flex items-center gap-1 text-[11px] font-mono text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                title="Disconnect Telegram pairing"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Unlink</span>
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="cursor-pointer"
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
