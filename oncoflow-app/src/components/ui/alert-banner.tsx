'use client';

import React, { useState } from 'react';
import { Info, AlertTriangle, XCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'warning' | 'error' | 'success';

interface AlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  action?: React.ReactNode;
}

const variantConfig: Record<
  AlertVariant,
  { icon: React.ReactNode; containerClass: string; iconClass: string }
> = {
  info: {
    icon: <Info size={17} />,
    containerClass: 'alert-info bg-blue-50 border-blue-200 text-blue-800',
    iconClass: 'text-blue-500',
  },
  warning: {
    icon: <AlertTriangle size={17} />,
    containerClass: 'alert-warning bg-amber-50 border-amber-200 text-amber-800',
    iconClass: 'text-amber-500',
  },
  error: {
    icon: <XCircle size={17} />,
    containerClass: 'alert-error bg-red-50 border-red-200 text-red-800',
    iconClass: 'text-red-500',
  },
  success: {
    icon: <CheckCircle size={17} />,
    containerClass: 'alert-success bg-emerald-50 border-emerald-200 text-emerald-800',
    iconClass: 'text-emerald-500',
  },
};

export function AlertBanner({
  variant = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  className,
  action,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const config = variantConfig[variant] || variantConfig['info'];

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'alert flex items-start gap-3 p-3.5 rounded-[var(--radius)] border text-sm animate-fade-in',
        config.containerClass,
        className
      )}
      role="alert"
    >
      <span className={cn('flex-shrink-0 mt-0.5', config.iconClass)}>{config.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <p className="leading-relaxed">{message}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 rounded-md p-0.5 opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
          aria-label="Cerrar alerta"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
