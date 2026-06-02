import React from 'react';
import { cn } from '@/lib/utils';

// Card root
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}
export function Card({ className, hover = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[var(--radius)] shadow-[var(--shadow-sm)] transition-shadow duration-200',
        hover && 'hover:shadow-[var(--shadow)]',
        className
      )}
      {...props}
    />
  );
}

// CardHeader
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1 px-5 pt-5 pb-0', className)}
      {...props}
    />
  );
}

// CardTitle
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold leading-tight text-[hsl(var(--foreground))]', className)}
      {...props}
    />
  );
}

// CardDescription
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-[hsl(var(--muted-foreground))]', className)}
      {...props}
    />
  );
}

// CardContent
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4', className)} {...props} />
  );
}

// CardFooter
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center px-5 py-4 pt-0 border-t border-[hsl(var(--border))] mt-auto',
        className
      )}
      {...props}
    />
  );
}
