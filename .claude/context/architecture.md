# Architecture Front - DiagTertiaire V3

## Surfaces runtime

- `index.html` : site public + diagnostic gratuit
- `index.saaspro.html` : espace pro canonique
- `diagtertiaire-pro-alpha.html` : simple redirection vers `index.saaspro.html`

## Regles structurantes

- le frontend reste buildless : HTML + CSS + JS, CDN React/Babel/Tailwind
- les dependances npm servent uniquement au runtime serveur `/api/*`
- ne pas toucher `index.html` sauf besoin reel sur le site public ou la doc
- ne pas casser le mode shared report `#report=`

## Espace pro

- auth minimale Supabase
- workspace persiste dans Supabase
- source de verite : tables Supabase, pas `localStorage`
- `localStorage` legacy uniquement pour migrations douces et etats transitoires
- branding persiste via `organization_settings` et `organization_branding`
- logo d'organisation stocke dans le bucket prive `organization-assets`

## PDF

- `PDF officiel` : genere cote serveur via `/api/pro-report-pdf`
- rendu PDF local sur le backend, sans service externe
- stockage final dans `organization-assets`
- catalogue `organization_files`
- suivi metier dans `pro_reports`
- `Export rapide local` conserve cote navigateur via `window.print()`

## Shared report

- acces via `#report=`
- lecture sans auth
- distinct du workspace pro authentifie
- distinct du PDF officiel sauvegarde
