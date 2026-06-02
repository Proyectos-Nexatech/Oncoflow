'use client';

import React, { useState } from 'react';
import { DollarSign, Clock, FileCheck, Send, Download, Eye, BarChart2 } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
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

// ============================================================
// MOCK DATA REPLACED WITH SUPABASE
// ============================================================
const KPI_FACTURACION = {
  valor_facturado_mes: 48750000,
  valor_pendiente: 12300000,
  entregas_facturables: 23,
  facturas_enviadas: 5,
};

const BARRAS_EPS = [
  { eps: 'Sura EPS', valor: 18500000, entregas: 9, color: '#0F5FA6' },
  { eps: 'Nueva EPS', valor: 14200000, entregas: 7, color: '#1A9E6B' },
  { eps: 'Compensar', valor: 9800000, entregas: 5, color: '#E8941A' },
  { eps: 'Famisanar', valor: 6250000, entregas: 2, color: '#D63B3B' },
];



const ESTADO_BADGE: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  pagada: 'success',
  enviada: 'info',
  validada: 'info',
  borrador: 'default',
  rechazada: 'danger',
};

const ESTADO_LABEL: Record<string, string> = {
  pagada: 'Pagada',
  enviada: 'Enviada',
  validada: 'Validada',
  borrador: 'Borrador',
  rechazada: 'Rechazada',
};

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
}

function formatMes(mes: string): string {
  if (!mes || !mes.includes('-')) return mes;
  const [year, month] = mes.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export default function FacturacionPage() {
  const [generando, setGenerando] = useState(false);
  const [generado, setGenerado] = useState(false);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data } = await supabase.from('facturacion').select('*');
      if (data) setFacturas(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleGenerarRelacion = async () => {
    setGenerando(true);
    
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Relación de Facturación - Mayo 2025', 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-CO')}`, 14, 32);
      
      doc.setFontSize(14);
      doc.text('Consolidado por EPS', 14, 45);
      
      let y = 55;
      doc.setFontSize(11);
      BARRAS_EPS.forEach((epsItem) => {
        doc.text(`${epsItem.eps}:`, 14, y);
        doc.text(`${epsItem.entregas} entregas`, 80, y);
        doc.text(`${formatCOP(epsItem.valor)}`, 140, y);
        y += 10;
      });

      doc.setLineWidth(0.5);
      doc.line(14, y + 5, 196, y + 5);
      y += 15;
      
      doc.setFontSize(12);
      doc.text('Total Facturado:', 80, y);
      doc.text(formatCOP(KPI_FACTURACION.valor_facturado_mes), 140, y);

      doc.save('Relacion_Facturacion_Mayo2025.pdf');
      
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

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Facturación</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">Consolidado y relación de entregas por EPS</p>
        </div>
        <Button
          variant="primary"
          onClick={handleGenerarRelacion}
          loading={generando}
          className="gap-2 flex-shrink-0"
        >
          {generado ? <><FileCheck size={16} /> ¡Generado!</> : <><Download size={16} /> Generar Relación</>}
        </Button>
      </div>

      {/* Notification */}
      {generado && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-[var(--radius)] flex items-center gap-3 animate-fade-in">
          <FileCheck size={16} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">
            Relación de entregas generada exitosamente. El archivo está listo para descarga.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Valor Facturado (Mes)"
          value={formatCOP(KPI_FACTURACION.valor_facturado_mes)}
          icon={<DollarSign size={20} />}
          accent="success"
          trend="up"
          trendValue="+12% vs mes anterior"
        />
        <StatCard
          title="Valor Pendiente"
          value={formatCOP(KPI_FACTURACION.valor_pendiente)}
          icon={<Clock size={20} />}
          accent="warning"
        />
        <StatCard
          title="Entregas Facturables"
          value={KPI_FACTURACION.entregas_facturables}
          icon={<FileCheck size={20} />}
          accent="primary"
          subtitle="pendientes de facturar"
        />
        <StatCard
          title="Facturas Enviadas"
          value={KPI_FACTURACION.facturas_enviadas}
          icon={<Send size={20} />}
          accent="primary"
          trend="up"
          trendValue="este mes"
        />
      </div>

      {/* Bar chart + table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart by EPS */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-[hsl(var(--primary))]" />
              <CardTitle>Valor por EPS — Mayo 2025</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={BARRAS_EPS} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 92%)" />
                <XAxis dataKey="eps" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                <Tooltip
                  formatter={(v) => [typeof v === 'number' ? formatCOP(v) : v, 'Valor']}
                  contentStyle={{ background: '#fff', border: '1px solid hsl(210 20% 88%)', borderRadius: '8px', fontSize: 12 }}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {BARRAS_EPS.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-2">
              {BARRAS_EPS.map((e) => (
                <div key={e.eps} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                    <span className="text-[hsl(var(--foreground))]">{e.eps}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[hsl(var(--muted-foreground))]">{e.entregas} entregas</span>
                    <span className="font-semibold text-[hsl(var(--foreground))]">{formatCOP(e.valor)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Consolidados table */}
        <Card hover={false} className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Consolidados por Mes y EPS</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead>EPS</TableHead>
                  <TableHead className="text-center">Entregas</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map((c) => {
                  const mes = c.mes || '2025-05';
                  const eps = c.eps || 'Sin EPS';
                  const cant = c.cantidad_entregas || 0;
                  const valor = c.valor_total || 0;
                  const estado = c.estado || 'borrador';
                  return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="text-sm font-medium capitalize">{formatMes(mes)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{eps}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-semibold">{cant}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold">{formatCOP(valor)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_BADGE[estado] || 'default'}>{ESTADO_LABEL[estado] || estado}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-blue-50 hover:text-[hsl(var(--primary))] transition-colors" title="Ver detalle">
                          <Eye size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Descargar">
                          <Download size={14} />
                        </button>
                        {estado === 'validada' && (
                          <button className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-blue-50 hover:text-[hsl(var(--primary))] transition-colors" title="Enviar">
                            <Send size={14} />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
