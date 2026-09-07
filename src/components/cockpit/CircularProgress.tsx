import React from 'react';
import { cn } from '@/lib/utils';

export interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  sublabel?: string;
  colorClass?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 96,
  strokeWidth = 8,
  className,
  label,
  sublabel,
  colorClass = 'stroke-accent-green text-accent-green',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn('relative flex flex-col items-center justify-center select-none', className)}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-border/70 fill-none"
        />
        {/* Progress bar */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('fill-none transition-all duration-700 ease-out', colorClass)}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display font-bold text-display-4 text-primaryDark leading-none">
          {Math.round(clamped)}%
        </span>
        {label && (
          <span className="font-mono text-mono-xs text-secondaryGray mt-0.5 leading-none">
            {label}
          </span>
        )}
      </div>
      {sublabel && (
        <span className="font-mono text-mono-tag text-midGray mt-1.5 uppercase tracking-wider">
          {sublabel}
        </span>
      )}
    </div>
  );
};
