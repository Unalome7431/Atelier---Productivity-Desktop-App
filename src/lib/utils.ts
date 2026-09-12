import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-display-1',
        'text-display-2',
        'text-display-3',
        'text-display-4',
        'text-display-5',
        'text-display-6',
        'text-ui-bold-sm',
        'text-ui-bold-xs',
        'text-ui-md-sm',
        'text-ui-md-xs',
        'text-ui-rg-sm',
        'text-ui-rg-xs',
        'text-ui-rg-xxs',
        'text-mono-lg',
        'text-mono-uppercase',
        'text-mono-md',
        'text-mono-xs',
        'text-mono-tag',
      ],
      rounded: ['rounded-card', 'rounded-panel', 'rounded-pill'],
      shadow: ['shadow-hairline', 'shadow-subtle', 'shadow-card', 'shadow-float', 'shadow-modal'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
