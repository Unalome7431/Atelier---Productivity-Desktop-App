import React from 'react';
import { CheckCircle2, Flame, Plus, Sparkles, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const CockpitView: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 bg-bg max-w-7xl mx-auto w-full">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs font-semibold text-midGray uppercase tracking-wider">
            Today • Sunday, Sep 6
          </span>
          <h2 className="font-display font-bold text-3xl text-primaryDark mt-1">
            Good morning, Creator.
          </h2>
          <p className="text-secondaryGray text-sm mt-0.5">
            You have 4 habits and 3 tasks planned for deep focus today.
          </p>
        </div>
        <Button variant="mint" size="md" className="gap-2">
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </Button>
      </div>

      {/* Routine Progress Card & Habits Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Habit Completion Card */}
        <div className="p-5 rounded-card bg-surface border border-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-base text-primaryDark">
              Daily Habits Cadence
            </span>
            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 font-mono text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span>5-day streak</span>
            </div>
          </div>
          <div className="my-4">
            <div className="flex items-baseline justify-between mb-1.5 font-mono text-xs">
              <span className="text-secondaryGray">Completion</span>
              <span className="font-bold text-primaryDark">75%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-accent-green h-full rounded-full transition-all duration-500"
                style={{ width: '75%' }}
              />
            </div>
          </div>
          <p className="text-xs text-secondaryGray">
            3 of 4 routines completed today. Keep up the rhythm!
          </p>
        </div>

        {/* Focus Time Card */}
        <div className="p-5 rounded-card bg-surface border border-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-base text-primaryDark">
              Focus Time
            </span>
            <Clock className="w-4 h-4 text-secondaryGray" />
          </div>
          <div className="my-2">
            <span className="font-display font-bold text-3xl text-primaryDark">
              2.5 hrs
            </span>
            <p className="text-xs text-secondaryGray mt-1">
              5 pomodoro cycles recorded
            </p>
          </div>
          <div className="flex gap-1.5">
            <Badge variant="mint">#deepwork</Badge>
            <Badge variant="lavender">#coding</Badge>
          </div>
        </div>

        {/* Up Next in Calendar */}
        <div className="p-5 rounded-card bg-surface border border-border flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-base text-primaryDark">
              Next Scheduled Block
            </span>
            <CalendarIcon className="w-4 h-4 text-secondaryGray" />
          </div>
          <div className="my-2">
            <span className="font-display font-semibold text-base text-primaryDark">
              Architecture & API Design
            </span>
            <p className="text-xs text-secondaryGray mt-0.5">
              10:30 AM – 11:45 AM (Focus Block)
            </p>
          </div>
          <Badge variant="sky">Deep Work Block</Badge>
        </div>
      </div>

      {/* Routine Tracker & Today's Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit List */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-mauve" />
              <h3 className="font-display font-bold text-lg text-primaryDark">
                Daily Routines
              </h3>
            </div>
            <span className="font-mono text-xs text-midGray">Auto-reset at 00:00</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              { id: '1', title: 'Morning Movement & Stretch', category: '#health', done: true },
              { id: '2', title: 'Read 15 Pages of Architecture Book', category: '#learning', done: true },
              { id: '3', title: 'Review PRs & Issues', category: '#work', done: true },
              { id: '4', title: 'Evening Daily Reflection & Journal', category: '#mindset', done: false },
            ].map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border/80 hover:border-[#D8D2C5] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      habit.done
                        ? 'bg-primaryDark border-primaryDark text-bg'
                        : 'border-border bg-surface'
                    }`}
                  >
                    {habit.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <span
                    className={`text-sm font-medium ${
                      habit.done ? 'line-through text-midGray' : 'text-primaryDark'
                    }`}
                  >
                    {habit.title}
                  </span>
                </div>
                <Badge variant={habit.done ? 'default' : 'lavender'}>{habit.category}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Tactical Tasks Queue */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-primaryDark">
              Today's Task Queue
            </h3>
            <Button variant="ghost" size="sm" className="text-xs">
              + Add Task
            </Button>
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              { id: 't1', title: 'Scaffold Tauri + Vite frontend foundation', category: '#atelier', time: '09:00 AM', done: true },
              { id: 't2', title: 'Design SQLite offline schema & sync queue', category: '#architecture', time: '11:00 AM', done: false },
              { id: 't3', title: 'Set up spatial canvas with @xyflow/react', category: '#canvas', time: '02:00 PM', done: false },
            ].map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border/80 hover:border-[#D8D2C5] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      task.done
                        ? 'bg-primaryDark border-primaryDark text-bg'
                        : 'border-border bg-surface'
                    }`}
                  >
                    {task.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <span
                    className={`text-sm font-medium ${
                      task.done ? 'line-through text-midGray' : 'text-primaryDark'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-secondaryGray">{task.time}</span>
                  <Badge variant="mint">{task.category}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
