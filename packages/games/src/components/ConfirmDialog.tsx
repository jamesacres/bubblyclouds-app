'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A small "are you sure?" modal for destructive actions (Retry, Reset,
// Reveal). Renders nothing when closed so it stays out of the tab order until
// summoned; the backdrop click and Cancel both back out without acting.
const ConfirmDialog = ({
  isOpen,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previouslyFocusedRef.current = document.activeElement as HTMLElement;
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (
          activeElement === firstElement ||
          !dialogRef.current.contains(activeElement)
        ) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (
          activeElement === lastElement ||
          !dialogRef.current.contains(activeElement)
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={dialogRef}
      data-testid="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 backdrop-blur-sm"
      style={{ animation: 'unblock-confirm-fade 150ms ease-out both' }}
      onClick={onCancel}
    >
      <style>{`
        @keyframes unblock-confirm-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-testid="confirm-dialog"] { animation: none !important; }
        }
      `}</style>
      <div
        className="w-full max-w-xs rounded-2xl border border-stone-200/80 bg-white p-5 text-center shadow-2xl dark:border-white/10 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-base font-black tracking-tight text-stone-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-stone-600 dark:text-zinc-300">
          {body}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            ref={cancelButtonRef}
            type="button"
            data-testid="confirm-dialog-cancel"
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-full border border-stone-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-stone-700 transition-all duration-200 hover:bg-white active:scale-95 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-dialog-confirm"
            onClick={onConfirm}
            className="flex-1 cursor-pointer rounded-full bg-rose-600 px-4 py-2 text-sm font-black uppercase tracking-wide text-white transition-all duration-200 hover:bg-rose-700 active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
