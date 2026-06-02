'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Pill,
  Package,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Pacientes', href: '/pacientes', icon: <Users size={18} /> },
  { label: 'Programación', href: '/programacion', icon: <CalendarDays size={18} /> },
  { label: 'Medicamentos', href: '/medicamentos', icon: <Pill size={18} /> },
  { label: 'Entregas', href: '/entregas', icon: <Package size={18} /> },
  { label: 'Documentos', href: '/documentos', icon: <FileText size={18} />, badge: 3 },
  { label: 'Facturación', href: '/facturacion', icon: <Receipt size={18} /> },
  { label: 'Reportes', href: '/reportes', icon: <BarChart3 size={18} /> },
  { label: 'Administración', href: '/administracion', icon: <Settings size={18} /> },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'sidebar flex flex-col transition-all duration-300 h-full',
        'bg-[hsl(215,40%,10%)] text-[hsl(var(--sidebar-foreground))]',
        collapsed ? 'collapsed' : '',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center shadow-lg">
          <Activity size={18} className="text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <span className="text-white font-bold text-lg tracking-tight leading-none block">
              ONCO<span className="text-[hsl(var(--secondary))]">FLOW</span>
            </span>
            <span className="text-[hsl(var(--sidebar-foreground))] text-[0.65rem] opacity-60 tracking-widest uppercase leading-none">
              Oncología
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-nav-item group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-150 mb-0.5',
                isActive
                  ? 'bg-[hsl(var(--primary))] text-white opacity-100 font-medium shadow-[0_2px_8px_hsla(211,87%,36%,0.4)]'
                  : 'text-[hsl(var(--sidebar-foreground))] opacity-70 hover:bg-[hsl(var(--sidebar-muted))] hover:opacity-100'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="flex-1 truncate animate-fade-in">{item.label}</span>
              )}
              {/* Badge */}
              {item.badge && !collapsed && (
                <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[hsl(var(--warning))] text-white text-[0.65rem] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {item.badge && collapsed && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[hsl(var(--warning))]" />
              )}
              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Alerts indicator */}
      <div className={cn(
        'mx-2 mb-2 p-2.5 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-muted))] flex items-center transition-all duration-300 overflow-hidden whitespace-nowrap',
        collapsed ? 'justify-center w-[56px]' : 'justify-start gap-2.5 w-[244px]'
      )}>
        <div className="relative flex-shrink-0">
          <Bell size={16} className="text-[hsl(var(--warning))]" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[hsl(var(--warning))] rounded-full text-white text-[0.55rem] font-bold flex items-center justify-center">5</span>
        </div>
        <div className={cn('flex-1 min-w-0 transition-opacity duration-300', collapsed ? 'opacity-0 w-0' : 'opacity-100')}>
          <p className="text-xs font-medium text-[hsl(var(--sidebar-foreground))] opacity-90 truncate">5 alertas activas</p>
          <p className="text-[0.65rem] text-[hsl(var(--sidebar-foreground))] opacity-50 truncate">Documentos por vencer</p>
        </div>
      </div>

      {/* User info */}
      <div className={cn(
        'border-t border-[hsl(var(--sidebar-border))] p-3 flex items-center transition-all duration-300 overflow-hidden whitespace-nowrap',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center text-white text-xs font-bold">
          AD
        </div>
        <div className={cn('flex-1 min-w-0 transition-opacity duration-300', collapsed ? 'opacity-0 w-0' : 'opacity-100')}>
          <p className="text-sm font-medium text-[hsl(var(--sidebar-foreground))] truncate">Administrador</p>
          <p className="text-[0.7rem] text-[hsl(var(--sidebar-foreground))] opacity-50 truncate">admin@oncoflow.co</p>
        </div>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => onCollapse(!collapsed)}
        className="absolute -right-3 top-[5.5rem] z-10 w-6 h-6 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center text-white shadow-[var(--shadow-md)] hover:bg-[hsl(var(--primary-light))] transition-colors"
        aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
