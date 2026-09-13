import React from 'react';
import { Link2, ExternalLink, Network, FileText, LayoutGrid, CheckSquare } from 'lucide-react';
import { BacklinkItem, NavigationTab } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { cn } from '@/lib/utils';

interface BacklinksSectionProps {
  backlinks: BacklinkItem[];
}

export const BacklinksSection: React.FC<BacklinksSectionProps> = ({ backlinks }) => {
  const { setActiveTab } = useAppStore();
  const { setActiveCanvasId } = useCanvasStore();
  const { setActiveBoardId, openCardDrawer } = useKanbanStore();
  const { setActiveNoteId } = useNotesStore();

  const handleNavigate = (item: BacklinkItem) => {
    switch (item.type) {
      case 'canvas':
        setActiveCanvasId(item.targetId);
        setActiveTab('canvas' as NavigationTab);
        break;
      case 'kanban':
        if (item.containerId) {
          setActiveBoardId(item.containerId);
        }
        openCardDrawer(item.targetId);
        setActiveTab('kanban' as NavigationTab);
        break;
      case 'task':
        setActiveTab('cockpit' as NavigationTab);
        break;
      case 'note':
        setActiveNoteId(item.targetId);
        break;
    }
  };

  const getTypeDetails = (type: BacklinkItem['type']) => {
    switch (type) {
      case 'canvas':
        return {
          label: 'CANVAS',
          badgeClass: 'bg-accent-indigo text-indigo-950 border border-indigo-200/60',
          icon: Network,
          actionText: 'Open Canvas',
        };
      case 'kanban':
        return {
          label: 'KANBAN',
          badgeClass: 'bg-accent-blue text-sky-950 border border-sky-200/60',
          icon: LayoutGrid,
          actionText: 'Open Card',
        };
      case 'task':
        return {
          label: 'TASK',
          badgeClass: 'bg-accent-pink text-amber-950 border border-amber-200/60',
          icon: CheckSquare,
          actionText: 'View Task',
        };
      case 'note':
      default:
        return {
          label: 'NOTE',
          badgeClass: 'bg-accent-green text-emerald-950 border border-emerald-200/60',
          icon: FileText,
          actionText: 'Open Note',
        };
    }
  };

  return (
    <div className="mt-14 pt-8 border-t border-border/80 select-none">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-secondaryGray" />
          <span className="font-mono text-mono-xs font-bold text-secondaryGray uppercase tracking-wider">
            Backlinks & References
          </span>
        </div>
        <span className="font-mono text-[10px] text-midGray">
          {backlinks.length} connected reference{backlinks.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Backlinks Grid / List */}
      {backlinks.length === 0 ? (
        <div className="p-5 rounded-2xl border border-dashed border-border bg-surface/40 text-center flex flex-col items-center justify-center gap-1.5">
          <span className="font-sans text-xs text-secondaryGray">No external references to this note yet.</span>
          <span className="font-mono text-[10px] text-midGray">
            Type @ in other notes, canvas nodes, or kanban tasks to establish bidirectional links.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {backlinks.map((item) => {
            const details = getTypeDetails(item.type);
            const Icon = details.icon;

            return (
              <div
                key={item.id}
                onClick={() => handleNavigate(item)}
                className="group p-3.5 rounded-2xl bg-surface/60 hover:bg-white border border-border hover:border-indigo-200/80 shadow-subtle hover:shadow-float transition-all cursor-pointer flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-4 h-4 text-secondaryGray shrink-0 group-hover:text-primaryDark transition-colors" />
                    <span className="font-sans font-semibold text-xs text-primaryDark truncate">
                      {item.title}
                    </span>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase shrink-0', details.badgeClass)}>
                    {details.label}
                  </span>
                </div>

                {item.subtitle && (
                  <p className="font-sans text-[11px] text-secondaryGray line-clamp-1">
                    {item.subtitle}
                  </p>
                )}

                <div className="flex items-center justify-end gap-1 font-sans text-[11px] font-medium text-secondaryGray group-hover:text-primaryDark pt-1 border-t border-border/40 transition-colors">
                  <span>{details.actionText}</span>
                  <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
