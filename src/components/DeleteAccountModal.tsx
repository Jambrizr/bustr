import React, { FC, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onConfirm: () => void;
}

export const DeleteAccountModal: FC<DeleteAccountModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Handle ESC key and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'Escape') {
        onOpenChange(false);
      }

      // Focus trap
      if (e.key === 'Tab') {
        if (!document.activeElement) return;

        if (e.shiftKey) {
          if (document.activeElement === cancelButtonRef.current) {
            confirmButtonRef.current?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === confirmButtonRef.current) {
            cancelButtonRef.current?.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the cancel button when modal opens
      cancelButtonRef.current?.focus();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      aria-describedby="delete-account-description"
    >
      {/* Modal Content */}
      <div
        ref={modalRef}
        className="
          relative w-full max-w-md 
          bg-white dark:bg-[#2A2A2A] 
          rounded-lg shadow-xl
          border border-border-light dark:border-border-dark
          transition-all duration-200
          animate-in fade-in-0 zoom-in-95
        "
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Warning Icon */}
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-status-error/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-status-error" />
          </div>

          {/* Title */}
          <h2 
            id="delete-account-title"
            className="text-[28px] font-bold text-center mb-2"
          >
            Delete Account
          </h2>

          {/* Warning Message */}
          <p 
            id="delete-account-description"
            className="text-center text-text-light/60 dark:text-text-dark/60 mb-6"
          >
            Are you sure you want to delete your account? This action is irreversible and all your data will be permanently removed.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button
              ref={cancelButtonRef}
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              ref={confirmButtonRef}
              type="button"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="
                w-full sm:w-auto
                bg-status-error hover:bg-[#D64545]
                text-white transition-colors
              "
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};