import React, { useState, useEffect } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { createClient } from '@/lib/supabase/client';

export function DocumentUploadModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [pacienteId, setPacienteId] = useState('');
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Cargar pacientes
      const supabase = createClient();
      supabase.from('pacientes').select('id, nombre_completo, numero_documento').then(({ data }) => {
        if (data) setPacientes(data);
      });
    } else {
      setFile(null);
      setPacienteId('');
      setTipo('');
      setError('');
    }
  }, [isOpen]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !pacienteId || !tipo) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('pacienteId', pacienteId);
    formData.append('tipo', tipo);

    try {
      const res = await fetch('/api/documentos/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error subiendo el archivo');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">Cargar Documento</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleUpload} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex gap-2 items-center">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Paciente</label>
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className="w-full form-input rounded-lg border-slate-200 text-sm"
              required
            >
              <option value="">Selecciona un paciente...</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre_completo} (CC {p.numero_documento})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Documento</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full form-input rounded-lg border-slate-200 text-sm"
              required
            >
              <option value="">Selecciona el tipo...</option>
              <option value="formula_medica">Fórmula Médica</option>
              <option value="autorizacion">Autorización EPS</option>
              <option value="historia_clinica">Historia Clínica</option>
              <option value="documento_identidad">Documento de Identidad</option>
              <option value="acta_entrega">Acta de Entrega</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Archivo (PDF o Imagen)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => document.getElementById('fileUpload')?.click()}>
              <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">
                {file ? file.name : 'Haz clic para seleccionar o arrastra un archivo'}
              </p>
              <input
                id="fileUpload"
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={loading || !file || !pacienteId || !tipo}>
              {loading ? <><Loader2 className="animate-spin mr-2" size={16} /> Subiendo...</> : 'Subir a Drive'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
