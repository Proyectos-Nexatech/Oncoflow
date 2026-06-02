-- ============================================================
-- ONCOFLOW — Esquema de Base de Datos PostgreSQL (Supabase)
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE rol_usuario AS ENUM ('administrador', 'coordinador', 'farmacia', 'facturacion', 'medico', 'auxiliar', 'auditor');
CREATE TYPE estado_paciente AS ENUM ('activo', 'suspendido', 'finalizado', 'fallecido');
CREATE TYPE sexo_tipo AS ENUM ('masculino', 'femenino', 'otro');
CREATE TYPE tipo_tratamiento AS ENUM ('quimioterapia', 'inmunoterapia', 'hormonoterapia', 'terapia_biologica', 'otro');
CREATE TYPE estado_programacion AS ENUM ('programado', 'confirmado', 'pendiente_documentacion', 'pendiente_autorizacion', 'listo_entrega', 'entregado', 'reprogramado', 'cancelado');
CREATE TYPE estado_entrega AS ENUM ('pendiente', 'en_proceso', 'entregado', 'no_entregado', 'rechazado');
CREATE TYPE tipo_documento AS ENUM ('formula_medica', 'autorizacion', 'consentimiento', 'historia_clinica', 'documento_identidad', 'acta_entrega', 'soporte_facturacion', 'otro');
CREATE TYPE estado_documento AS ENUM ('completo', 'pendiente', 'vencido', 'en_revision', 'rechazado');
CREATE TYPE estado_factura AS ENUM ('borrador', 'validada', 'enviada', 'pagada', 'rechazada');

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE, -- referencia a auth.users de Supabase
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'auxiliar',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: pacientes
-- ============================================================
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_documento VARCHAR(30) NOT NULL,
    numero_documento VARCHAR(20) UNIQUE NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    fecha_nacimiento DATE,
    sexo sexo_tipo,
    telefono VARCHAR(20),
    correo VARCHAR(150),
    direccion TEXT,
    eps VARCHAR(150),
    diagnostico TEXT,
    codigo_diagnostico VARCHAR(20), -- CIE-10
    medico_tratante VARCHAR(200),
    tipo_tratamiento tipo_tratamiento,
    estado estado_paciente NOT NULL DEFAULT 'activo',
    observaciones TEXT,
    creado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: medicamentos
