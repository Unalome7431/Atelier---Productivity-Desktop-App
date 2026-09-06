import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const KanbanView: React.FC = () => {
  return (
    <div className="flex-1 overflow-x-auto p-8 flex flex-col gap-6 bg-bg h-full">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-mono-uppercase text-midGray uppercase">
            Execution Board
          </span>
          <h2 className="font-display font-bold text-display-2 text-primaryDark mt-1">
            Productivity OS Roadmap
          </h2>
        </div>
        <Button variant="primary" size="md" className="gap-2">
          <Plus className="w-4 h-4" />
          <span>New Column</span>
        </Button>
      </div>

      <div className="flex gap-6 items-start flex-1 min-h-0">
        {/* Column 1 */}
        <div className="w-80 bg-surface rounded-panel border border-border p-4 flex flex-col gap-3 shadow-card">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-mauve" />
              <span className="font-display font-bold text-display-6 text-primaryDark">
                Backlog & Ideas
              </span>
            </div>
            <span className="font-mono text-mono-xs text-midGray">2</span>
          </div>

          <div className="p-4 rounded-card bg-bg border border-border shadow-subtle flex flex-col gap-2">
            <Badge variant="lavender" size="sm">#research</Badge>
            <h4 className="font-sans font-semibold text-ui-bold-sm text-primaryDark">
              Telegram Serverless Webhook Bot
            </h4>
            <p className="text-ui-rg-xs text-secondaryGray">
              Explore grammY edge runtime on Cloudflare Workers
            </p>
          </div>
        </div>

        {/* Column 2 */}
        <div className="w-80 bg-surface rounded-panel border border-border p-4 flex flex-col gap-3 shadow-card">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-blue" />
              <span className="font-display font-bold text-display-6 text-primaryDark">
                In Progress
              </span>
            </div>
            <span className="font-mono text-mono-xs text-midGray">1</span>
          </div>

          <div className="p-4 rounded-card bg-bg border border-border shadow-subtle flex flex-col gap-2">
            <Badge variant="mint" size="sm">#core</Badge>
            <h4 className="font-sans font-semibold text-ui-bold-sm text-primaryDark">
              Desktop Foundation & Aura UI
            </h4>
            <p className="text-ui-rg-xs text-secondaryGray">
              Phase 1 setup with Vite, React, and strict TypeScript
            </p>
          </div>
        </div>

        {/* Column 3 */}
        <div className="w-80 bg-surface rounded-panel border border-border p-4 flex flex-col gap-3 shadow-card">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
              <span className="font-display font-bold text-display-6 text-primaryDark">
                Done & Verified
              </span>
            </div>
            <span className="font-mono text-mono-xs text-midGray">1</span>
          </div>

          <div className="p-4 rounded-card bg-bg border border-border shadow-subtle flex flex-col gap-2">
            <Badge variant="default" size="sm">#spec</Badge>
            <h4 className="font-sans font-semibold text-ui-bold-sm text-primaryDark line-through text-midGray">
              PRD & Styleguide Definition
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};
