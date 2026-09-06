import React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'mint'
  | 'lavender'
  | 'pill';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-sans font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none rounded-pill';

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-primaryDark text-bg hover:bg-[#1a1918] shadow-subtle',
    secondary:
      'bg-surface text-primaryDark border border-border hover:bg-[#EFE9DC] shadow-subtle',
    ghost:
      'bg-transparent text-secondaryGray hover:text-primaryDark hover:bg-border/50',
    destructive:
      'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
    mint:
      'bg-accent-green text-emerald-950 font-semibold hover:brightness-95 shadow-subtle border border-emerald-300/40',
    lavender:
      'bg-accent-indigo text-indigo-950 font-semibold hover:brightness-95 shadow-subtle border border-indigo-200/60',
    pill:
      'bg-surface text-secondaryGray border border-border hover:text-primaryDark hover:border-[#D0C8BA] shadow-subtle',
  };

  const sizes: Record<ButtonSize, string> = {
    xs: 'text-ui-rg-xxs px-2.5 py-1 gap-1',
    sm: 'text-ui-rg-xs px-3 py-1.5 gap-1.5',
    md: 'text-ui-md-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
    icon: 'p-2 aspect-square',
    'icon-sm': 'p-1.5 aspect-square',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
