import React, { useMemo, useState } from 'react';
import { CalendarEvent, Task } from '@/types';
import { cn } from '@/lib/utils';

interface MonthlyGridProps {
  year: number;
  month: number; // 0-indexed (0 = Jan, 8 = Sep)
  selectedDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  onSelectDate: (date: string) => void;
  onDropTask: (task: Task, date: string) => void;
}

export const MonthlyGrid: React.FC<MonthlyGridProps> = ({
  year,
  month,
  selectedDate,
  events,
  onSelectDate,
  onDropTask,
}) => {
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Compute today's date (or fallback to Figma reference date if testing preview year/month)
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const realToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    // If exploring September 2026, default reference day is 2026-09-13 (today) or 2026-09-09
    if (year === 2026 && month === 8) {
      return '2026-09-13';
    }
    return realToday;
  }, [year, month]);

  // Generate 42 calendar cells (6 rows × 7 columns)
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
    }> = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: true,
      });
    }

    // Next month filler days to complete 42 cells (6 rows × 7 cols)
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month]);

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, dateStr: string) => {
    if (dragOverDate === dateStr) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const task: Task = JSON.parse(raw);
        onDropTask(task, dateStr);
      }
    } catch (err) {
      console.error('Failed to parse dropped task on date cell:', err);
    }
  };

  const getEventBadgeClass = (ev: CalendarEvent) => {
    if (ev.colorAccent === 'mint' || ev.category === 'focus') {
      return 'bg-accent-green/85 text-emerald-950 border border-emerald-300/40';
    }
    if (ev.colorAccent === 'blue' || ev.category === 'personal') {
      return 'bg-accent-blue/85 text-sky-950 border border-sky-200/50';
    }
    if (ev.colorAccent === 'mauve' || ev.category === 'deadline') {
      return 'bg-accent-mauve/25 text-[#4A2D40] border border-accent-mauve/40';
    }
    if (ev.colorAccent === 'sand') {
      return 'bg-[#EFE9DC] text-amber-950 border border-amber-200/60';
    }
    return 'bg-accent-indigo/90 text-indigo-950 border border-indigo-200/50';
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 7 Days of Week Small-Caps Header Bar */}
      <div className="grid grid-cols-7 gap-1.5 text-center select-none">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="bg-bg/80 border border-border rounded-md py-2 font-mono text-mono-xs font-bold text-secondaryGray tracking-wider flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 42 Calendar Cells Grid (6 weeks × 7 days) */}
      <div className="grid grid-cols-7 gap-1.5 min-h-[460px]">
        {calendarCells.map((cell) => {
          const isSelected = cell.dateStr === selectedDate;
          const isToday = cell.dateStr === todayDateStr;
          const isDragTarget = dragOverDate === cell.dateStr;
          const cellEvents = events.filter((e) => e.date === cell.dateStr);

          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              onDragOver={(e) => handleDragOver(e, cell.dateStr)}
              onDragLeave={(e) => handleDragLeave(e, cell.dateStr)}
              onDrop={(e) => handleDrop(e, cell.dateStr)}
              className={cn(
                'min-h-[78px] rounded-lg p-1.5 border flex flex-col justify-between transition-all cursor-pointer select-none group relative',
                cell.isCurrentMonth
                  ? isSelected
                    ? 'bg-[#F1EEE7] border-primaryDark/45 shadow-subtle'
                    : isToday
                      ? 'bg-[#EDE6DF] border-secondaryGray/50 shadow-xs'
                      : 'bg-bg border-border/80 hover:border-[#D0C8BA]'
                  : 'bg-bg/40 border-border/40 opacity-40 hover:opacity-75',
                isDragTarget && 'border-emerald-500 ring-2 ring-emerald-400/40 bg-accent-green/20'
              )}
            >
              {/* Day Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-accent-indigo text-primaryDark flex items-center justify-center font-mono font-bold text-mono-xs shadow-xs">
                      {cell.dayNum}
                    </div>
                  ) : isToday ? (
                    <div className="w-5 h-5 rounded-full bg-[#DFD7CC] text-primaryDark flex items-center justify-center font-mono font-bold text-mono-xs shadow-xs">
                      {cell.dayNum}
                    </div>
                  ) : (
                    <span
                      className={cn(
                        'font-mono text-mono-xs font-semibold px-1',
                        cell.isCurrentMonth ? 'text-primaryDark' : 'text-midGray'
                      )}
                    >
                      {cell.dayNum}
                    </span>
                  )}

                  {isToday && (
                    <span className="text-[9px] font-mono font-bold text-secondaryGray uppercase tracking-tighter">
                      Today
                    </span>
                  )}
                </div>
              </div>

              {/* Event Pills List */}
              <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                {cellEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-sans font-medium truncate leading-tight flex items-center gap-1 transition-transform',
                      getEventBadgeClass(ev)
                    )}
                    title={`${ev.startTime} ${ev.title}${ev.isFixed ? ' (Fixed)' : ' (Flexible)'}`}
                  >
                    <span className="font-mono text-[9px] opacity-75 shrink-0">{ev.startTime}</span>
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}
                {cellEvents.length > 2 && (
                  <span className="text-[9px] font-mono text-midGray px-1">
                    +{cellEvents.length - 2} more
                  </span>
                )}
              </div>

              {/* Drop Target Hint */}
              {isDragTarget && (
                <div className="absolute inset-0 bg-accent-green/80 rounded-lg flex items-center justify-center pointer-events-none z-10 border border-emerald-400">
                  <span className="text-[10px] font-sans font-bold text-emerald-950">
                    Drop to schedule
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
