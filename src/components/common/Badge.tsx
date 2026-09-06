import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'mint'
  | 'lavender'
  | 'pink'
  | 'sky'
  | 'mauve'
  | 'outline'
  | 'p1' // Blush pink
  | 'p2' // Butter yellow
  | 'p3'; // Periwinkle

export type BadgeSize = 'sm' | 'md' | 'xs';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'sm',
  dot = false,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 font-mono font-medium rounded-pill transition-colors select-none tracking-tight';

  const variants: Record<BadgeVariant, string> = {
    default: 'bg-surface text-secondaryGray border border-border',
    mint: 'bg-accent-green/80 text-emerald-950 border border-emerald-300/40',
    lavender: 'bg-accent-indigo text-indigo-950 border border-indigo-200/60',
    pink: 'bg-accent-pink text-amber-950 border border-amber-200/60',
    sky: 'bg-accent-blue/70 text-sky-950 border border-sky-200/60',
    mauve: 'bg-accent-mauve/15 text-accent-mauve border border-accent-mauve/30',
    outline: 'bg-transparent text-secondaryGray border border-border',
    p1: 'bg-rose-100/90 text-rose-900 border border-rose-200 font-semibold',
    p2: 'bg-amber-100/90 text-amber-900 border border-amber-200 font-semibold',
    p3: 'bg-indigo-100/90 text-indigo-900 border border-indigo-200 font-semibold',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-midGray',
    mint: 'bg-emerald-600',
    lavender: 'bg-indigo-600',
    pink: 'bg-amber-600',
    sky: 'bg-sky-600',
    mauve: 'bg-accent-mauve',
    outline: 'bg-secondaryGray',
    p1: 'bg-rose-600',
    p2: 'bg-amber-600',
    p3: 'bg-indigo-600',
  };

  const sizes: Record<BadgeSize, string> = {
    xs: 'text-mono-tag px-2 py-0.5',
    sm: 'text-mono-xs px-2.5 py-0.5',
    md: 'text-mono-md px-3 py-1',
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};

export const Eyebrow: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <span
      className={cn(
        'font-mono text-mono-uppercase text-secondaryGray uppercase select-none tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
