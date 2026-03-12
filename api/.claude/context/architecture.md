# Architecture API - DiagTertiaire V3

## Routes actives

- `api/public-config.js` : expose seulement `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY`
- `api/pdf.js` : endpoint generique HTML -> PDF, rendu local uniquement
- `api/pro-report-pdf.js` : PDF officiel pro, bearer token Supabase obligatoire
- `api/pro-delete-case.js` : suppression securisee dossier / rapports / PDF officiel

## Runtime

- serveur Vercel / Node
- rendu PDF local via `puppeteer-core` + `@sparticuz/chromium`
- plus aucun fournisseur PDF externe

## Contrats data a retenir

- `organization_files` est le catalogue du Storage prive
- les PDF de rapport sont identifies via :
  - `kind = report_pdf`
  - `pro_reports.latest_pdf_file_id`
  - `metadata.report_id` / `metadata.case_id`
  - prefixe `org/{organization_id}/reports/{report_id}/...`
- `public.soft_delete_case_bundle(target_case_id uuid, actor_user_id uuid)` est l'entree SQL canonique pour la suppression metier
- la service key reste strictement cote serveur pour RPC et purge Storage

## Modele de statuts

- `pro_cases.status` = qualification metier existante
- `pro_cases.lifecycle_status` = `active` / `deleted`
- `pro_reports.status` = `active` / `deleted`
- `organization_files.status` = `active` / `pending_cleanup` / `deleted`
- `deleted_at` porte la date de retrait du perimetre actif

## Garde-fous

- ne jamais exposer la service key au front
- ne pas reintroduire PDFShift
- ne pas retomber sur une suppression critique pilotee seulement par le front
- ne pas casser `#report=` qui reste hors auth et hors API pro
