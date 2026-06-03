'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Users, Shield, Database, Plus, CheckCircle2, XCircle, Edit2, ListChecks, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { UsuarioModal } from '@/components/ui/usuario-modal';
import { getLabelForEnum } from '@/lib/utils';

// Static Matrix of Permissions for UI Display
const PERMISSIONS_MATRIX = [
  { module: 'Pacientes (Ver, Crear, Editar)', admin: true, coord: true, farmacia: false, facturacion: false, medico: true, auxiliar: true, auditor: true },
  { module: 'Programación (Agendar Citas)', admin: true, coord: true, farmacia: false, facturacion: false, medico: true, auxiliar: true, auditor: false },
  { module: 'Medicamentos (Inventario)', admin: true, coord: true, farmacia: true, facturacion: false, medico: false, auxiliar: false, auditor: true },
  { module: 'Entregas (Registrar Salida)', admin: true, coord: true, farmacia: true, facturacion: false, medico: false, auxiliar: true, auditor: true },
  { module: 'Facturación y Cobros', admin: true, coord: false, farmacia: false, facturacion: true, medico: false, auxiliar: false, auditor: true },
  { module: 'Documentos (Validar)', admin: true, coord: true, farmacia: false, facturacion: true, medico: true, auxiliar: true, auditor: true },
  { module: 'Reportes e Indicadores', admin: true, coord: true, farmacia: false, facturacion: true, medico: false, auxiliar: false, auditor: true },
  { module: 'Administración y Usuarios', admin: true, coord: false, farmacia: false, facturacion: false, medico: false, auxiliar: false, auditor: false },
];

