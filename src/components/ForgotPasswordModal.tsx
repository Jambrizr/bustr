import React, { FC, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, X, CheckCircle2, AlertTriangle } from 'lucide-react';
// 1) Import your Supabase client
import { supabase } from '@/lib/auth';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}

type MessageStatus = 'success' | 'error' | null;

interface Message {
  type: MessageStatus;
  text: string;
}

export const ForgotPasswordModal: FC<ForgotPasswordModalProps> = ({
  open,
  onOpenChange,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset message when modal opens/closes
  useEffect(() => {
    if (!open) {
      setMessage(null);
      setIsSubmitting(false);
    }
  }, [open]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Focus the email input when modal opens
      inputRef.current?.focus();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onOpenChange(false);
    }
  };

  // 2) Actual password reset logic with Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const email = (e.currentTarget as HTMLFormElement).email.value.toLowerCase();

    try {
      // Call Supabase's resetPasswordForEmail
      // NOTE: Adjust "redirectTo" to your actual reset page path
      // e.g. 'https://bustr.io/reset-password'
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:3000/resetPassword',
      });

      if (error) {
        console.error('Forgot password error:', error);
        // Many possible error messages from Supabase. 
        // Typically "User not found" for unknown emails, etc.
        if (error.message.toLowerCase().includes('not found')) {
          setMessage({
            type: 'error',
            text: 'No account found with that email address.',
          });
        } else {
          setMessage({
            type: 'error',
            text: error.message || 'An error occurred. Please try again.',
          });
        }
      } else {
        // Success
        setMessage({
          type: 'success',
          text: 'Reset link sent! Please check your email.',
        });
        // Optional: close modal automatically after a delay
        setTimeout(() => onOpenChange(false), 2000);
      }

    } catch (error: any) {
      // Catch any unexpected errors
      console.error('Unexpected error:', error);
      setMessage({
        type: 'error',
        text: error?.message || 'An error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
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
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="
            absolute right-4 top-4
            text-text-light/40 dark:text-text-dark/40
            hover:text-text-light dark:hover:text-text-dark
            transition-colors
            p-1 rounded-full
            hover:bg-background-light dark:hover:bg-background-dark
          "
          aria-label="Close modal"
          disabled={isSubmitting}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="p-6">
          <h2 
            id="modal-title"
            className="text-2xl font-bold mb-2"
          >
            Reset Your Password
          </h2>
          <p className="text-text-light/60 dark:text-text-dark/60 mb-6">
            Enter your email address below and we'll send you instructions to reset your password.
          </p>

          {/* Status Message */}
          {message && (
            <div
              className={`
                mb-4 p-4 rounded-lg flex items-start gap-3
                ${message.type === 'success' 
                  ? 'bg-status-success/10 text-status-success border border-status-success/20' 
                  : 'bg-status-error/10 text-status-error border border-status-error/20'
                }
              `}
              role="alert"
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="text-sm font-medium flex items-center gap-2"
              >
                <Mail className="h-4 w-4 text-text-light/40 dark:text-text-dark/40" />
                Email Address
              </label>
              <Input
                ref={inputRef}
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                className="w-full"
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-coral-500 hover:bg-coral-hover text-white transition-colors min-w-[120px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
