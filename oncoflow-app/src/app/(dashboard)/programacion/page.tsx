'use client';

import React, { useState, useMemo } from 'react';
import { Plus, List, CalendarDays, Search, Filter, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from '@/components/ui/table';

// FullCalendar imports
import dynamic from 'next/dynamic';
const FullCalendarDynamic = dynamic(() => import('@fullcalendar/react'), { ssr: false });
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { createClient } from '@/lib/supabase/client';
import { ProgramacionModal } from '@/components/ui/programacion-modal';

// ============================================================
// MOCK DATA REPLACED WITH SUPABASE
// ============================================================


const ESTADO_COLOR: Record<string, string> = {
  entregado: '#1A9E6B',
  en_proceso: '#0F5FA6',
  pendiente_documentacion: '#E8941A',
  programado: '#64748B',
  cancelado: '#D63B3B',
  confirmado: '#0F5FA6',
  listo_entrega: '#1A9E6B',
  reprogramado: '#E8941A',
};

const ESTADO_BADGE: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  entregado: 'success',
  en_proceso: 'info',
  pendiente_documentacion: 'warning',
  programado: 'default',
  cancelado: 'danger',
  confirmado: 'info',
  listo_entrega: 'success',
  reprogramado: 'warning',
};

const ESTADO_LABEL: Record<string, string> = {
  entregado: 'Entregado',
  en_proceso: 'En proceso',
  pendiente_documentacion: 'Pend. Documentos',
  programado: 'Programado',
  cancelado: 'Cancelado',
  confirmado: 'Confirmado',
  listo_entrega: 'Listo Entrega',
  reprogramado: 'Reprogramado',
};

export default function ProgramacionPage() {
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [programaciones, setProgramaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProg, setSelectedProg] = useState<any>(null);
  const [readOnly, setReadOnly] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('programaciones').select(`
      *,
      pacientes(nombre_completo, numero_documento, eps),
      medicamentos(nombre_comercial, nombre_generico)
    `);
    if (data) {
      const formatted = data.map(d => ({
        ...d,
        paciente: d.pacientes?.nombre_completo,
        eps: d.pacientes?.eps,
        medicamento: d.medicamentos?.nombre_comercial,
        fecha: d.fecha_programada.split('T')[0],
        hora: d.fecha_programada.split('T')[1]?.substring(0,5) || '12:00'
      }));
      setProgramaciones(formatted);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const calendarEvents = useMemo(() =>
    programaciones.map((p) => {
      const paciente = p.paciente || p.paciente_nombre || p.nombre_paciente || 'Paciente';
      const med = p.medicamento || 'Medicamento';
      const fecha = p.fecha || p.fecha_programada || new Date().toISOString().split('T')[0];
      const hora = p.hora || '00:00';
      const estado = p.estado || 'programado';
      return {
        id: p.id,
        title: `${paciente.split(' ')[0]} — ${med.split(' ')[0]}`,
        start: `${fecha}T${hora}`,
        backgroundColor: ESTADO_COLOR[estado] || '#64748B',
        borderColor: 'transparent',
        extendedProps: { ...p, paciente, med, fecha, hora, estado },
      };
    }), [programaciones]);

  const filtered = useMemo(() =>
    programaciones.filter((p) => {
      const paciente = p.paciente || p.paciente_nombre || p.nombre_paciente || '';
      const med = p.medicamento || '';
      const estado = p.estado || 'programado';
      const matchSearch = !search || paciente.toLowerCase().includes(search.toLowerCase()) || med.toLowerCase().includes(search.toLowerCase());
      const matchEstado = estadoFilter === 'todos' || estado === estadoFilter;
      return matchSearch && matchEstado;
    }), [search, estadoFilter, programaciones]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Cargando programaciones...</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Programación</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            {programaciones.length} programaciones registradas
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-[hsl(var(--muted))] rounded-lg p-0.5 border border-[hsl(var(--border))]">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'calendar' ? 'bg-white text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
            >
              <CalendarDays size={13} /> Calendario
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'list' ? 'bg-white text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
            >
              <List size={13} /> Lista
            </button>
          </div>
          <Button variant="primary" size="sm" onClick={() => { setSelectedProg(null); setReadOnly(false); setIsModalOpen(true); }}>
            <Plus size={14} /> Nueva Programación
          </Button>
        </div>
      </div>

      {/* Calendar view */}
      {view === 'calendar' && (
        <Card>
          <CardContent className="p-4">
            <FullCalendarDynamic
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={calendarEvents}
              height={600}
              locale="es"
              buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
              eventClick={(info) => {
                const p = info.event.extendedProps;
                alert(`Paciente: ${p.paciente}\nMedicamento: ${p.med}\nEstado: ${ESTADO_LABEL[p.estado]}`);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* List view */}
      {view === 'list' && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="text"
                    placeholder="Buscar por paciente o medicamento..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-input w-full !pl-10 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] focus:shadow-[0_0_0_3px_hsla(211,87%,36%,0.15)] transition-all placeholder:text-[hsl(var(--muted-foreground))]"
                  />
                </div>
                <select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  className="form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-all appearance-none cursor-pointer min-w-[160px]"
                >
                  <option value="todos">Todos los estados</option>
                  {Object.keys(ESTADO_LABEL).map((k) => <option key={k} value={k}>{ESTADO_LABEL[k]}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card hover={false}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableEmpty message="No hay programaciones que coincidan" />
                ) : (
                  filtered.map((p) => {
                    const paciente = p.paciente || p.paciente_nombre || p.nombre_paciente || 'Sin nombre';
                    const eps = p.eps || '-';
                    const medicamento = p.medicamento || '-';
                    const fecha = p.fecha || p.fecha_programada || new Date().toISOString().split('T')[0];
                    const hora = p.hora || '00:00';
                    const responsable = p.responsable || p.medico || '-';
                    const estado = p.estado || 'programado';
                    return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm">{paciente}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{eps}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{medicamento}</TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {new Date(fecha + 'T12:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </TableCell>
                      <TableCell><span className="font-mono text-sm">{hora}</span></TableCell>
                      <TableCell className="text-sm text-[hsl(var(--muted-foreground))]">{responsable}</TableCell>
                      <TableCell>
                        <Badge variant={ESTADO_BADGE[estado] || 'default'}>{ESTADO_LABEL[estado] || estado}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => { setSelectedProg(p); setReadOnly(true); setIsModalOpen(true); }}
                            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-blue-50 hover:text-[hsl(var(--primary))] transition-colors" title="Ver"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => { setSelectedProg(p); setReadOnly(false); setIsModalOpen(true); }}
                            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      <ProgramacionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => loadData()} 
        progToEdit={selectedProg}
        readOnly={readOnly}
      />
    </div>
  );
}
