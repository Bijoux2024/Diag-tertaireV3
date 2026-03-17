-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : 20260316_public_report_pdfs
-- Objectif  : Table de suivi des PDFs publics générés via /api/save-public-report
--             et colonnes pdf_url / pdf_expires_at sur lead_submissions.
-- ─────────────────────────────────────────────────────────────────────────────

-- Table de suivi des PDFs publics générés
CREATE TABLE IF NOT EXISTS public.public_report_pdfs (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id            text        NOT NULL,               -- ID côté front (DIAG-timestamp)
  lead_submission_id   uuid,                               -- FK vers lead_submissions si disponible
  storage_path         text        NOT NULL,               -- chemin dans le bucket public-reports
  signed_url           text,                               -- URL signée (valide 15 jours)
  signed_url_expires_at timestamptz,                       -- date d'expiration de l'URL signée
  email                text,                               -- email de l'utilisateur
  activity             text,
  surface              numeric,
  score_letter         text,
  site_name            text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  pdf_size_bytes       integer
);

-- RLS
ALTER TABLE public.public_report_pdfs ENABLE ROW LEVEL SECURITY;

-- Lecture publique (accès sans auth pour vérifier l'expiration côté front si besoin)
CREATE POLICY "Lecture publique" ON public.public_report_pdfs
  FOR SELECT USING (true);

-- L'insertion se fait uniquement via la service_key côté serveur
CREATE POLICY "Insertion service uniquement" ON public.public_report_pdfs
  FOR INSERT WITH CHECK (false);

-- Colonnes pdf_url / pdf_expires_at sur lead_submissions
ALTER TABLE lead_submissions ADD COLUMN IF NOT EXISTS pdf_url         text;
ALTER TABLE lead_submissions ADD COLUMN IF NOT EXISTS pdf_expires_at  timestamptz;

-- ─────────────────────────────────────────────────────────────────────────────
-- Instructions Supabase Dashboard (à faire manuellement après la migration) :
--   1. Storage → New bucket
--   2. Nom : public-reports
--   3. Public : OUI (cocher "Public bucket")
--   4. File size limit : 10 MB
--   5. Allowed MIME types : application/pdf
-- ─────────────────────────────────────────────────────────────────────────────
