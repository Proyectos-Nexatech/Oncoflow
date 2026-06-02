import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy') {
  return format(new Date(date), formatStr, { locale: es });
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

export function isExpired(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return isBefore(new Date(dateStr), new Date());
}

export function isExpiringSoon(dateStr?: string | null, daysAhead = 7): boolean {
  if (!dateStr) return false;
  const expDate = new Date(dateStr);
  const threshold = addDays(new Date(), daysAhead);
  return !isBefore(expDate, new Date()) && isBefore(expDate, threshold);
}

export function getDocumentStatusColor(estado: string): string {
  const colors: Record<string, string> = {
    completo: 'bg-emerald-100 text-emerald-800',
    pendiente: 'bg-amber-100 text-amber-800',
    vencido: 'bg-red-100 text-red-800',
    en_revision: 'bg-blue-100 text-blue-800',
    rechazado: 'bg-red-100 text-red-800',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
}

export function getProgramacionStatusColor(estado: string): string {
  const colors: Record<string, string> = {
    programado: 'bg-blue-100 text-blue-800',
    confirmado: 'bg-indigo-100 text-indigo-800',
    pendiente_documentacion: 'bg-amber-100 text-amber-800',
    pendiente_autorizacion: 'bg-orange-100 text-orange-800',
    listo_entrega: 'bg-emerald-100 text-emerald-800',
    entregado: 'bg-green-100 text-green-800',
    reprogramado: 'bg-purple-100 text-purple-800',
    cancelado: 'bg-red-100 text-red-800',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
}

export function getEntregaStatusColor(estado: string): string {
  const colors: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-800',
    en_proceso: 'bg-blue-100 text-blue-800',
    entregado: 'bg-emerald-100 text-emerald-800',
    no_entregado: 'bg-red-100 text-red-800',
    rechazado: 'bg-red-100 text-red-800',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
}

export function getPacienteStatusColor(estado: string): string {
  const colors: Record<string, string> = {
    activo: 'bg-emerald-100 text-emerald-800',
    suspendido: 'bg-amber-100 text-amber-800',
    finalizado: 'bg-gray-100 text-gray-800',
    fallecido: 'bg-red-100 text-red-800',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
}

export function getLabelForEnum(value: string, type: string): string {
  const labels: Record<string, Record<string, string>> = {
    estado_paciente: {
      activo: 'Activo',
      suspendido: 'Suspendido',
      finalizado: 'Finalizado',
      fallecido: 'Fallecido',
    },
    rol_usuario: {
      administrador: 'Administrador',
      coordinador: 'Coordinador',
      farmacia: 'Farmacia',
      facturacion: 'Facturación',
      medico: 'Médico',
      auxiliar: 'Auxiliar',
      auditor: 'Auditor',
    },
    estado_programacion: {
      programado: 'Programado',
      confirmado: 'Confirmado',
      pendiente_documentacion: 'Pendiente Documentación',
      pendiente_autorizacion: 'Pendiente Autorización',
      listo_entrega: 'Listo para Entrega',
      entregado: 'Entregado',
      reprogramado: 'Reprogramado',
      cancelado: 'Cancelado',
    },
    estado_entrega: {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      entregado: 'Entregado',
      no_entregado: 'No Entregado',
      rechazado: 'Rechazado',
    },
    tipo_documento: {
      formula_medica: 'Fórmula Médica',
      autorizacion: 'Autorización',
      consentimiento: 'Consentimiento',
      historia_clinica: 'Historia Clínica',
      documento_identidad: 'Documento de Identidad',
      acta_entrega: 'Acta de Entrega',
      soporte_facturacion: 'Soporte de Facturación',
      otro: 'Otro',
    },
    tipo_tratamiento: {
      quimioterapia: 'Quimioterapia',
      inmunoterapia: 'Inmunoterapia',
      hormonoterapia: 'Hormonoterapia',
      terapia_biologica: 'Terapia Biológica',
      otro: 'Otro',
    },
  };
  return labels[type]?.[value] || value;
}
