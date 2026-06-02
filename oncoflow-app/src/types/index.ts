// types/index.ts — Tipos TypeScript globales de ONCOFLOW

// ============================================================
// ENUMS
// ============================================================
export type RolUsuario = 'administrador' | 'coordinador' | 'farmacia' | 'facturacion' | 'medico' | 'auxiliar' | 'auditor';
export type EstadoPaciente = 'activo' | 'suspendido' | 'finalizado' | 'fallecido';
export type SexoTipo = 'masculino' | 'femenino' | 'otro';
export type TipoTratamiento = 'quimioterapia' | 'inmunoterapia' | 'hormonoterapia' | 'terapia_biologica' | 'otro';
export type EstadoProgramacion = 'programado' | 'confirmado' | 'pendiente_documentacion' | 'pendiente_autorizacion' | 'listo_entrega' | 'entregado' | 'reprogramado' | 'cancelado';
export type EstadoEntrega = 'pendiente' | 'en_proceso' | 'entregado' | 'no_entregado' | 'rechazado';
export type TipoDocumento = 'formula_medica' | 'autorizacion' | 'consentimiento' | 'historia_clinica' | 'documento_identidad' | 'acta_entrega' | 'soporte_facturacion' | 'otro';
export type EstadoDocumento = 'completo' | 'pendiente' | 'vencido' | 'en_revision' | 'rechazado';
export type EstadoFactura = 'borrador' | 'validada' | 'enviada' | 'pagada' | 'rechazada';

// ============================================================
// INTERFACES DE ENTIDADES
// ============================================================
export interface Usuario {
  id: string;
  auth_id?: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
  ultimo_acceso?: string;
  created_at: string;
  updated_at: string;
}

export interface Paciente {
  id: string;
  tipo_documento: string;
  numero_documento: string;
  nombre_completo: string;
  fecha_nacimiento?: string;
  sexo?: SexoTipo;
  telefono?: string;
  correo?: string;
  direccion?: string;
  eps?: string;
  diagnostico?: string;
  codigo_diagnostico?: string;
  medico_tratante?: string;
  tipo_tratamiento?: TipoTratamiento;
  estado: EstadoPaciente;
  observaciones?: string;
  creado_por?: string;
  created_at: string;
  updated_at: string;
}

