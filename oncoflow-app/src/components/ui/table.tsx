import React from 'react';
import { cn } from '@/lib/utils';

// Table root wrapper
export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-[var(--radius)] border border-[hsl(var(--border))]">
      <table
        className={cn('data-table w-full border-collapse text-sm', className)}
        {...props}
      />
    </div>
  );
}

// TableHeader
export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('bg-[hsl(var(--muted))] border-b-2 border-[hsl(var(--border))]', className)}
      {...props}
    />
  );
}

// TableBody
export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-[hsl(var(--border))]', className)} {...props} />;
}

// TableRow
export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-[hsl(var(--border))] transition-colors duration-100 hover:bg-[hsl(var(--muted))]',
        className
      )}
      {...props}
    />
  );
}

// TableHead (th)
export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-[0.8125rem] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-[0.025em] whitespace-nowrap',
        className
      )}
      {...props}
    />
  );
}

// TableCell (td)
export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-3.5 align-middle text-sm text-[hsl(var(--foreground))]', className)}
      {...props}
    />
  );
}

// TableEmpty
interface TableEmptyProps {
  colSpan?: number;
  message?: string;
  icon?: React.ReactNode;
}
export function TableEmpty({ colSpan = 10, message = 'No hay datos disponibles', icon }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3 text-[hsl(var(--muted-foreground))]">
          {icon || (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 17H5a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2h-4" />
              <rect x="9" y="11" width="6" height="6" rx="1" />
              <path d="M12 11V7" />
              <path d="M9 7h6" />
            </svg>
          )}
          <p className="text-sm font-medium">{message}</p>
        </div>
      </td>
    </tr>
  );
}
