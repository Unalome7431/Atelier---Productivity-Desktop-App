import React, { useEffect, useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Calendar as CalendarIcon,
  ListFilter,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Eyebrow } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { CalendarEvent, RecurringWeeklyBlock } from '@/types';
import { cn } from '@/lib/utils';

export const CalendarView: React.FC = () => {
  const {
    events,
    selectedDate,
    weeklyBlocks,
    loadEvents,
    setSelectedDate,
    addEvent,
    deleteEvent,
    addWeeklyBlock,
    deleteWeeklyBlock,
  } = useCalendarStore();

  // Navigation state (Defaulting to September 2026 matching Figma design)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 = September (0-indexed)

  // Modals state
  const [isAddAgendaModalOpen, setIsAddAgendaModalOpen] = useState(false);
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaCategory, setAgendaCategory] = useState<CalendarEvent['category']>('meeting');
  const [agendaDate, setAgendaDate] = useState(selectedDate);
  const [agendaStart, setAgendaStart] = useState('09:30');
  const [agendaEnd, setAgendaEnd] = useState('10:15');
  const [agendaDesc, setAgendaDesc] = useState('');

  const [isAddRecurringModalOpen, setIsAddRecurringModalOpen] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recDay, setRecDay] = useState<number>(1);
  const [recTimeSlot, setRecTimeSlot] = useState('09:00');
  const [recStart, setRecStart] = useState('09:00');
  const [recEnd, setRecEnd] = useState('09:45');
  const [recCategory, setRecCategory] = useState<RecurringWeeklyBlock['category']>('planning');
  const [recColor, setRecColor] = useState<RecurringWeeklyBlock['colorAccent']>('lavender');

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Month names
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '16:00'];

  // Generate 35 calendar cells (5 rows × 7 cols) for the active month
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: true,
      });
    }

    // Next month filler days up to 35 cells
    const remaining = 35 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8);
    setSelectedDate('2026-09-09');
  };

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    return events.filter((e) => e.date === selectedDate);
  }, [events, selectedDate]);

  // Format selected date heading e.g. "Wednesday, Sep 9"
  const formattedSelectedDateHeading = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return selectedDate;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate]);

  // Calculate total focus hours for selected date
  const totalFocusHours = useMemo(() => {
    return selectedDateEvents
      .filter((e) => e.category === 'focus')
      .reduce((acc, curr) => {
        const startH = parseInt(curr.startTime.split(':')[0] || '0', 10);
        const endH = parseInt(curr.endTime.split(':')[0] || '0', 10);
        return acc + Math.max(1, endH - startH);
      }, 0);
  }, [selectedDateEvents]);

  const handleOpenAddAgenda = (date = selectedDate) => {
    setAgendaDate(date);
    setAgendaTitle('');
    setAgendaDesc('');
    setIsAddAgendaModalOpen(true);
  };

  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaTitle.trim()) return;
    await addEvent(
      agendaTitle.trim(),
      agendaCategory,
      agendaDate,
      agendaStart,
      agendaEnd,
      agendaDesc.trim() || undefined
    );
    setIsAddAgendaModalOpen(false);
  };

  const handleSaveRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) return;
    addWeeklyBlock({
      dayOfWeek: recDay as any,
      timeSlot: recTimeSlot,
      title: recTitle.trim(),
      startFormatted: recStart,
      endFormatted: recEnd,
      category: recCategory,
      colorAccent: recColor,
    });
    setRecTitle('');
    setIsAddRecurringModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-8 bg-bg max-w-[1440px] mx-auto w-full">
      {/* Top Split Section: Monthly Calendar (65%) & Selected Date Agenda (35%) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 65%: Monthly Calendar Grid */}
        <div className="xl:col-span-8 bg-surface border border-border rounded-panel p-6 shadow-card flex flex-col gap-5">
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-display-3 text-primaryDark tracking-tight">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <span className="text-ui-rg-xs text-secondaryGray">Monthly schedule</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-bg border border-border rounded-pill p-1 shadow-subtle">
                <button
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-secondaryGray hover:text-primaryDark hover:bg-surface transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-secondaryGray hover:text-primaryDark hover:bg-surface transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleToday}
                className="text-ui-rg-xs px-3.5 shadow-subtle"
              >
                Today
              </Button>
            </div>
          </div>

          {/* 7 Days of Week Header Bar */}
          <div className="grid grid-cols-7 gap-1 bg-bg/80 border border-border rounded-md py-2 px-1 text-center select-none">
            {daysOfWeek.map((day) => (
              <span
                key={day}
                className="font-mono text-mono-xs font-bold text-secondaryGray tracking-wider"
              >
                {day}
              </span>
            ))}
          </div>

          {/* 35 Calendar Cells Grid (5 weeks × 7 days) */}
          <div className="grid grid-cols-7 gap-1.5 min-h-[420px]">
            {calendarCells.map((cell) => {
              const isSelected = cell.dateStr === selectedDate;
              const cellEvents = events.filter((e) => e.date === cell.dateStr);

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={cn(
                    'min-h-[86px] rounded-lg p-1.5 border flex flex-col justify-between transition-all cursor-pointer select-none group relative',
                    cell.isCurrentMonth
                      ? isSelected
                        ? 'bg-[#F1EEE7] border-primaryDark/40 shadow-subtle'
                        : 'bg-bg border-border/80 hover:border-[#D0C8BA]'
                      : 'bg-bg/40 border-border/40 opacity-40 hover:opacity-75'
                  )}
                >
                  {/* Day Header Row */}
                  <div className="flex items-center justify-between">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-accent-indigo text-primaryDark flex items-center justify-center font-mono font-bold text-mono-xs shadow-xs">
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

                    {/* Quick Add Button on Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddAgenda(cell.dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full text-secondaryGray hover:text-primaryDark hover:bg-border transition-all flex items-center justify-center"
                      title="Add agenda"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Event Chips List */}
                  <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                    {cellEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={cn(
                          'px-1.5 py-0.5 rounded-sm text-[10px] font-sans font-medium truncate leading-tight transition-transform',
                          ev.colorAccent === 'mint' || ev.category === 'focus'
                            ? 'bg-accent-green/85 text-emerald-950 border border-emerald-300/30'
                            : 'bg-accent-indigo/90 text-indigo-950 border border-indigo-200/50'
                        )}
                        title={`${ev.startTime} ${ev.title}`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {cellEvents.length > 2 && (
                      <span className="text-[9px] font-mono text-midGray px-1">
                        +{cellEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 35%: Selected Date Details Panel */}
        <div className="xl:col-span-4 bg-surface border border-border rounded-panel p-6 shadow-card flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
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

              <Button
                variant="lavender"
                size="xs"
                onClick={() => handleOpenAddAgenda(selectedDate)}
                className="gap-1 font-mono text-mono-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </Button>
            </div>

            {/* Agenda Item Cards */}
            <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
              {selectedDateEvents.length === 0 ? (
                <div className="p-6 rounded-card bg-bg border border-dashed border-border text-center flex flex-col items-center gap-2 text-secondaryGray">
                  <CalendarIcon className="w-6 h-6 text-midGray" />
                  <span className="text-ui-rg-xs">No agenda scheduled for this date.</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleOpenAddAgenda(selectedDate)}
                  >
                    + Add first item
                  </Button>
                </div>
              ) : (
                selectedDateEvents.map((item) => {
                  const isFocus = item.category === 'focus' || item.colorAccent === 'mint';

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'p-4 rounded-card border shadow-subtle flex flex-col gap-2 transition-all',
                        isFocus
                          ? 'bg-accent-green/45 border-emerald-300/40'
                          : 'bg-accent-indigo/60 border-indigo-200/60'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-mono-xs text-primaryDark">
                            {item.startTime}
                          </span>
                          <span className="bg-white/90 text-primaryDark text-[11px] font-mono px-2 py-0.5 rounded-pill font-medium border border-border/40 shadow-xs">
                            {item.category === 'focus'
                              ? 'Focus'
                              : item.category === 'meeting'
                                ? 'Meeting'
                                : 'Review'}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteEvent(item.id)}
                          className="w-5 h-5 rounded text-secondaryGray hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer"
                          title="Delete item"
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
                  );
                })
              )}
            </div>

            {/* Action button */}
            <button
              onClick={() => handleOpenAddAgenda(selectedDate)}
              className="w-full py-2.5 rounded-pill bg-[#EFE9DC] hover:bg-[#E7E0D1] border border-border text-primaryDark font-sans text-ui-md-sm font-semibold transition-all shadow-subtle cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add agenda item</span>
            </button>
          </div>

          {/* Summary Card */}
          <div className="p-3.5 rounded-card bg-[#F2EFE8] border border-border/90 flex items-center gap-3 select-none">
            <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-primaryDark shrink-0 shadow-xs">
              <Clock className="w-4 h-4 text-secondaryGray" />
            </div>
            <div>
              <span className="font-sans font-bold text-ui-bold-xs text-primaryDark block">
                {selectedDateEvents.length} scheduled items
              </span>
              <span className="text-[11px] text-secondaryGray block">
                {totalFocusHours || 3} hours reserved for focused work.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: Horizontal Weekly Recurring Schedule Matrix */}
      <div className="bg-surface border border-border rounded-panel p-6 shadow-card flex flex-col gap-5">
        {/* Weekly Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Eyebrow>RECURRING WORK</Eyebrow>
            </div>
            <h3 className="font-display font-bold text-display-3 text-primaryDark tracking-tight">
              Weekly schedule
            </h3>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddRecurringModalOpen(true)}
              className="gap-1.5 shadow-subtle"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recurring Block</span>
            </Button>
            <Button
              variant="pill"
              size="sm"
              onClick={() => setIsAddRecurringModalOpen(true)}
              className="shadow-subtle"
            >
              Edit
            </Button>
          </div>
        </div>

        {/* Horizontal Weekly Schedule Matrix Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Table Header Columns */}
            <div className="grid grid-cols-8 gap-2 bg-bg/70 border border-border rounded-md py-2 px-3 mb-2 text-center select-none font-mono text-mono-xs font-bold text-secondaryGray">
              <div className="text-left text-midGray">TIME</div>
              <div>SUN</div>
              <div>MON</div>
              <div>TUE</div>
              <div>WED</div>
              <div>THU</div>
              <div>FRI</div>
              <div>SAT</div>
            </div>

            {/* Time Slot Rows */}
            <div className="flex flex-col gap-2">
              {timeSlots.map((slot) => {
                return (
                  <div
                    key={slot}
                    className="grid grid-cols-8 gap-2 items-center p-2 rounded-lg bg-bg border border-border/70 hover:border-border transition-colors min-h-[52px]"
                  >
                    {/* Time Label on left */}
                    <div className="font-mono font-bold text-mono-xs text-secondaryGray pl-1 select-none">
                      {slot}
                    </div>

                    {/* 7 Day Slot Columns (0 to 6) */}
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const block = weeklyBlocks.find(
                        (b) => b.timeSlot === slot && b.dayOfWeek === dayIndex
                      );

                      if (!block) {
                        return (
                          <div
                            key={dayIndex}
                            onClick={() => {
                              setRecDay(dayIndex);
                              setRecTimeSlot(slot);
                              setRecStart(slot);
                              setRecEnd(`${parseInt(slot.split(':')[0]) + 1}:00`);
                              setIsAddRecurringModalOpen(true);
                            }}
                            className="h-full min-h-[38px] rounded border border-transparent hover:border-dashed hover:border-border hover:bg-surface/50 transition-all cursor-pointer"
                            title={`Add recurring block for ${daysOfWeek[dayIndex]} at ${slot}`}
                          />
                        );
                      }

                      const colors = {
                        lavender: 'bg-accent-indigo text-indigo-950 border-indigo-200/80',
                        mint: 'bg-accent-green text-emerald-950 border-emerald-300/60',
                        sand: 'bg-[#EFE9DC] text-amber-950 border-amber-200/70',
                        blue: 'bg-accent-blue text-sky-950 border-sky-200/80',
                      };

                      return (
                        <div
                          key={dayIndex}
                          className={cn(
                            'p-2 rounded-md border shadow-xs flex flex-col justify-between relative group select-none transition-transform hover:scale-[1.02]',
                            colors[block.colorAccent] || colors.lavender
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-sans font-bold text-[12px] truncate leading-tight">
                              {block.title}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteWeeklyBlock(block.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-secondaryGray hover:text-rose-700 transition-opacity ml-1"
                              title="Delete recurring block"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-mono text-[10px] opacity-75 mt-0.5">
                            {block.startFormatted} – {block.endFormatted}
                          </span>
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

      {/* Modal 1: Add Agenda Item to Date */}
      <Modal
        isOpen={isAddAgendaModalOpen}
        onClose={() => setIsAddAgendaModalOpen(false)}
        title="Add Agenda Item"
        description={`Schedule an agenda item for ${agendaDate}.`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveAgenda} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Agenda Title
            </label>
            <input
              type="text"
              autoFocus
              value={agendaTitle}
              onChange={(e) => setAgendaTitle(e.target.value)}
              placeholder="e.g. Team sync / Deep work block..."
              className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Category
              </label>
              <select
                value={agendaCategory}
                onChange={(e) => setAgendaCategory(e.target.value as any)}
                className="bg-bg border border-border rounded-md px-3 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              >
                <option value="meeting">Meeting (Lavender)</option>
                <option value="focus">Focus Block (Mint)</option>
                <option value="review">Review (Lavender)</option>
                <option value="personal">Personal (Sky)</option>
                <option value="deadline">Deadline (Mauve)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Scheduled Date
              </label>
              <input
                type="date"
                value={agendaDate}
                onChange={(e) => setAgendaDate(e.target.value)}
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Start Time
              </label>
              <input
                type="time"
                value={agendaStart}
                onChange={(e) => setAgendaStart(e.target.value)}
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                End Time
              </label>
              <input
                type="time"
                value={agendaEnd}
                onChange={(e) => setAgendaEnd(e.target.value)}
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Description (Optional)
            </label>
            <input
              type="text"
              value={agendaDesc}
              onChange={(e) => setAgendaDesc(e.target.value)}
              placeholder="e.g. Review delivery progress and blockers."
              className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddAgendaModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Agenda Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add Recurring Weekly Schedule Block */}
      <Modal
        isOpen={isAddRecurringModalOpen}
        onClose={() => setIsAddRecurringModalOpen(false)}
        title="Add Recurring Weekly Block"
        description="Maintain fixed recurring disciplines and team rituals every week."
        maxWidth="md"
      >
        <form onSubmit={handleSaveRecurring} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Activity Title
            </label>
            <input
              type="text"
              autoFocus
              value={recTitle}
              onChange={(e) => setRecTitle(e.target.value)}
              placeholder="e.g. Weekly planning / Project build..."
              className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Day of Week
              </label>
              <select
                value={recDay}
                onChange={(e) => setRecDay(parseInt(e.target.value, 10))}
                className="bg-bg border border-border rounded-md px-3 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Matrix Row Slot
              </label>
              <select
                value={recTimeSlot}
                onChange={(e) => setRecTimeSlot(e.target.value)}
                className="bg-bg border border-border rounded-md px-3 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              >
                {timeSlots.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Start Time
              </label>
              <input
                type="text"
                value={recStart}
                onChange={(e) => setRecStart(e.target.value)}
                placeholder="09:00"
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                End Time
              </label>
              <input
                type="text"
                value={recEnd}
                onChange={(e) => setRecEnd(e.target.value)}
                placeholder="09:45"
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Category
              </label>
              <select
                value={recCategory}
                onChange={(e) => setRecCategory(e.target.value as any)}
                className="bg-bg border border-border rounded-md px-3 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              >
                <option value="planning">Planning</option>
                <option value="build">Build</option>
                <option value="meeting">Meeting</option>
                <option value="focus">Focus</option>
                <option value="review">Review</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Color Accent
              </label>
              <select
                value={recColor}
                onChange={(e) => setRecColor(e.target.value as any)}
                className="bg-bg border border-border rounded-md px-3 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              >
                <option value="lavender">Lavender (Meeting/Planning)</option>
                <option value="mint">Mint (Deep Work/Build)</option>
                <option value="sand">Sand (Open Block)</option>
                <option value="blue">Blue (Personal)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddRecurringModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Recurring Block
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
