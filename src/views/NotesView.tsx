import React from 'react';
import { Plus, Pin, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const NotesView: React.FC = () => {
  return (
    <div className="flex-1 flex h-full bg-bg">
      {/* Notes Sidebar List */}
      <div className="w-72 border-r border-border bg-surface p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-primaryDark">
            Notes & Docs
          </h3>
          <Button variant="primary" size="icon" className="w-7 h-7">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Notes */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-midGray" />
          <input
            type="text"
            placeholder="Search notes..."
            className="w-full bg-bg border border-border rounded-full pl-8 pr-3 py-1.5 text-xs text-primaryDark placeholder:text-midGray outline-none focus:border-[#C5BDAF]"
          />
        </div>

        {/* Note List */}
        <div className="flex flex-col gap-2 overflow-y-auto">
          <div className="p-3 rounded-card bg-accent-indigo border border-indigo-200/60 shadow-xs flex flex-col gap-1 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="font-sans font-semibold text-sm text-primaryDark">
                System Architecture
              </span>
              <Pin className="w-3 h-3 text-indigo-700 fill-indigo-700" />
            </div>
            <p className="text-xs text-secondaryGray line-clamp-2">
              Atelier bridges local SQLite persistence with remote Postgres sync queue...
            </p>
            <div className="flex gap-1 mt-1">
              <Badge variant="default" size="sm">#design</Badge>
            </div>
          </div>

          <div className="p-3 rounded-card bg-bg border border-border hover:bg-surface transition-colors flex flex-col gap-1 cursor-pointer">
            <span className="font-sans font-semibold text-sm text-primaryDark">
              Weekly Studio Log
            </span>
            <p className="text-xs text-secondaryGray line-clamp-2">
              Key milestones achieved in Phase 1 & 2 layout sprint...
            </p>
          </div>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div>
          <span className="font-mono text-xs text-midGray uppercase tracking-wider">
            Last edited 5 minutes ago • Pinned
          </span>
          <h1 className="font-display font-bold text-3xl text-primaryDark mt-2">
            System Architecture & Offline Sync Protocol
          </h1>
        </div>

        <div className="prose text-secondaryGray text-sm leading-relaxed space-y-4 font-sans">
          <p>
            Atelier operates with a strict <strong>local-first</strong> architecture. Every action, routine check-in, task completion, and note edit writes immediately to the embedded SQLite database before broadcasting across the network.
          </p>
          <div className="p-4 rounded-xl bg-surface border border-border">
            <h4 className="font-display font-semibold text-sm text-primaryDark mb-1">
              ✦ Offline Sync Invariant
            </h4>
            <p className="text-xs text-secondaryGray">
              Mutations are ordered monotonically via high-resolution client timestamps with Last-Write-Wins (LWW) conflict resolution upon cloud reconnection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
