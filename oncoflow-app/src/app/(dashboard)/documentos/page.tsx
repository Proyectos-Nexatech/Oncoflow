'use client';

import React from 'react';
import { FileText, Search, Filter, AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { formatDate, getDocumentStatusColor, getLabelForEnum } from '@/lib/utils';
import { useFilter, usePagination } from '@/hooks';
import { createClient } from '@/lib/supabase/client';
import { DocumentUploadModal } from '@/components/ui/document-upload-modal';

export default function DocumentosPage() {
  const [documentos, setDocumentos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const cargarDocumentos = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('documentos')
      .select(`
        *,
        pacientes (nombre_completo, numero_documento)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      const formatted = data.map(d => ({
        id: d.id,
        paciente_nombre: d.pacientes?.nombre_completo || 'Desconocido',
        paciente_documento: d.pacientes?.numero_documento || '-',
        tipo: d.tipo,
        nombre_archivo: d.nombre_archivo,
        fecha_emision: d.created_at, // O usar una columna específica
        fecha_vencimiento: null, // Si aplica
        estado: d.estado,
        archivo_url: d.archivo_url,
      }));
      setDocumentos(formatted);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, nuevoEstado: string) => {
    const supabase = createClient();
    try {
      await supabase.from('documentos').update({ estado: nuevoEstado }).eq('id', id);
      cargarDocumentos(); // Recargar la lista para reflejar el cambio
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  };

  const getStatusColorClass = (estado: string) => {
    switch (estado) {
      case 'completo': return 'bg-emerald-100 text-emerald-700';
      case 'pendiente': return 'bg-slate-100 text-slate-700';
      case 'vencido': return 'bg-rose-100 text-rose-700';
      case 'en_revision': return 'bg-amber-100 text-amber-700';
      case 'rechazado': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  React.useEffect(() => {
    cargarDocumentos();
  }, []);

  const { search, setSearch, filteredItems, setFilter, filters } = useFilter(documentos, ['paciente_nombre', 'paciente_documento', 'nombre_archivo']);
  const { paginatedItems, currentPage, totalPages, nextPage, prevPage, hasNext, hasPrev } = usePagination(filteredItems, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión Documental</h1>
          <p className="text-sm text-slate-500">Control centralizado de documentación y evidencias.</p>
        </div>
        <Button variant="primary" className="shadow-sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Cargar Documento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Documentos"
          value={documentos.length.toString()}
          icon={<FileText size={20} />}
          accent="primary"
        />
        <StatCard
          title="Completos"
          value={documentos.filter(d => d.estado === 'completo' || d.estado === 'validado').length.toString()}
          icon={<FileText size={20} />}
          accent="success"
        />
        <StatCard
          title="En Revisión"
          value={documentos.filter(d => d.estado === 'en_revision' || d.estado === 'pendiente').length.toString()}
          icon={<Filter size={20} />}
          accent="warning"
        />
        <StatCard
          title="Vencidos / Rechazados"
          value={documentos.filter(d => d.estado === 'vencido' || d.estado === 'rechazado').length.toString()}
          icon={<AlertCircle size={20} />}
          accent="danger"
          trend="up"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <CardTitle className="text-lg font-semibold">Repositorio Documental</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Buscar paciente o archivo..."
                  className="!pl-10 bg-slate-50/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="form-input bg-slate-50/50 w-full sm:w-40 text-sm h-10"
                value={filters.estado as string || ''}
                onChange={(e) => setFilter('estado', e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="completo">Completo</option>
                <option value="en_revision">En Revisión</option>
                <option value="vencido">Vencido</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Emisión / Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" />
                        {doc.nombre_archivo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{doc.paciente_nombre}</div>
                        <div className="text-xs text-slate-500">CC: {doc.paciente_documento}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getLabelForEnum(doc.tipo, 'tipo_documento')}</TableCell>
                    <TableCell>
                      {doc.fecha_emision || doc.fecha_vencimiento ? (
                        <div className="text-sm">
                          {doc.fecha_emision && <div>Emisión: {formatDate(doc.fecha_emision)}</div>}
                          {doc.fecha_vencimiento && <div>Vence: {formatDate(doc.fecha_vencimiento)}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <select
                        value={doc.estado}
                        onChange={(e) => updateStatus(doc.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold focus:outline-none appearance-none cursor-pointer border border-transparent hover:border-black/10 transition-colors ${getStatusColorClass(doc.estado)}`}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_revision">En Revisión</option>
                        <option value="completo">Completo</option>
                        <option value="vencido">Vencido</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      {doc.archivo_url && (
                        <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-8 text-[hsl(var(--primary))] font-semibold">Ver Documento</Button>
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No se encontraron documentos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Paginación */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-slate-500">
              Página {currentPage} de {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={prevPage} disabled={!hasPrev}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNext}>Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DocumentUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          cargarDocumentos(); // Recargar tras subir
        }}
      />
    </div>
  );
}
