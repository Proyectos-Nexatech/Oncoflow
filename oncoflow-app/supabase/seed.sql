-- ============================================================
-- ONCOFLOW — Datos Semilla (Seed) para desarrollo
-- ============================================================

-- Datos de ejemplo para medicamentos
INSERT INTO medicamentos (codigo, nombre_comercial, nombre_generico, concentracion, presentacion, laboratorio, valor_unitario, stock, stock_minimo, lote, fecha_vencimiento, tipo_medicamento) VALUES
('TRAS-440', 'Herceptin', 'Trastuzumab', '440mg', 'Vial polvo liofilizado', 'Roche', 2850000.00, 15, 5, 'LOT-2024-001', '2026-12-31', 'Anticuerpo monoclonal'),
('BEVA-400', 'Avastin', 'Bevacizumab', '400mg/16ml', 'Vial solución', 'Roche', 3200000.00, 8, 3, 'LOT-2024-002', '2026-10-15', 'Anticuerpo monoclonal'),
('RITUX-500', 'Mabthera', 'Rituximab', '500mg/50ml', 'Vial solución', 'Roche', 4100000.00, 10, 4, 'LOT-2024-003', '2026-11-30', 'Anticuerpo monoclonal'),
('CETU-100', 'Erbitux', 'Cetuximab', '100mg/20ml', 'Vial solución', 'Merck', 1850000.00, 12, 5, 'LOT-2024-004', '2026-09-20', 'Anticuerpo monoclonal'),
('PEME-500', 'Alimta', 'Pemetrexed', '500mg', 'Vial polvo liofilizado', 'Eli Lilly', 1650000.00, 20, 8, 'LOT-2024-005', '2027-01-31', 'Antimetabolito');
