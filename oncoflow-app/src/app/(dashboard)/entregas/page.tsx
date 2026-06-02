'use client';

import React, { useState, useMemo } from 'react';
import { Search, Eye, CheckCircle, XCircle, Clock, Package, Filter } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
} from '@/components/ui/table';

import { createClient } from '@/lib/supabase/client';

// ============================================================
// MOCK DATA REPLACED WITH SUPABASE
// ============================================================


const ESTADO_BADGE: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  entregado: 'success',
  en_proceso: 'info',
  pendiente: 'warning',
  no_entregado: 'danger',
  rechazado: 'danger',
};

const ESTADO_LABEL: Record<string, string> = {
  entregado: 'Entregado',
  en_proceso: 'En proceso',
  pendiente: 'Pendiente',
  no_entregado: 'No entregado',
  rechazado: 'Rechazado',
};

// Traffic light indicator for document readiness
function SemaforoIndicador({ formula, autorizacion, documentos }: { formula: boolean; autorizacion: boolean; documentos: boolean }) {
  const all = formula && autorizacion && documentos;
  const none = !formula && !autorizacion && !documentos;
  const color = all ? 'bg-emerald-500' : none ? 'bg-red-500' : 'bg-amber-500';
  const title = all ? 'Listo para entrega' : none ? 'Sin documentación' : 'Documentación incompleta';
  return (
    <div className="flex items-center gap-1.5" title={title}>
      <span className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm`} />
      <div className="flex gap-0.5">
        <span title="Fórmula médica" className={`w-2 h-2 rounded-full ${formula ? 'bg-emerald-400' : 'bg-red-300'}`} />
        <span title="Autorización" className={`w-2 h-2 rounded-full ${autorizacion ? 'bg-emerald-400' : 'bg-red-300'}`} />
        <span title="Documentos" className={`w-2 h-2 rounded-full ${documentos ? 'bg-emerald-400' : 'bg-red-300'}`} />
      </div>
    </div>
  );
}

export default function EntregasPage() {
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [fechaFilter, setFechaFilter] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [entregas, setEntregas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('programaciones').select(`
      id, fecha_programada, estado,
      pacientes(id, nombre_completo, eps),
      medicamentos(id, nombre_comercial),
      entregas(id, estado, valor_total, fecha_entrega)
    `);
    
    if (data) {
      const formatted = data.map((p: any) => {
        const entrega = p.entregas && p.entregas.length > 0 ? p.entregas[0] : null;
        return {
          id: p.id, // programacion_id
          entrega_id: entrega?.id || null,
          paciente: p.pacientes?.nombre_completo,
          paciente_id: p.pacientes?.id,
          eps: p.pacientes?.eps,
          medicamento: p.medicamentos?.nombre_comercial,
          medicamento_id: p.medicamentos?.id,
          fecha_programada: p.fecha_programada.split('T')[0],
          fecha_entrega: entrega?.fecha_entrega ? entrega.fecha_entrega.split('T')[0] : null,
          estado: entrega?.estado || 'pendiente',
          valor: entrega?.valor_total || 0,
          tiene_formula: true,
          tiene_autorizacion: true,
          tiene_documentos: true
        };
      });
      setEntregas(formatted);
    }
    setLoading(false);
  }

  React.useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (programacionId: string, entregaId: string | null, nuevoEstado: string, pacienteId: string, medicamentoId: string) => {
    const supabase = createClient();
    if (entregaId) {
      await supabase.from('entregas').update({ estado: nuevoEstado }).eq('id', entregaId);
    } else {
      await supabase.from('entregas').insert([{
        programacion_id: programacionId,
        paciente_id: pacienteId,
        medicamento_id: medicamentoId,
        estado: nuevoEstado,
        fecha_entrega: new Date().toISOString()
      }]);
    }
    loadData();
  };

  const filtered = useMemo(() =>
    entregas.filter((e) => {
      const paciente = e.paciente || '';
      const med = e.medicamento || '';
      const estado = e.estado || 'pendiente';
      
      const matchSearch = !search ||
        paciente.toLowerCase().includes(search.toLowerCase()) ||
        med.toLowerCase().includes(search.toLowerCase());
        
      const matchEstado = estadoFilter === 'todos' || estado === estadoFilter;
      
      // Filter by date: check scheduled delivery date
      const matchFecha = !fechaFilter || e.fecha_programada === fechaFilter;
      
      return matchSearch && matchEstado && matchFecha;
    }), [search, estadoFilter, fechaFilter, entregas]);

  // KPIs are now calculated from the filtered results so they reflect the selected day
  const pendientes = filtered.filter((e) => e.estado === 'pendiente').length;
  const en_proceso = filtered.filter((e) => e.estado === 'en_proceso').length;
  // Entregadas Hoy: counts if fecha_programada is equal to fecha_entrega
  const entregadas_hoy = filtered.filter((e) => e.estado === 'entregado' && e.fecha_programada === e.fecha_entrega).length;
  const no_entregadas = filtered.filter((e) => e.estado === 'no_entregado').length;

  if (loading) {
    return <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Cargando entregas...</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Entregas</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">Control y seguimiento de entregas de medicamentos</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pendientes" value={pendientes} icon={<Clock size={20} />} accent="warning" />
        <StatCard title="En Proceso" value={en_proceso} icon={<Package size={20} />} accent="primary" />
        <StatCard title="Entregadas Hoy" value={entregadas_hoy} icon={<CheckCircle size={20} />} accent="success" />
        <StatCard title="No Entregadas" value={no_entregadas} icon={<XCircle size={20} />} accent="danger" />
      </div>

      {/* Semáforo legend */}
      <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-4 py-2 rounded-[var(--radius)] border border-[hsl(var(--border))]">
        <span className="font-semibold text-[hsl(var(--foreground))]">Semáforo documentación:</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Fórmula médica</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Autorización EPS</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Documentos completos</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-300 inline-block" />= Faltante</span>
      </div>

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
            
            <input
              type="date"
              value={fechaFilter}
              onChange={(e) => setFechaFilter(e.target.value)}
              className="form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-all min-w-[150px]"
            />

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

      {/* Table */}
      <Card hover={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Medicamento</TableHead>
              <TableHead>Fecha Prog.</TableHead>
              <TableHead>Fecha Entrega</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Documentación</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableEmpty message="No hay entregas con los filtros seleccionados" />
            ) : (
              filtered.map((e) => {
                const paciente = e.paciente || 'Sin nombre';
                const eps = e.eps || '-';
                const medicamento = e.medicamento || '-';
                const fecha_prog = e.fecha_programada;
                const fecha_ent = e.fecha_entrega;
                const responsable = e.responsable || '-';
                const valor = e.valor || 0;
                const estado = e.estado || 'pendiente';
                return (
                <TableRow key={e.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm">{paciente}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{eps}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{medicamento}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {new Date(fecha_prog + 'T12:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {fecha_ent ? new Date(fecha_ent + 'T12:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">{responsable}</span>
                  </TableCell>
                  <TableCell>
                    <SemaforoIndicador formula={!!e.tiene_formula} autorizacion={!!e.tiene_autorizacion} documentos={!!e.tiene_documentos} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">${valor.toLocaleString('es-CO')}</span>
                  </TableCell>
                  <TableCell>
                    <select
                      value={estado}
                      onChange={(ev) => handleStatusChange(e.id, e.entrega_id, ev.target.value, e.paciente_id, e.medicamento_id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full outline-none cursor-pointer border-0 ${
                        estado === 'entregado' ? 'bg-emerald-100 text-emerald-700' :
                        estado === 'en_proceso' ? 'bg-blue-100 text-blue-700' :
                        estado === 'no_entregado' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {Object.keys(ESTADO_LABEL).map(k => (
                        <option key={k} value={k} className="bg-white text-black">{ESTADO_LABEL[k]}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-blue-50 hover:text-[hsl(var(--primary))] transition-colors" title="Ver">
                        <Eye size={14} />
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
    </div>
  );
}
