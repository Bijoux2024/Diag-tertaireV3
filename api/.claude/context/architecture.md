# Architecture API - DiagTertiaire V3

## Endpoints actifs

- `api/public-config.js`
  - expose uniquement `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY`
  - ne doit jamais exposer de cle serveur

- `api/pdf.js`
  - endpoint generique HTML -> PDF
  - utilise le moteur local partage `api/_lib/pdf-renderer.js`
  - ne depend d'aucun service PDF externe

- `api/pro-report-pdf.js`
  - flux officiel du PDF pro
  - recoit un `report_id`
  - valide l'utilisateur via le bearer token Supabase
  - verifie que le rapport appartient a l'organisation connectee
  - lit branding, logo Storage et donnees rapport
  - genere un PDF localement
  - stocke le PDF dans `organization-assets`
  - met a jour `organization_files` puis `pro_reports`

## Moteur PDF serveur

- helper partage : `api/_lib/pdf-renderer.js`
- rendu local via `puppeteer-core` + `@sparticuz/chromium`
- compatible Vercel, sans SaaS externe
- protections attendues :
  - HTML vide refuse
  - payload trop lourd refuse
  - timeout gere
  - buffer PDF retourne cote serveur

## Variables d'environnement runtime

Requises :
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_KEY`

Optionnelle hors Vercel :
- `PUPPETEER_EXECUTABLE_PATH`

## Stockage et securite

- bucket prive : `organization-assets`
- conventions de chemin :
  - `org/{organization_id}/branding/logo/{filename}`
  - `org/{organization_id}/reports/{report_id}/{filename}`
  - `org/{organization_id}/assets/{subpath}`
- aucune cle serveur ne doit sortir du backend
- aucune route PDF ne doit dependre d'un fournisseur externe
