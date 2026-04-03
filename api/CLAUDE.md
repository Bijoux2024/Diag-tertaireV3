# CLAUDE.md - API DiagTertiaire V3

## Mission

Stabiliser les routes `/api/*` qui soutiennent la pre-production de l'espace pro, sans refonte large.

## Regles absolues

- `espace-professionnel.html` est la route pro canonique
- auth reelle = Supabase email + mot de passe, magic link secondaire, pas `proAuth`
- workspace pro = tables Supabase, pas `localStorage`
- storage prive = bucket `organization-assets` + `organization_files`
- PDF officiel = Chromium local / Vercel + Supabase, pas PDFShift
- fallback PDF local navigateur conserve comme secours temporaire
- suppression critique dossier / rapport / PDF = SQL transactionnel + route serveur, jamais front seul
- ne pas casser `#report=`
- aucune cle serveur ne sort du backend
- variable serveur canonique = `SUPABASE_SERVICE_KEY` (`SUPABASE_SECRET_KEY` toleree seulement en fallback transitoire)

## Endpoints a connaitre

- `api/public-config.js`
- `api/public-report-pdf.js`
- `api/public-report-view.js`
- `api/pro-report-pdf.js`
- `api/pro-delete-case.js`

## Schema utile

- `organizations`, `profiles`
- `organization_settings`, `organization_branding`
- `pro_cases`
  - `status` = qualification metier existante
  - `lifecycle_status` = suppression douce
- `pro_reports`
  - `status` = `active` / `deleted`
- `organization_files`
  - `status` = `active` / `pending_cleanup` / `deleted`

## Migrations minimales a lire avant modif

- `20260311_pro_auth_minimal.sql`
- `20260311_workspace_persistence.sql`
- `20260311_storage_assets.sql`
- `20260311_report_pdf_persistence.sql`
- `20260312_case_secure_deletion.sql`

## Methode

1. Lire le code reel avant toute modif
2. Modifier seulement le runtime necessaire
3. Privilegier les garanties portees par la base et le serveur
4. Verifier la preview Vercel + vrai Supabase avant de conclure
