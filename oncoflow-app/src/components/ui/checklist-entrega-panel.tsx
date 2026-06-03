'use client';

import React from 'react';
import { CheckCircle2, Clock, MinusCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ChecklistItem {
  id: string;
  tipo_doc_id: string;
  nombre: string;
  descripcion: string | null;
  obligatorio: boolean;
  estado: 'pendiente' | 'verificado' | 'no_aplica';
  observaciones: string | null;
  fecha_verificacion: string | null;
}

interface ChecklistEntregaPanelProps {
  entregaId: string;
  onUpdate?: (silencioso?: boolean) => void;
}

const ESTADO_CONFIG = {
  verificado: {
    icon: <CheckCircle2 size={16} />,
    label: 'Verificado',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  pendiente: {
    icon: <Clock size={16} />,
    label: 'Pendiente',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  },
  no_aplica: {
    icon: <MinusCircle size={16} />,
    label: 'No Aplica',
    classes: 'bg-slate-50 text-slate-500 border-slate-200',
    dot: 'bg-slate-300',
  },
};

export function ChecklistEntregaPanel({ entregaId, onUpdate }: ChecklistEntregaPanelProps) {
  const [items, setItems] = React.useState<ChecklistItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [editingObs, setEditingObs] = React.useState<string | null>(null);
  const [obsValues, setObsValues] = React.useState<Record<string, string>>({});

  const cargar = React.useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    const supabase = createClient();

    // Fetch all checklist types
    const { data: tipos } = await supabase
      .from('checklist_tipos_documento')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    // Fetch existing checklist items for this entrega
    const { data: existentes } = await supabase
      .from('checklist_entrega')
      .select('*')
      .eq('entrega_id', entregaId);

    if (tipos) {
      const itemsMap: Record<string, any> = {};
      (existentes || []).forEach((e) => { itemsMap[e.tipo_doc_id] = e; });

      const merged: ChecklistItem[] = tipos.map((t) => ({
        id: itemsMap[t.id]?.id || '',
        tipo_doc_id: t.id,
        nombre: t.nombre,
        descripcion: t.descripcion,
        obligatorio: t.obligatorio,
        estado: itemsMap[t.id]?.estado || 'pendiente',
        observaciones: itemsMap[t.id]?.observaciones || '',
        fecha_verificacion: itemsMap[t.id]?.fecha_verificacion || null,
      }));

      setItems(merged);
      const obsInit: Record<string, string> = {};
      merged.forEach((m) => { obsInit[m.tipo_doc_id] = m.observaciones || ''; });
      setObsValues(obsInit);
    }

    if (!silencioso) setLoading(false);
  }, [entregaId]);

  React.useEffect(() => { cargar(); }, [cargar]);

  const updateEstado = async (item: ChecklistItem, nuevoEstado: 'pendiente' | 'verificado' | 'no_aplica') => {
    setSaving(item.tipo_doc_id);
    const supabase = createClient();

    const nowStr = new Date().toISOString();
    const payload = {
      entrega_id: entregaId,
      tipo_doc_id: item.tipo_doc_id,
      estado: nuevoEstado,
      observaciones: obsValues[item.tipo_doc_id] || null,
      fecha_verificacion: nuevoEstado === 'verificado' ? nowStr : null,
    };

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) =>
        i.tipo_doc_id === item.tipo_doc_id
          ? { ...i, estado: nuevoEstado, fecha_verificacion: nuevoEstado === 'verificado' ? nowStr : null }
          : i
      )
    );

    if (item.id) {
      await supabase.from('checklist_entrega').update(payload).eq('id', item.id);
    } else {
      await supabase.from('checklist_entrega').insert(payload);
    }

    await cargar(true);
    setSaving(null);
    onUpdate?.(true);
  };

  const saveObs = async (item: ChecklistItem) => {
    setSaving(item.tipo_doc_id);
    const supabase = createClient();
    
    // Optimistic UI update
    const currentObs = obsValues[item.tipo_doc_id] || '';
    setItems((prev) =>
      prev.map((i) =>
        i.tipo_doc_id === item.tipo_doc_id
          ? { ...i, observaciones: currentObs }
          : i
      )
    );

    if (item.id) {
      await supabase.from('checklist_entrega')
        .update({ observaciones: currentObs || null })
        .eq('id', item.id);
    } else {
      await supabase.from('checklist_entrega').insert({
        entrega_id: entregaId,
        tipo_doc_id: item.tipo_doc_id,
        estado: item.estado,
        observaciones: currentObs || null,
      });
    }
    setEditingObs(null);
    await cargar(true);
    setSaving(null);
    onUpdate?.(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Cargando checklist...
      </div>
    );
  }

  const total = items.filter((i) => i.obligatorio).length;
  const verificados = items.filter((i) => i.estado === 'verificado' || i.estado === 'no_aplica').length;
  const pct = total > 0 ? Math.round((verificados / total) * 100) : 0;

  return (
    <div className="px-4 pb-4 pt-2 space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${pct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
          {verificados}/{total} docs
        </span>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item) => {
          const cfg = ESTADO_CONFIG[item.estado];
          const isSaving = saving === item.tipo_doc_id;
          const isEditObs = editingObs === item.tipo_doc_id;

          return (
            <div
              key={item.tipo_doc_id}
              className={`rounded-xl border p-3 transition-all duration-200 ${cfg.classes}`}
            >
              <div className="flex items-start gap-3">
                {/* Status dot */}
                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800 leading-tight">
                        {item.nombre}
                        {item.obligatorio && (
                          <span className="ml-1.5 text-[10px] text-slate-400 font-normal">• Obligatorio</span>
                        )}
                      </p>
                      {item.descripcion && (
                        <p className="text-xs text-slate-500 mt-0.5">{item.descripcion}</p>
                      )}
                      {item.fecha_verificacion && item.estado === 'verificado' && (
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          Verificado el {new Date(item.fecha_verificacion).toLocaleDateString('es-CO')}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isSaving ? (
                        <Loader2 size={14} className="animate-spin text-slate-400" />
                      ) : (
                        <>
                          <button
                            onClick={() => updateEstado(item, 'verificado')}
                            disabled={item.estado === 'verificado'}
                            title="Marcar como Verificado"
                            className={`p-1.5 rounded-lg transition-all text-xs font-medium border
                              ${item.estado === 'verificado'
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                              }`}
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            onClick={() => updateEstado(item, 'pendiente')}
                            disabled={item.estado === 'pendiente'}
                            title="Marcar como Pendiente"
                            className={`p-1.5 rounded-lg transition-all text-xs font-medium border
                              ${item.estado === 'pendiente'
                                ? 'bg-amber-400 text-white border-amber-400'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
                              }`}
                          >
                            <Clock size={14} />
                          </button>
                          <button
                            onClick={() => updateEstado(item, 'no_aplica')}
                            disabled={item.estado === 'no_aplica'}
                            title="No Aplica"
                            className={`p-1.5 rounded-lg transition-all text-xs font-medium border
                              ${item.estado === 'no_aplica'
                                ? 'bg-slate-400 text-white border-slate-400'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                              }`}
                          >
                            <MinusCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Observations */}
                  {isEditObs ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Agregar observación..."
                        value={obsValues[item.tipo_doc_id] || ''}
                        onChange={(e) => setObsValues((prev) => ({ ...prev, [item.tipo_doc_id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveObs(item); if (e.key === 'Escape') setEditingObs(null); }}
                        className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                      />
                      <button onClick={() => saveObs(item)} className="text-xs px-2 py-1 bg-[hsl(var(--primary))] text-white rounded-lg font-medium">
                        Guardar
                      </button>
                      <button onClick={() => setEditingObs(null)} className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingObs(item.tipo_doc_id)}
                      className="mt-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {obsValues[item.tipo_doc_id] ? `📝 ${obsValues[item.tipo_doc_id]}` : '+ Agregar observación'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
