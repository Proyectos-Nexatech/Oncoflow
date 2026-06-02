'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Check } from 'lucide-react';
import { Button } from './button';
import { createClient } from '@/lib/supabase/client';

export function MedicamentoModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    nombre_generico: '',
    nombre_comercial: '',
    codigo: '',
    tipo_medicamento: 'Quimioterapia',
    concentracion: '',
    presentacion: '',
    laboratorio: '',
    lote: '',
    fecha_vencimiento: '',
    stock: '',
    stock_minimo: '',
    valor_unitario: '',
    requiere_refrigeracion: false
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    
    try {
      const { error } = await supabase.from('medicamentos').insert({
        nombre_generico: formData.nombre_generico,
        nombre_comercial: formData.nombre_comercial,
        codigo: formData.codigo,
        tipo_medicamento: formData.tipo_medicamento,
        concentracion: formData.concentracion,
        presentacion: formData.presentacion,
        laboratorio: formData.laboratorio,
        lote: formData.lote,
        fecha_vencimiento: formData.fecha_vencimiento || null,
        stock: parseInt(formData.stock) || 0,
        stock_minimo: parseInt(formData.stock_minimo) || 0,
        valor_unitario: parseFloat(formData.valor_unitario) || 0,
        requiere_refrigeracion: formData.requiere_refrigeracion,
        activo: true
      });

      if (!error) {
        onSuccess();
        onClose();
      } else {
        console.error(error);
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
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-0 shadow-2xl z-50 overflow-hidden focus:outline-none flex flex-col animate-scale-in">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Nuevo Medicamento
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          
          <div className="p-5 overflow-y-auto">
            <form id="med-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">Nombre Genérico *</label>
                <input name="nombre_generico" value={formData.nombre_generico} onChange={handleChange} required
                  className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] outline-none focus:border-[hsl(var(--primary))]" />
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">Nombre Comercial</label>
                <input name="nombre_comercial" value={formData.nombre_comercial} onChange={handleChange}
                  className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] outline-none focus:border-[hsl(var(--primary))]" />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">Código</label>
                <input name="codigo" value={formData.codigo} onChange={handleChange}
                  className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] outline-none focus:border-[hsl(var(--primary))]" />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">Tipo *</label>
                <select name="tipo_medicamento" value={formData.tipo_medicamento} onChange={handleChange} required
                  className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] outline-none focus:border-[hsl(var(--primary))] bg-white">
                  <option value="Quimioterapia">Quimioterapia</option>
                  <option value="Inmunoterapia">Inmunoterapia</option>
                  <option value="Hormonoterapia">Hormonoterapia</option>
                  <option value="Terapia biológica">Terapia biológica</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">Concentración</label>
                <input name="concentracion" value={formData.concentracion} onChange={handleChange} placeholder="Ej. 500mg"
                  className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] outline-none focus:border-[hsl(var(--primary))]" />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">Laboratorio</label>
                <input name="laboratorio" value={formData.laboratorio} onChange={handleChange}
                  className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] outline-none focus:border-[hsl(var(--primary))]" />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">Lote</label>
                <input name="lote" value={formData.lote} onChange={handleChange}
                  className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] outline-none focus:border-[hsl(var(--primary))]" />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">Fecha Vencimiento *</label>
                <input name="fecha_vencimiento" type="date" value={formData.fecha_vencimiento} onChange={handleChange} required
                  className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] outline-none focus:border-[hsl(var(--primary))]" />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">Stock Inicial *</label>
                <input name="stock" type="number" min="0" value={formData.stock} onChange={handleChange} required
                  className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] outline-none focus:border-[hsl(var(--primary))]" />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">Stock Mínimo *</label>
                <input name="stock_minimo" type="number" min="0" value={formData.stock_minimo} onChange={handleChange} required
                  className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] outline-none focus:border-[hsl(var(--primary))]" />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">Valor Unitario ($)</label>
                <input name="valor_unitario" type="number" min="0" step="0.01" value={formData.valor_unitario} onChange={handleChange}
                  className="w-full form-input px-3 py-2 text-sm rounded-[var(--radius)] border border-[hsl(var(--border))] outline-none focus:border-[hsl(var(--primary))]" />
              </div>

              <div className="space-y-1.5 sm:col-span-1 flex items-center h-full pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input name="requiere_refrigeracion" type="checkbox" checked={formData.requiere_refrigeracion} onChange={handleChange} 
                    className="w-4 h-4 rounded text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]" />
                  Requiere Refrigeración
                </label>
              </div>

            </form>
          </div>

          <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
            <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
            <Button variant="primary" type="submit" form="med-form" loading={loading} className="gap-1.5">
              <Check size={16} /> Guardar
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
