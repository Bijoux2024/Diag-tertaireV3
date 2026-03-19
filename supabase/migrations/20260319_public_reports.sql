-- ═══════════════════════════════════════════════════════════════════════════
-- 20260319_public_reports.sql
-- Table canonique public_reports + bucket public-report-assets
-- ═══════════════════════════════════════════════════════════════════════════
--
-- RÔLE :
--   Table de référence pour les rapports publics issus du diagnostic gratuit.
--   Remplace l'ancienne table public_report_pdfs (conservée, non supprimée).
--   Chaque ligne correspond à un lead_submission unique.
--
-- CYCLE DE VIE pdf_status :
--   pending → generating → ready
--                        → failed
--
-- BUCKET :
--   public-report-assets  (privé, accès via signed URL 30 jours)
--   Chemin : reports/{year}/{month}/{public_report_id}/official.pdf
--
-- TABLES TOUCHÉES :
--   public.public_reports        — créée ici
--   storage.buckets              — bucket public-report-assets créé si absent
--   storage.objects              — policies RLS pour le bucket
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Table public_reports ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.public_reports (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_submission_id      UUID        REFERENCES public.lead_submissions(id) ON DELETE SET NULL,

    -- Payload source (report_payload JSON envoyé depuis index.html)
    report_payload          JSONB       NOT NULL DEFAULT '{}',

    -- Statut de génération PDF
    pdf_status              TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (pdf_status IN ('pending', 'generating', 'ready', 'failed')),
    pdf_error               TEXT,

    -- Résultat PDF (rempli quand pdf_status = 'ready')
    latest_pdf_storage_path TEXT,
    latest_pdf_bucket       TEXT,
    latest_pdf_url          TEXT,       -- signed URL (expire)
    latest_pdf_expires_at   TIMESTAMPTZ,

    -- Accès sécurisé (optionnel, pour partage futur)
    access_token_hash       TEXT,
    access_expires_at       TIMESTAMPTZ,

    -- Horodatage
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour lookup par lead_submission_id
CREATE INDEX IF NOT EXISTS public_reports_lead_submission_id_idx
    ON public.public_reports (lead_submission_id);

-- Index pour requêtes par statut (monitoring, retry jobs)
CREATE INDEX IF NOT EXISTS public_reports_pdf_status_idx
    ON public.public_reports (pdf_status);

-- updated_at auto-refresh
CREATE OR REPLACE FUNCTION public.set_public_reports_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_public_reports_updated_at ON public.public_reports;
CREATE TRIGGER trg_public_reports_updated_at
    BEFORE UPDATE ON public.public_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_public_reports_updated_at();

-- ─── 2. RLS ──────────────────────────────────────────────────────────────
--
-- Accès uniquement via service key (route serveur).
-- Aucun accès anon direct : pas de politique SELECT/INSERT pour anon.

ALTER TABLE public.public_reports ENABLE ROW LEVEL SECURITY;

-- Service role bypasse RLS par défaut — aucune policy supplémentaire requise.
-- Si besoin d'un accès anon par access_token_hash à l'avenir, ajouter ici.

-- ─── 3. Bucket public-report-assets ──────────────────────────────────────
--
-- Bucket PRIVÉ : les objets ne sont pas accessibles sans signed URL.
-- La génération des signed URL se fait exclusivement côté serveur
-- (api/public-report-pdf.js) via service key.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'public-report-assets',
    'public-report-assets',
    false,                          -- bucket privé
    10485760,                       -- 10 MB max par fichier
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public              = EXCLUDED.public,
    file_size_limit     = EXCLUDED.file_size_limit,
    allowed_mime_types  = EXCLUDED.allowed_mime_types;

-- ─── 4. Storage RLS — service role only ──────────────────────────────────
--
-- Aucune policy anon : seule la service key peut lire/écrire.
-- Les policies ci-dessous sont optionnelles car le service role bypasse RLS,
-- mais elles documentent l'intention et protègent contre une mauvaise config.

-- Supprime les policies existantes si elles existent déjà
DROP POLICY IF EXISTS "public_report_assets_service_insert" ON storage.objects;
DROP POLICY IF EXISTS "public_report_assets_service_select" ON storage.objects;
DROP POLICY IF EXISTS "public_report_assets_service_update" ON storage.objects;
DROP POLICY IF EXISTS "public_report_assets_service_delete" ON storage.objects;

-- Service role : accès complet
CREATE POLICY "public_report_assets_service_insert"
    ON storage.objects FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'public-report-assets');

CREATE POLICY "public_report_assets_service_select"
    ON storage.objects FOR SELECT
    TO service_role
    USING (bucket_id = 'public-report-assets');

CREATE POLICY "public_report_assets_service_update"
    ON storage.objects FOR UPDATE
    TO service_role
    USING (bucket_id = 'public-report-assets');

CREATE POLICY "public_report_assets_service_delete"
    ON storage.objects FOR DELETE
    TO service_role
    USING (bucket_id = 'public-report-assets');

-- ─── 5. Commentaires ─────────────────────────────────────────────────────

COMMENT ON TABLE public.public_reports IS
    'Rapports publics issus du diagnostic gratuit. Un rapport par lead_submission. '
    'Le PDF est stocké dans le bucket public-report-assets (privé). '
    'Accès via signed URL générée côté serveur (api/public-report-pdf.js).';

COMMENT ON COLUMN public.public_reports.pdf_status IS
    'pending = en attente | generating = Puppeteer en cours | ready = PDF disponible | failed = erreur';

COMMENT ON COLUMN public.public_reports.latest_pdf_url IS
    'Signed URL Supabase Storage (TTL 30 jours). Régénérer si expirée.';

COMMENT ON COLUMN public.public_reports.access_token_hash IS
    'Hash SHA-256 d''un token de partage sécurisé (usage futur).';
