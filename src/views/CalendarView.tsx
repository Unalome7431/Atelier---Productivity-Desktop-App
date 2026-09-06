import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { getTodayDateString } from '@/lib/utils';

export const CalendarView: React.FC = () => {
  const { events, loadEvents, addEvent } = useCalendarStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'focus' | 'meeting' | 'personal' | 'deadline'>('focus');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:30');

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    const today = getTodayDateString();
    await addEvent(eventTitle.trim(), eventType, `${today}T${startTime}:00`, `${today}T${endTime}:00`);
    setEventTitle('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 bg-bg max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-mono-uppercase text-midGray uppercase">
            Time Blocking & Agenda
          </span>
          <h2 className="font-display font-bold text-display-2 text-primaryDark mt-1">
            Weekly Schedule & Time Blocks
          </h2>
        </div>
        <Button
          variant="primary"
          size="md"
          className="gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>New Time Block</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Events List */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-display-4 text-primaryDark">
              Today's Scheduled Blocks
            </h3>
            <span className="font-mono text-mono-xs text-midGray">
              {events.length} blocks
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-card bg-bg border border-border/90 shadow-subtle flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-indigo flex items-center justify-center text-indigo-900">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-sans font-semibold text-ui-bold-sm text-primaryDark">
                      {ev.title}
                    </h4>
                    <span className="font-mono text-mono-xs text-secondaryGray">
                      {ev.startTime.split('T')[1]?.substring(0, 5) || '10:00'} – {ev.endTime.split('T')[1]?.substring(0, 5) || '11:30'}
                    </span>
                  </div>
                </div>
                <Badge variant={ev.category === 'meeting' ? 'lavender' : 'mint'}>
                  {ev.category.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Agenda Card */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-display-4 text-primaryDark mb-2">
              Deep Work Allocation
            </h3>
            <p className="text-ui-rg-sm text-secondaryGray">
              Maintain optimal cognitive flow by clustering meetings in afternoons and safeguarding mornings for deep architecture work.
            </p>
          </div>

          <div className="my-6 p-4 rounded-card bg-bg border border-border flex items-center justify-between">
            <div>
              <span className="font-mono text-mono-xs text-midGray uppercase block">
                Total Focus Planned
              </span>
              <span className="font-display font-bold text-display-2 text-primaryDark">
                3.75 hrs
              </span>
            </div>
            <Badge variant="sky">82% Deep Work Ratio</Badge>
          </div>

          <div className="flex gap-2">
            <Badge variant="lavender">Meeting Block</Badge>
            <Badge variant="mint">Focus Block</Badge>
            <Badge variant="sky">Habit Block</Badge>
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Time Block"
        description="Block dedicated deep focus or meeting time on your agenda."
      >
        <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Block Title
            </label>
            <input
              type="text"
              autoFocus
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g. Code Review & System Refactor..."
              className="bg-bg border border-border rounded-md px-3.5 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
              Block Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as any)}
              className="bg-bg border border-border rounded-md px-3 py-2 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
            >
              <option value="focus">Focus (Deep Work)</option>
              <option value="meeting">Meeting</option>
              <option value="personal">Personal</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-mono-xs font-semibold text-primaryDark uppercase">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-ui-rg-sm text-primaryDark outline-none focus:border-[#C5BDAF]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Schedule Block
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
