import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'mint' | 'lavender' | 'pink' | 'sky' | 'mauve' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'sm',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-mono font-medium rounded-full transition-colors select-none';

  const variants = {
    default: 'bg-surface text-secondaryGray border border-border',
    mint: 'bg-accent-green/70 text-emerald-900 border border-emerald-200/50',
    lavender: 'bg-accent-indigo text-indigo-900 border border-indigo-200/50',
    pink: 'bg-accent-pink text-amber-900 border border-amber-200/50',
    sky: 'bg-accent-blue/60 text-sky-900 border border-sky-200/50',
    mauve: 'bg-accent-mauve/15 text-accent-mauve border border-accent-mauve/30',
    outline: 'bg-transparent text-secondaryGray border border-border',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 tracking-tight',
    md: 'text-xs px-3 py-1',
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
