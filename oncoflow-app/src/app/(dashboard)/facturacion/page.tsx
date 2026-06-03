'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, FileCheck, Send, Download, Eye, BarChart2, Calendar, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

import { createClient } from '@/lib/supabase/client';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => THIS_YEAR - i);

const EPS_COLORS = ['#0F5FA6','#1A9E6B','#E8941A','#D63B3B','#7C3AED','#0891B2'];

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
}

export default function FacturacionPage() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [generando, setGenerando] = useState(false);
  const [generado, setGenerado] = useState(false);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [kpiMes, setKpiMes] = useState<any>(null);
  const [barrasEPS, setBarrasEPS] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const mesStr = String(mes).padStart(2, '0');
    const mesKey = `${anio}-${mesStr}`;

    const [resKpi, resEntregas] = await Promise.all([
      supabase.from('v_kpis_facturacion_mes').select('*').eq('mes', mesKey).single(),
      supabase.from('v_estado_facturacion_entregas').select('*')
        .gte('fecha_entrega', `${anio}-${mesStr}-01`)
        .lt('fecha_entrega', new Date(anio, mes, 1).toISOString().slice(0, 10)),
    ]);

    if (resKpi.data) setKpiMes(resKpi.data);
    else setKpiMes(null);

    if (resEntregas.data) {
      setEntregas(resEntregas.data);
      // Build EPS summary
      const epsMap: Record<string, { eps: string; entregas: number; disponibles: number; valor: number }> = {};
      resEntregas.data.forEach((e: any) => {
        const key = e.eps || 'Sin EPS';
        if (!epsMap[key]) epsMap[key] = { eps: key, entregas: 0, disponibles: 0, valor: 0 };
        epsMap[key].entregas += 1;
        if (e.listo_para_facturar) {
          epsMap[key].disponibles += 1;
          epsMap[key].valor += Number(e.valor_total || 0);
        }
      });
      const barras = Object.values(epsMap).map((e, i) => ({ ...e, color: EPS_COLORS[i % EPS_COLORS.length] }));
      setBarrasEPS(barras);
    }
    setLoading(false);
  }, [mes, anio]);

  React.useEffect(() => { cargar(); }, [cargar]);

  const handleGenerarRelacion = async () => {
    setGenerando(true);
    try {
      const doc = new jsPDF();
      const mesLabel = `${MESES[mes - 1]} ${anio}`;
      doc.setFontSize(18);
      doc.text(`Relación de Facturación — ${mesLabel}`, 14, 22);
      doc.setFontSize(10);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-CO')}`, 14, 30);
      doc.setFontSize(11);
      doc.text('Solo incluye entregas con documentación completa verificada.', 14, 38);

      let y = 52;
      doc.setFontSize(12);
      doc.text('Resumen por EPS:', 14, y); y += 10;
      doc.setFontSize(10);
      barrasEPS.forEach((epsItem) => {
        doc.text(`${epsItem.eps}:`, 14, y);
        doc.text(`${epsItem.disponibles} entregas disponibles`, 80, y);
        doc.text(`${formatCOP(epsItem.valor)}`, 145, y);
        y += 8;
      });

      doc.setLineWidth(0.3);
      doc.line(14, y + 3, 196, y + 3); y += 12;
      doc.setFontSize(11);
      doc.text('Total Disponible para Facturar:', 80, y);
      doc.text(formatCOP(kpiMes?.valor_disponible || 0), 145, y);

      doc.save(`Relacion_Facturacion_${anio}_${String(mes).padStart(2,'0')}.pdf`);
      setGenerado(true);
      setTimeout(() => setGenerado(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerando(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Cargando facturación...</div>;
  }

  const totalEntregas = kpiMes?.total_entregas || 0;
  const disponibles = kpiMes?.disponible_facturar || 0;
  const pendientes = kpiMes?.facturacion_pendiente || 0;
  const valorDisponible = kpiMes?.valor_disponible || 0;
  const valorPendiente = kpiMes?.valor_pendiente || 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Facturación</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Consolidado de entregas disponibles para facturar por EPS
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month/Year selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar size={14} className="text-slate-400" />
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="text-sm font-medium text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="text-sm font-medium text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <Button
            variant="primary"
            onClick={handleGenerarRelacion}
            loading={generando}
            className="gap-2 flex-shrink-0"
            disabled={disponibles === 0}
          >
            {generado ? <><FileCheck size={16} /> ¡Generado!</> : <><Download size={16} /> Generar Relación</>}
          </Button>
        </div>
      </div>

      {/* Notification */}
      {generado && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-[var(--radius)] flex items-center gap-3 animate-fade-in">
          <FileCheck size={16} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">
            Relación generada para {MESES[mes - 1]} {anio} — {disponibles} entregas disponibles para facturar.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Entregas del Mes"
          value={totalEntregas}
          icon={<BarChart2 size={20} />}
          accent="primary"
        />
        <StatCard
          title="Disponible para Facturar"
          value={disponibles}
          icon={<CheckCircle2 size={20} />}
          accent="success"
          subtitle={disponibles > 0 ? formatCOP(valorDisponible) : 'Sin valor'}
        />
        <StatCard
          title="Facturación Pendiente"
          value={pendientes}
          icon={<Clock size={20} />}
          accent="warning"
          subtitle={pendientes > 0 ? `${formatCOP(valorPendiente)} en espera` : 'Sin pendientes'}
        />
        <StatCard
          title="% Listo para Facturar"
          value={totalEntregas > 0 ? `${Math.round((disponibles / totalEntregas) * 100)}%` : '0%'}
          icon={<FileCheck size={20} />}
          accent={disponibles === totalEntregas && totalEntregas > 0 ? 'success' : 'primary'}
          subtitle="del mes"
        />
      </div>

      {/* Bar chart + table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart by EPS */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-[hsl(var(--primary))]" />
              <CardTitle>Disponible por EPS — {MESES[mes - 1]} {anio}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {barrasEPS.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">Sin datos para este período</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barrasEPS} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 92%)" />
                    <XAxis dataKey="eps" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip
                      formatter={(v) => [typeof v === 'number' ? formatCOP(v) : v, 'Valor disponible']}
                      contentStyle={{ background: '#fff', border: '1px solid hsl(210 20% 88%)', borderRadius: '8px', fontSize: 12 }}
                    />
                    <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                      {barrasEPS.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {barrasEPS.map((e) => (
                    <div key={e.eps} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                        <span className="text-[hsl(var(--foreground))]">{e.eps}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[hsl(var(--muted-foreground))]">{e.disponibles}/{e.entregas} listas</span>
                        <span className="font-semibold text-[hsl(var(--foreground))]">{formatCOP(e.valor)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Entregas table */}
        <Card hover={false} className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Entregas del Mes — Detalle Documental</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>EPS</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead className="text-center">Docs</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entregas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                      No hay entregas registradas para este período.
                    </TableCell>
                  </TableRow>
                ) : entregas.map((e: any) => (
                  <TableRow key={e.entrega_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{e.paciente}</p>
                        <p className="text-xs text-slate-400">{e.paciente_documento}</p>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm">{e.eps || '—'}</span></TableCell>
                    <TableCell><span className="text-sm">{e.medicamento}</span></TableCell>
                    <TableCell className="text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        e.listo_para_facturar
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {e.docs_verificados}/{e.total_docs}
                      </span>
                    </TableCell>
                    <TableCell>
                      {e.listo_para_facturar
                        ? <Badge variant="success">✅ Disponible</Badge>
                        : <Badge variant="warning">⏳ Pendiente</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold">{formatCOP(Number(e.valor_total || 0))}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
