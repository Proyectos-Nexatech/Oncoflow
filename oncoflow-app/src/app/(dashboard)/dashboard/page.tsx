'use client';

import React from 'react';
import type { Metadata } from 'next';
import {
  CalendarDays, Package, Clock, FileWarning,
  AlertTriangle, Pill, TrendingUp, CheckCircle2,
  XCircle, Eye, Activity,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertBanner } from '@/components/ui/alert-banner';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

import { createClient } from '@/lib/supabase/client';

// ============================================================
// MOCK DATA REPLACED WITH SUPABASE
// ============================================================
const KPI_DATA_DEFAULT = {
  programados_hoy: 0,
  entregas_realizadas: 0,
  entregas_pendientes: 0,
  documentos_vencidos: 0,
};


const ALERTAS_CRITICAS = [
  { id: 1, tipo: 'warning', titulo: 'Documentos próximos a vencer', desc: '5 documentos vencen en los próximos 7 días', },
  { id: 2, tipo: 'danger', titulo: 'Medicamentos con stock bajo', desc: 'Pembrolizumab: 3 unidades restantes (mín. 10)', },
  { id: 3, tipo: 'danger', titulo: 'Entregas vencidas sin gestionar', desc: '2 entregas del día anterior no se procesaron', },
];

const ENTREGAS_SEMANA = [
  { dia: 'Lun', entregas: 9, programadas: 11 },
  { dia: 'Mar', entregas: 11, programadas: 12 },
  { dia: 'Mié', entregas: 7, programadas: 9 },
  { dia: 'Jue', entregas: 10, programadas: 10 },
  { dia: 'Vie', entregas: 8, programadas: 12 },
  { dia: 'Sáb', entregas: 5, programadas: 6 },
  { dia: 'Hoy', entregas: 8, programadas: 12 },
];

const ESTADOS_DONUT = [
  { name: 'Entregado', value: 63, color: '#1A9E6B' },
  { name: 'Pendiente', value: 18, color: '#E8941A' },
  { name: 'En proceso', value: 12, color: '#0F5FA6' },
  { name: 'No entregado', value: 7, color: '#D63B3B' },
];


const ALERTAS_RECIENTES = [
  { id: 1, icon: <FileWarning size={15} />, bg: 'bg-amber-100 text-amber-600', texto: 'Fórmula médica de Jorge Morales vence el 05/06', hora: '09:15' },
  { id: 2, icon: <Pill size={15} />, bg: 'bg-red-100 text-red-600', texto: 'Stock crítico: Pembrolizumab 200mg (3 ud.)', hora: '08:47' },
  { id: 3, icon: <XCircle size={15} />, bg: 'bg-red-100 text-red-600', texto: 'Entrega no realizada: Rosa Mendoza (31/05)', hora: '07:30' },
  { id: 4, icon: <CheckCircle2 size={15} />, bg: 'bg-emerald-100 text-emerald-600', texto: 'Entrega confirmada: María García - Bevacizumab', hora: '08:12' },
];

const ESTADO_BADGE: Record<string, { variant: 'success' | 'info' | 'warning' | 'danger' | 'default'; label: string }> = {
  entregado: { variant: 'success', label: 'Entregado' },
  en_proceso: { variant: 'info', label: 'En proceso' },
  pendiente_documentacion: { variant: 'warning', label: 'Pend. Documentos' },
  programado: { variant: 'default', label: 'Programado' },
  cancelado: { variant: 'danger', label: 'Cancelado' },
};

