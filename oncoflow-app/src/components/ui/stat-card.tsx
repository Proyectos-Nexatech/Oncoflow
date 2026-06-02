import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardAccent = 'primary' | 'success' | 'warning' | 'danger';
type Trend = 'up' | 'down' | 'neutral';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: StatCardAccent;
  trend?: Trend;
  trendValue?: string;
  subtitle?: string;
  className?: string;
}

const accentConfig: Record<StatCardAccent, { bar: string; iconBg: string; iconText: string }> = {
  primary: {
    bar: 'from-[hsl(var(--primary))] to-[hsl(var(--primary-light))]',
    iconBg: 'bg-blue-50',
    iconText: 'text-[hsl(var(--primary))]',
  },
  success: {
    bar: 'from-[hsl(var(--secondary))] to-emerald-400',
    iconBg: 'bg-emerald-50',
    iconText: 'text-[hsl(var(--secondary))]',
  },
  warning: {
    bar: 'from-[hsl(var(--warning))] to-amber-400',
    iconBg: 'bg-amber-50',
    iconText: 'text-[hsl(var(--warning))]',
  },
  danger: {
    bar: 'from-[hsl(var(--danger))] to-red-400',
    iconBg: 'bg-red-50',
    iconText: 'text-[hsl(var(--danger))]',
  },
};

const trendConfig: Record<Trend, { icon: React.ReactNode; color: string }> = {
  up: { icon: <TrendingUp size={14} />, color: 'text-emerald-600' },
  down: { icon: <TrendingDown size={14} />, color: 'text-red-500' },
  neutral: { icon: <Minus size={14} />, color: 'text-[hsl(var(--muted-foreground))]' },
};

export function StatCard({
  title,
  value,
  icon,
  accent = 'primary',
  trend,
  trendValue,
  subtitle,
  className,
}: StatCardProps) {
  const config = accentConfig[accent];
  const trendInfo = trend ? trendConfig[trend] : null;

  return (
    <div
      className={cn(
        'kpi-card relative overflow-hidden bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[var(--radius)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]',
        className
      )}
    >
      {/* Accent bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r', config.bar)} />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">{title}</p>
          <p className="text-3xl font-bold text-[hsl(var(--foreground))] leading-tight tracking-tight">
            {value}
          </p>
          {(trendInfo || subtitle) && (
            <div className="flex items-center gap-2 mt-2">
              {trendInfo && (
                <span className={cn('flex items-center gap-0.5 text-xs font-medium', trendInfo.color)}>
                  {trendInfo.icon}
                  {trendValue}
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
            config.iconBg,
            config.iconText
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
