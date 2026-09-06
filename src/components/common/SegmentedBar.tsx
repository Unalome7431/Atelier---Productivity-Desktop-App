import React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedBarProps {
  totalSegments?: number;
  completedSegments: number;
  className?: string;
  activeColor?: string;
}

export const SegmentedBar: React.FC<SegmentedBarProps> = ({
  totalSegments = 5,
  completedSegments,
  className,
  activeColor = 'bg-accent-green',
}) => {
  return (
    <div className={cn('flex items-center gap-1.5 w-full', className)}>
      {Array.from({ length: totalSegments }).map((_, i) => {
        const isFilled = i < completedSegments;
        return (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-pill transition-all duration-300',
              isFilled ? activeColor : 'bg-border/80'
            )}
          />
        );
      })}
    </div>
  );
};
