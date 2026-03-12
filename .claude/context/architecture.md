# Architecture Front - DiagTertiaire V3

## Surfaces runtime

- `index.html` : landing public + diagnostic public
- `index.saaspro.html` : espace pro canonique
- `diagtertiaire-pro-alpha.html` : alias legacy vers `index.saaspro.html`

## Source de verite reelle

- auth pro : Supabase magic link minimal
- workspace pro : Supabase (`organizations`, `profiles`, `organization_settings`, `organization_branding`, `pro_cases`, `pro_reports`, `user_workspace_state`)
- storage prive : bucket `organization-assets` + catalogue `organization_files`
- `localStorage` : migration douce / fallback legacy seulement, pas modele cible
- ne plus raisonner avec `proAuth` comme source de verite

## PDF

- `PDF officiel` : `/api/pro-report-pdf`
- rendu serveur local via Chromium / Vercel + Supabase Storage
- plus de PDFShift
- fallback navigateur conserve sous forme `Export local (secours)` via `window.print()`

## Suppression securisee

- flux canonique : `/api/pro-delete-case`
- coherence metier portee par `public.soft_delete_case_bundle(...)`
- `pro_cases.status` reste la qualification metier existante
- la suppression douce des dossiers passe donc par `pro_cases.lifecycle_status` + `deleted_at`
- `pro_reports` et `organization_files` utilisent `status` + `deleted_at`
- suppression metier immediate, purge Storage ensuite, `pending_cleanup` si la purge serveur echoue

## Shared report

- acces via `#report=`
- lecture sans auth
- hors workspace pro authentifie
- ne pas casser ce mode lors des lots auth / storage / suppression

## A ne plus rouvrir par defaut

- fusion `pro.html -> index.saaspro.html`
- retour a PDFShift
- suppression critique pilotee uniquement par le front
