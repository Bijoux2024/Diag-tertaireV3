# DiagTertiaire V3

Projet buildless avec deux surfaces runtime :
- `index.html` : site public et diagnostic grand public
- `index.saaspro.html` : espace pro, route canonique

`diagtertiaire-pro-alpha.html` est un alias legacy qui redirige vers `index.saaspro.html`.

## Architecture actuelle

- Public : front statique buildless
- Espace pro : front statique buildless avec auth Supabase email + mot de passe, magic link en option secondaire
- Persistance workspace : `organization_settings`, `organization_branding`, `pro_cases`, `pro_reports`, `user_workspace_state`
- Assets prives : `organization_files` + bucket Storage `organization-assets` cloisonne par `organization_id`
- Shared report : lecture via `#report=` sans auth, basee uniquement sur le hash URL
- PDF officiel : generation serveur locale via Chromium headless sur Vercel, puis archivage dans Supabase Storage

## Pre-requis Supabase

L'endpoint `/api/public-config` doit exposer :
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Variables serveur requises :
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_KEY`

Fallback transitoire accepte cote serveur :
- `SUPABASE_SECRET_KEY` (tant que `SUPABASE_SERVICE_KEY` n'est pas encore renseignee partout)

Variable optionnelle pour executer les routes PDF localement hors Vercel :
- `PUPPETEER_EXECUTABLE_PATH`

Configuration minimale Supabase :
- activer l'auth email + mot de passe, avec magic link conserve
- activer Supabase Storage si ce n'est pas deja fait
- verifier l'existence du bucket prive `organization-assets`
- ajouter les redirect URLs de `index.saaspro.html` en local et en prod
- appliquer les migrations dans cet ordre :
1. `supabase/migrations/20260311_pro_auth_minimal.sql`
2. `supabase/migrations/20260311_workspace_persistence.sql`
3. `supabase/migrations/20260311_storage_assets.sql`
4. `supabase/migrations/20260311_report_pdf_persistence.sql`
5. `supabase/migrations/20260312_case_secure_deletion.sql`
6. `supabase/migrations/20260316_public_report_pdfs.sql`

## Bucket public-reports (rapport public PDF)

A creer manuellement dans Supabase Dashboard -> Storage :
1. Cliquer "New bucket"
2. Nom : `public-reports`
3. Cocher "Public bucket" : OUI
4. File size limit : 10 MB
5. Allowed MIME types : `application/pdf`

### Route canonique PDF public

`/api/public-report-pdf` — pipeline Puppeteer :
- Front (`index.html`) POST `{ lead_submission_id, report_payload }`
- Serveur genere un token temporaire, INSERT `public_reports` (status=generating)
- Construit l'URL de la page print `public-report-print.html?token=...`
- Puppeteer ouvre la page, attend `window.__REPORT_READY__`
- Export PDF A4 -> upload bucket `public-reports` (PUBLIC)
- URL signee 30 jours -> UPDATE `public_reports` (status=ready)
- UPDATE `lead_submissions.pdf_url` (best-effort)
- Email Resend (fire-and-forget)
- Retourne `{ ok, public_report_id, report_url, pdf_url }`

Variables serveur requises :
- `RESEND_API_KEY`
- `RESEND_FROM`

### Route deprecee

`/api/save-public-report` retourne desormais 410 Gone. Elle n'est plus appelee par le front.
Ne pas la supprimer tant qu'elle peut recevoir des appels externes residuels.

Exemples de redirect URLs :
- `http://localhost:3000/index.saaspro.html`
- `https://<votre-domaine>/index.saaspro.html`

## PDF officiel

- Runtime Vercel PDF : `puppeteer-core` et `@sparticuz/chromium` doivent rester en `dependencies` npm, pas en `devDependencies`.
- Variable serveur canonique pour les routes Supabase privees : `SUPABASE_SERVICE_KEY` (`SUPABASE_SECRET_KEY` reste un fallback transitoire cote serveur).
- le front pro appelle `/api/pro-report-pdf` avec le bearer token de la session Supabase
- la route serveur valide ce token via `GET /auth/v1/user`
- le `report_id` est resserre cote serveur sur l'organisation du profil connecte
- le branding persiste (`brand_name`, `accent`, `logo_storage_path`) est injecte dans le HTML du PDF
- le rendu HTML -> PDF se fait localement via Chromium headless (`puppeteer-core` + `@sparticuz/chromium`)
- le PDF est stocke dans `organization-assets` sous `org/{organization_id}/reports/{report_id}/rapport-officiel.pdf`
- `organization_files` est mis a jour par `storage_path`
- `pro_reports` suit `latest_pdf_file_id`, `latest_pdf_generated_at`, `pdf_status`, `pdf_error`

Strategie produit :
- `PDF officiel` : version serveur persistante, archivee dans Supabase Storage
- `Export local (secours)` : fallback navigateur conserve via `window.print()`

Suppression securisee :
- le front pro appelle `/api/pro-delete-case` pour supprimer un dossier
- la coherence metier est portee par `public.soft_delete_case_bundle(...)`
- les fichiers Storage passent par `organization_files.status = 'pending_cleanup'` si la purge serveur ne va pas au bout

Strategie de regeneration :
- la regeneration reutilise le meme chemin Storage pour un meme rapport
- l'objet prive est ecrase a chemin constant
- l'entree `organization_files` est fusionnee par `storage_path`
- il n'y a donc pas d'accumulation de fichiers actifs pour un meme rapport a ce stade

## Tests manuels minimum

1. Ouvrir `index.saaspro.html`, se connecter, puis ouvrir un rapport pro deja sauvegarde.
2. Si aucun PDF officiel n'existe, lancer `Generer le PDF officiel`.
3. Verifier `pro_reports.pdf_status = 'generating'` pendant le traitement puis `ready` apres succes, avec ouverture automatique du PDF a la fin.
4. Verifier la presence du PDF dans `organization-assets` sous `org/{organization_id}/reports/{report_id}/rapport-officiel.pdf`.
5. Verifier la ligne `organization_files` associee et `pro_reports.latest_pdf_file_id`.
6. Si le navigateur bloque l'ouverture automatique, verifier que le lien / bouton de repli permet d'ouvrir le PDF officiel.
7. Verifier que l'export local navigateur fonctionne toujours.
8. Forcer un echec serveur de rendu PDF et verifier `pdf_status = 'error'`, `pdf_error` renseigne et fallback local toujours disponible.
9. Verifier qu'un autre compte ne peut ni generer ni ouvrir le PDF d'une autre organisation.
10. Ouvrir `index.saaspro.html#report=...` sans session et verifier que le mode shared report reste intact.

Checklist preview detaillee :
- `docs/qa-preview-checklist.md`

## Notes

- Le frontend reste buildless. Les dependances npm servent uniquement au runtime serveur `/api/*`.
- Aucune cle serveur n'est exposee au navigateur.
- La route documentaire et runtime a retenir pour l'espace pro est `index.saaspro.html`.
