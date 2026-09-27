import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'pill' | 'default';
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', leftIcon, rightElement, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span className="absolute left-3.5 text-secondaryGray pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-bg border border-border text-primaryDark placeholder:text-midGray transition-all outline-none font-sans text-ui-rg-sm focus:border-border-focus',
            variant === 'pill' ? 'rounded-pill px-4 py-2' : 'rounded-md px-3.5 py-2',
            leftIcon ? 'pl-9' : '',
            rightElement ? 'pr-12' : '',
            className
          )}
          {...props}
        />
        {rightElement && <div className="absolute right-3 flex items-center">{rightElement}</div>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  shortcut?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  shortcut = '⌘K',
  className,
  ...props
}) => {
  return (
    <Input
      variant="pill"
      leftIcon={<Search className="w-4 h-4" />}
      rightElement={
        shortcut ? (
          <kbd className="font-mono text-mono-xs bg-surface border border-border px-1.5 py-0.5 rounded-sm text-midGray">
            {shortcut}
          </kbd>
        ) : undefined
      }
      className={className}
      {...props}
    />
  );
};
