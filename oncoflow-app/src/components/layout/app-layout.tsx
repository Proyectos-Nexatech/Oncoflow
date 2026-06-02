'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] transition-transform duration-300 shadow-2xl lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      </div>

      {/* Main content area */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        )}
      >
        <Header onMenuToggle={() => setMobileOpen(!mobileOpen)} />

        <main className="flex-1 p-4 lg:p-6 animate-fade-in pb-20 lg:pb-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-[hsl(var(--border))] flex items-center justify-between hidden lg:flex">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            © 2025 ONCOFLOW — Sistema de Gestión Oncológica
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">v1.0.0</p>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] px-2 py-2 flex items-center justify-around shadow-[0_-4px_15px_rgba(0,0,0,0.05)] pb-safe">
        <a href="/dashboard" className="flex flex-col items-center gap-1 p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          <span className="text-[0.65rem] font-medium">Inicio</span>
        </a>
        <a href="/pacientes" className="flex flex-col items-center gap-1 p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span className="text-[0.65rem] font-medium">Pacientes</span>
        </a>
        <a href="/programacion" className="flex flex-col items-center gap-1 p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
          <span className="text-[0.65rem] font-medium">Citas</span>
        </a>
        <button onClick={() => setMobileOpen(true)} className="flex flex-col items-center gap-1 p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          <span className="text-[0.65rem] font-medium">Menú</span>
        </button>
      </div>
    </div>
  );
}