export default function DashboardPage() {
  const [kpis, setKpis] = React.useState<any>(KPI_DATA_DEFAULT);
  const [entregasHoy, setEntregasHoy] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const [resKpis, resEntregas] = await Promise.all([
        supabase.from('v_dashboard_kpis').select('*').single(),
        supabase.from('v_entregas_hoy').select('*')
      ]);

      if (resKpis.data) setKpis(resKpis.data);
      if (resEntregas.data) setEntregasHoy(resEntregas.data);

      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Cargando dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Dashboard</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Resumen del sistema — {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
          <span className="text-xs font-medium text-emerald-700">Sistema operativo</span>
        </div>
      </div>

      {/* Alertas críticas */}
      <div className="space-y-2">
        {ALERTAS_CRITICAS.map((alerta) => (
          <AlertBanner
            key={alerta.id}
            variant={alerta.tipo as 'warning' | 'error'}
            title={alerta.titulo}
            message={alerta.desc}
            dismissible
          />
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Programados Hoy"
          value={kpis.programados_hoy || 0}
          icon={<CalendarDays size={22} />}
          accent="primary"
          trend="up"
          trendValue="+2 vs ayer"
          subtitle="tratamientos"
        />
        <StatCard
          title="Entregas Realizadas"
          value={kpis.entregas_realizadas || 0}
          icon={<Package size={22} />}
          accent="success"
          trend="up"
          trendValue="67%"
          subtitle="del total"
        />
        <StatCard
          title="Entregas Pendientes"
          value={kpis.entregas_pendientes || 0}
          icon={<Clock size={22} />}
          accent="warning"
          trend="neutral"
          trendValue="sin cambios"
        />
        <StatCard
          title="Documentos Vencidos"
          value={kpis.documentos_vencidos || 0}
          icon={<FileWarning size={22} />}
          accent="danger"
          trend="down"
          trendValue="-1 vs ayer"
          subtitle="requieren atención"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Entregas por Día (Semana Actual)</CardTitle>
              <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#0F5FA6] inline-block rounded" />Entregas</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[hsl(var(--border))] inline-block rounded border-dashed border" />Programadas</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ENTREGAS_SEMANA} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 92%)" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(210 20% 88%)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
                  labelStyle={{ fontWeight: 600, color: '#1A2332' }}
                />
                <Line type="monotone" dataKey="programadas" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="4 2" dot={false} />
                <Line type="monotone" dataKey="entregas" stroke="#0F5FA6" strokeWidth={2.5} dot={{ fill: '#0F5FA6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut chart */}
        <Card>
          <CardHeader>
            <CardTitle>Entregas por Estado</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={ESTADOS_DONUT} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {ESTADOS_DONUT.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ fontSize: 12, borderRadius: '8px', border: '1px solid hsl(210 20% 88%)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {ESTADOS_DONUT.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="truncate">{d.name}</span>
                  <span className="ml-auto font-semibold text-[hsl(var(--foreground))]">{d.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table + alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's schedules */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between pb-3">
              <CardTitle>Programaciones del Día</CardTitle>
              <a href="/programacion" className="text-xs text-[hsl(var(--primary))] hover:underline font-medium flex items-center gap-1">
                Ver todas <Eye size={12} />
              </a>
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entregasHoy.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-sm text-[hsl(var(--muted-foreground))]">No hay entregas para hoy</TableCell></TableRow>
                ) : entregasHoy.map((prog) => {
                  const estado = prog.estado || 'programado';
                  const paciente = prog.paciente || prog.paciente_nombre || prog.nombre_paciente || 'Paciente';
                  const doc = prog.doc || prog.documento || '-';
                  const med = prog.medicamento || 'Medicamento';
                  const hora = prog.hora || '00:00';
                  const badge = ESTADO_BADGE[estado] || { variant: 'default', label: estado };
                  return (
                    <TableRow key={prog.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-[hsl(var(--foreground))] text-sm">{paciente}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{doc}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-[hsl(var(--foreground))]">{med}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono text-[hsl(var(--foreground))]">{hora}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between pb-1">
              <CardTitle>Alertas Recientes</CardTitle>
              <span className="text-xs bg-[hsl(var(--danger))] text-white px-2 py-0.5 rounded-full font-medium">
                {ALERTAS_RECIENTES.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-[hsl(var(--border))]">
              {ALERTAS_RECIENTES.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-3">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${a.bg}`}>
                    {a.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[hsl(var(--foreground))] leading-relaxed">{a.texto}</p>
                    <p className="text-[0.65rem] text-[hsl(var(--muted-foreground))] mt-0.5">{a.hora} — hoy</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
