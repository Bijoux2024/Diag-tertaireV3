# Architecture Front - DiagTertiaire V3

## Surfaces runtime

- `src/engine.js` : moteur de calcul public, source unique (ENGINE_VERSION 1.6.1, ~3 030 lignes). Tiers ACT13/ACT18 avec fourchette capex +/- 15 % (`capex_low/mid/high` + `capex_range` formate FR), garde volume CET > 2 000 L (sentinelle `needsStudy`), fallback reseau de chaleur dans les resolveurs ECS/chauffage.
- `src/solar-icons.js` : dictionnaire des 118 icones SVG Solar, partage entre index.html et saaspro
- `index.html` : landing public + diagnostic public (charge engine.js et solar-icons.js)
- `index.saaspro.html` : espace pro canonique (ENGINE_PRO inline, divergent de engine.js)
- `diagtertiaire-pro-alpha.html` : alias legacy vers `index.saaspro.html`

## Source de verite reelle

- auth pro : Supabase email + mot de passe, magic link secondaire
- modele cible : `1 user = 1 organization`
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
