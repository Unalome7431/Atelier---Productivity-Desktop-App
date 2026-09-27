import React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'mint'
  | 'lavender'
  | 'pill'
  | 'dark';

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
      'bg-primaryDark text-white font-semibold hover:opacity-90 shadow-subtle',
    secondary:
      'bg-white text-primaryDark border border-border-hover hover:bg-surface shadow-subtle',
    ghost: 'bg-transparent text-secondaryGray hover:text-primaryDark hover:bg-border/50',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
    mint: 'bg-primaryDark text-white font-semibold hover:opacity-90 shadow-subtle',
    lavender:
      'bg-surface text-primaryDark border border-border hover:bg-surface-alt shadow-subtle',
    pill: 'bg-surface text-primaryDark border border-border hover:bg-surface-alt hover:border-border-hover shadow-subtle',
    dark: 'bg-primaryDark text-white font-semibold hover:opacity-90 shadow-subtle',
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
    <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
