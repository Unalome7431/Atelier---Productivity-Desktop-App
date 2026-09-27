import React, { useState } from 'react';
import { RecurringWeeklyBlock, Task } from '@/types';
import { cn } from '@/lib/utils';

interface WeeklyTimelineProps {
  weeklyBlocks: RecurringWeeklyBlock[];
  onSelectBlockToAdjust: (block: RecurringWeeklyBlock) => void;
  onAddBlockAtSlot: (dayIndex: number, hour: string) => void;
  onDropTaskToSchedule?: (task: Task, dayIndex: number, hour: string) => void;
}

const HOURS = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
];

const DAYS = [
  { index: 0, label: 'SUN', full: 'Sunday' },
  { index: 1, label: 'MON', full: 'Monday' },
  { index: 2, label: 'TUE', full: 'Tuesday' },
  { index: 3, label: 'WED', full: 'Wednesday' },
  { index: 4, label: 'THU', full: 'Thursday' },
  { index: 5, label: 'FRI', full: 'Friday' },
  { index: 6, label: 'SAT', full: 'Saturday' },
];

const ROW_HEIGHT = 58; // px per hour

export const WeeklyTimeline: React.FC<WeeklyTimelineProps> = ({
  weeklyBlocks,
  onSelectBlockToAdjust,
  onAddBlockAtSlot,
  onDropTaskToSchedule,
}) => {
  const [dragTargetSlot, setDragTargetSlot] = useState<{
    dayIndex: number;
    hour: string;
  } | null>(null);

  const handleDragOver = (e: React.DragEvent, dayIndex: number, hour: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragTargetSlot || dragTargetSlot.dayIndex !== dayIndex || dragTargetSlot.hour !== hour) {
      setDragTargetSlot({ dayIndex, hour });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragTargetSlot(null);
  };

  const handleDrop = (e: React.DragEvent, dayIndex: number, hour: string) => {
    e.preventDefault();
    setDragTargetSlot(null);
    if (!onDropTaskToSchedule) return;
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const task: Task = JSON.parse(raw);
        onDropTaskToSchedule(task, dayIndex, hour);
      }
    } catch (err) {
      console.error('Failed to drop task onto repeatable schedule:', err);
    }
  };

  // Convert time string "HH:mm" to minutes from 06:00
  const timeToMinutesFromStart = (timeStr?: string): number => {
    if (!timeStr) return 180; // default 09:00
    const [h, m] = timeStr.split(':').map(Number);
    const hour = isNaN(h) ? 9 : h;
    const min = isNaN(m) ? 0 : m;
    return (hour - 6) * 60 + min;
  };

  const getColorClasses = (accent?: RecurringWeeklyBlock['colorAccent']) => {
    switch (accent) {
      case 'mint':
        return 'bg-accent-green/90 border border-emerald-300/80 text-emerald-950 shadow-subtle hover:border-emerald-400';
      case 'sand':
        return 'bg-[#EFE9DC] border border-[#DDD5C8] text-[#4F483D] shadow-subtle hover:border-[#C8BFB0]';
      case 'blue':
        return 'bg-accent-blue/85 border border-sky-300/80 text-sky-950 shadow-subtle hover:border-sky-400';
      case 'mauve':
        return 'bg-[#F3E8EE] border border-[#DFC5D6] text-[#4A2D40] shadow-subtle hover:border-[#8E677E]';
      case 'rose':
        return 'bg-[#FED7E8] border border-[#F472B6]/60 text-[#831843] shadow-subtle hover:border-[#F472B6]';
      case 'amber':
        return 'bg-[#FEF3C7] border border-[#F59E0B]/50 text-[#78350F] shadow-subtle hover:border-[#F59E0B]';
      case 'lavender':
      default:
        return 'bg-accent-indigo/90 border border-indigo-200/80 text-indigo-950 shadow-subtle hover:border-indigo-300';
    }
  };

  return (
    <div className="flex flex-col bg-surface border border-border-dark rounded-panel overflow-hidden shadow-card">
      {/* Scrollable Timeline Container containing both Sticky Header and Grid for 100% Column Alignment */}
      <div className="overflow-y-auto overflow-x-auto max-h-[660px] relative bg-bg/40">
        <div className="min-w-[760px] flex flex-col">
          {/* 7-Day Header Strip (Pinned at top of scroll view with identical column widths) */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-surface border-b border-border-dark sticky top-0 z-20 select-none shadow-xs">
            <div className="p-3 font-mono text-mono-xs font-bold text-secondaryGray flex items-center justify-center border-r border-border-dark uppercase tracking-wider bg-surface">
              TIME
            </div>
            {DAYS.map((day) => (
              <div
                key={day.index}
                className="p-2.5 text-center border-r border-border-dark last:border-r-0 flex items-center justify-center bg-surface"
              >
                <span className="font-mono text-mono-xs font-bold text-primaryDark tracking-wider">
                  {day.label}
                </span>
              </div>
            ))}
          </div>

          {/* Hourly Timeline Grid Body */}
          <div
            className="grid grid-cols-[80px_repeat(7,1fr)] relative"
            style={{ height: `${HOURS.length * ROW_HEIGHT}px` }}
          >
            {/* Left Time Column */}
            <div className="border-r border-border-dark bg-bg/70 select-none">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="font-mono text-mono-xs font-semibold text-secondaryGray px-2.5 flex items-start justify-end pt-1.5 border-b border-border-dark"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <span>{hour}</span>
                </div>
              ))}
            </div>

            {/* 7 Day Vertical Columns */}
            {DAYS.map((day) => {
              const dayBlocks = weeklyBlocks.filter((b) => b.dayOfWeek === day.index);

              return (
                <div
                  key={day.index}
                  className="relative border-r border-border-dark last:border-r-0"
                >
                  {/* Hourly Grid Slots */}
                  {HOURS.map((hour) => {
                    const isHoverTarget =
                      dragTargetSlot?.dayIndex === day.index && dragTargetSlot?.hour === hour;

                    return (
                      <div
                        key={hour}
                        onClick={() => onAddBlockAtSlot(day.index, hour)}
                        onDragOver={(e) => handleDragOver(e, day.index, hour)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day.index, hour)}
                        className={cn(
                          'border-b border-border-dark transition-colors cursor-pointer group relative',
                          isHoverTarget
                            ? 'bg-accent-green/25 ring-1 ring-emerald-400 z-10'
                            : 'hover:bg-surface/70'
                        )}
                        style={{ height: `${ROW_HEIGHT}px` }}
                        title={`Click to add block on ${day.full} at ${hour}`}
                      >
                        {/* Drop cue */}
                        {isHoverTarget && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <span className="text-[10px] font-mono font-bold text-emerald-950 bg-accent-green/90 px-2 py-0.5 rounded-pill shadow-xs border border-emerald-300">
                              Drop to add at {hour}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Rendered Repeatable Schedule Blocks on Day Column */}
                  {dayBlocks.map((block) => {
                    const startMin = timeToMinutesFromStart(block.startFormatted || block.timeSlot);
                    const endMin = timeToMinutesFromStart(
                      block.endFormatted ||
                        `${parseInt((block.startFormatted || '09:00').split(':')[0], 10) + 1}:00`
                    );

                    // Guard bounds within 06:00 to 23:00
                    if (startMin < 0 || startMin >= HOURS.length * 60) return null;

                    const durationMin = Math.max(30, endMin - startMin);
                    const topPx = (startMin / 60) * ROW_HEIGHT;
                    const heightPx = Math.max(36, (durationMin / 60) * ROW_HEIGHT - 3);

                    return (
                      <div
                        key={block.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBlockToAdjust(block);
                        }}
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                        }}
                        className={cn(
                          'absolute left-1 right-1 rounded-md p-2 border flex flex-col justify-between overflow-hidden transition-all z-10 select-none cursor-pointer group hover:scale-[1.01] hover:shadow-subtle',
                          getColorClasses(block.colorAccent)
                        )}
                        title="Click to adjust schedule block"
                      >
                        {/* Top Row: Time Range & Category Tag */}
                        <div className="flex items-center justify-between gap-1 leading-none">
                          <span className="font-mono text-[10px] font-bold shrink-0">
                            {block.startFormatted} – {block.endFormatted}
                          </span>

                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold uppercase bg-white/80 text-primaryDark border border-black/5">
                            {block.category || 'focus'}
                          </span>
                        </div>

                        {/* Middle Title & Description */}
                        <div className="mt-0.5 leading-tight">
                          <h5 className="font-sans font-bold text-[12px] truncate">
                            {block.title}
                          </h5>
                          {heightPx > 50 && block.description && (
                            <p className="text-[10px] opacity-75 truncate mt-0.5">
                              {block.description}
                            </p>
                          )}
                        </div>

                        {/* Hint to edit on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                          <span className="text-[8px] font-mono uppercase bg-black/5 px-1 py-0.2 rounded text-secondaryGray">
                            Adjust
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
