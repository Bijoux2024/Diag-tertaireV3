# FINDINGS — Points adjacents détectés pendant l'intervention SEO

> Créé le 2026-04-20 pendant le commit `fix(seo): cleanUrls Vercel + canonicals sans .html`.
> À traiter séparément. Ne PAS mélanger avec le commit SEO.

> **Statut session 2026-04-20 (post-rollout prod validé)** :
> - #2 LEVÉ (PDF Puppeteer testé E2E en preview + prod, 200 KB %PDF valide)
> - #3 FIXÉ (commit `c51e764` — logo-preview.html supprimé + .gitignore nettoyé)
> - #4 FIXÉ (commit `7d17ab3` — 301 Vercel vers /espace-professionnel, HTML supprimé)
> - #6 SKIPPED intentionnel (X-Robots-Tag Vercel = source canonique testée ; un meta tag serait une seconde source de vérité à maintenir pour zéro gain réel)
> - #1, #5, #7, #8 : restants pour session ultérieure (non bloquants, voir détails ci-dessous)

## 1. `vercel dev` ne simule pas complètement `cleanUrls` (limitation CLI)
**Observation** — En local avec `npx vercel dev` (v50.28.0) :
- Les 308 `/foo.html` → `/foo` fonctionnent parfaitement.
- Mais l'URL finale `/foo` renvoie 404 parce que la CLI dev ne résout pas `/foo` vers `foo.html` malgré `cleanUrls: true`.

**Conséquence** — Le comportement réel n'est vérifiable qu'en preview Vercel. Lancer `npm run deploy:preview` et re-tester `curl -I https://<preview>.vercel.app/diagnostic` → attendu **200** (pas 404).

**Action suggérée** — Upgrade Vercel CLI (`npm i -g vercel@latest` → v50.42.0) et re-tester. Si toujours KO en dev, c'est un bug CLI acceptable (la prod fonctionne).

## 2. `public-report-print.html` + Puppeteer — test PDF à faire en preview
**Observation** — [api/public-report-pdf.js:490](api/public-report-pdf.js#L490) construit l'URL `public-report-print.html?public_report_id=…&token=…`. Avec `cleanUrls`, Vercel fait un 308 vers `/public-report-print?…`.

**Risque** — Puppeteer suit les redirects par défaut, donc devrait fonctionner, mais non testé.

**Action suggérée** — Sur le premier preview deploy, déclencher une génération PDF (via `api/public-report-pdf.js`) et vérifier que le PDF sort correctement. Si échec, option de repli : ajouter un rewrite explicite `{ "source": "/public-report-print", "destination": "/public-report-print.html" }` dans `vercel.json` pour court-circuiter le 308.

## 3. `logo-preview.html` — fichier orphelin
**Observation** — Présent à la racine ([logo-preview.html](logo-preview.html)), aucune référence nulle part (grep sans match). Outil interne de preview visuelle.

**Action suggérée** — Soit le déplacer dans `/scratch/`, soit le supprimer. Ne change pas le SEO.

## 4. `diagtertiaire-pro-alpha.html` — page de redirect legacy
**Observation** — Redirige vers `/espace-professionnel` (mise à jour faite dans le commit SEO). Aucun lien interne ne pointe dessus. Probablement utilisée pour un lien externe historique.

**Action suggérée** — Vérifier si l'URL est encore diffusée quelque part (mailings, QR code, partner). Si non : supprimer + ajouter un redirect Vercel si besoin de compat.

## 5. Sitemap — `/partenaire` absent (intentionnel ?)
**Observation** — `/partenaire` est `noindex, nofollow` (vercel.json + meta HTML) mais n'est pas dans le sitemap. Cohérent avec "pas indexable".

**Rien à faire** — Juste pour info.

## 6. Vercel CLI obsolète
**Observation** — v50.28.0 installée, v50.42.0 disponible. Message dans le log au démarrage.

**Action suggérée** — `npm i -g vercel@latest` quand tu as 2 min.

## 7. `<meta name="robots">` manquant dans `espace-professionnel.html`
**Observation** — Cette page n'a pas de `<meta name="robots">` dans le `<head>`. Le `X-Robots-Tag: noindex, nofollow` HTTP couvre déjà le besoin, donc pas de bug. Pour ceinture+bretelles, on pourrait ajouter `<meta name="robots" content="noindex, nofollow">`.

**Action suggérée** — Mineur. À ajouter la prochaine fois que le fichier est touché.

## 8. `public/` local casse les deploys CLI Vercel (PRIORITAIRE)
**Observation** — Le dossier `public/` est gitignored (commit `fb68678` avait résolu le problème la première fois : "Vercel servait public/ à la place de la racine — 404"). Mais il a été recréé localement le 2026-04-10 avec `bic-montpellier.png/svg`. Quand `npx vercel` est lancé depuis la machine dev, la CLI uploade ces fichiers, Vercel auto-détecte `public/` comme `outputDirectory`, et ignore tous les statics de la racine → preview CLI 100% cassée (toutes les URLs renvoient 404 sauf `/api/*`).

**Impact** — Aucun sur la prod (GitHub integration déploie depuis le tree git qui exclut `public/`). Impact majeur sur tout déploiement CLI local (preview via `npm run deploy:preview` inutilisable).

**Action suggérée** — Créer `.vercelignore` à la racine contenant une ligne `public/`. Coût : 1 fichier, 1 ligne. Commit dédié `chore: vercelignore public/ pour deploys CLI`. À traiter dès que 10 min disponibles. Sinon, workaround ponctuel : `mv public/ /tmp/ && npx vercel && mv /tmp/public ./`.
