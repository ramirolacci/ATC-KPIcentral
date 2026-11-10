-- ==============================================================================
-- SCHEMA SUPABASE: KPI CENTRAL MI GUSTO
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase
-- ==============================================================================

-- 1. Tabla de Períodos y Cierres (PEYA, Rappi, Mercado Delivery)
CREATE TABLE IF NOT EXISTS public.kpi_periods (
  id TEXT PRIMARY KEY,                       -- Ej: "cierre octubre", "5 al 12 de octubre"
  records JSONB NOT NULL DEFAULT '[]'::jsonb,-- Listado de sucursales con todas sus métricas
  is_cierre BOOLEAN DEFAULT false,           -- Indica si es cierre mensual o semanal
  created_by TEXT,                           -- Email de la administradora (ej: alexandraramirez@migusto.com.ar)
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS (Seguridad a Nivel de Fila)
ALTER TABLE public.kpi_periods ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para kpi_periods
CREATE POLICY "Lectura publica de periodos"
  ON public.kpi_periods FOR SELECT
  USING (true);

CREATE POLICY "Modificacion de periodos"
  ON public.kpi_periods FOR ALL
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------

-- 2. Tabla de Configuraciones Globales (Semáforos y Asignación de Tiendas)
CREATE TABLE IF NOT EXISTS public.kpi_settings (
  key TEXT PRIMARY KEY,                      -- 'thresholds' | 'stores'
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.kpi_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para kpi_settings
CREATE POLICY "Lectura publica de settings"
  ON public.kpi_settings FOR SELECT
  USING (true);

CREATE POLICY "Modificacion de settings"
  ON public.kpi_settings FOR ALL
  USING (true)
  WITH CHECK (true);

