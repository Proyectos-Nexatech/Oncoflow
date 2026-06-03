'use client';

import React from 'react';
import {
  FileCheck2, Clock, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Search, Calendar, Filter,
  ReceiptText, ListChecks, DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChecklistEntregaPanel } from '@/components/ui/checklist-entrega-panel';
import { createClient } from '@/lib/supabase/client';

// ─── helpers ───────────────────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCOP(v: number | null) {
  if (!v) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
}

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => THIS_YEAR - i);

// ─── Types ─────────────────────────────────────────────────────────────────
interface EntregaRow {
  entrega_id: string;
  paciente: string;
  paciente_documento: string;
  eps: string;
  medicamento: string;
  fecha_entrega: string;
  valor_total: number;
  total_docs: number;
  docs_verificados: number;
  docs_pendientes: number;
  listo_para_facturar: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function DocumentosPage() {
  const hoy = new Date();
  const [mes, setMes] = React.useState(hoy.getMonth() + 1);   // 1-based
  const [anio, setAnio] = React.useState(hoy.getFullYear());
  const [search, setSearch] = React.useState('');
  const [filterEstado, setFilterEstado] = React.useState<'todos' | 'disponible' | 'pendiente'>('todos');
  const [filterEPS, setFilterEPS] = React.useState('');

  const [entregas, setEntregas] = React.useState<EntregaRow[]>([]);
  const [epsOptions, setEpsOptions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // ─── Data loading ────────────────────────────────────────────────────────
  const cargar = React.useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    const supabase = createClient();

    // Build month range filter
    const mesStr = String(mes).padStart(2, '0');
    const desde = `${anio}-${mesStr}-01`;
    const hasta = new Date(anio, mes, 1).toISOString().slice(0, 10); // first day of next month

    const { data } = await supabase
      .from('v_estado_facturacion_entregas')
      .select('*')
      .gte('fecha_entrega', desde)
      .lt('fecha_entrega', hasta);

    if (data) {
      setEntregas(data as EntregaRow[]);
      const eps = [...new Set(data.map((d: any) => d.eps).filter(Boolean))].sort();
      setEpsOptions(eps as string[]);
    }
    if (!silencioso) setLoading(false);
  }, [mes, anio]);

  React.useEffect(() => { cargar(); }, [cargar]);

