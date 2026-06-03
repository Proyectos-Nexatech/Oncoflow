-- ============================================================
-- ONCOFLOW — Migración: Sistema de Checklist Documental
-- Fecha: 2026-06
-- ============================================================

-- ============================================================
-- TABLA: checklist_tipos_documento
-- Catálogo configurable de documentos requeridos para facturar
-- ============================================================
CREATE TABLE IF NOT EXISTS checklist_tipos_documento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    tipo tipo_documento NOT NULL,
    descripcion TEXT,
    obligatorio BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_checklist_tipos_updated_at
    BEFORE UPDATE ON checklist_tipos_documento
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: 4 tipos iniciales de documentos requeridos
INSERT INTO checklist_tipos_documento (nombre, tipo, descripcion, obligatorio, orden) VALUES
  ('Fórmula Médica',         'formula_medica',       'Fórmula médica vigente autorizada por el médico tratante', TRUE,  1),
  ('Autorización EPS',       'autorizacion',         'Autorización emitida por la EPS para la entrega del medicamento', TRUE,  2),
  ('Acta de Entrega Firmada','acta_entrega',          'Acta firmada por el paciente o responsable al momento de recibir el medicamento', TRUE,  3),
  ('Soporte de Facturación', 'soporte_facturacion',  'Documentación de soporte para el proceso de cobro a la EPS', TRUE,  4)
ON CONFLICT DO NOTHING;


-- ============================================================
-- TABLA: checklist_entrega
-- Estado de cada ítem del checklist por entrega
-- ============================================================
CREATE TABLE IF NOT EXISTS checklist_entrega (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrega_id UUID NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
    tipo_doc_id UUID NOT NULL REFERENCES checklist_tipos_documento(id),
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'verificado', 'no_aplica')),
    observaciones TEXT,
    verificado_por UUID REFERENCES usuarios(id),
    fecha_verificacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entrega_id, tipo_doc_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_entrega_entrega ON checklist_entrega(entrega_id);
CREATE INDEX IF NOT EXISTS idx_checklist_entrega_estado ON checklist_entrega(estado);