-- ============================================================
CREATE TABLE medicamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre_comercial VARCHAR(200) NOT NULL,
    nombre_generico VARCHAR(200) NOT NULL,
    concentracion VARCHAR(100),
    presentacion VARCHAR(100),
    laboratorio VARCHAR(150),
    valor_unitario DECIMAL(15, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    lote VARCHAR(100),
    fecha_vencimiento DATE,
    tipo_medicamento VARCHAR(100),
    requiere_refrigeracion BOOLEAN DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: programaciones
-- ============================================================
CREATE TABLE programaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    medicamento_id UUID NOT NULL REFERENCES medicamentos(id),
    responsable_id UUID REFERENCES usuarios(id),
    fecha_programada TIMESTAMPTZ NOT NULL,
    hora_estimada TIME,
    estado estado_programacion NOT NULL DEFAULT 'programado',
    dosis VARCHAR(100),
    via_administracion VARCHAR(100),
    observaciones TEXT,
    motivo_reprogramacion TEXT,
    reprogramacion_de UUID REFERENCES programaciones(id), -- si es reprogramación
    creado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: entregas
-- ============================================================
CREATE TABLE entregas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programacion_id UUID NOT NULL REFERENCES programaciones(id),
    responsable_id UUID REFERENCES usuarios(id),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    medicamento_id UUID NOT NULL REFERENCES medicamentos(id),
    fecha_entrega TIMESTAMPTZ,
    cantidad INTEGER NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(15, 2),
    valor_total DECIMAL(15, 2),
    estado estado_entrega NOT NULL DEFAULT 'pendiente',
    firma_digital_url TEXT,
    observaciones TEXT,
    motivo_no_entrega TEXT,
    es_facturable BOOLEAN DEFAULT TRUE,
    creado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: documentos
-- ============================================================
CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    entrega_id UUID REFERENCES entregas(id), -- documento asociado a entrega específica
    tipo tipo_documento NOT NULL,
    nombre_archivo VARCHAR(255),
    archivo_url TEXT, -- URL en Google Drive
    drive_file_id VARCHAR(255), -- ID del archivo en Google Drive
    fecha_emision DATE,
    fecha_vencimiento DATE,
    estado estado_documento NOT NULL DEFAULT 'pendiente',
    observaciones TEXT,
    validado_por UUID REFERENCES usuarios(id),
    fecha_validacion TIMESTAMPTZ,
    motivo_rechazo TEXT,
    creado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: facturacion
-- ============================================================
CREATE TABLE facturacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_factura VARCHAR(50) UNIQUE,
    mes_facturacion VARCHAR(7) NOT NULL, -- formato: YYYY-MM
    eps VARCHAR(150) NOT NULL,
    valor_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    estado estado_factura NOT NULL DEFAULT 'borrador',
    fecha_generacion DATE,
    fecha_envio DATE,
    fecha_pago DATE,
    archivo_url TEXT, -- URL Excel/PDF en Google Drive
    drive_file_id VARCHAR(255),
    observaciones TEXT,
    creado_por UUID REFERENCES usuarios(id),
    validado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: facturacion_detalle
-- ============================================================
CREATE TABLE facturacion_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factura_id UUID NOT NULL REFERENCES facturacion(id) ON DELETE CASCADE,
    entrega_id UUID NOT NULL REFERENCES entregas(id),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    medicamento_id UUID NOT NULL REFERENCES medicamentos(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(15, 2) NOT NULL,
    valor_total DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: alertas
-- ============================================================
CREATE TABLE alertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(50) NOT NULL, -- 'documento_vencido', 'stock_bajo', 'entrega_pendiente', etc.
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    entidad_tipo VARCHAR(50), -- 'paciente', 'medicamento', 'programacion'
    entidad_id UUID,
    leida BOOLEAN DEFAULT FALSE,
    usuario_id UUID REFERENCES usuarios(id), -- a quién va dirigida (NULL = todos)
    prioridad VARCHAR(20) DEFAULT 'media', -- 'alta', 'media', 'baja'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: auditoria
-- ============================================================
CREATE TABLE auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    accion VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
    tabla_afectada VARCHAR(100),
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================================
CREATE INDEX idx_pacientes_documento ON pacientes(numero_documento);
CREATE INDEX idx_pacientes_eps ON pacientes(eps);
CREATE INDEX idx_pacientes_estado ON pacientes(estado);
CREATE INDEX idx_programaciones_fecha ON programaciones(fecha_programada);
CREATE INDEX idx_programaciones_paciente ON programaciones(paciente_id);
CREATE INDEX idx_programaciones_estado ON programaciones(estado);
CREATE INDEX idx_entregas_fecha ON entregas(fecha_entrega);
CREATE INDEX idx_entregas_estado ON entregas(estado);
CREATE INDEX idx_documentos_vencimiento ON documentos(fecha_vencimiento);
CREATE INDEX idx_documentos_estado ON documentos(estado);
CREATE INDEX idx_facturacion_mes ON facturacion(mes_facturacion);
CREATE INDEX idx_facturacion_eps ON facturacion(eps);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(created_at);
CREATE INDEX idx_alertas_usuario ON alertas(usuario_id);
CREATE INDEX idx_alertas_leida ON alertas(leida);

-- ============================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_pacientes_updated_at BEFORE UPDATE ON pacientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_medicamentos_updated_at BEFORE UPDATE ON medicamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_programaciones_updated_at BEFORE UPDATE ON programaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_entregas_updated_at BEFORE UPDATE ON entregas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_documentos_updated_at BEFORE UPDATE ON documentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_facturacion_updated_at BEFORE UPDATE ON facturacion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista: Entregas del día con información completa
CREATE VIEW v_entregas_hoy AS
SELECT
    p.id as programacion_id,
    p.fecha_programada,
    p.estado as estado_programacion,
    pac.nombre_completo as paciente_nombre,
    pac.eps as paciente_eps,
    m.nombre_comercial as medicamento,
    m.concentracion,
    u.nombre as responsable,
    e.estado as estado_entrega
FROM programaciones p
JOIN pacientes pac ON p.paciente_id = pac.id
JOIN medicamentos m ON p.medicamento_id = m.id
LEFT JOIN usuarios u ON p.responsable_id = u.id
LEFT JOIN entregas e ON e.programacion_id = p.id
WHERE DATE(p.fecha_programada) = CURRENT_DATE;

-- Vista: KPIs del dashboard
CREATE VIEW v_dashboard_kpis AS
SELECT
    (SELECT COUNT(*) FROM programaciones WHERE DATE(fecha_programada) = CURRENT_DATE) as programados_hoy,
    (SELECT COUNT(*) FROM entregas WHERE DATE(fecha_entrega) = CURRENT_DATE AND estado = 'entregado') as entregas_hoy,
    (SELECT COUNT(*) FROM programaciones WHERE fecha_programada < NOW() AND estado NOT IN ('entregado', 'cancelado')) as entregas_vencidas,
    (SELECT COUNT(*) FROM programaciones WHERE DATE(fecha_programada) = CURRENT_DATE AND estado IN ('programado', 'confirmado', 'listo_entrega')) as entregas_pendientes,
    (SELECT COUNT(*) FROM documentos WHERE estado = 'vencido') as documentos_vencidos,
    (SELECT COUNT(*) FROM documentos WHERE fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND estado != 'vencido') as documentos_proximos_vencer,
    (SELECT COUNT(*) FROM medicamentos WHERE stock <= stock_minimo AND activo = TRUE) as medicamentos_stock_bajo;