  // ─── Derived / filtered list ─────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    return entregas.filter((e) => {
      const matchSearch =
        !search ||
        e.paciente?.toLowerCase().includes(search.toLowerCase()) ||
        e.paciente_documento?.includes(search) ||
        e.medicamento?.toLowerCase().includes(search.toLowerCase());
      const matchEstado =
        filterEstado === 'todos' ||
        (filterEstado === 'disponible' && e.listo_para_facturar) ||
        (filterEstado === 'pendiente' && !e.listo_para_facturar);
      const matchEPS = !filterEPS || e.eps === filterEPS;
      return matchSearch && matchEstado && matchEPS;
    });
  }, [entregas, search, filterEstado, filterEPS]);

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const totalEntregas = entregas.length;
  const disponibles = entregas.filter((e) => e.listo_para_facturar).length;
  const pendientes = entregas.filter((e) => !e.listo_para_facturar).length;
  const totalDocsPendientes = entregas.reduce((acc, e) => acc + (e.docs_pendientes || 0), 0);
  const valorDisponible = entregas
    .filter((e) => e.listo_para_facturar)
    .reduce((acc, e) => acc + (e.valor_total || 0), 0);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Lista de Chequeo Documental
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verifica la documentación requerida por entrega para habilitarla para facturación.
          </p>
        </div>

        {/* Month / Year selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <Calendar size={15} className="text-slate-400 flex-shrink-0" />
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="text-sm font-medium text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="text-sm font-medium text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Entregas del Mes"
          value={totalEntregas.toString()}
          icon={<ReceiptText size={20} />}
          accent="primary"
          subtitle="con medicamento entregado"
        />
        <StatCard
          title="Disponible para Facturar"
          value={disponibles.toString()}
          icon={<CheckCircle2 size={20} />}
          accent="success"
          subtitle="documentación completa"
        />
        <StatCard
          title="Facturación Pendiente"
          value={pendientes.toString()}
          icon={<Clock size={20} />}
          accent="warning"
          subtitle="faltan documentos"
        />
        <StatCard
          title="Valor Disp. Facturación"
          value={formatCOP(valorDisponible)}
          icon={<DollarSign size={20} />}
          accent="success"
          subtitle="entregas con docs OK"
        />
        <StatCard
          title="Documentos Faltantes"
          value={totalDocsPendientes.toString()}
          icon={<AlertCircle size={20} />}
          accent="danger"
          subtitle="ítems sin verificar"
        />
      </div>

      {/* ── Tabla principal ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ListChecks size={18} className="text-[hsl(var(--primary))]" />
              Entregas — {MESES[mes - 1]} {anio}
            </CardTitle>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <Input
                  placeholder="Buscar paciente o medicamento..."
                  className="!pl-10 bg-slate-50/50 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* EPS filter */}
              <select
                className="form-input bg-slate-50/50 w-full sm:w-40 text-sm h-10"
                value={filterEPS}
                onChange={(e) => setFilterEPS(e.target.value)}
              >
                <option value="">Todas las EPS</option>
                {epsOptions.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>

              {/* Estado filter */}
              <select
                className="form-input bg-slate-50/50 w-full sm:w-44 text-sm h-10"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as any)}
              >
                <option value="todos">Todos los estados</option>
                <option value="disponible">✅ Disponible para facturar</option>
                <option value="pendiente">⏳ Documentación pendiente</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Cargando entregas...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ListChecks size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No se encontraron entregas para este período.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>EPS</TableHead>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entrega) => {
                    const isExpanded = expandedId === entrega.entrega_id;
                    const total = entrega.total_docs || 0;
                    const verificados = entrega.docs_verificados || 0;
                    const pct = total > 0 ? Math.round((verificados / total) * 100) : 0;

                    return (
                      <React.Fragment key={entrega.entrega_id}>
                        <TableRow
                          className={`cursor-pointer transition-colors hover:bg-slate-50 ${isExpanded ? 'bg-slate-50/80 border-b-0' : ''}`}
                          onClick={() => setExpandedId(isExpanded ? null : entrega.entrega_id)}
                        >
                          {/* Paciente */}
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{entrega.paciente}</p>
                              <p className="text-xs text-slate-400">CC: {entrega.paciente_documento}</p>
                            </div>
                          </TableCell>

                          {/* EPS */}
                          <TableCell>
                            <span className="text-sm text-slate-600">{entrega.eps || '—'}</span>
                          </TableCell>

                          {/* Medicamento */}
                          <TableCell>
                            <span className="text-sm">{entrega.medicamento}</span>
                          </TableCell>

                          {/* Fecha */}
                          <TableCell>
                            <span className="text-sm text-slate-600">{formatDate(entrega.fecha_entrega)}</span>
                          </TableCell>

                          {/* Progreso */}
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 whitespace-nowrap">
                                {verificados}/{total}
                              </span>
                            </div>
                          </TableCell>

                          {/* Estado badge */}
                          <TableCell>
                            {entrega.listo_para_facturar ? (
                              <Badge variant="success">✅ Disponible</Badge>
                            ) : (
                              <Badge variant="warning">⏳ Pendiente</Badge>
                            )}
                          </TableCell>

                          {/* Valor */}
                          <TableCell className="text-right">
                            <span className="text-sm font-medium">{formatCOP(entrega.valor_total)}</span>
                          </TableCell>

                          {/* Expand icon */}
                          <TableCell>
                            <span className="flex items-center justify-center text-slate-400">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </TableCell>
                        </TableRow>

                        {/* Expanded checklist panel */}
                        {isExpanded && (
                          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                            <TableCell colSpan={8} className="p-0 border-t border-slate-100">
                              <ChecklistEntregaPanel
                                entregaId={entrega.entrega_id}
                                onUpdate={cargar}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Footer summary */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Mostrando {filtered.length} de {totalEntregas} entregas
              </span>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {disponibles} disponibles para facturar
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {pendientes} con documentación pendiente
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
