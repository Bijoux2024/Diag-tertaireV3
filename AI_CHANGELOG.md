# AI Changelog

Historique des modifications effectuees par des agents IA sur ce depot.

## 2026-04-21 — Claude Code (fix CSP GA4)

- Extension de la directive `Content-Security-Policy` dans `vercel.json` pour autoriser Google Analytics / Tag Manager : ajout de `https://www.googletagmanager.com` dans `script-src`, nouvelle directive explicite `script-src-elem` (miroir de `script-src` pour clarifier le comportement Firefox/Safari qui ne fallback pas sur `script-src`), et ajout de `https://www.google-analytics.com`, `https://*.analytics.google.com`, `https://*.google-analytics.com`, `https://stats.g.doubleclick.net`, `https://www.googletagmanager.com` dans `connect-src` (beacons `/g/collect`). Domaines issus de la reco officielle Google (developers.google.com/tag-platform/security/guides/csp), aucun wildcard permissif.
- **Regression pre-existante** : la CSP bloquait le chargement de `gtag.js` depuis l'ajout de ga4.js. Aucun event GA4 n'est parti en production depuis la mise en place du tracking — les ~76 pageviews initialement visibles dans le rapport GA4 viennent probablement d'autres sources (Search Console, referrers directs sur domaines non couverts par la CSP, ou tests locaux). Ce fix debloque le tracking de bout en bout et doit etre merge avant toute validation DebugView.
- `img-src` inchange (deja couvert par le wildcard `https:` pour les pixels GA).

## 2026-04-21 — Claude Code (GA4 funnel events)

- Ajout de deux nouveaux business events dans `ga4.js` via `resolveBusinessEvent` : `diagnostic_form_start` (premiere saisie reelle dans le formulaire, distinct de `diagnostic_start` qui est declenche au mount) et `contact_opt_in` (envoye apres insertion partenaire reussie quand l'utilisateur coche la mise en relation). `diagnostic_form_start` est volontairement renomme depuis l'ancienne proposition `form_start` pour eviter tout conflit avec le nom reserve de l'Enhanced Measurement GA4.
- Enrichissement de `resolveTrackedCta` dans `ga4.js` avec un parametre `cta_location` resolu via une nouvelle helper `resolveCtaLocation`. Priorite donnee a l'attribut explicite `data-dt-cta-location` (avec remontee `closest()` si le scope est un conteneur), fallback heuristique sur les selecteurs `.mobile-menu`, `nav/header`, `footer`, `main/section`.
- Ajout de `data-dt-cta-location` sur les 5 CTAs d'entree de `index.html` : `nav`, `mobile_menu`, `hero`, `footer_section`, `footer_link`.
- `diagnostic.html` : ajout d'un flag React `formStarted` dans `NewDiagnosticForm` + callback `handleFormStart(firstField)` qui fire `diagnostic_form_start` une seule fois par session (flag reset dans `handleReset`). Le callback est passe en prop `onFormStart` a `NewDiagnosticStep1Building` et appele depuis `handleAddressChange` des qu'un caractere non vide est saisi.
- Enrichissement de `submit_form` (event GA4 `diagnostic_complete`) avec le parametre `partner_consent: !!formData.contactOptIn`, permettant de comparer directement les completions avec ou sans mise en relation.
- Ajout de l'emission de `contact_opt_in` apres l'await `newDiagnosticSubmitPartnerLead` reussi (chemin succes uniquement), avec les 5 dimensions analytiques `activity`, `surface`, `objective` (= `projectObjective`), `budget` (= `budgetRange`), `role`. Pas d'ID unique envoye (eviter PII/cardinalite) — le lien email <-> diagnostic reste cote Supabase.

## 2026-04-20 — Claude Code (findings post-SEO)

- Suppression de `logo-preview.html` (fichier orphelin, 0 reference active, gitignored) + nettoyage de la ligne `.gitignore` devenue obsolete.
- Remplacement de la page legacy `diagtertiaire-pro-alpha.html` par un redirect 301 server-side via `vercel.json` vers `/espace-professionnel`. Couverture des deux variantes d'URL (`/diagtertiaire-pro-alpha` et `/diagtertiaire-pro-alpha.html`) pour preserver tout backlink externe historique. Suppression du fichier HTML, du header `X-Robots-Tag` devenu sans objet, du `Disallow` dans `robots.txt`, et de la ligne descriptive dans `README.md`.

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
