# DiagTertiaire V3

Projet buildless avec deux surfaces runtime :
- `index.html` : site public et diagnostic grand public
- `index.saaspro.html` : espace pro, route canonique

`diagtertiaire-pro-alpha.html` est un alias legacy qui redirige vers `index.saaspro.html`.

## Architecture actuelle

- Public : front statique buildless
- Espace pro : front statique buildless avec auth Supabase par magic link
- Auth minimale : `auth.users` + `public.organizations` + `public.profiles` avec modele `1 user = 1 organization`
- Persistance workspace : `organization_settings`, `organization_branding`, `pro_cases`, `pro_reports`, `user_workspace_state`
- Assets prives : `organization_files` + bucket Storage `organization-assets` cloisonne par `organization_id`
- Shared report : lecture via `#report=` sans auth, basee uniquement sur le hash URL

## Pre-requis Supabase

L'endpoint `/api/public-config` doit exposer :
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Variables serveur requises pour la génération du PDF officiel :
- `SUPABASE_SERVICE_KEY`
- `PDFSHIFT_API_KEY`

Configuration minimale Supabase :
- activer l'auth email / magic link
- activer Supabase Storage si ce n'est pas deja fait
- ajouter les redirect URLs de `index.saaspro.html` en local et en prod
- appliquer les migrations dans cet ordre :
1. `supabase/migrations/20260311_pro_auth_minimal.sql`
2. `supabase/migrations/20260311_workspace_persistence.sql`
3. `supabase/migrations/20260311_storage_assets.sql`
4. `supabase/migrations/20260311_report_pdf_persistence.sql`

Exemples de redirect URLs :
- `http://localhost:3000/index.saaspro.html`
- `https://<votre-domaine>/index.saaspro.html`

## Persistance workspace

Au chargement de l'espace pro :
- la session Supabase est verifiee
- le `profile` et l'`organization` sont assures
- le workspace recharge depuis Supabase les settings, le branding metadata, les dossiers, les rapports et le draft utilisateur

Migration douce :
- les anciennes cles workspace en `localStorage` sont lues une seule fois pour l'utilisateur connecte
- les donnees sont poussees dans Supabase
- le workspace bascule ensuite sur Supabase comme source de verite

Stockage fichiers :
- les binaires restent hors Postgres
- le logo d'organisation est stocke dans le bucket prive `organization-assets`
- les chemins `org/{organization_id}/reports/...` et `org/{organization_id}/assets/...` preparent les PDF et assets du workspace
- le PDF officiel d'un rapport sauvegarde est genere cote serveur via `/api/pro-report-pdf`, archive dans `organization-assets`, puis relie a `pro_reports`
- l'export PDF navigateur reste disponible comme fallback local si la generation serveur echoue

## PDF officiel

- le front appelle `/api/pro-report-pdf` avec le bearer token de la session Supabase en cours
- la route serveur valide ce token via `GET /auth/v1/user`, resserre le `report_id` sur l'organisation du profil connecte, puis genere le PDF officiel
- l'acces au PDF sauvegarde se fait ensuite via une signed URL creee par le client Supabase navigateur authentifie; aucune cle serveur n'est exposee au front
- la regeneration reutilise le meme chemin Storage `org/{organization_id}/reports/{report_id}/rapport-officiel.pdf`
- il n'y a donc pas d'accumulation de fichiers pour le meme rapport a ce stade; l'objet Storage et l'entree `organization_files` sont ecrases logiquement a chemin constant

Tests manuels minimum :
1. Ouvrir un rapport pro deja sauvegarde puis lancer "Generer le PDF officiel".
2. Verifier `pro_reports.pdf_status = 'generating'` pendant le traitement puis `ready` apres succes.
3. Verifier la presence du PDF dans `organization-assets` sous `org/{organization_id}/reports/{report_id}/rapport-officiel.pdf`.
4. Verifier la ligne `organization_files` associee et `pro_reports.latest_pdf_file_id`.
5. Rafraichir la page puis ouvrir le PDF officiel via le bouton dedie.
6. Forcer un echec serveur (ex. variable PDFShift absente) et verifier `pdf_status = 'error'`, `pdf_error` renseigne et fallback local toujours disponible.
7. Verifier qu'un autre compte ne peut ni generer ni ouvrir le PDF d'une autre organisation.

## Smoke tests avant chantier E

1. Demander un magic link puis ouvrir le lien vers `index.saaspro.html`.
2. Verifier la creation du `profile` et de l'`organization` au premier login.
3. Creer un dossier depuis le wizard pro et verifier la creation du dossier et du rapport associe.
4. Rafraichir `index.saaspro.html` et verifier la rehydratation du workspace depuis Supabase.
5. Modifier un draft, la couleur et le nom de marque, puis rafraichir et verifier la persistance.
6. Connecter un second compte et verifier l'isolement complet des donnees.
7. Ouvrir `index.saaspro.html#report=...` sans session et verifier le mode shared report.

## Notes

- Il n'y a plus de login demo normal ni de mecanisme `proAuth` pour l'espace pro.
- La route documentaire et runtime a retenir pour l'espace pro est `index.saaspro.html`.
