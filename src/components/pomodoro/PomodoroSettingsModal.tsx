import React, { useState } from 'react';
import { Volume2, Bell, Check, Sparkles, Minus, Plus } from 'lucide-react';
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
    cyclesBeforeLongBreak,
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
  const [localCyclesBeforeLongBreak, setLocalCyclesBeforeLongBreak] = useState(
    cyclesBeforeLongBreak || 4
  );
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
      setLocalCyclesBeforeLongBreak(cyclesBeforeLongBreak || 4);
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
    cyclesBeforeLongBreak,
    soundEnabled,
    notificationsEnabled,
    autoStartBreaks,
    autoStartFocus,
  ]);

  const handleSave = () => {
    updateSettings({
      focusMinutes: Math.max(1, localFocus),
      shortBreakMinutes: Math.max(1, localShortBreak),
      longBreakMinutes: Math.max(1, localLongBreak),
      targetCyclesDaily: Math.max(1, localTargetCycles),
      cyclesBeforeLongBreak: Math.max(1, localCyclesBeforeLongBreak),
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

  // Symmetrical Stepper Controller Component
  const StepperInput = ({
    value,
    unit,
    step,
    min,
    max,
    onChange,
  }: {
    value: number;
    unit: string;
    step: number;
    min: number;
    max: number;
    onChange: (val: number) => void;
  }) => {
    const displayUnit = unit === 'cycles' && value === 1 ? 'cycle' : unit;
    return (
      <div className="flex items-center gap-1.5 shrink-0 select-none">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-7 h-7 rounded-lg bg-white hover:bg-surface border border-border flex items-center justify-center text-secondaryGray hover:text-primaryDark cursor-pointer transition-colors shadow-2xs active:scale-95 shrink-0"
          title={`Decrease by ${step} ${unit}`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <div className="w-24 h-7 flex items-center justify-center bg-white border border-border rounded-lg px-2 shadow-2xs">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              onChange(isNaN(parsed) ? min : Math.min(max, Math.max(min, parsed)));
            }}
            className="w-9 text-right font-mono text-xs font-bold text-primaryDark bg-transparent outline-none"
          />
          <span className="font-mono text-[11px] text-secondaryGray ml-1 text-left select-none">
            {displayUnit}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-7 h-7 rounded-lg bg-white hover:bg-surface border border-border flex items-center justify-center text-secondaryGray hover:text-primaryDark cursor-pointer transition-colors shadow-2xs active:scale-95 shrink-0"
          title={`Increase by ${step} ${unit}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pomodoro Preferences"
      description="Configure customizable focus intervals, cycle cadence, audio chimes, and native desktop notifications."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-5 pt-1 font-sans text-xs">
        {/* Section 1: Interval Durations */}
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider px-0.5">
            Interval Durations
          </span>

          <div className="flex flex-col gap-2">
            {/* Focus Session */}
            <div className="bg-bg border border-border/80 rounded-2xl p-3 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-sans text-xs font-bold text-primaryDark">Focus Session</span>
                <span className="text-[11px] text-secondaryGray">Deep work countdown interval</span>
              </div>
              <StepperInput
                value={localFocus}
                unit="min"
                step={5}
                min={1}
                max={180}
                onChange={setLocalFocus}
              />
            </div>

            {/* Short Break */}
            <div className="bg-bg border border-border/80 rounded-2xl p-3 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-sans text-xs font-bold text-primaryDark">Short Break</span>
                <span className="text-[11px] text-secondaryGray">
                  Brief recovery between focus sessions
                </span>
              </div>
              <StepperInput
                value={localShortBreak}
                unit="min"
                step={1}
                min={1}
                max={60}
                onChange={setLocalShortBreak}
              />
            </div>

            {/* Long Break */}
            <div className="bg-bg border border-border/80 rounded-2xl p-3 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-sans text-xs font-bold text-primaryDark">Long Break</span>
                <span className="text-[11px] text-secondaryGray">
                  Extended recovery upon completing cycle threshold
                </span>
              </div>
              <StepperInput
                value={localLongBreak}
                unit="min"
                step={5}
                min={1}
                max={90}
                onChange={setLocalLongBreak}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Customizable Cycle Cadence */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-border/80">
          <span className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider px-0.5">
            Cycle Cadence
          </span>

          <div className="flex flex-col gap-2">
            {/* Cycles Before Long Break */}
            <div className="bg-bg border border-border/80 rounded-2xl p-3 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-sans text-xs font-bold text-primaryDark">
                  Cycles Before Long Break
                </span>
                <span className="text-[11px] text-secondaryGray">
                  Completed sessions before triggering an extended break
                </span>
              </div>
              <StepperInput
                value={localCyclesBeforeLongBreak}
                unit="cycles"
                step={1}
                min={1}
                max={20}
                onChange={setLocalCyclesBeforeLongBreak}
              />
            </div>

            {/* Daily Focus Target */}
            <div className="bg-bg border border-border/80 rounded-2xl p-3 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-sans text-xs font-bold text-primaryDark">
                  Daily Focus Target
                </span>
                <span className="text-[11px] text-secondaryGray">
                  Total target sessions to complete each day
                </span>
              </div>
              <StepperInput
                value={localTargetCycles}
                unit="cycles"
                step={1}
                min={1}
                max={30}
                onChange={setLocalTargetCycles}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Audio & Alerts */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-border/80">
          <span className="font-mono text-mono-xs font-bold text-midGray uppercase tracking-wider px-0.5">
            Audio & Alerts
          </span>

          <div className="flex flex-col gap-2">
            {/* Sound Chime Toggle */}
            <div className="bg-bg border border-border/80 rounded-2xl p-3 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white border border-border flex items-center justify-center text-secondaryGray shrink-0 shadow-2xs">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-sans text-xs font-bold text-primaryDark">
                    Subtle Audio Chime
                  </span>
                  <span className="text-[11px] text-secondaryGray">
                    Play harmonic chime upon interval completion
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleTestChime}
                  title="Test audio chime"
                  className="font-mono text-mono-xs text-secondaryGray hover:text-primaryDark px-2.5 py-1 rounded-lg border border-border bg-white hover:bg-surface cursor-pointer transition-colors shadow-2xs"
                >
                  Test
                </button>
                <button
                  type="button"
                  onClick={() => setLocalSound(!localSound)}
                  className={cn(
                    'w-10 h-6 rounded-full transition-colors relative cursor-pointer shadow-inner-xs',
                    localSound ? 'bg-primaryDark' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                      localSound ? 'left-5' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Desktop Notification Toggle */}
            <div className="bg-bg border border-border/80 rounded-2xl p-3 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white border border-border flex items-center justify-center text-secondaryGray shrink-0 shadow-2xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-sans text-xs font-bold text-primaryDark">
                    Desktop Notifications
                  </span>
                  <span className="text-[11px] text-secondaryGray">
                    Receive native OS alerts when cycles finish
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleTestNotification}
                  title="Test desktop notification"
                  className="font-mono text-mono-xs text-secondaryGray hover:text-primaryDark px-2.5 py-1 rounded-lg border border-border bg-white hover:bg-surface cursor-pointer transition-colors shadow-2xs"
                >
                  Test
                </button>
                <button
                  type="button"
                  onClick={() => setLocalNotifications(!localNotifications)}
                  className={cn(
                    'w-10 h-6 rounded-full transition-colors relative cursor-pointer shadow-inner-xs',
                    localNotifications ? 'bg-primaryDark' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                      localNotifications ? 'left-5' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {testNotificationFeedback && (
              <div className="bg-[#D1FAE5] border border-emerald-300 text-emerald-950 px-3 py-1.5 rounded-xl text-ui-rg-xs font-mono flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{testNotificationFeedback}</span>
              </div>
            )}

            {/* Auto-start Breaks */}
            <div className="bg-bg border border-border/80 rounded-2xl p-3 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-sans text-xs font-bold text-primaryDark">
                  Auto-start Breaks
                </span>
                <span className="text-[11px] text-secondaryGray">
                  Automatically begin break timers after focus session finishes
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLocalAutoBreaks(!localAutoBreaks)}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative cursor-pointer shadow-inner-xs shrink-0',
                  localAutoBreaks ? 'bg-primaryDark' : 'bg-border'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                    localAutoBreaks ? 'left-5' : 'left-1'
                  )}
                />
              </button>
            </div>

            {/* Auto-start Focus */}
            <div className="bg-bg border border-border/80 rounded-2xl p-3 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-sans text-xs font-bold text-primaryDark">
                  Auto-start Focus
                </span>
                <span className="text-[11px] text-secondaryGray">
                  Automatically begin focus session after break timer finishes
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLocalAutoFocus(!localAutoFocus)}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative cursor-pointer shadow-inner-xs shrink-0',
                  localAutoFocus ? 'bg-primaryDark' : 'bg-border'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                    localAutoFocus ? 'left-5' : 'left-1'
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-secondaryGray text-ui-rg-xs">
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
