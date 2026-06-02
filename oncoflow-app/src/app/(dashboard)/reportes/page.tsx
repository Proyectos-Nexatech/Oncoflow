'use client';

import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore - jspdf-autotable extends jsPDF automatically if imported, but we might not have it.
// We'll do basic text if autotable is not present.

export default function ReportesPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  const reportes = [
    {
      id: 'facturacion',
      titulo: 'Consolidado de Facturación Mensual',
      descripcion: 'Reporte detallado de entregas facturables agrupadas por EPS.',
      tipo: 'Administrativo',
      formatos: ['Excel', 'PDF']
    },
    {
      id: 'entregas',
      titulo: 'Entregas por Medicamento',
      descripcion: 'Estadísticas de medicamentos entregados en un periodo determinado.',
      tipo: 'Operativo',
      formatos: ['Excel']
    },
    {
      id: 'pacientes',
      titulo: 'Pacientes Activos y Tratamientos',
      descripcion: 'Listado de pacientes en estado activo con sus diagnósticos y esquemas.',
      tipo: 'Operativo',
      formatos: ['Excel', 'PDF']
    },
    {
      id: 'indicadores',
      titulo: 'Indicadores de Cumplimiento',
      descripcion: 'Porcentaje de entregas a tiempo vs reprogramadas o vencidas.',
      tipo: 'Gerencial',
      formatos: ['PDF']
    }
  ];

  const handleExportExcel = async (reportId: string, title: string) => {
    setExporting(`${reportId}-excel`);
    try {
      const supabase = createClient();
      let dataToExport: any[] = [];

      if (reportId === 'pacientes') {
        const { data } = await supabase.from('pacientes').select('*').order('nombre_completo');
        if (data) {
          dataToExport = data.map(p => ({
            'Documento': p.numero_documento,
            'Paciente': p.nombre_completo,
            'EPS': p.eps,
            'Diagnóstico': p.diagnostico || 'N/A',
            'Médico': p.medico_tratante || 'N/A',
            'Estado': p.estado
          }));
        }
      } else {
        // Mock data for other reports
        dataToExport = [
          { 'Columna 1': 'Dato A', 'Columna 2': 100 },
          { 'Columna 1': 'Dato B', 'Columna 2': 250 },
        ];
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
      XLSX.writeFile(workbook, `${reportId}_export.xlsx`);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async (reportId: string, title: string) => {
    setExporting(`${reportId}-pdf`);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Reporte: ${title}`, 14, 22);
      doc.setFontSize(11);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-CO')}`, 14, 30);
      
      const supabase = createClient();
      
      if (reportId === 'pacientes') {
        const { data } = await supabase.from('pacientes').select('*').limit(20);
        let yPos = 40;
        if (data) {
          data.forEach((p, idx) => {
            doc.text(`${idx + 1}. ${p.nombre_completo} - EPS: ${p.eps} - Estado: ${p.estado}`, 14, yPos);
            yPos += 8;
          });
        }
      } else {
        doc.text("Contenido del reporte...", 14, 40);
      }
      
      doc.save(`${reportId}_export.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Generador de Reportes</h1>
        <p className="text-sm text-slate-500">Exporte datos operativos y administrativos del sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportes.map((reporte) => (
          <Card key={reporte.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{reporte.tipo}</div>
                  <CardTitle className="text-lg">{reporte.titulo}</CardTitle>
                </div>
                <BarChart3 className="text-slate-400" size={24} />
              </div>
              <CardDescription className="mt-2">{reporte.descripcion}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                {reporte.formatos.includes('Excel') && (
                  <Button 
                    variant="outline" 
                    className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => handleExportExcel(reporte.id, reporte.titulo)}
                    disabled={exporting !== null}
                    loading={exporting === `${reporte.id}-excel`}
                  >
                    <FileSpreadsheet size={16} />
                    Excel
                  </Button>
                )}
                {reporte.formatos.includes('PDF') && (
                  <Button 
                    variant="outline" 
                    className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => handleExportPDF(reporte.id, reporte.titulo)}
                    disabled={exporting !== null}
                    loading={exporting === `${reporte.id}-pdf`}
                  >
                    <FileText size={16} />
                    PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
