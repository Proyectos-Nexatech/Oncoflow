'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-0.5 w-full">
        {label && (
          <label htmlFor={inputId} className="form-label text-sm font-medium text-[hsl(var(--foreground))] mb-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 text-[hsl(var(--muted-foreground))] flex items-center pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'form-input w-full py-2 px-3.5 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
              'outline-none transition-all duration-150 placeholder:text-[hsl(var(--muted-foreground))]',
              'focus:border-[hsl(var(--primary))] focus:shadow-[0_0_0_3px_hsla(211,87%,36%,0.15)]',
              leftIcon && '!pl-10',
              rightIcon && 'pr-9',
              error && 'border-[hsl(var(--danger))] focus:border-[hsl(var(--danger))] focus:shadow-[0_0_0_3px_hsla(0,64%,52%,0.12)]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-[hsl(var(--muted-foreground))] flex items-center">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="form-error text-xs text-[hsl(var(--danger))] mt-0.5 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
