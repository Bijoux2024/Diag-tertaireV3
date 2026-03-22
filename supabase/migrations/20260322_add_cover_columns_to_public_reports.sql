-- ═══════════════════════════════════════════════════════════════════════════
-- 20260322_add_cover_columns_to_public_reports.sql
-- Ajout des métadonnées de cover et de l'upload manuel premium.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.public_reports
    ADD COLUMN IF NOT EXISTS cover_image_status TEXT DEFAULT 'initial',
    ADD COLUMN IF NOT EXISTS cover_image_source TEXT,
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
    ADD COLUMN IF NOT EXISTS cover_lat NUMERIC,
    ADD COLUMN IF NOT EXISTS cover_lon NUMERIC,
    ADD COLUMN IF NOT EXISTS cover_bbox JSONB,
    ADD COLUMN IF NOT EXISTS cover_parcel_ref TEXT,
    ADD COLUMN IF NOT EXISTS cover_photo_provider TEXT,
    ADD COLUMN IF NOT EXISTS cover_generated_at TIMESTAMPTZ,
    
    -- Nouvelles colonnes pour l'upload manuel
    ADD COLUMN IF NOT EXISTS cover_original_filename TEXT,
    ADD COLUMN IF NOT EXISTS cover_mime_type TEXT,
    ADD COLUMN IF NOT EXISTS cover_file_size INTEGER,
    ADD COLUMN IF NOT EXISTS cover_is_manual BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.public_reports.cover_image_url IS 'Chemin Storage Supabase de l''image de couverture premium ou auto';
COMMENT ON COLUMN public.public_reports.cover_is_manual IS 'Indique si le visuel a été téléversé manuellement par l''utilisateur (premium)';
