import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Download, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

interface PacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  pacienteToEdit?: any | null;
  readOnly?: boolean;
}

export function PacienteModal({ isOpen, onClose, onSaved, pacienteToEdit, readOnly }: PacienteModalProps) {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'individual' | 'lote'>('individual');
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    tipo_documento: 'CC',
    numero_documento: '',
    nombre_completo: '',
    eps: '',
    diagnostico: '',
    codigo_diagnostico: '',
    medico_tratante: '',
    tipo_tratamiento: 'inmunoterapia',
    estado: 'activo'
  });

  useEffect(() => {
    if (pacienteToEdit) {
      setTab('individual');
      setFormData({
        tipo_documento: pacienteToEdit.tipo_documento || 'CC',
        numero_documento: pacienteToEdit.numero_documento || pacienteToEdit.documento || '',
        nombre_completo: pacienteToEdit.nombre_completo || pacienteToEdit.nombre || '',
        eps: pacienteToEdit.eps || '',
        diagnostico: pacienteToEdit.diagnostico || '',
        codigo_diagnostico: pacienteToEdit.codigo_diagnostico || pacienteToEdit.codigo_dx || '',
        medico_tratante: pacienteToEdit.medico_tratante || pacienteToEdit.medico || '',
        tipo_tratamiento: pacienteToEdit.tipo_tratamiento || 'inmunoterapia',
        estado: pacienteToEdit.estado || 'activo'
      });
    } else {
      setFormData({
        tipo_documento: 'CC',
        numero_documento: '',
        nombre_completo: '',
        eps: '',
        diagnostico: '',
        codigo_diagnostico: '',
        medico_tratante: '',
        tipo_tratamiento: 'inmunoterapia',
        estado: 'activo'
      });
      setFile(null);
    }
  }, [pacienteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDownloadTemplate = () => {
    // Generar CSV con punto y coma (;) para que Excel en Latinoamérica lo separe en columnas automáticamente.
    // El BOM (\uFEFF) asegura que caracteres como tildes (é, í) se muestren correctamente.
    const csvContent = 
      "\uFEFFtipo_documento;numero_documento;nombre_completo\n" +
      "CC;1020304050;Juan Pérez\n" +
      "CE;987654321;María García";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_pacientes.csv');
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
      // Detectar el separador (punto y coma o coma)
      const delimiter = text.indexOf(';') !== -1 ? ';' : ',';
      
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        alert('El archivo está vacío o solo contiene encabezados.');
        setLoading(false);
        return;
      }

      // Omitir la primera línea (encabezados) y mapear los datos
      const data = lines.slice(1).map(line => {
        const cols = line.split(delimiter);
        return {
          tipo_documento: cols[0]?.trim() || 'CC',
          numero_documento: cols[1]?.trim() || '',
          nombre_completo: cols[2]?.trim() || 'Sin Nombre'
        };
      });

      const toInsert = data.map(row => ({
        tipo_documento: row.tipo_documento,
        numero_documento: String(row.numero_documento),
        nombre_completo: row.nombre_completo,
        estado: 'activo'
      })).filter(row => row.numero_documento.trim() !== '');

      if (toInsert.length > 0) {
        const supabase = createClient();
        // Usar upsert para que si el documento ya existe, actualice los datos en lugar de dar error 409
        const { error } = await supabase.from('pacientes').upsert(toInsert, { onConflict: 'numero_documento' });
        
        if (error) {
          console.error(error);
          alert('Hubo un error guardando los pacientes: ' + error.message);
        } else {
          onSaved();
          onClose();
        }
      } else {
        alert('El archivo no tiene el formato correcto o no contiene números de documento válidos.');
      }
    } catch (err) {
      console.error(err);
      alert('Error procesando el archivo CSV.');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (tab === 'lote') {
      await processFile();
      return;
    }
    
    setLoading(true);
    const supabase = createClient();
    try {
      if (pacienteToEdit) {
        await supabase.from('pacientes').update(formData).eq('id', pacienteToEdit.id);
      } else {
        await supabase.from('pacientes').insert([formData]);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error guardando paciente');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[hsl(var(--card))] w-full max-w-lg rounded-xl shadow-2xl border border-[hsl(var(--border))] flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col border-b border-[hsl(var(--border))] shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
              {readOnly ? 'Ver Paciente' : pacienteToEdit ? 'Editar Paciente' : 'Nuevo Paciente'}
            </h2>
            <button onClick={onClose} className="p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          {!readOnly && !pacienteToEdit && (
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

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {tab === 'individual' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[hsl(var(--foreground))]">Tipo Documento</label>
                <select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange} disabled={readOnly} className="form-input w-full px-3 py-2 border rounded-lg bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="PAS">Pasaporte</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[hsl(var(--foreground))]">Número Documento</label>
                <input type="text" name="numero_documento" value={formData.numero_documento} onChange={handleChange} disabled={readOnly} className="form-input w-full px-3 py-2 border rounded-lg bg-[hsl(var(--background))] text-[hsl(var(--foreground))]" placeholder="Ej. 1020304050" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-[hsl(var(--foreground))]">Nombre Completo</label>
                <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} disabled={readOnly} className="form-input w-full px-3 py-2 border rounded-lg bg-[hsl(var(--background))] text-[hsl(var(--foreground))]" placeholder="Ej. Ana Sofía Vergara" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <FileText size={16} /> Paso a paso para carga por lote
                </h3>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                  <li>Descarga la plantilla CSV haciendo clic en el botón de abajo.</li>
                  <li>Abre el archivo en Excel o Google Sheets.</li>
                  <li>Llena las columnas respetando los nombres originales (tipo_documento, numero_documento, nombre_completo).</li>
                  <li>Guarda el archivo asegurándote de que mantenga el formato <strong>.CSV</strong></li>
                  <li>Sube el archivo en el recuadro inferior y presiona "Guardar".</li>
                </ol>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="mt-4 bg-white hover:bg-blue-50 text-blue-700 border-blue-200 gap-2">
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
                  {file ? (
                    <div className="flex flex-col items-center gap-2 text-[hsl(var(--success))]">
                      <CheckCircle2 size={32} />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">Archivo listo para subir</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                      <Upload size={32} />
                      <span className="font-medium">Haz clic o arrastra tu archivo aquí</span>
                      <span className="text-xs">Solo formato .CSV</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!readOnly && (
            <Button variant="primary" onClick={handleSave} disabled={loading || (tab === 'lote' && !file)} className="gap-2">
              <Save size={16} />
              {loading ? 'Procesando...' : pacienteToEdit ? 'Guardar Cambios' : (tab === 'lote' ? 'Cargar Archivo' : 'Crear Paciente')}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
