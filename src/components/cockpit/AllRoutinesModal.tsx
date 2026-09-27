import React from 'react';
import { Flame, Trash2, Calendar, Target } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useRoutinesStore } from '@/stores/useRoutinesStore';
import { cn } from '@/lib/utils';

export interface AllRoutinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreate: () => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getStreakBadgeStyle(days: number) {
  if (days <= 0) {
    return {
      badge: 'bg-surface text-secondaryGray border-border',
      flame: 'text-secondaryGray',
    };
  }
  if (days <= 30) {
    // 1-30: default orange
    return {
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      flame: 'text-amber-600 fill-amber-500',
    };
  }
  if (days <= 90) {
    // 31-90: slightly more contrast orange
    return {
      badge: 'bg-orange-100 text-orange-800 border-orange-300',
      flame: 'text-orange-700 fill-orange-600',
    };
  }
  if (days <= 180) {
    // 91-180: blue
    return {
      badge: 'bg-sky-100 text-sky-800 border-sky-300',
      flame: 'text-sky-600 fill-sky-500',
    };
  }
  // 180+: purple
  return {
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    flame: 'text-purple-600 fill-purple-500',
  };
}

export const AllRoutinesModal: React.FC<AllRoutinesModalProps> = ({
  isOpen,
  onClose,
  onOpenCreate,
}) => {
  const { routines, individualStreaks, deleteRoutine } = useRoutinesStore();

  const todayDayOfWeek = new Date().getDay();

  const formatCadence = (routine: (typeof routines)[0]) => {
    if (routine.cadence === 'daily') return 'Everyday';
    if (routine.cadence === 'weekdays') return 'Weekdays (Mon – Fri)';
    if (routine.cadence === 'custom' && Array.isArray(routine.customDays)) {
      return routine.customDays.map((d) => DAY_NAMES[d] || d).join(', ');
    }
    return 'Daily';
  };

  const isRoutineActiveToday = (routine: (typeof routines)[0]) => {
    if (routine.cadence === 'daily') return true;
    if (routine.cadence === 'weekdays') return todayDayOfWeek >= 1 && todayDayOfWeek <= 5;
    if (routine.cadence === 'custom' && Array.isArray(routine.customDays)) {
      return routine.customDays.includes(todayDayOfWeek);
    }
    return true;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configured Routines"
      description="All recurring disciplines with active cadences, targets, and streaks."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-mono-xs text-secondaryGray">
            {routines.length} total {routines.length === 1 ? 'habit' : 'habits'} defined
          </span>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => {
              onClose();
              onOpenCreate();
            }}
          >
            + New Habit
          </Button>
        </div>

        {routines.length === 0 ? (
          <div className="p-8 rounded-xl bg-bg border border-dashed border-border text-center flex flex-col items-center justify-center gap-2">
            <p className="font-sans font-medium text-ui-md-sm text-primaryDark">
              No routines configured yet.
            </p>
            <p className="text-ui-rg-xs text-secondaryGray">
              Create your first habit to establish consistency tracking.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onOpenCreate();
              }}
              className="mt-2"
            >
              Create Routine
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {routines.map((routine) => {
              const streak = individualStreaks[routine.id] || 0;
              const streakStyle = getStreakBadgeStyle(streak);
              const isActiveToday = isRoutineActiveToday(routine);
              const targetCount = routine.targetCount || 1;

              return (
                <div
                  key={routine.id}
                  className="p-3.5 rounded-xl bg-bg border border-border flex items-center justify-between gap-4 group hover:border-border-hover transition-all shadow-subtle"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans font-semibold text-ui-bold-sm text-primaryDark">
                        {routine.title}
                      </span>
                      {isActiveToday ? (
                        <span className="px-2 py-0.5 rounded-pill font-mono text-[10px] bg-accent-green/80 text-emerald-950 border border-emerald-300">
                          Active Today
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-pill font-mono text-[10px] bg-surface text-secondaryGray border border-border">
                          Rest Day
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-ui-rg-xs text-secondaryGray font-sans mt-0.5">
                      <div className="flex items-center gap-1.5 font-mono text-mono-xs">
                        <Calendar className="w-3.5 h-3.5 text-midGray" />
                        <span>{formatCadence(routine)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-mono-xs">
                        <Target className="w-3.5 h-3.5 text-midGray" />
                        <span>
                          {targetCount === 1
                            ? '1 check'
                            : `${targetCount} ${targetCount === 1 ? 'rep' : 'reps'}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Individual Streak Badge */}
                    <div
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-0.5 rounded-pill border font-mono text-mono-xs font-semibold shadow-xs',
                        streakStyle.badge
                      )}
                    >
                      <Flame className={cn('w-3.5 h-3.5', streakStyle.flame)} />
                      <span>{streak}d</span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteRoutine(routine.id)}
                      title="Delete routine"
                      className="text-midGray hover:text-rose-600 p-1 rounded hover:bg-surface transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
