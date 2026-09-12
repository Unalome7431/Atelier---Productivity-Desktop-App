import React, { useState } from 'react';
import { Volume2, Bell, Check, Sparkles } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { usePomodoroStore } from '@/stores/usePomodoroStore';
import { audioService } from '@/services/audioService';
import { notificationService } from '@/services/notificationService';
import { cn } from '@/lib/utils';

interface PomodoroSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PomodoroSettingsModal: React.FC<PomodoroSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    focusMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    targetCyclesDaily,
    soundEnabled,
    notificationsEnabled,
    autoStartBreaks,
    autoStartFocus,
    updateSettings,
  } = usePomodoroStore();

  const [localFocus, setLocalFocus] = useState(focusMinutes);
  const [localShortBreak, setLocalShortBreak] = useState(shortBreakMinutes);
  const [localLongBreak, setLocalLongBreak] = useState(longBreakMinutes);
  const [localTargetCycles, setLocalTargetCycles] = useState(targetCyclesDaily);
  const [localSound, setLocalSound] = useState(soundEnabled);
  const [localNotifications, setLocalNotifications] = useState(notificationsEnabled);
  const [localAutoBreaks, setLocalAutoBreaks] = useState(autoStartBreaks);
  const [localAutoFocus, setLocalAutoFocus] = useState(autoStartFocus);
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);

  // Sync local state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalFocus(focusMinutes);
      setLocalShortBreak(shortBreakMinutes);
      setLocalLongBreak(longBreakMinutes);
      setLocalTargetCycles(targetCyclesDaily);
      setLocalSound(soundEnabled);
      setLocalNotifications(notificationsEnabled);
      setLocalAutoBreaks(autoStartBreaks);
      setLocalAutoFocus(autoStartFocus);
      setTestNotificationFeedback(null);
    }
  }, [
    isOpen,
    focusMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    targetCyclesDaily,
    soundEnabled,
    notificationsEnabled,
    autoStartBreaks,
    autoStartFocus,
  ]);

  const handleSave = () => {
    updateSettings({
      focusMinutes: localFocus,
      shortBreakMinutes: localShortBreak,
      longBreakMinutes: localLongBreak,
      targetCyclesDaily: localTargetCycles,
      soundEnabled: localSound,
      notificationsEnabled: localNotifications,
      autoStartBreaks: localAutoBreaks,
      autoStartFocus: localAutoFocus,
    });
    onClose();
  };

  const handleTestChime = () => {
    audioService.playCompletionChime();
  };

  const handleTestNotification = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      await notificationService.send(
        '✦ Atelier Focus Bar',
        'Desktop notifications are connected and working perfectly!'
      );
      setTestNotificationFeedback('Notification dispatched!');
    } else {
      setTestNotificationFeedback('Permissions not granted.');
    }
    setTimeout(() => setTestNotificationFeedback(null), 3000);
  };

  const focusPresets = [15, 20, 25, 30, 45, 50, 60];
  const shortBreakPresets = [3, 5, 10, 15];
  const longBreakPresets = [10, 15, 20, 30];
  const cyclePresets = [2, 3, 4, 6, 8];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pomodoro Preferences"
      description="Configure focus intervals, cycle cadence, audio chimes, and native desktop notifications."
      maxWidth="md"
    >
      <div className="flex flex-col gap-5 pt-2">
        {/* Preset Durations */}
        <div className="flex flex-col gap-4">
          {/* Focus Duration */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-mono text-mono-xs font-bold text-primaryDark uppercase">
                Focus Duration
              </label>
              <span className="font-mono text-mono-xs text-secondaryGray font-bold">
                {localFocus} min
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {focusPresets.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setLocalFocus(mins)}
                  className={cn(
                    'px-2.5 py-1 rounded-pill text-mono-xs font-mono transition-all cursor-pointer border',
                    localFocus === mins
                      ? 'bg-primaryDark text-bg border-primaryDark'
                      : 'bg-surface border-border text-secondaryGray hover:text-primaryDark hover:border-[#DED7C9]'
                  )}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Short Break Duration */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-mono text-mono-xs font-bold text-primaryDark uppercase">
                Short Break
              </label>
              <span className="font-mono text-mono-xs text-secondaryGray font-bold">
                {localShortBreak} min
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {shortBreakPresets.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setLocalShortBreak(mins)}
                  className={cn(
                    'px-2.5 py-1 rounded-pill text-mono-xs font-mono transition-all cursor-pointer border',
                    localShortBreak === mins
                      ? 'bg-primaryDark text-bg border-primaryDark'
                      : 'bg-surface border-border text-secondaryGray hover:text-primaryDark hover:border-[#DED7C9]'
                  )}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Long Break Duration */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-mono text-mono-xs font-bold text-primaryDark uppercase">
                Long Break
              </label>
              <span className="font-mono text-mono-xs text-secondaryGray font-bold">
                {localLongBreak} min
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {longBreakPresets.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setLocalLongBreak(mins)}
                  className={cn(
                    'px-2.5 py-1 rounded-pill text-mono-xs font-mono transition-all cursor-pointer border',
                    localLongBreak === mins
                      ? 'bg-primaryDark text-bg border-primaryDark'
                      : 'bg-surface border-border text-secondaryGray hover:text-primaryDark hover:border-[#DED7C9]'
                  )}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Daily Target Cycles */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-mono text-mono-xs font-bold text-primaryDark uppercase">
                Daily Focus Target
              </label>
              <span className="font-mono text-mono-xs text-secondaryGray font-bold">
                {localTargetCycles} cycles
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cyclePresets.map((cycles) => (
                <button
                  key={cycles}
                  type="button"
                  onClick={() => setLocalTargetCycles(cycles)}
                  className={cn(
                    'px-2.5 py-1 rounded-pill text-mono-xs font-mono transition-all cursor-pointer border',
                    localTargetCycles === cycles
                      ? 'bg-primaryDark text-bg border-primaryDark'
                      : 'bg-surface border-border text-secondaryGray hover:text-primaryDark hover:border-[#DED7C9]'
                  )}
                >
                  {cycles} cycles
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audio & Notification Preferences */}
        <div className="pt-3 border-t border-border flex flex-col gap-3">
          {/* Sound Chime Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-secondaryGray" />
              <div>
                <p className="text-ui-bold-sm text-primaryDark font-medium">Subtle Audio Chime</p>
                <p className="text-ui-rg-xs text-secondaryGray">
                  Play harmonic chime upon interval completion
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestChime}
                title="Test audio chime"
                className="text-mono-xs font-mono text-secondaryGray hover:text-primaryDark px-2 py-1 rounded border border-border bg-surface hover:bg-bg cursor-pointer transition-colors"
              >
                Test
              </button>
              <button
                type="button"
                onClick={() => setLocalSound(!localSound)}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative cursor-pointer',
                  localSound ? 'bg-primaryDark' : 'bg-border'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-bg transition-transform',
                    localSound ? 'left-5' : 'left-1'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Desktop Notification Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-secondaryGray" />
              <div>
                <p className="text-ui-bold-sm text-primaryDark font-medium">
                  Desktop Notifications
                </p>
                <p className="text-ui-rg-xs text-secondaryGray">
                  Receive native OS alerts when cycles finish
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestNotification}
                title="Test desktop notification"
                className="text-mono-xs font-mono text-secondaryGray hover:text-primaryDark px-2 py-1 rounded border border-border bg-surface hover:bg-bg cursor-pointer transition-colors"
              >
                Test
              </button>
              <button
                type="button"
                onClick={() => setLocalNotifications(!localNotifications)}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative cursor-pointer',
                  localNotifications ? 'bg-primaryDark' : 'bg-border'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-bg transition-transform',
                    localNotifications ? 'left-5' : 'left-1'
                  )}
                />
              </button>
            </div>
          </div>

          {testNotificationFeedback && (
            <div className="bg-[#D1FAE5] border border-emerald-300 text-emerald-950 px-3 py-1.5 rounded-lg text-ui-rg-xs font-mono flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>{testNotificationFeedback}</span>
            </div>
          )}

          {/* Auto-start options */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div>
              <p className="text-ui-bold-sm text-primaryDark font-medium">Auto-start Breaks</p>
              <p className="text-ui-rg-xs text-secondaryGray">
                Automatically begin break timers after focus
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLocalAutoBreaks(!localAutoBreaks)}
              className={cn(
                'w-10 h-6 rounded-full transition-colors relative cursor-pointer',
                localAutoBreaks ? 'bg-primaryDark' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-bg transition-transform',
                  localAutoBreaks ? 'left-5' : 'left-1'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-ui-bold-sm text-primaryDark font-medium">Auto-start Focus</p>
              <p className="text-ui-rg-xs text-secondaryGray">
                Automatically begin focus timer after break
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLocalAutoFocus(!localAutoFocus)}
              className={cn(
                'w-10 h-6 rounded-full transition-colors relative cursor-pointer',
                localAutoFocus ? 'bg-primaryDark' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-bg transition-transform',
                  localAutoFocus ? 'left-5' : 'left-1'
                )}
              />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-secondaryGray text-ui-rg-xs">
            <Sparkles className="w-3.5 h-3.5 text-accent-indigo" />
            <span>Settings persist locally</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
