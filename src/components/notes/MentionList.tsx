import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { LayoutGrid, Network, CheckSquare, FileText } from 'lucide-react';
import { MentionItem } from '@/types';
import { cn } from '@/lib/utils';

export interface MentionListProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (items.length === 0) return false;

        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          if (items[selectedIndex]) {
            command(items[selectedIndex]);
            return true;
          }
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="bg-white border border-border shadow-float rounded-2xl p-3 min-w-[240px] text-xs font-sans text-secondaryGray">
          No matching entity found
        </div>
      );
    }

    const getIcon = (type: MentionItem['type']) => {
      switch (type) {
        case 'card':
          return LayoutGrid;
        case 'canvas':
          return Network;
        case 'task':
          return CheckSquare;
        case 'note':
        default:
          return FileText;
      }
    };

    const getBadge = (type: MentionItem['type']) => {
      switch (type) {
        case 'card':
          return { label: 'KANBAN', color: 'bg-accent-blue text-sky-950' };
        case 'canvas':
          return { label: 'CANVAS', color: 'bg-accent-indigo text-indigo-950' };
        case 'task':
          return { label: 'TASK', color: 'bg-accent-pink text-amber-950' };
        case 'note':
        default:
          return { label: 'NOTE', color: 'bg-accent-green text-emerald-950' };
      }
    };

    return (
      <div className="bg-white border border-border shadow-float rounded-2xl p-1.5 min-w-[280px] max-w-sm max-h-64 overflow-y-auto flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-100">
        <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-midGray uppercase tracking-wider border-b border-border/50 select-none">
          Link Entity
        </div>

        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          const Icon = getIcon(item.type);
          const badge = getBadge(item.type);

          return (
            <button
              key={`${item.type}_${item.id}`}
              type="button"
              onClick={() => command(item)}
              className={cn(
                'flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer select-none',
                isSelected ? 'bg-surface font-medium' : 'hover:bg-bg'
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Icon className="w-3.5 h-3.5 text-secondaryGray shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-sans text-primaryDark truncate">{item.title}</span>
                  {item.subtitle && (
                    <span className="text-[10px] font-sans text-secondaryGray truncate">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </div>

              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase shrink-0',
                  badge.color
                )}
              >
                {badge.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
);

MentionList.displayName = 'MentionList';
