import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Eyebrow } from '@/components/common/Badge';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { useTasksStore } from '@/stores/useTasksStore';
import { CalendarEvent, RecurringWeeklyBlock, Task } from '@/types';
import { cn, getTodayDateString } from '@/lib/utils';

// Subcomponents
import { MonthlyGrid } from '@/components/calendar/MonthlyGrid';
import { WeeklyTimeline } from '@/components/calendar/WeeklyTimeline';
import { SelectedDateAgenda } from '@/components/calendar/SelectedDateAgenda';
import { TaskIntegrationDrawer } from '@/components/calendar/TaskIntegrationDrawer';
import { ScheduleTaskModal } from '@/components/calendar/ScheduleTaskModal';
import { ScheduleBlockModal } from '@/components/calendar/ScheduleBlockModal';

export const CalendarView: React.FC = () => {
  const {
    events,
    selectedDate,
    weeklyBlocks,
    isTaskDrawerOpen,
    loadEvents,
    setSelectedDate,
    toggleTaskDrawer,
    setTaskDrawerOpen,
    addEvent,
    deleteEvent,
    addWeeklyBlock,
    updateWeeklyBlock,
    deleteWeeklyBlock,
  } = useCalendarStore();

  const { tasks, inboxTasks, allTasks, loadTasks, setTaskScheduledDate, addTask, addSubtask } =
    useTasksStore();

  // Navigation state (Defaulting to September 2026 matching Figma design)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 = September (0-indexed)
  const [isMonthYearPickerOpen, setIsMonthYearPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(2026);

  // Single Add Event Modal state (for date-bound calendar events)
  const [isAddAgendaModalOpen, setIsAddAgendaModalOpen] = useState(false);
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaColor, setAgendaColor] = useState<CalendarEvent['colorAccent']>('lavender');
  const [agendaDate, setAgendaDate] = useState(selectedDate);
  const [agendaStart, setAgendaStart] = useState('09:30');
  const [agendaEnd, setAgendaEnd] = useState('10:15');
  const [agendaDesc, setAgendaDesc] = useState('');

  // Schedule Block Modal state (for repeatable weekly schedule blocks)
  const [isScheduleBlockModalOpen, setIsScheduleBlockModalOpen] = useState(false);
  const [selectedBlockForModal, setSelectedBlockForModal] = useState<RecurringWeeklyBlock | null>(
    null
  );
  const [defaultBlockDay, setDefaultBlockDay] = useState<number>(1);
  const [defaultBlockHour, setDefaultBlockHour] = useState<string>('09:00');

  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  useEffect(() => {
    loadEvents();
    loadTasks();
  }, [loadEvents, loadTasks]);

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

  // Month Navigation handlers
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
    const todayStr = getTodayDateString();
    const parts = todayStr.split('-').map(Number);
    setCurrentYear(parts[0]);
    setCurrentMonth(parts[1] - 1);
    setSelectedDate(todayStr);
  };

  // Open Add Event modal helper (from Selected Date Agenda)
  const handleOpenAddAgenda = (date = selectedDate, start = '09:30', end = '10:15') => {
    setAgendaDate(date);
    setAgendaTitle('');
    setAgendaDesc('');
    setAgendaStart(start);
    setAgendaEnd(end);
    setAgendaColor('lavender');
    setIsAddAgendaModalOpen(true);
  };

  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaTitle.trim()) return;

    await addEvent(
      agendaTitle.trim(),
      (agendaColor === 'mint'
        ? 'focus'
        : agendaColor === 'mauve'
          ? 'deadline'
          : agendaColor === 'blue'
            ? 'personal'
            : 'meeting') as any,
      agendaDate,
      agendaStart,
      agendaEnd,
      agendaDesc.trim() || undefined,
      {
        colorAccent: agendaColor,
        isFixed: false,
      }
    );
    setIsAddAgendaModalOpen(false);
  };

  // Task drop handlers
  const handleDropTaskOnDate = async (task: Task, date: string) => {
    await setTaskScheduledDate(task.id, date);
  };

  const handleConfirmModalSchedule = async (task: Task, date: string) => {
    await setTaskScheduledDate(task.id, date);
    setSelectedTaskForModal(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-8 bg-bg w-full relative">
      {/* Calendar Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="font-display font-bold text-display-1 text-primaryDark tracking-tight">
            Calendar
          </h1>
          <p className="text-ui-rg-xs text-secondaryGray mt-0.5">
            Schedule & Time-Blocking Calendar
          </p>
        </div>
      </div>

      {/* Top Split Section: Monthly Calendar Grid (65%) & Selected Date Agenda (35%) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left 65%: Monthly Calendar Grid (Acts as event listing & date-bound task target) */}
        <div className="xl:col-span-8 bg-surface border border-border rounded-panel p-6 shadow-card flex flex-col justify-between gap-5 h-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-display-3 text-primaryDark tracking-tight">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <span className="text-ui-rg-xs text-secondaryGray">Monthly schedule (6×7 Grid)</span>
            </div>
          </div>

          {/* 6×7 Monthly Grid Component */}
          <MonthlyGrid
            year={currentYear}
            month={currentMonth}
            selectedDate={selectedDate}
            events={events}
            tasks={allTasks}
            onSelectDate={setSelectedDate}
            onDropTask={handleDropTaskOnDate}
          />
        </div>

        {/* Right 35%: Selected Date Details Panel */}
        <div className="xl:col-span-4 h-full flex flex-col">
          <SelectedDateAgenda
            selectedDate={selectedDate}
            events={events}
            tasks={allTasks}
            onOpenAddAgenda={handleOpenAddAgenda}
            onDeleteEvent={deleteEvent}
            onDropTask={handleDropTaskOnDate}
            onUnscheduleTask={(taskId) => setTaskScheduledDate(taskId, null)}
            onQuickAddTask={(title, date) => addTask({ title, scheduledDate: date })}
            onAddSubtask={(taskId, title) => addSubtask(taskId, title)}
            isTaskDrawerOpen={isTaskDrawerOpen}
            onToggleTaskDrawer={toggleTaskDrawer}
            queueTasksCount={tasks.length + inboxTasks.length}
            headerControls={
              <div className="flex items-center gap-2 select-none">
                <div className="flex items-center gap-1 bg-white border border-border-hover rounded-pill p-0.5 shadow-subtle relative">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-secondaryGray hover:text-primaryDark hover:bg-surface transition-colors cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerYear(currentYear);
                      setIsMonthYearPickerOpen(!isMonthYearPickerOpen);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-pill hover:bg-surface transition-colors cursor-pointer group"
                    title="Choose month and year"
                  >
                    <span className="font-mono text-[10px] font-bold text-primaryDark">
                      {monthNames[currentMonth].substring(0, 3).toUpperCase()} {currentYear}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-3 h-3 text-secondaryGray transition-transform',
                        isMonthYearPickerOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-secondaryGray hover:text-primaryDark hover:bg-surface transition-colors cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Month & Year Picker Popover */}
                  {isMonthYearPickerOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsMonthYearPickerOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-border shadow-float rounded-2xl p-4 z-40 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-100 select-none">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                          <button type="button" onClick={() => setPickerYear((y) => y - 1)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface text-secondaryGray hover:text-primaryDark transition-colors cursor-pointer" title="Previous Year">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <select value={pickerYear} onChange={(e) => setPickerYear(parseInt(e.target.value, 10))} className="font-mono text-sm font-bold text-primaryDark bg-surface border border-border/70 rounded-lg px-2.5 py-1 outline-none cursor-pointer">
                            {Array.from({ length: 21 }, (_, i) => 2020 + i).map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => setPickerYear((y) => y + 1)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface text-secondaryGray hover:text-primaryDark transition-colors cursor-pointer" title="Next Year">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {monthNames.map((name, index) => {
                            const isSelected = currentMonth === index && currentYear === pickerYear;
                            return (
                              <button key={name} type="button" onClick={() => { setCurrentMonth(index); setCurrentYear(pickerYear); setIsMonthYearPickerOpen(false); }} className={cn('py-2 px-1 rounded-xl text-xs font-mono transition-all text-center cursor-pointer', isSelected ? 'bg-primaryDark text-white font-bold shadow-xs' : 'bg-surface/60 hover:bg-surface text-primaryDark hover:font-bold')}>
                                {name.substring(0, 3).toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] font-mono">
                          <button type="button" onClick={() => { const now = new Date(); setPickerYear(now.getFullYear()); }} className="text-secondaryGray hover:text-primaryDark transition-colors cursor-pointer">Current Year</button>
                          <button type="button" onClick={() => { const now = new Date(); setCurrentMonth(now.getMonth()); setCurrentYear(now.getFullYear()); setIsMonthYearPickerOpen(false); }} className="text-primaryDark font-bold hover:underline cursor-pointer">Jump to Today</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <Button variant="secondary" size="xs" onClick={handleToday} className="px-2.5 shrink-0">
                  Today
                </Button>
              </div>
            }
          />
        </div>
      </div>

      {/* Lower Section: Repeatable Weekly Schedule (Class timetable, work routines, focus blocks) */}
      <div className="bg-surface border border-border rounded-panel p-6 shadow-card flex flex-col gap-5">
        {/* Weekly Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Eyebrow>REPEATABLE SCHEDULE</Eyebrow>
            </div>
            <h3 className="font-display font-bold text-display-3 text-primaryDark tracking-tight">
              Weekly schedule
            </h3>
            <span className="text-ui-rg-xs text-secondaryGray">
              Class timetable, recurring focus blocks & work routines
            </span>
          </div>
        </div>

        {/* 7-Day Repeatable Hourly Timeline (06:00 to 22:00) with High-Contrast Grid Borders */}
        <WeeklyTimeline
          weeklyBlocks={weeklyBlocks}
          onSelectBlockToAdjust={(block) => {
            setSelectedBlockForModal(block);
            setIsScheduleBlockModalOpen(true);
          }}
          onAddBlockAtSlot={(dayIndex, hour) => {
            setSelectedBlockForModal(null);
            setDefaultBlockDay(dayIndex);
            setDefaultBlockHour(hour);
            setIsScheduleBlockModalOpen(true);
          }}
          onDropTaskToSchedule={(task, dayIndex, hour) => {
            const nextH = Math.min(23, parseInt(hour.split(':')[0], 10) + 1);
            addWeeklyBlock({
              dayOfWeek: dayIndex as any,
              title: task.title,
              startFormatted: hour,
              endFormatted: `${String(nextH).padStart(2, '0')}:00`,
              timeSlot: hour,
              category: 'work',
              colorAccent: 'mint',
              description: task.description,
            });
          }}
        />
      </div>

      {/* Tactical Tasks Side Drawer */}
      <TaskIntegrationDrawer
        isOpen={isTaskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
        tasks={tasks}
        inboxTasks={inboxTasks}
        onSelectTaskToSchedule={(task) => setSelectedTaskForModal(task)}
      />

      {/* Modal 1: Date-Bound Event Creation Modal (Triggered by the single "Add Event" button) */}
      <Modal
        isOpen={isAddAgendaModalOpen}
        onClose={() => setIsAddAgendaModalOpen(false)}
        title="Add Event"
        description={`Schedule an agenda item or focus block for ${agendaDate}.`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveAgenda} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Event Title
            </label>
            <input
              type="text"
              autoFocus
              required
              value={agendaTitle}
              onChange={(e) => setAgendaTitle(e.target.value)}
              placeholder="e.g. Team sync / Deep work block..."
              className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus"
            />
          </div>

          {/* Color Accent Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Color Accent
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                {
                  id: 'mint',
                  label: 'Mint',
                  bg: 'bg-accent-green text-emerald-950 border border-emerald-300/60',
                },
                {
                  id: 'lavender',
                  label: 'Lavender',
                  bg: 'bg-accent-indigo text-indigo-950 border border-indigo-200/60',
                },
                {
                  id: 'sand',
                  label: 'Sand',
                  bg: 'bg-[#EFE9DC] text-[#4F483D] border border-[#DDD5C8]',
                },
                {
                  id: 'blue',
                  label: 'Sky Blue',
                  bg: 'bg-accent-blue text-sky-950 border border-sky-200/60',
                },
                {
                  id: 'mauve',
                  label: 'Mauve',
                  bg: 'bg-[#F3E8EE] text-[#4A2D40] border border-[#DFC5D6]',
                },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAgendaColor(c.id as any)}
                  className={`py-1.5 px-2 rounded-md text-center text-xs font-sans font-medium transition-all cursor-pointer ${
                    c.bg
                  } ${agendaColor === c.id ? 'ring-2 ring-primaryDark shadow-xs font-bold' : 'opacity-80 hover:opacity-100'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Date
              </label>
              <input
                type="date"
                required
                value={agendaDate}
                onChange={(e) => setAgendaDate(e.target.value)}
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Start Time
              </label>
              <input
                type="time"
                required
                value={agendaStart}
                onChange={(e) => setAgendaStart(e.target.value)}
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                End Time
              </label>
              <input
                type="time"
                required
                value={agendaEnd}
                onChange={(e) => setAgendaEnd(e.target.value)}
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus"
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
              className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-border-focus"
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
              Save Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Schedule Block Modal for Adding or Adjusting Repeatable Blocks */}
      <ScheduleBlockModal
        isOpen={isScheduleBlockModalOpen}
        onClose={() => setIsScheduleBlockModalOpen(false)}
        block={selectedBlockForModal}
        defaultDay={defaultBlockDay}
        defaultHour={defaultBlockHour}
        onSave={(data, existingId) => {
          if (existingId) {
            updateWeeklyBlock(existingId, data);
          } else {
            addWeeklyBlock(data);
          }
        }}
        onDelete={(id) => {
          deleteWeeklyBlock(id);
        }}
      />

      {/* Modal 3: Quick Schedule Task Time-Box Modal */}
      <ScheduleTaskModal
        isOpen={Boolean(selectedTaskForModal)}
        onClose={() => setSelectedTaskForModal(null)}
        task={selectedTaskForModal}
        defaultDate={selectedDate}
        onConfirmSchedule={handleConfirmModalSchedule}
      />
    </div>
  );
};
