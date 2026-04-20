# AI Changelog

Historique des modifications effectuees par des agents IA sur ce depot.

## 2026-04-20 — Claude Code

- Activation de `"cleanUrls": true` dans vercel.json : Vercel emet desormais un 308 permanent de `/foo.html` vers `/foo` et sert l'URL sans extension depuis le meme fichier. Supprime les doublons GA4 `/` vs `/index.html` et `/diagnostic` vs `/diagnostic.html`.
- Suppression des 3 rewrites devenus redondants (`/diagnostic`, `/exemple-rapport`, `/espace-professionnel` -> `.html`) puisque cleanUrls gere la resolution automatiquement.
- Deplacement des headers `X-Robots-Tag: noindex` depuis les patterns `.html` vers les patterns sans extension (`/diagnostic`, `/espace-professionnel`, `/partenaire`, `/diagtertiaire-pro-alpha`, `/public-report-print`) pour rester cohe rent avec l'URL finale apres redirect.
- Mise a jour des 7 canonicals, og:url, twitter:url et hreflang pour pointer vers les URLs sans `.html` (methode, politique-confidentialite, mentions-legales, conditions-generales-utilisation, cookies, exemple-rapport, espace-professionnel, partenaire).
- Mise a jour de `sitemap-pages.xml` pour lister les URLs canoniques sans `.html` (lastmod 2026-04-20).
- Mise a jour de `robots.txt` : Disallow sur les URLs canoniques sans `.html`.
- Remplacement de ~45 liens internes `href="/xxx.html"`, `href="./xxx.html"`, `href="xxx.html"` par `href="/xxx"` dans 9 pages (index, diagnostic, methode, exemple-rapport, espace-professionnel, cookies, mentions-legales, politique-confidentialite, conditions-generales-utilisation, partenaire, diagtertiaire-pro-alpha) pour eviter un 308 par clic.
- Mise a jour du routeur SPA dans `exemple-rapport.html` et du dictionnaire `PAGE_URLS` dans `diagnostic.html` pour reconnaitre les paths sans `.html`.
- Mise a jour des `pagePath` GA4 dans `espace-professionnel.html` (6 occurrences) pour coherence avec l'URL visible dans le navigateur.

## 2026-04-06 — Claude Code

- Ajout du rewrite `/blog/*` dans vercel.json pour proxier le blog depuis diag-tertiaire-blog.vercel.app
- Ajout de regles supplementaires pour les chemins avec slash final (`/blog/` et `/blog/:path+/`), necessaires car Vercel traite les trailing slashes comme des repertoires avant d'appliquer les rewrites sur les sites statiques
