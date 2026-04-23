# AI Changelog

Historique des modifications effectuees par des agents IA sur ce depot.

## 2026-04-23 — Claude Code (Landing UX/A11y Sprint 1)

Refonte accessibilite / hygiene de la landing `index.html` — Sprint 1 du plan `polished-fluttering-quill.md` (sur 3 sprints). Zero nouveau JS, zero dep npm, CTA texte inchange.

- **`@media (prefers-reduced-motion: reduce)`** global ajoute en fin de `<style>` dans `index.html`. Neutralise `animation`, `transition`, `scroll-behavior`, et force `opacity:1 / transform:none` sur `.sr`, `.hero-cascade`. Respecte WCAG 2.3.3 — l'ancien comportement (cta-pulse infini, scroll reveal, cascade hero) violait la preference utilisateur.
- **`.cta-pulse`** : `animation-iteration-count` passe d'`infinite` a `3` (ligne 172-176). Pulse limite = 9 secondes max, puis CTA statique.
- **FAQ "C'est vraiment gratuit ? Pourquoi ?"** retiree sur decision produit, du DOM `<div id="faq-list">` ET du JSON-LD `FAQPage`. La FAQ compte desormais 5 questions cote DOM et 5 cote JSON-LD, parfaitement synchronises (evite les warnings Search Console sur divergence DOM/structured-data).
- **`:focus-visible`** : `outline: 2px solid rgba(29,78,216,0.45); outline-offset: 2px` → `outline: 2px solid #1D4ED8; outline-offset: 3px`. Contraste solide (WCAG 2.4.11 AAA 2025).
- **`cookie-consent.js`** : ajout de l'attribut `defer` sur le `<script src="./cookie-consent.js">`. Le script est deja defer-safe car il detecte `document.readyState === 'loading'` + fallback `DOMContentLoaded`. Gain : deblocage du parsing HTML (≈20-30 ms mobile 3G selon Lighthouse).
- **Logo BIC Montpellier** : extraction en SVG externe testee puis annulee sur decision produit. Le `data:image/svg+xml;base64,...` inline est restaure tel qu'a HEAD (pas de changement net).
- **Hygiene** : aucune regle absolue du `CLAUDE.md` touchee. Moteur `src/engine.js`, `api/*.js`, migrations Supabase et `vercel.json` non modifies. Zero code mort, zero doublon, zero fichier orphelin introduit.

Suite : Sprint 2 (preuve au-dessus du fold : stat-chip chiffre-cle, bande proof, mockup mobile, auteur) puis Sprint 3 (reordonnancement sections + `animation-timeline: view()` + content-visibility, optionnel).

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
