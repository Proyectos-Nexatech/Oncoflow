'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar as CalendarIcon, Clock, Check, FileText, Download, Upload } from 'lucide-react';
import { Button } from './button';
import { createClient } from '@/lib/supabase/client';

interface ProgramacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  progToEdit?: any | null;
  readOnly?: boolean;
}

export function ProgramacionModal({ isOpen, onClose, onSuccess, progToEdit, readOnly }: ProgramacionModalProps) {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  
  const [tab, setTab] = useState<'individual' | 'lote'>('individual');
  const [file, setFile] = useState<File | null>(null);

  const [pacienteId, setPacienteId] = useState('');
  const [medicamentoId, setMedicamentoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarListas();
    }
  }, [isOpen]);

  useEffect(() => {
    if (progToEdit) {
      setTab('individual');
      setPacienteId(progToEdit.paciente_id || '');
      setMedicamentoId(progToEdit.medicamento_id || '');
      
      if (progToEdit.fecha_programada) {
        const d = new Date(progToEdit.fecha_programada);
        setFecha(d.toISOString().split('T')[0]);
        setHora(d.toISOString().split('T')[1].substring(0, 5));
      } else {
        setFecha('');
        setHora('');
      }
    } else {
      setPacienteId('');
      setMedicamentoId('');
      setFecha('');
      setHora('');
      setFile(null);
    }
  }, [progToEdit, isOpen]);

  const cargarListas = async () => {
    const supabase = createClient();
    const { data: pacs } = await supabase.from('pacientes').select('*');
    if (pacs) setPacientes(pacs);
    
    const { data: meds } = await supabase.from('medicamentos').select('*');
    if (meds) setMedicamentos(meds);
  };

  const handleDownloadTemplate = () => {
    const csvContent = 
      "\uFEFFdocumento_paciente;codigo_medicamento;fecha_programada;hora\n" +
      "1020304050;MED-001;2026-06-01;08:00\n" +
      "987654321;MED-002;2026-06-02;14:30";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_programaciones.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const delimiter = text.indexOf(';') !== -1 ? ';' : ',';
      
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        alert('El archivo está vacío o solo contiene encabezados.');
        setLoading(false);
        return;
      }

      const data = lines.slice(1).map(line => {
        const cols = line.split(delimiter);
        return {
          documento: cols[0]?.trim() || '',
          medicamento: cols[1]?.trim() || '',
          fecha: cols[2]?.trim() || '',
          hora: cols[3]?.trim() || '12:00'
        };
      });

      const toInsert: any[] = [];
      data.forEach(row => {
        const pac = pacientes.find(p => p.numero_documento === row.documento);
        const med = medicamentos.find(m => m.codigo === row.medicamento || m.nombre_comercial.toLowerCase() === row.medicamento.toLowerCase());
        
        if (pac && med && row.fecha) {
          toInsert.push({
            paciente_id: pac.id,
            medicamento_id: med.id,
            fecha_programada: `${row.fecha}T${row.hora}:00Z`,
            estado: 'programado'
          });
        }
      });

      if (toInsert.length > 0) {
        const supabase = createClient();
        const { error } = await supabase.from('programaciones').insert(toInsert);
        
        if (error) {
          console.error(error);
          alert('Hubo un error guardando las programaciones: ' + error.message);
        } else {
          onSuccess();
          onClose();
        }
      } else {
        alert('El archivo no tiene el formato correcto o no se encontraron pacientes/medicamentos coincidentes.');
      }
    } catch (err) {
      console.error(err);
      alert('Error procesando el archivo CSV.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'lote') {
      await processFile();
      return;
    }

    if (!pacienteId || !medicamentoId || !fecha) return;

    setLoading(true);
    const supabase = createClient();
    
    try {
      const datetime = hora ? `${fecha}T${hora}:00Z` : `${fecha}T12:00:00Z`;

      if (progToEdit) {
        const { error } = await supabase.from('programaciones').update({
          paciente_id: pacienteId,
          medicamento_id: medicamentoId,
          fecha_programada: datetime,
        }).eq('id', progToEdit.id);

        if (!error) {
          onSuccess();
          onClose();
        }
      } else {
        const { error } = await supabase.from('programaciones').insert({
          paciente_id: pacienteId,
          medicamento_id: medicamentoId,
          fecha_programada: datetime,
          estado: 'programado'
        });

        if (!error) {
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-[hsl(var(--card))] p-0 shadow-2xl z-50 overflow-hidden focus:outline-none flex flex-col animate-scale-in">
          
          <div className="flex flex-col border-b border-[hsl(var(--border))] shrink-0">
            <div className="flex items-center justify-between px-6 py-4">
              <Dialog.Title className="text-xl font-semibold text-[hsl(var(--foreground))]">
                {readOnly ? 'Ver Programación' : progToEdit ? 'Editar Programación' : 'Nueva Programación'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            
            {!readOnly && !progToEdit && (
              <div className="flex px-6 gap-6">
                <button
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'individual' ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
                  onClick={() => setTab('individual')}
                >
                  Carga Individual
                </button>
                <button
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'lote' ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
                  onClick={() => setTab('lote')}
                >
                  Carga por Lote (.CSV)
                </button>
              </div>
            )}
          </div>
          
          <div className="p-6 overflow-y-auto">
            {tab === 'individual' ? (
              <form id="prog-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Paciente</label>
                  <select 
                    value={pacienteId}
                    onChange={(e) => setPacienteId(e.target.value)}
                    disabled={readOnly}
                    className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>Selecciona un paciente...</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre_completo} - {p.numero_documento}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Medicamento</label>
                  <select 
                    value={medicamentoId}
                    onChange={(e) => setMedicamentoId(e.target.value)}
                    disabled={readOnly}
                    className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>Selecciona un medicamento...</option>
                    {medicamentos.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre_comercial} ({m.codigo})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[hsl(var(--foreground))]">Fecha</label>
                    <div className="relative">
                      <CalendarIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                      <input 
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        disabled={readOnly}
                        className="w-full form-input !pl-10 pr-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[hsl(var(--foreground))]">Hora (Opcional)</label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                      <input 
                        type="time"
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        disabled={readOnly}
                        className="w-full form-input !pl-10 pr-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <FileText size={16} /> Paso a paso para carga por lote
                  </h3>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>Descarga la plantilla CSV haciendo clic en el botón inferior.</li>
                    <li>Llena las columnas <span className="font-mono bg-blue-100 px-1 rounded">documento_paciente</span>, <span className="font-mono bg-blue-100 px-1 rounded">codigo_medicamento</span>, <span className="font-mono bg-blue-100 px-1 rounded">fecha_programada</span> (YYYY-MM-DD), y <span className="font-mono bg-blue-100 px-1 rounded">hora</span> (HH:MM).</li>
                    <li>Guarda el archivo en formato CSV.</li>
                    <li>Sube el archivo aquí. El sistema buscará automáticamente los IDs en la base de datos usando el documento y el código del medicamento.</li>
                  </ol>
                  <Button variant="outline" size="sm" onClick={handleDownloadTemplate} type="button" className="mt-4 bg-white hover:bg-blue-50 text-blue-700 border-blue-200 gap-2">
                    <Download size={14} /> Descargar Plantilla .CSV
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Seleccionar archivo CSV</label>
                  <div className="relative border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-8 hover:bg-[hsl(var(--muted))] transition-colors text-center group">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={18} />
                      </div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                        {file ? file.name : 'Haz clic o arrastra tu archivo aquí'}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Solo archivos .CSV soportados</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[hsl(var(--border))] px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-xl shrink-0">
            <Button variant="outline" onClick={onClose} type="button">Cerrar</Button>
            {!readOnly && (
              <Button variant="primary" onClick={handleSubmit} loading={loading} className="gap-1.5">
                <Check size={16} /> {tab === 'lote' ? 'Procesar Lote' : 'Guardar'}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
