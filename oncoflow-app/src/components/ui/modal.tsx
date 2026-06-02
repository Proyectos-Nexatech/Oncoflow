'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-[fadeIn_0.2s_ease] data-[state=closed]:animate-[fadeOut_0.15s_ease]" />

        {/* Content */}
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full bg-[hsl(var(--card))] rounded-xl shadow-[var(--shadow-lg)] border border-[hsl(var(--border))]',
            'data-[state=open]:animate-[scaleIn_0.2s_ease] data-[state=closed]:animate-[scaleOut_0.15s_ease]',
            'focus:outline-none',
            sizeMap[size],
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
            <div>
              <Dialog.Title className="text-base font-semibold text-[hsl(var(--foreground))]">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors focus:outline-none"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] rounded-b-xl">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Also export Trigger for convenience
export const ModalTrigger = Dialog.Trigger;
