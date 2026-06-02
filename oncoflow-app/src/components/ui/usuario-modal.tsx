import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  usuarioToEdit?: any | null;
}

const ROLES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'farmacia', label: 'Farmacia' },
  { value: 'facturacion', label: 'Facturación' },
  { value: 'medico', label: 'Médico' },
  { value: 'auxiliar', label: 'Auxiliar' },
  { value: 'auditor', label: 'Auditor' }
];

export function UsuarioModal({ isOpen, onClose, onSaved, usuarioToEdit }: UsuarioModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    rol: 'auxiliar',
    activo: true
  });

  useEffect(() => {
    if (usuarioToEdit) {
      setFormData({
        nombre: usuarioToEdit.nombre || '',
        correo: usuarioToEdit.correo || '',
        rol: usuarioToEdit.rol || 'auxiliar',
        activo: usuarioToEdit.activo !== false // true by default
      });
    } else {
      setFormData({
        nombre: '',
        correo: '',
        rol: 'auxiliar',
        activo: true
      });
    }
  }, [usuarioToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      if (usuarioToEdit) {
        await supabase.from('usuarios').update(formData).eq('id', usuarioToEdit.id);
      } else {
        await supabase.from('usuarios').insert([formData]);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Error guardando usuario: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[hsl(var(--card))] w-full max-w-md rounded-xl shadow-2xl border border-[hsl(var(--border))] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))] shrink-0">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
            {usuarioToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className="p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[hsl(var(--foreground))]">Nombre Completo</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="form-input w-full px-3 py-2 border rounded-lg bg-[hsl(var(--background))] text-[hsl(var(--foreground))]" placeholder="Ej. Dra. Laura Torres" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[hsl(var(--foreground))]">Correo Electrónico</label>
              <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="form-input w-full px-3 py-2 border rounded-lg bg-[hsl(var(--background))] text-[hsl(var(--foreground))]" placeholder="Ej. ltorres@oncoflow.co" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[hsl(var(--foreground))]">Rol del Sistema</label>
              <select name="rol" value={formData.rol} onChange={handleChange} className="form-input w-full px-3 py-2 border rounded-lg bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="activo" 
                name="activo" 
                checked={formData.activo} 
                onChange={handleChange} 
                className="w-4 h-4 text-[hsl(var(--primary))] rounded border-[hsl(var(--border))] focus:ring-[hsl(var(--primary))]" 
              />
              <label htmlFor="activo" className="text-sm font-medium text-[hsl(var(--foreground))] cursor-pointer">
                Usuario Activo
              </label>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] pt-2 border-t mt-4">
              Nota: Este panel crea el perfil interno. La autenticación final dependerá de que el usuario inicie sesión con este correo a través de Supabase Auth.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading || !formData.nombre || !formData.correo} className="gap-2">
            <Save size={16} />
            {loading ? 'Guardando...' : usuarioToEdit ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </div>

      </div>
    </div>
  );
}
