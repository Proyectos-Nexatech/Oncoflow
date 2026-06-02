'use client';

import React, { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, ChevronRight, Menu, LogOut, User, Settings, X } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

import { MiPerfilModal } from '@/components/ui/mi-perfil-modal';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  pacientes: 'Pacientes',
  programacion: 'Programación',
  medicamentos: 'Medicamentos',
  entregas: 'Entregas',
  documentos: 'Documentos',
  facturacion: 'Facturación',
  reportes: 'Reportes',
  administracion: 'Administración',
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isPerfilModalOpen, setPerfilModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchUser = React.useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const { data } = await supabase.from('usuarios').select('*').eq('correo', session.user.email).single();
      if (data) {
        setCurrentUser(data);
      } else {
        // Fallback for authenticated users who don't have a record in the 'usuarios' table yet
        setCurrentUser({ 
          correo: session.user.email, 
          nombre: 'Administrador', 
          rol: 'administrador',
          isNew: true 
        });
      }
    }
  }, []);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Build breadcrumb
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg) => ROUTE_LABELS[seg] || seg);

  // Debounced search placeholder
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const MOCK_NOTIFICATIONS = [
    { id: 1, type: 'warning', title: 'Documento próximo a vencer', desc: 'Fórmula médica - Juan García', time: 'hace 10 min' },
    { id: 2, type: 'danger', title: 'Stock bajo', desc: 'Pembrolizumab - 3 unidades', time: 'hace 25 min' },
    { id: 3, type: 'info', title: 'Nueva programación', desc: 'Paciente María López - mañana', time: 'hace 1 hora' },
    { id: 4, type: 'success', title: 'Entrega confirmada', desc: 'Pedro Ramírez - completada', time: 'hace 2 horas' },
    { id: 5, type: 'warning', title: 'Autorización pendiente', desc: 'EPS Sura - lote #4821', time: 'hace 3 horas' },
  ];

  const notifColor: Record<string, string> = {
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
    success: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-[hsl(var(--card))]/95 backdrop-blur-sm border-b border-[hsl(var(--border))] flex items-center gap-4 px-4 lg:px-6 shadow-[var(--shadow-sm)]">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0" aria-label="Ruta de navegación">
        <span className="text-[hsl(var(--muted-foreground))] font-medium">ONCOFLOW</span>
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            <ChevronRight size={14} className="text-[hsl(var(--muted-foreground))] flex-shrink-0" />
            <span
              className={cn(
                'truncate',
                i === breadcrumbs.length - 1
                  ? 'text-[hsl(var(--foreground))] font-semibold'
                  : 'text-[hsl(var(--muted-foreground))]'
              )}
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Search bar */}
      <div className="hidden md:flex items-center relative">
        {showSearch ? (
          <div className="flex items-center gap-2 bg-[hsl(var(--muted))] rounded-lg px-3 py-1.5 border border-[hsl(var(--border))] focus-within:border-[hsl(var(--primary))] focus-within:shadow-[0_0_0_2px_hsla(211,87%,36%,0.15)] transition-all">
            <Search size={15} className="text-[hsl(var(--muted-foreground))] flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar pacientes, medicamentos..."
              value={searchQuery}
              onChange={handleSearch}
              className="bg-transparent text-sm outline-none text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] w-64"
            />
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
              <X size={14} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
            aria-label="Buscar"
          >
            <Search size={18} />
          </button>
        )}
      </div>

      {/* Notifications */}
      <DropdownMenu.Root open={notifOpen} onOpenChange={setNotifOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            className="relative p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
            aria-label="Notificaciones"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-4 h-4 bg-[hsl(var(--danger))] rounded-full text-white text-[0.6rem] font-bold flex items-center justify-center">
              5
            </span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 w-80 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-[var(--shadow-lg)] animate-fade-in"
            align="end"
            sideOffset={8}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
              <h3 className="font-semibold text-sm text-[hsl(var(--foreground))]">Notificaciones</h3>
              <span className="text-xs bg-[hsl(var(--danger))] text-white px-1.5 py-0.5 rounded-full font-medium">5</span>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-[hsl(var(--border))]">
              {MOCK_NOTIFICATIONS.map((n) => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[hsl(var(--muted))] cursor-pointer transition-colors">
                  <span className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs mt-0.5', notifColor[n.type])}>
                    <Bell size={13} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{n.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{n.desc}</p>
                    <p className="text-[0.65rem] text-[hsl(var(--muted-foreground))] mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-[hsl(var(--border))]">
              <button className="w-full text-xs text-center text-[hsl(var(--primary))] font-medium hover:underline">
                Ver todas las notificaciones
              </button>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* User dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2.5 hover:bg-[hsl(var(--muted))] rounded-lg px-2 py-1.5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 uppercase">
              {currentUser?.nombre ? currentUser.nombre.substring(0, 2) : 'AD'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-[hsl(var(--foreground))] leading-none">{currentUser?.nombre || 'Administrador'}</p>
              <p className="text-[0.7rem] text-[hsl(var(--muted-foreground))] mt-0.5">{currentUser?.correo || 'admin@oncoflow.co'}</p>
            </div>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 w-52 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-[var(--shadow-lg)] animate-fade-in"
            align="end"
            sideOffset={8}
          >
            <div className="px-3 py-2.5 border-b border-[hsl(var(--border))]">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{currentUser?.nombre || 'Administrador'}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{currentUser?.correo || 'admin@oncoflow.co'}</p>
            </div>
            <div className="py-1.5">
              <DropdownMenu.Item 
                onClick={() => setPerfilModalOpen(true)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer outline-none rounded-md mx-1 transition-colors"
              >
                <User size={15} className="text-[hsl(var(--muted-foreground))]" /> Mi Perfil
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] cursor-pointer outline-none rounded-md mx-1 transition-colors">
                <Settings size={15} className="text-[hsl(var(--muted-foreground))]" /> Configuración
              </DropdownMenu.Item>
            </div>
            <DropdownMenu.Separator className="h-px bg-[hsl(var(--border))] mx-2 my-1" />
            <div className="py-1.5">
              <DropdownMenu.Item
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client');
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.push('/login');
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-[hsl(var(--danger))] hover:bg-red-50 cursor-pointer outline-none rounded-md mx-1 transition-colors"
              >
                <LogOut size={15} /> Cerrar Sesión
              </DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <MiPerfilModal 
        isOpen={isPerfilModalOpen} 
        onClose={() => setPerfilModalOpen(false)} 
        currentUser={currentUser}
        onProfileUpdated={fetchUser}
      />
    </header>
  );
}
