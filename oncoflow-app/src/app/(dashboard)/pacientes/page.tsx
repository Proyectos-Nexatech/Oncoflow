'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, Eye, Pencil, FileText, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from '@/components/ui/table';

import { createClient } from '@/lib/supabase/client';
import { PacienteModal } from '@/components/ui/paciente-modal';

// ============================================================
// MOCK DATA REPLACED WITH SUPABASE
const ESTADO_OPTIONS = ['Todos', 'activo', 'suspendido', 'finalizado', 'fallecido'];

const ESTADO_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  activo: 'success',
  suspendido: 'warning',
  finalizado: 'default',
  fallecido: 'danger',
};

const PAGE_SIZE = 6;

export default function PacientesPage() {
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [page, setPage] = useState(1);

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<any | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('pacientes').select('*');
    if (data) setPacientes(data);
    setLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setSelectedPaciente(null);
    setIsReadOnly(false);
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setSelectedPaciente(p);
    setIsReadOnly(false);
    setIsModalOpen(true);
  };

  const openViewModal = (p: any) => {
    setSelectedPaciente(p);
    setIsReadOnly(true);
    setIsModalOpen(true);
  };

  const filtered = useMemo(() => {
    return pacientes.filter((p) => {
      const nombre = p.nombre || p.paciente_nombre || p.nombre_completo || '';
      const doc = p.documento || p.identificacion || '';
      const eps = p.eps || '';
      const estado = p.estado || 'activo';

      const matchSearch =
        !search ||
        nombre.toLowerCase().includes(search.toLowerCase()) ||
        doc.toLowerCase().includes(search.toLowerCase());
      const matchEstado = estadoFilter === 'Todos' || estado === estadoFilter;
      return matchSearch && matchEstado;
    });
  }, [pacientes, search, estadoFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Cargando pacientes...</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Pacientes</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            {filtered.length} paciente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" size="md" className="gap-2 flex-shrink-0" onClick={openNewModal}>
          <Plus size={16} /> Nuevo Paciente
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="form-input w-full !pl-10 pr-3.5 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] focus:shadow-[0_0_0_3px_hsla(211,87%,36%,0.15)] transition-all placeholder:text-[hsl(var(--muted-foreground))]"
              />
            </div>
            {/* Estado filter */}
            <div className="relative">
              <select
                value={estadoFilter}
                onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
                className="form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-all appearance-none cursor-pointer min-w-[130px]"
              >
                {ESTADO_OPTIONS.map((e) => <option key={e} value={e}>{e === 'Todos' ? 'Todos los estados' : e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card hover={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableEmpty message="No se encontraron pacientes con los filtros seleccionados" />
            ) : (
              paginated.map((p) => {
                const nombre = p.nombre || p.paciente_nombre || p.nombre_completo || 'Sin Nombre';
                const doc = p.numero_documento || p.documento || p.identificacion || 'Sin documento';
                const estado = p.estado || 'activo';
                return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[hsl(var(--foreground))]">{nombre}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{doc}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ESTADO_BADGE[estado] || 'default'}>
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openViewModal(p)} className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-blue-50 hover:text-[hsl(var(--primary))] transition-colors" title="Ver">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => openEditModal(p)} className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Editar">
                        <Pencil size={15} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(var(--border))]">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${pg === page ? 'bg-[hsl(var(--primary))] text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
      
      <PacienteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadData}
        pacienteToEdit={selectedPaciente}
        readOnly={isReadOnly}
      />
    </div>
  );
}
