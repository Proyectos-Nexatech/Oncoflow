import React, { useState } from 'react';
import { X, User, Mail, Shield, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MiPerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  onProfileUpdated?: () => void;
}

export function MiPerfilModal({ isOpen, onClose, currentUser, onProfileUpdated }: MiPerfilModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    rol: '',
  });

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (currentUser) {
      setFormData({
        nombre: currentUser.nombre || 'Administrador',
        correo: currentUser.correo || 'admin@oncoflow.co',
        rol: currentUser.rol || 'Administrador',
      });
    } else {
      setFormData({
        nombre: 'Administrador',
        correo: 'admin@oncoflow.co',
        rol: 'Administrador Principal',
      });
    }
  }, [currentUser]);

  if (!isOpen || !mounted) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setLoading(true);
    if (currentUser?.id || currentUser?.isNew) {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      if (currentUser.isNew) {
        await supabase.from('usuarios').insert({
          correo: currentUser.correo,
          nombre: formData.nombre,
          rol: 'administrador',
          activo: true
        });
      } else {
        await supabase.from('usuarios').update({ nombre: formData.nombre }).eq('id', currentUser.id);
      }
      
      if (onProfileUpdated) onProfileUpdated();
    } else {
      // Demo mode timeout
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    setLoading(false);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[hsl(var(--card))] w-full max-w-sm rounded-xl shadow-2xl border border-[hsl(var(--border))] flex flex-col overflow-hidden">
        
        {/* Header Cover Background */}
        <div className="h-24 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] relative shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-1.5 bg-black/20 text-white hover:bg-black/40 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Avatar & Info */}
        <div className="px-6 pb-6 pt-0 relative flex-1 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white border-4 border-[hsl(var(--card))] flex items-center justify-center -mt-10 mb-4 shadow-md relative z-10 overflow-hidden">
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[hsl(var(--primary))] font-bold text-2xl">
              {formData.nombre.substring(0, 2).toUpperCase()}
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">{formData.nombre}</h2>
          <p className="text-sm font-medium text-[hsl(var(--primary))] mt-1">{formData.rol}</p>
          
          <div className="w-full mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center gap-1.5">
                <User size={12} /> Nombre de visualización
              </label>
              <input 
                type="text" 
                name="nombre" 
                value={formData.nombre} 
                onChange={handleChange} 
                className="form-input w-full px-3 py-2 text-sm border rounded-lg bg-[hsl(var(--background))] text-[hsl(var(--foreground))]" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={12} /> Correo electrónico
              </label>
              <input 
                type="text" 
                value={formData.correo} 
                disabled 
                className="form-input w-full px-3 py-2 text-sm border rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={12} /> Nivel de Acceso
              </label>
              <input 
                type="text" 
                value={formData.rol} 
                disabled 
                className="form-input w-full px-3 py-2 text-sm border rounded-lg bg-emerald-50 text-emerald-700 font-medium cursor-not-allowed border-emerald-100" 
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-[hsl(var(--border))] flex justify-end gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={loading} className="gap-2">
            <Save size={14} />
            {loading ? 'Guardando...' : 'Guardar Perfil'}
          </Button>
        </div>

      </div>
    </div>
  );

  const { createPortal } = require('react-dom');
  return createPortal(modalContent, document.body);
}
