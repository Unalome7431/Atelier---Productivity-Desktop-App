import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 bg-primaryDark/25 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full bg-surface border border-border rounded-panel shadow-modal p-6 flex flex-col gap-4',
          maxWidths[maxWidth]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between">
            <div>
              {title && (
                <h3 className="font-display font-bold text-display-4 text-primaryDark">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-ui-rg-xs text-secondaryGray mt-0.5">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="text-secondaryGray hover:text-primaryDark"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