export default function AdminPage() {
  const [tab, setTab] = useState<'usuarios' | 'permisos' | 'checklist'>('usuarios');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);

  // Checklist state
  const [tiposDoc, setTiposDoc] = useState<any[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('otro');
  const [nuevoDesc, setNuevoDesc] = useState('');
  const [savingChecklist, setSavingChecklist] = useState(false);

  const fetchUsuarios = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('usuarios').select('*').order('created_at', { ascending: false });
    if (data) {
      setUsuarios(data);
    } else {
      console.error(error);
    }
    setLoading(false);
  };

  const fetchTiposDoc = async () => {
    setLoadingChecklist(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('checklist_tipos_documento')
      .select('*')
      .order('orden', { ascending: true });
    if (data) setTiposDoc(data);
    setLoadingChecklist(false);
  };

  const agregarTipoDoc = async () => {
    if (!nuevoNombre.trim()) return;
    setSavingChecklist(true);
    const supabase = createClient();
    await supabase.from('checklist_tipos_documento').insert({
      nombre: nuevoNombre.trim(),
      tipo: nuevoTipo,
      descripcion: nuevoDesc.trim() || null,
      obligatorio: true,
      activo: true,
      orden: tiposDoc.length + 1,
    });
    setNuevoNombre('');
    setNuevoDesc('');
    setNuevoTipo('otro');
    await fetchTiposDoc();
    setSavingChecklist(false);
  };

  const toggleActivoTipoDoc = async (id: string, activo: boolean) => {
    const supabase = createClient();
    await supabase.from('checklist_tipos_documento').update({ activo: !activo }).eq('id', id);
    fetchTiposDoc();
  };

  const eliminarTipoDoc = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este tipo de documento del checklist?')) return;
    const supabase = createClient();
    await supabase.from('checklist_tipos_documento').delete().eq('id', id);
    fetchTiposDoc();
  };

  useEffect(() => {
    fetchUsuarios();
    fetchTiposDoc();
  }, []);

  const openNewUserModal = () => {
    setUserToEdit(null);
    setModalOpen(true);
  };

  const openEditUserModal = (user: any) => {
    setUserToEdit(user);
    setModalOpen(true);
  };

  const toggleEstado = async (id: string, currentState: boolean) => {
    const supabase = createClient();
    await supabase.from('usuarios').update({ activo: !currentState }).eq('id', id);
    fetchUsuarios();
  };

  const renderIcon = (hasPermission: boolean) => {
    return hasPermission ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto" /> : <XCircle size={16} className="text-slate-300 mx-auto" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Administración del Sistema</h1>
          <p className="text-sm text-slate-500">Gestión de usuarios, roles y permisos de la clínica.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
            <Users className="text-slate-400" size={18} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuarios.length}</div>
            <p className="text-xs text-slate-500 mt-1">Usuarios registrados en el sistema</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Shield className="text-slate-400" size={18} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuarios.filter(u => u.activo).length}</div>
            <p className="text-xs text-slate-500 mt-1">Con acceso permitido</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-slate-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Roles Disponibles</CardTitle>
            <Database className="text-slate-400" size={18} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-slate-500 mt-1">Perfiles de seguridad configurados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col border-b border-[hsl(var(--border))] shrink-0 p-0">
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div>
              <CardTitle>Control de Accesos</CardTitle>
              <CardDescription>Visualice y configure quién puede acceder a qué módulos.</CardDescription>
            </div>
            {tab === 'usuarios' && (
              <Button variant="primary" onClick={openNewUserModal} className="gap-2">
                <Plus size={16} />
                Nuevo Usuario
              </Button>
            )}
          </div>
          <div className="flex px-6 gap-6">
            <button
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'usuarios' ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
              onClick={() => setTab('usuarios')}
            >
              Lista de Usuarios
            </button>
            <button
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'permisos' ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
              onClick={() => setTab('permisos')}
            >
              Matriz de Roles y Permisos
            </button>
            <button
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'checklist' ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
              onClick={() => setTab('checklist')}
            >
              <span className="flex items-center gap-1.5"><ListChecks size={14} />Checklist Documental</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {tab === 'usuarios' ? (
            <div className="overflow-x-auto p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Rol del Sistema</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">Cargando usuarios...</TableCell>
                    </TableRow>
                  ) : usuarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">No hay usuarios registrados.</TableCell>
                    </TableRow>
                  ) : (
                    usuarios.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.nombre}</TableCell>
                        <TableCell>{user.correo}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {user.rol}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button 
                            onClick={() => toggleEstado(user.id, user.activo)}
                            className="focus:outline-none"
                            title={user.activo ? "Desactivar usuario" : "Activar usuario"}
                          >
                            <Badge className={`cursor-pointer transition-colors ${user.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                              {user.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEditUserModal(user)} className="text-slate-500 hover:text-primary">
                            <Edit2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : tab === 'checklist' ? (
            <div className="p-6 space-y-6">
              {/* Formulario para agregar nuevo tipo */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Plus size={14} /> Agregar Tipo de Documento
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Nombre del documento *"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="form-input text-sm col-span-1"
                  />
                  <select
                    value={nuevoTipo}
                    onChange={(e) => setNuevoTipo(e.target.value)}
                    className="form-input text-sm"
                  >
                    <option value="formula_medica">Fórmula Médica</option>
                    <option value="autorizacion">Autorización</option>
                    <option value="consentimiento">Consentimiento</option>
                    <option value="acta_entrega">Acta de Entrega</option>
                    <option value="soporte_facturacion">Soporte de Facturación</option>
                    <option value="historia_clinica">Historia Clínica</option>
                    <option value="documento_identidad">Documento de Identidad</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Descripción (opcional)"
                    value={nuevoDesc}
                    onChange={(e) => setNuevoDesc(e.target.value)}
                    className="form-input text-sm"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={agregarTipoDoc}
                    loading={savingChecklist}
                    disabled={!nuevoNombre.trim()}
                    className="gap-2"
                  >
                    <Plus size={14} /> Agregar
                  </Button>
                </div>
              </div>

              {/* Lista de tipos de documentos */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Obligatorio</TableHead>
                    <TableHead className="text-center">Activo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingChecklist ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-400">Cargando...</TableCell>
                    </TableRow>
                  ) : tiposDoc.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-400">No hay tipos de documentos configurados.</TableCell>
                    </TableRow>
                  ) : tiposDoc.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-sm">{t.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs capitalize">{t.tipo?.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{t.descripcion || '—'}</TableCell>
                      <TableCell className="text-center">
                        {t.obligatorio ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto" /> : <XCircle size={16} className="text-slate-300 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        <button onClick={() => toggleActivoTipoDoc(t.id, t.activo)} className="focus:outline-none">
                          <Badge className={`cursor-pointer transition-colors text-xs ${
                            t.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}>
                            {t.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => eliminarTipoDoc(t.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="text-xs text-slate-400 bg-blue-50 border border-blue-100 rounded-lg p-3">
                <strong>Nota:</strong> Los documentos marcados como <strong>Activos</strong> aparecerán automáticamente en el checklist 
                de cada nueva entrega registrada. Los cambios aplican solo a entregas futuras.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto p-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Guía de Permisos:</strong> Esta matriz visual indica a qué módulos tiene acceso cada rol. 
                  El sistema bloquea automáticamente las rutas y acciones basándose en el rol asignado a cada usuario en la pestaña anterior.
                </p>
              </div>
              <Table className="border text-center">
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[250px] font-bold text-left border-r">Módulo / Acción</TableHead>
                    <TableHead className="text-center font-semibold text-xs border-r">Administrador</TableHead>
                    <TableHead className="text-center font-semibold text-xs border-r">Coordinador</TableHead>
                    <TableHead className="text-center font-semibold text-xs border-r">Médico</TableHead>
                    <TableHead className="text-center font-semibold text-xs border-r">Farmacia</TableHead>
                    <TableHead className="text-center font-semibold text-xs border-r">Facturación</TableHead>
                    <TableHead className="text-center font-semibold text-xs border-r">Auxiliar</TableHead>
                    <TableHead className="text-center font-semibold text-xs">Auditor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSIONS_MATRIX.map((row, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell className="font-medium text-left border-r text-sm text-slate-700 bg-slate-50/50">{row.module}</TableCell>
                      <TableCell className="border-r">{renderIcon(row.admin)}</TableCell>
                      <TableCell className="border-r">{renderIcon(row.coord)}</TableCell>
                      <TableCell className="border-r">{renderIcon(row.medico)}</TableCell>
                      <TableCell className="border-r">{renderIcon(row.farmacia)}</TableCell>
                      <TableCell className="border-r">{renderIcon(row.facturacion)}</TableCell>
                      <TableCell className="border-r">{renderIcon(row.auxiliar)}</TableCell>
                      <TableCell>{renderIcon(row.auditor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UsuarioModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSaved={fetchUsuarios} 
        usuarioToEdit={userToEdit} 
      />
    </div>
  );
}