export interface Medicamento {
  id: string;
  codigo: string;
  nombre_comercial: string;
  nombre_generico: string;
  concentracion?: string;
  presentacion?: string;
  laboratorio?: string;
  valor_unitario: number;
  stock: number;
  stock_minimo?: number;
  lote?: string;
  fecha_vencimiento?: string;
  tipo_medicamento?: string;
  requiere_refrigeracion?: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Programacion {
  id: string;
  paciente_id: string;
  medicamento_id: string;
  responsable_id?: string;
  fecha_programada: string;
  hora_estimada?: string;
  estado: EstadoProgramacion;
  ciclo?: number;
  dosis?: string;
  via_administracion?: string;
  observaciones?: string;
  motivo_reprogramacion?: string;
  reprogramacion_de?: string;
  creado_por?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  paciente?: Paciente;
  medicamento?: Medicamento;
  responsable?: Usuario;
}

export interface Entrega {
  id: string;
  programacion_id: string;
  responsable_id?: string;
  paciente_id: string;
  medicamento_id: string;
  fecha_entrega?: string;
  cantidad: number;
  valor_unitario?: number;
  valor_total?: number;
  estado: EstadoEntrega;
  firma_digital_url?: string;
  observaciones?: string;
  motivo_no_entrega?: string;
  es_facturable?: boolean;
  creado_por?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  programacion?: Programacion;
  paciente?: Paciente;
  medicamento?: Medicamento;
}

export interface Documento {
  id: string;
  paciente_id: string;
  entrega_id?: string;
  tipo: TipoDocumento;
  nombre_archivo?: string;
  archivo_url?: string;
  drive_file_id?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  estado: EstadoDocumento;
  observaciones?: string;
  validado_por?: string;
  fecha_validacion?: string;
  motivo_rechazo?: string;
  creado_por?: string;
  created_at: string;
  updated_at: string;
}

export interface Facturacion {
  id: string;
  numero_factura?: string;
  mes_facturacion: string;
  eps: string;
  valor_total: number;
  estado: EstadoFactura;
  fecha_generacion?: string;
  fecha_envio?: string;
  fecha_pago?: string;
  archivo_url?: string;
  drive_file_id?: string;
  observaciones?: string;
  creado_por?: string;
  validado_por?: string;
  created_at: string;
  updated_at: string;
}

export interface Alerta {
  id: string;
  tipo: string;
  titulo: string;
  descripcion?: string;
  entidad_tipo?: string;
  entidad_id?: string;
  leida: boolean;
  usuario_id?: string;
  prioridad: 'alta' | 'media' | 'baja';
  created_at: string;
}

// ============================================================
// TIPOS DE DASHBOARD KPIs
// ============================================================
export interface DashboardKPIs {
  programados_hoy: number;
  entregas_hoy: number;
  entregas_vencidas: number;
  entregas_pendientes: number;
  documentos_vencidos: number;
  documentos_proximos_vencer: number;
  medicamentos_stock_bajo: number;
}

// ============================================================
// PERMISOS POR ROL
// ============================================================
export const PERMISOS_ROL: Record<RolUsuario, {
  dashboard: boolean;
  pacientes: 'ninguno' | 'ver' | 'crear' | 'editar' | 'eliminar';
  programacion: 'ninguno' | 'ver' | 'crear' | 'editar';
  medicamentos: 'ninguno' | 'ver' | 'crear' | 'editar';
  entregas: 'ninguno' | 'ver' | 'crear' | 'editar';
  documentos: 'ninguno' | 'ver' | 'crear' | 'editar';
  facturacion: 'ninguno' | 'ver' | 'crear' | 'editar';
  reportes: 'ninguno' | 'ver' | 'exportar';
  administracion: boolean;
}> = {
  administrador: {
    dashboard: true,
    pacientes: 'eliminar',
    programacion: 'editar',
    medicamentos: 'editar',
    entregas: 'editar',
    documentos: 'editar',
    facturacion: 'editar',
    reportes: 'exportar',
    administracion: true,
  },
  coordinador: {
    dashboard: true,
    pacientes: 'editar',
    programacion: 'editar',
    medicamentos: 'ver',
    entregas: 'editar',
    documentos: 'editar',
    facturacion: 'ver',
    reportes: 'exportar',
    administracion: false,
  },
  farmacia: {
    dashboard: true,
    pacientes: 'ver',
    programacion: 'editar',
    medicamentos: 'editar',
    entregas: 'editar',
    documentos: 'editar',
    facturacion: 'ver',
    reportes: 'exportar',
    administracion: false,
  },
  facturacion: {
    dashboard: true,
    pacientes: 'ver',
    programacion: 'ver',
    medicamentos: 'ver',
    entregas: 'ver',
    documentos: 'editar',
    facturacion: 'editar',
    reportes: 'exportar',
    administracion: false,
  },
  medico: {
    dashboard: true,
    pacientes: 'editar',
    programacion: 'ver',
    medicamentos: 'ver',
    entregas: 'ver',
    documentos: 'editar',
    facturacion: 'ninguno',
    reportes: 'ver',
    administracion: false,
  },
  auxiliar: {
    dashboard: true,
    pacientes: 'ver',
    programacion: 'crear',
    medicamentos: 'ver',
    entregas: 'crear',
    documentos: 'crear',
    facturacion: 'ninguno',
    reportes: 'ninguno',
    administracion: false,
  },
  auditor: {
    dashboard: true,
    pacientes: 'ver',
    programacion: 'ver',
    medicamentos: 'ver',
    entregas: 'ver',
    documentos: 'ver',
    facturacion: 'ver',
    reportes: 'exportar',
    administracion: false,
  },
};
