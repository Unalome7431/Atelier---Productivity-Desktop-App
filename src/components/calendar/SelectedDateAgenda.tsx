import React, { useMemo, useState } from 'react';
import {
  ListFilter,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  CheckSquare,
} from 'lucide-react';
import { Eyebrow } from '@/components/common/Badge';
import { CalendarEvent, Task } from '@/types';
import { cn } from '@/lib/utils';

interface SelectedDateAgendaProps {
  selectedDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  onOpenAddAgenda: (date?: string) => void;
  onDeleteEvent: (id: string) => void;
  onDropTask: (task: Task, date: string) => void;
}

export const SelectedDateAgenda: React.FC<SelectedDateAgendaProps> = ({
  selectedDate,
  events,
  onOpenAddAgenda,
  onDeleteEvent,
  onDropTask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Selected date events sorted by startTime
  const selectedDateEvents = useMemo(() => {
    return events
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, selectedDate]);

  // Formatted date string, e.g. "Wednesday, Sep 9"
  const formattedSelectedDateHeading = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return selectedDate;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const task: Task = JSON.parse(raw);
        onDropTask(task, selectedDate);
      }
    } catch (err) {
      console.error('Failed to parse dropped task on agenda:', err);
    }
  };

  const getEventCardStyle = (item: CalendarEvent) => {
    if (item.colorAccent === 'mint' || item.category === 'focus') {
      return 'bg-accent-green/45 border-emerald-300/60';
    }
    if (item.colorAccent === 'blue' || item.category === 'personal') {
      return 'bg-accent-blue/50 border-sky-200/70';
    }
    if (item.colorAccent === 'sand') {
      return 'bg-[#EFE9DC] border-amber-200/80';
    }
    if (item.colorAccent === 'mauve' || item.category === 'deadline') {
      return 'bg-accent-mauve/20 border-accent-mauve/40';
    }
    return 'bg-accent-indigo/60 border-indigo-200/60';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'bg-surface border border-border rounded-panel p-6 shadow-card flex flex-col justify-between h-full gap-5 transition-colors relative',
        isDragOver && 'border-emerald-500 ring-2 ring-emerald-400/40 bg-accent-green/10'
      )}
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <ListFilter className="w-3.5 h-3.5 text-secondaryGray" />
              <Eyebrow>SELECTED DATE</Eyebrow>
            </div>
            <h3 className="font-display font-bold text-display-3 text-primaryDark tracking-tight">
              {formattedSelectedDateHeading}
            </h3>
          </div>
        </div>

        {/* Drop zone alert when dragging */}
        {isDragOver && (
          <div className="p-3 rounded-md bg-accent-green/60 border border-emerald-400 text-center select-none">
            <span className="font-mono text-mono-xs font-bold text-emerald-950">
              Drop task to schedule on {formattedSelectedDateHeading}
            </span>
          </div>
        )}

        {/* Agenda Items List — Fills remaining height with clean scroll */}
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto pr-1">
          {selectedDateEvents.length === 0 ? (
            <div className="p-6 rounded-card bg-bg border border-dashed border-border text-center flex flex-col items-center justify-center gap-2 text-secondaryGray h-full min-h-[180px]">
              <CalendarIcon className="w-6 h-6 text-midGray" />
              <span className="text-ui-rg-xs">No events scheduled for this date.</span>
            </div>
          ) : (
            selectedDateEvents.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-4 rounded-card border shadow-subtle flex flex-col gap-2 transition-all group select-none',
                  getEventCardStyle(item)
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-mono-xs text-primaryDark">
                      {item.startTime} – {item.endTime}
                    </span>

                    {item.taskId && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-950 px-2 py-0.5 rounded-pill bg-white/85 border border-emerald-200/80">
                        <CheckSquare className="w-2.5 h-2.5" />
                        <span>Task Linked</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteEvent(item.id)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded text-secondaryGray hover:text-rose-700 hover:bg-rose-50 transition-all flex items-center justify-center cursor-pointer"
                    title="Delete event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h4 className="font-sans font-bold text-ui-bold-sm text-primaryDark">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-ui-rg-xs text-secondaryGray mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Full-width Add Event button */}
      <button
        type="button"
        onClick={() => onOpenAddAgenda(selectedDate)}
        className="w-full py-2.5 rounded-pill bg-[#EFE9DC] hover:bg-[#E7E0D1] border border-border text-primaryDark font-sans text-ui-md-sm font-semibold transition-all shadow-subtle cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
      >
        <Plus className="w-4 h-4" />
        <span>Add Event</span>
      </button>
    </div>
  );
};
