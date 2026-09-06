import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'mint' | 'pill';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-sans font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

  const variants = {
    primary:
      'bg-primaryDark text-bg hover:bg-[#1a1918] shadow-sm rounded-full',
    secondary:
      'bg-surface text-primaryDark border border-border hover:bg-[#EFE9DC] shadow-sm rounded-full',
    ghost:
      'bg-transparent text-secondaryGray hover:text-primaryDark hover:bg-surface/60 rounded-full',
    destructive:
      'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-full',
    mint:
      'bg-accent-green text-primaryDark font-semibold hover:brightness-95 shadow-sm rounded-full',
    pill:
      'bg-accent-indigo text-primaryDark hover:brightness-95 font-medium rounded-full',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
    icon: 'p-2 aspect-square rounded-full',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