CREATE TRIGGER trg_checklist_entrega_updated_at
    BEFORE UPDATE ON checklist_entrega
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- FUNCIÓN Y TRIGGER: Auto-generar checklist al registrar entrega
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generar_checklist_entrega()
RETURNS TRIGGER AS $$
BEGIN
    -- Insertar un ítem por cada tipo de documento activo y obligatorio
    INSERT INTO checklist_entrega (entrega_id, tipo_doc_id, estado)
    SELECT NEW.id, t.id, 'pendiente'
    FROM checklist_tipos_documento t
    WHERE t.activo = TRUE
    ON CONFLICT (entrega_id, tipo_doc_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generar_checklist_al_crear_entrega
    AFTER INSERT ON entregas
    FOR EACH ROW
    EXECUTE FUNCTION fn_generar_checklist_entrega();


-- ============================================================
-- VISTA: v_estado_facturacion_entregas
-- Estado de facturación por entrega (en base al checklist)
-- ============================================================
DROP VIEW IF EXISTS v_estado_facturacion_entregas;
CREATE VIEW v_estado_facturacion_entregas AS
SELECT
    e.id                                                    AS entrega_id,
    e.paciente_id,
    e.medicamento_id,
    e.fecha_entrega,
    COALESCE(e.valor_total, e.cantidad * m.valor_unitario, m.valor_unitario, 0) AS valor_total,
    e.estado                                                AS estado_entrega,
    pac.nombre_completo                                     AS paciente,
    pac.numero_documento                                    AS paciente_documento,
    pac.eps,
    m.nombre_comercial                                      AS medicamento,
    COUNT(ce.id)                                            AS total_docs,
    COUNT(ce.id) FILTER (WHERE ce.estado = 'verificado')   AS docs_verificados,
    COUNT(ce.id) FILTER (WHERE ce.estado = 'pendiente')    AS docs_pendientes,
    COUNT(ce.id) FILTER (WHERE ce.estado = 'no_aplica')    AS docs_no_aplica,
    -- Listo para facturar: hay items en el checklist Y ninguno está pendiente
    CASE
        WHEN COUNT(ce.id) > 0
         AND COUNT(ce.id) FILTER (WHERE ce.estado = 'pendiente') = 0
        THEN TRUE
        ELSE FALSE
    END                                                     AS listo_para_facturar
FROM entregas e
JOIN pacientes pac ON e.paciente_id = pac.id
JOIN medicamentos m  ON e.medicamento_id = m.id
LEFT JOIN checklist_entrega ce ON ce.entrega_id = e.id
WHERE e.estado = 'entregado'
GROUP BY e.id, e.paciente_id, e.medicamento_id, e.fecha_entrega,
         e.valor_total, e.estado,
         pac.nombre_completo, pac.numero_documento, pac.eps,
         m.nombre_comercial, e.cantidad, m.valor_unitario;


-- ============================================================
-- VISTA: v_kpis_facturacion_mes
-- Resumen mensual de entregas disponibles vs pendientes
-- ============================================================
DROP VIEW IF EXISTS v_kpis_facturacion_mes;
CREATE VIEW v_kpis_facturacion_mes AS
SELECT
    TO_CHAR(DATE_TRUNC('month', fecha_entrega), 'YYYY-MM') AS mes,
    COUNT(*)                                                AS total_entregas,
    COUNT(*) FILTER (WHERE listo_para_facturar = TRUE)     AS disponible_facturar,
    COUNT(*) FILTER (WHERE listo_para_facturar = FALSE)    AS facturacion_pendiente,
    COALESCE(SUM(valor_total) FILTER (WHERE listo_para_facturar = TRUE), 0)  AS valor_disponible,
    COALESCE(SUM(valor_total) FILTER (WHERE listo_para_facturar = FALSE), 0) AS valor_pendiente
FROM v_estado_facturacion_entregas
GROUP BY DATE_TRUNC('month', fecha_entrega)
ORDER BY DATE_TRUNC('month', fecha_entrega) DESC;


-- ============================================================
-- VISTA: v_dashboard_kpis (actualizada)
-- ============================================================
DROP VIEW IF EXISTS v_dashboard_kpis;
CREATE VIEW v_dashboard_kpis AS
SELECT
    (SELECT COUNT(*) FROM programaciones
      WHERE DATE(fecha_programada) = CURRENT_DATE)
        AS programados_hoy,

    (SELECT COUNT(*) FROM entregas
      WHERE DATE(fecha_entrega) = CURRENT_DATE AND estado = 'entregado')
        AS entregas_realizadas,

    (SELECT COUNT(*) FROM programaciones
      WHERE DATE(fecha_programada) = CURRENT_DATE
        AND estado IN ('programado', 'confirmado', 'listo_entrega'))
        AS entregas_pendientes,

    (SELECT COUNT(*) FROM documentos WHERE estado = 'vencido')
        AS documentos_vencidos,

    -- Nuevos KPIs de facturación del mes actual
    (SELECT COUNT(*) FROM v_estado_facturacion_entregas
      WHERE listo_para_facturar = TRUE
        AND DATE_TRUNC('month', fecha_entrega) = DATE_TRUNC('month', CURRENT_DATE))
        AS disponible_facturar_mes,

    (SELECT COUNT(*) FROM v_estado_facturacion_entregas
      WHERE listo_para_facturar = FALSE
        AND DATE_TRUNC('month', fecha_entrega) = DATE_TRUNC('month', CURRENT_DATE))
        AS facturacion_pendiente_mes,

    (SELECT COUNT(*) FROM medicamentos WHERE stock <= stock_minimo AND activo = TRUE)
        AS medicamentos_stock_bajo;
