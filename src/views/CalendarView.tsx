import React from 'react';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const CalendarView: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 bg-bg max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-mono-uppercase text-midGray uppercase">
            Time Blocking & Agenda
          </span>
          <h2 className="font-display font-bold text-display-2 text-primaryDark mt-1">
            Weekly Schedule
          </h2>
        </div>
        <Button variant="primary" size="md" className="gap-2">
          <Plus className="w-4 h-4" />
          <span>New Time Block</span>
        </Button>
      </div>

      <div className="p-8 rounded-panel bg-surface border border-border flex flex-col items-center justify-center min-h-[400px] text-center gap-3 shadow-card">
        <div className="w-12 h-12 rounded-full bg-accent-indigo flex items-center justify-center text-primaryDark shadow-subtle">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <h3 className="font-display font-bold text-display-3 text-primaryDark">
          Schedule & Calendar Grid
        </h3>
        <p className="text-ui-rg-sm text-secondaryGray max-w-md">
          Calm pastel time-blocking grid with Deep Work focus blocks, meetings, and habits integrated seamlessly.
        </p>
        <div className="flex gap-2 mt-2">
          <Badge variant="lavender">Meeting Block</Badge>
          <Badge variant="mint">Focus Block</Badge>
          <Badge variant="sky">Habit Block</Badge>
        </div>
      </div>
    </div>
  );
};
