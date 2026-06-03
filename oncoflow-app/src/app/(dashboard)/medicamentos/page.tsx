'use client';

import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle, Clock, Package, TrendingDown, Edit2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

import { createClient } from '@/lib/supabase/client';
import { MedicamentoModal } from '@/components/ui/medicamento-modal';

// ============================================================
// MOCK DATA REPLACED WITH SUPABASE
// ============================================================

const TIPO_OPTIONS = ['Todos', 'Inmunoterapia', 'Terapia biológica', 'Quimioterapia'];

function getDaysUntilExpiry(fecha: string): number {
  const today = new Date();
  const expiry = new Date(fecha);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function StockBar({ stock, minimo }: { stock: number; minimo: number }) {
  const max = Math.max(stock, minimo * 3);
  const pct = Math.min((stock / max) * 100, 100);
  const low = stock <= minimo;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={low ? 'text-[hsl(var(--danger))] font-semibold' : 'text-[hsl(var(--foreground))] font-medium'}>
          {stock} ud.
        </span>
        <span className="text-[hsl(var(--muted-foreground))]">mín. {minimo}</span>
      </div>
      <div className="h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${low ? 'bg-[hsl(var(--danger))]' : stock <= minimo * 1.5 ? 'bg-[hsl(var(--warning))]' : 'bg-[hsl(var(--secondary))]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function MedicamentosPage() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMed, setSelectedMed] = useState<any | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('medicamentos').select('*');
    if (data) setMedicamentos(data);
    setLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
        
        if (rows.length > 0) {
          const supabase = createClient();
          const medicamentosData = rows.map(row => ({
            nombre_generico: row['Nombre Genérico'] || row['nombre_generico'],
            nombre_comercial: row['Nombre Comercial'] || row['nombre_comercial'],
            codigo: row['Código'] || row['codigo'],
            tipo_medicamento: row['Tipo'] || row['tipo_medicamento'] || 'Otro',
            concentracion: row['Concentración'] || row['concentracion'],
            laboratorio: row['Laboratorio'] || row['laboratorio'],
            lote: row['Lote'] || row['lote'],
            fecha_vencimiento: row['Fecha Vencimiento'] || row['fecha_vencimiento'] || null,
            stock: parseInt(row['Stock'] || row['stock']) || 0,
            stock_minimo: parseInt(row['Stock Mínimo'] || row['stock_minimo']) || 0,
            valor_unitario: parseFloat(row['Valor Unitario'] || row['valor_unitario']) || 0,
            requiere_refrigeracion: (row['Requiere Refrigeración'] || row['requiere_refrigeracion']) === 'Sí' || (row['Requiere Refrigeración'] || row['requiere_refrigeracion']) === true,
            activo: true
          }));

          const { error } = await supabase.from('medicamentos').insert(medicamentosData);
          if (!error) {
            loadData();
          } else {
            console.error('Error insertando lote:', error);
          }
        }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error('Error procesando archivo:', err);
      setIsUploading(false);
    }
  };

  const stockBajo = medicamentos.filter((m) => (m.stock || 0) <= (m.stock_minimo || 0)).length;
  const proxVencer = medicamentos.filter((m) => getDaysUntilExpiry(m.fecha_vencimiento || new Date().toISOString()) <= 90).length;

  const filtered = useMemo(() =>
    medicamentos.filter((m) => {
      const comercial = m.nombre_comercial || '';
      const generico = m.nombre_generico || '';
      const cod = m.codigo || '';
      const tipo = m.tipo_medicamento || '';

      const matchSearch = !search ||
        comercial.toLowerCase().includes(search.toLowerCase()) ||
        generico.toLowerCase().includes(search.toLowerCase()) ||
        cod.toLowerCase().includes(search.toLowerCase());
      const matchTipo = tipoFilter === 'Todos' || tipo === tipoFilter;
      return matchSearch && matchTipo;
    }), [search, tipoFilter, medicamentos]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Cargando medicamentos...</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header + mini KPIs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Medicamentos</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">Catálogo y control de inventario oncológico</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            className="hidden" 
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} loading={isUploading}>
            <Upload size={14} className="mr-1" /> Importar Lote
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setSelectedMed(null); setIsModalOpen(true); }}>
            <Plus size={14} className="mr-1" /> Nuevo Medicamento
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg">
            <Package size={14} className="text-[hsl(var(--muted-foreground))]" />
            <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{medicamentos.length}</span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">total</span>
          </div>
          {stockBajo > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
              <TrendingDown size={14} className="text-[hsl(var(--danger))]" />
              <span className="text-sm font-semibold text-[hsl(var(--danger))]">{stockBajo}</span>
              <span className="text-xs text-red-600">stock bajo</span>
            </div>
          )}
          {proxVencer > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
              <Clock size={14} className="text-[hsl(var(--warning))]" />
              <span className="text-sm font-semibold text-amber-700">{proxVencer}</span>
              <span className="text-xs text-amber-600">por vencer</span>
            </div>
          )}
        </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Buscar por nombre, genérico o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input w-full !pl-10 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] focus:shadow-[0_0_0_3px_hsla(211,87%,36%,0.15)] transition-all placeholder:text-[hsl(var(--muted-foreground))]"
          />
        </div>
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-all appearance-none cursor-pointer min-w-[160px]"
        >
          {TIPO_OPTIONS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((med) => {
          const fecha_venc = med.fecha_vencimiento || new Date().toISOString();
          const daysLeft = getDaysUntilExpiry(fecha_venc);
          const stock = med.stock || 0;
          const minStock = med.stock_minimo || 0;
          const isLowStock = stock <= minStock;
          const isExpiringSoon = daysLeft <= 90;
          const hasAlert = isLowStock || isExpiringSoon;

          return (
            <Card key={med.id} className={`relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${hasAlert ? 'border-[hsl(var(--warning))]/50' : ''}`}>
              {/* Alert ribbon */}
              {hasAlert && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-[0.65rem] font-semibold">
                    <AlertTriangle size={10} />
                    {isLowStock ? 'Stock bajo' : 'Por vencer'}
                  </span>
                </div>
              )}

              <CardContent className="pt-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(med.nombre_generico || 'XX').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 pr-16">
                    <h3 className="font-bold text-[hsl(var(--foreground))] text-sm leading-tight">{med.nombre_comercial || 'Sin nombre comercial'}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{med.nombre_generico || 'Sin nombre genérico'} {med.concentracion || ''}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Stock bar */}
                  <StockBar stock={stock} minimo={minStock} />

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[hsl(var(--muted-foreground))]">Laboratorio</p>
                      <p className="font-medium text-[hsl(var(--foreground))]">{med.laboratorio || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[hsl(var(--muted-foreground))]">Tipo</p>
                      <p className="font-medium text-[hsl(var(--foreground))]">{med.tipo_medicamento || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[hsl(var(--muted-foreground))]">Vencimiento</p>
                      <p className={`font-medium ${daysLeft <= 90 ? 'text-amber-600' : 'text-[hsl(var(--foreground))]'}`}>
                        {new Date(fecha_venc).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <span className="text-[hsl(var(--muted-foreground))] font-normal"> ({daysLeft}d)</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[hsl(var(--muted-foreground))]">Valor unitario</p>
                      <p className="font-semibold text-[hsl(var(--foreground))]">
                        ${(med.valor_unitario || 0).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>

                  {/* Lote + refrigeración + acciones */}
                  <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--border))] mt-2">
                    <span className="text-[0.65rem] font-mono text-[hsl(var(--muted-foreground))]">{med.lote || '-'}</span>
                    <div className="flex items-center gap-2">
                      {med.requiere_refrigeracion && (
                        <span className="text-[0.65rem] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium">❄ Refrigeración</span>
                      )}
                      <button 
                        className="h-6 w-6 rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-slate-100 transition-colors border border-transparent"
                        onClick={() => { setSelectedMed(med); setIsModalOpen(true); }}
                        title="Editar Medicamento"
                        type="button"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))] gap-3">
          <p className="text-sm">No se encontraron medicamentos en el inventario.</p>
          <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>Crear el primero</Button>
        </div>
      )}

      <MedicamentoModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedMed(null); }} 
        onSuccess={() => loadData()} 
        medicamento={selectedMed}
      />
    </div>
  );
}
