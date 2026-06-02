'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))] hover:shadow-[0_4px_12px_hsla(211,87%,36%,0.35)] active:scale-[0.98]',
  secondary:
    'bg-[hsl(var(--secondary))] text-white border-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary-light))] active:scale-[0.98]',
  ghost:
    'bg-transparent text-[hsl(var(--foreground))] border-transparent hover:bg-[hsl(var(--muted))] active:scale-[0.98]',
  outline:
    'bg-transparent text-[hsl(var(--primary))] border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white active:scale-[0.98]',
  danger:
    'bg-[hsl(var(--danger))] text-white border-[hsl(var(--danger))] hover:bg-red-600 hover:shadow-[0_4px_12px_rgba(214,59,59,0.35)] active:scale-[0.98]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'btn-sm px-3 py-1.5 text-[0.8125rem] gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'btn-lg px-6 py-3 text-base gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'btn inline-flex items-center justify-center font-medium transition-all duration-150 border rounded-[var(--radius)] cursor-pointer whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && 'opacity-50 pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      {children}
    </button>
  );
}
