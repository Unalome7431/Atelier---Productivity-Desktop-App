import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Trash2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Move to Trash',
  description = 'Are you sure you want to move this item to the Trash Bin? You can restore it anytime within 30 days in Setting.',
  confirmText = 'Move to Trash',
  cancelText = 'Cancel',
  variant = 'destructive',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Confirmation action failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} maxWidth="sm">
      <div className="flex items-center justify-end gap-2.5 pt-4">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'primary'}
          size="sm"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="gap-1.5"
        >
          {variant === 'destructive' && <Trash2 className="w-3.5 h-3.5" />}
          <span>{confirmText}</span>
        </Button>
      </div>
    </Modal>
  );
};
