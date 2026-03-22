-- ═══════════════════════════════════════════════════════════════════════════
-- 20260322_add_cover_columns_to_public_reports.sql
-- (Remplace la version précédente)
-- 1. Correctifs d'alignement pour api/public-report-pdf.js
-- 2. Ajout des colonnes Cover pour la persistance globale
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.public_reports
    -- Colonnes attendues par le runtime `api/public-report-pdf.js` mais manquantes dans l'ancienne migration
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS site_name TEXT,
    ADD COLUMN IF NOT EXISTS input_payload JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS latest_pdf_path TEXT,
    ADD COLUMN IF NOT EXISTS latest_pdf_generated_at TIMESTAMPTZ,

    -- Colonnes canoniques Cover (historiquement écrites par api/public-report-cover.js)
    ADD COLUMN IF NOT EXISTS cover_image_status TEXT DEFAULT 'initial',
    ADD COLUMN IF NOT EXISTS cover_image_source TEXT,
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
    ADD COLUMN IF NOT EXISTS cover_lat NUMERIC,
    ADD COLUMN IF NOT EXISTS cover_lon NUMERIC,
    ADD COLUMN IF NOT EXISTS cover_bbox JSONB,
    ADD COLUMN IF NOT EXISTS cover_parcel_ref TEXT,
    ADD COLUMN IF NOT EXISTS cover_photo_provider TEXT,
    ADD COLUMN IF NOT EXISTS cover_generated_at TIMESTAMPTZ,
    
    -- Nouvelles colonnes pour l'upload manuel premium
    ADD COLUMN IF NOT EXISTS cover_original_filename TEXT,
    ADD COLUMN IF NOT EXISTS cover_mime_type TEXT,
    ADD COLUMN IF NOT EXISTS cover_file_size INTEGER,
    ADD COLUMN IF NOT EXISTS cover_is_manual BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.public_reports.cover_image_url IS 'Chemin Storage (ex: covers/manual/...) ; NE PAS utiliser de signed URL persistant';
COMMENT ON COLUMN public.public_reports.latest_pdf_path IS 'Chemin Storage du PDF généré par Puppeteer';
