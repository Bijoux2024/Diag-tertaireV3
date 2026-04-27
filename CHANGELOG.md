# Changelog - DiagTertiaire V3

## [Phase 2 SEO - TASK-008 : HowTo schema sur methode.html] - 2026-04-27

### Ajoute

- **TASK-008** : nouveau bloc JSON-LD `HowTo` dans `methode.html` apres
  le bloc `BreadcrumbList`. 4 etapes pretty-printed couvrant le parcours
  utilisateur du pre-diagnostic : renseigner batiment / declarer
  consommations / recevoir positionnement sectoriel / consulter actions
  prioritaires + rapport PDF. `totalTime: PT3M`. Outil reference
  HowToTool. Publisher Organization DiagTertiaire.
- **Note rich result** : depuis sept 2023, Google a retire les rich
  results HowTo. Le schema reste utile pour AI Overviews, ChatGPT
  Search et Perplexity qui consomment activement les structures HowTo
  pour generer des reponses pas-a-pas. Pas un signal SEO classique,
  signal GEO uniquement.

## [Phase 2 SEO - TASK-007 : FAQPage enrichie 5 -> 10 Q&A pour GEO] - 2026-04-27

### Modifie

- **TASK-007** : bloc JSON-LD `FAQPage` dans `index.html` remplace
  integralement (ancien : 5 Q&A minifiees, nouveau : 10 Q&A
  pretty-printed). Les 5 nouvelles questions couvrent le Decret
  Tertiaire, les aides 2026 (CEE, MaPrimeRenov Tertiaire, ADEME, BPI),
  la difference pre-diagnostic vs audit reglementaire NF EN 16247, le
  delai de generation du rapport et les types de batiments couverts
  (bureaux, commerces, hotels, restaurants, entrepots, sante).
- Densite factuelle : chiffres ancres sur sources (CABS ADEME 150-300
  kWh/m2/an, audit 800-3000 EUR HT, Decret Tertiaire 1000 m2 / 40-50-60
  pourcent, OPQIBI 1905, NF EN 16247, RT 2012, RE 2020).

### Notes

- **Longueur reponses** : 79-109 mots (moyenne 93). Le playbook visait
  130-160 mots optimum LLM, atteint partiellement. Suffisant pour GEO
  citation passages mais sous-optimum, a etoffer en Phase 4 si besoin.
- **Divergence DOM / JSON-LD assumee** : la FAQ visible cote DOM
  contient toujours 5 questions (cf. CHANGELOG Sprint 1 du 2026-04-23).
  Le bloc JSON-LD passe a 10 questions = 5 questions GEO-only non
  affichees a l'utilisateur. Trade-off accepte : optimisation citation
  LLM (AI Overviews, ChatGPT Search, Perplexity) vs strict alignement
  DOM/structured-data. Aligner DOM = Phase 4 (etoffe contenu) si decide.
- **Pas de rich result Google attendu** : depuis aout 2023, FAQ rich
  results restreints a sites gov/sante. Benefice attendu = AI Overviews,
  ChatGPT Search, Perplexity et Bing Copilot uniquement.

## [Phase 2 SEO - TASK-006 : GovernmentService OPERAT/ADEME] - 2026-04-27

### Ajoute

- **TASK-006** : nouveau bloc JSON-LD `GovernmentService` dans `index.html`
  apres le bloc `Organization`. Decrit la plateforme OPERAT (ADEME) avec
  `@id` partage `https://diag-tertiaire.fr/#operat-service`, provider
  `GovernmentOrganization` ADEME (lie a Wikidata Q2826025), reference
  Legifrance (loi ELAN article 175). Renforce le signal d'autorite
  reglementaire pour Bing Copilot et AI Overviews. Pas un rich result
  Google standard, gain GEO sur les requetes "Decret Tertiaire", "OPERAT
  ADEME", "obligation declaration tertiaire".

## [docs(seo) - Addendum GSC : TASK-031/032/033 + clarification redirects] - 2026-04-27

### Contexte

Suite a un signal "Page avec redirection - validation echouee" remonte par
Google Search Console sur `http://diag-tertiaire.fr/` et
`https://diag-tertiaire.fr/methode.html`, un diagnostic complementaire a
ete realise apres la cloture de l'audit SEO/GEO 360 deg du 2026-04-27.
Trois constats structurels ont ete identifies, dont deux non couverts par
les TASK-001 a TASK-030 du playbook initial.

### Ajoute (3 nouvelles taches d'audit)

- **TASK-031** (High, 10 min, technical) : forcer politique trailing-slash
  unique via `"trailingSlash": false` dans `vercel.json` (top-level, a cote
  de `cleanUrls: true`). Constat : `/methode/` ET `/methode` retournent
  toutes deux 200 sans canonique unique = duplicate content. Fichier
  verrouille CLAUDE.md, presentation du diff requise avant execution.
- **TASK-032** (Medium, 15 min, technical) : configurer `www.diag-tertiaire.fr`
  en redirect 301 vers l'apex via Vercel Dashboard. Constat : sous-domaine
  www. en timeout (dead-end), risque GSC futur si soumis ou backlinke.
  Action manuelle Yannis (configuration externe, pas de fichier projet).
- **TASK-033** (Medium, 30 min, seo/monitoring) : auditer le backlog GSC
  "Page avec redirection" et documenter dans nouveau fichier
  `seo-audit-2026-04/GSC-REDIRECT-AUDIT.md`. Confirme que les 308 sur
  anciennes URLs (HTTP, .html) sont VOULUS et qu'il ne faut PAS relancer
  "Valider la correction" en boucle. Action manuelle Yannis.

### Modifie

- `seo-audit-2026-04/AUDIT-REPORT.md` : nouvelle section 5 "Diagnostic GSC :
  Page avec redirection (clarification post-audit)" avec 3 sous-sections
  (5.1 redirections voulues, 5.2 trailing-slash, 5.3 www. dead-end, 5.4
  suite operationnelle). Plan d'action consolide renumerote en section 6.
- `seo-audit-2026-04/AGENT-EXECUTION-PLAN.md` : nouvelle section "Addendum
  GSC (post-Phase 1)" inseree entre "Tasks groupees Low" et "Validation
  finale globale", contenant les 3 taches TASK-031/032/033 au format
  strict du playbook (Priorite / Effort / Categorie / Pre-lecture / Action
  / Validation / Commit / Hygiene).
- `seo-audit-2026-04/ACTION-PLAN.md` :
  - TASK-031 ajoutee dans le tableau High (10 min, technical)
  - TASK-032 + TASK-033 ajoutees dans le tableau Medium (15 + 30 min)
  - Effort cumule High recalcule : 16,3 h -> 16,5 h
  - Effort cumule Medium recalcule : 7,5 h -> 8,3 h
  - Total recalcule : 34,3 h -> 35,3 h (incluant les ~55 min addendum)
  - Section "Taches necessitant validation explicite Yannis" : ajout de
    TASK-031 (vercel.json verrouille)

### Note

- Aucune action prod n'a ete executee dans ce commit : il s'agit
  uniquement de la mise a jour des livrables d'audit pour integrer
  l'addendum GSC. Les 3 taches sont en backlog et seront executees aux
  checkpoints prevus (TASK-031 demande accord vercel.json, TASK-032 +
  TASK-033 sont manuelles cote Yannis).

## [chore(docs) - Versionne livrables d'audit SEO/GEO 2026-04] - 2026-04-27

### Ajoute

- `seo-audit-2026-04/AUDIT-REPORT.md` : rapport decisionnel 360 deg
  consolide (8 sous-agents specialistes), score initial 60/100, top 5
  critiques, top 5 quick wins, matrice maturite, findings par categorie
  (technical, content, schema, sitemap, performance, visual, GEO, SXO),
  cross-reference Gemini Pro 2026, plan d'action consolide.
- `seo-audit-2026-04/AGENT-EXECUTION-PLAN.md` : playbook agent (TASK-001
  a TASK-030 + TASK-LOW), schema strict par tache (Priorite / Effort /
  Categorie / Pre-lecture / Action / Code exact / Validation / Commit /
  Hygiene), procedure validation finale.
- `seo-audit-2026-04/ACTION-PLAN.md` : tableau priorise executif Critical
  / High / Medium / Low, effort cumule par phase, roadmap 5 phases,
  taches a valider avec Yannis (vercel.json), gains attendus par phase.
- `.gitignore` : exclusion `.agent/` (residus sessions IA, anomalie
  Phase 1 documentee) et `seo-audit-2026-04/fetched/` (caches HTML
  transients, ~3 MB doublons git inutiles, les `.md` restent versionnes).

### Note

- Les commits Phase 1 (TASK-001/002/004/005) ont deja ete pushes sur
  `origin/main` (V3) et propages en production via Vercel
  (`https://diag-tertiaire.fr/llms.txt` 35 lignes, `/robots.txt`
  47 lignes confirmes par curl). TASK-003 cote blog en attente de
  rebase + push.

## [Phase 1 SEO - Quick wins playbook 2026-04-27] - 2026-04-27

### Ajoute

- **TASK-001** : `robots.txt` enrichi avec directives explicites pour les
  crawlers IA. Search-time bots autorises (GPTBot, OAI-SearchBot,
  ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended,
  Applebot-Extended, Bytespider) pour visibilite AI Overviews / ChatGPT
  Search / Perplexity. Training-only bots bloques (CCBot, anthropic-ai,
  cohere-ai). Aucune valeur SEO pour ces derniers, uniquement training
  data. Header descriptif ajoute en debut de fichier.
- **TASK-002** : `llms.txt` refondu avec densite factuelle pour
  optimisation citation LLM (AI Overviews, ChatGPT Search, Perplexity).
  Ajout du contexte reglementaire Decret Tertiaire (loi ELAN, OPERAT
  ADEME, echeances 40/50/60 pourcent), description detaillee du service
  (precision 20 pourcent, NF EN 16247, secteurs couverts) et liste des
  11 articles de blog avec URLs cleanUrls (sans `.html`) pour eviter les
  redirections 308. Migration des URLs legales en cleanUrls egalement.

### Retire

- **TASK-004** : `aggregateRating` supprime du bloc JSON-LD
  `SoftwareApplication` dans `index.html` (ratingValue 4.8 / ratingCount
  47). Avis non verifiables : aucune source de collecte exposee sur la
  page (pas de Trustpilot, pas de Google Reviews, pas de bloc avis
  visible) et ratingCount sous le seuil pratique des rich results.
  Retrait conforme aux Quality Rater Guidelines Google. Bloc reste
  valide schema.org. A reintroduire si une source de collecte tierce est
  mise en place (Trustpilot, Capterra, G2).

### Modifie

- **TASK-005** : `diagnostic.html` `.cta-pulse` passe d'animation
  `infinite` a `animation-iteration-count: 3` (alignement avec la
  landing page deja conforme depuis 2026-04-23). Conformite WCAG 2.3.3
  Animation from Interactions : pas d'animation indefinie auto-jouee.
  Reduit la fatigue visuelle sur mobile et respecte les environnements
  sensibles (le `@media (prefers-reduced-motion: reduce)` global
  neutralise toujours l'animation pour les utilisateurs concernes).

## [UX/A11y - Sprint 1 landing page : accessibilite et hygiene] - 2026-04-23

### Ajoute

- **`@media (prefers-reduced-motion: reduce)`** global en fin de `<style>`
  dans `index.html` (WCAG 2.3.3). Neutralise `.cta-pulse`, `.sr`,
  `.hero-cascade`, hover `.mockup-glow` et toute animation/transition
  globale pour les utilisateurs ayant active la preference.

### Modifie

- **`index.html`** : `.cta-pulse` passe de `infinite` a
  `animation-iteration-count: 3` (evite la fatigue visuelle sur mobile
  et respecte mieux les environnements sensibles).
- **`index.html`** : `:focus-visible` durci de `outline: 2px solid
  rgba(29,78,216,0.45)` / offset 2px a `outline: 2px solid #1D4ED8` /
  offset 3px (WCAG 2.4.11 AAA 2025).
- **`cookie-consent.js`** : chargement passe en `defer` dans
  `index.html` (deblocage du parsing HTML). Le script est defer-safe
  car il detecte `document.readyState` et fallback sur
  `DOMContentLoaded`.

### Retire

- **Question FAQ "C'est vraiment gratuit ? Pourquoi ?"** retiree du
  DOM ET du JSON-LD `FAQPage` (decision produit : retrait complet,
  pas de divergence DOM/structured-data). La FAQ compte desormais
  5 questions cote DOM et 5 cote JSON-LD.

### Notes

- Sprint 1 = accessibilite et hygiene uniquement. Aucun changement de
  contenu structurel ni de CTA. Zero JS ajoute, zero dependance npm.
- Le logo BIC Montpellier a ete temporairement extrait en SVG externe
  puis restaure en base64 inline sur decision produit (pas de changement
  net par rapport a HEAD).
- Sprints 2 (preuve au-dessus du fold) et 3 (architecture/animations
  modernes) a livrer separement apres validation Lighthouse.

## [Securite - Durcissement CSP, SRI, Origin check, scrubbing #report=] - 2026-04-22

### Ajoute

- **Origin/Referer check** sur les endpoints publics non-authentifies via
  nouveau helper `assertAllowedOrigin` dans `api/_lib/request-guard.js`.
  Applique sur `send-email`, `public-report-cover`,
  `public-report-google-streetview`, `public-config`. Whitelist :
  diag-tertiaire.fr, www, previews Vercel (regex tolere typo
  `diag-tertaire`). Mode optional=true (backward compat si header absent).
- **Rate limit** sur `api/public-config` (120 requetes / 10 min par
  fingerprint, scope `public-config`).
- **Endpoint `api/csp-report.js`** : POST only, rate limit 30/60s, log en
  preview uniquement, retour 204. Recoit les violations via
  `report-uri /api/csp-report` declaree dans la CSP globale.
- **SRI sha384 + `crossorigin="anonymous"`** sur tous les scripts CDN
  statiques : React 18.3.1 (prod/dev), ReactDOM 18.3.1 (prod/dev),
  prop-types 15.8.1, Recharts 2.12.7, @babel/standalone 7.24.10,
  @supabase/supabase-js 2.47.10 (jsdelivr).
- **CSP durcie** (vercel.json bloc global) : ajout de `worker-src 'self'`,
  `manifest-src 'self'`, `media-src 'self' data:`, `child-src 'none'`,
  `frame-ancestors 'none'`, `upgrade-insecure-requests`,
  `report-uri /api/csp-report`. Declaration explicite de
  `fonts.googleapis.com`, `fonts.gstatic.com`, `maps.googleapis.com`.
  Retrait de `https://*.supabase.io` (non utilise).
- **Cross-Origin-Opener-Policy: same-origin** global (vercel.json).
- **Referrer-Policy: no-referrer** par route sur `/espace-professionnel`,
  `/diagnostic`, `/public-report-print`.
- **COOP same-origin** specifique sur `/espace-professionnel`.
- **AI-CONTEXT.md** : nouvelles sections "Securite - Restrictions Google
  Cloud Console" (actions ops : API / IP / quota / billing) et "Securite
  - CSP et SRI" (liste des directives + SRI pinnes vs non-SRI).

### Modifie

- **`handleShare` (`#report=`)** dans `espace-professionnel.html` :
  remplacement des `delete` manuels par un `Set SHARE_FORBIDDEN_KEYS`
  (19 cles sensibles) + walker recursif `scrubForShare` (profondeur
  max 8). Nouvelles cles retirees : `adresse`, `address`, `site_name`,
  `siteName`, `siret`, `raison_sociale`, `companyName`,
  `organizationAddress`, `chauffage_consommation`, `elecKwh`, `gasKwh`
  (+ toute cle dont le nom contient "adresse" ou "address"). Si
  base64 > 6000 chars : `alert` bloquant + abort (pas de clipboard).
- **`public-report-google-streetview.js`** : retour `503` + warning
  unique via `global.__GSV_KEY_WARNED__` si `GOOGLE_STREETVIEW_SERVER_KEY`
  absente (au lieu de `500` + repetition du log a chaque requete).
- **`public-config.js`** : handler passe synchrone -> try/catch avec
  rate limit + origin check + retour d'erreur structure.

### Conserve (backward compat)

- `parseSharedReportFromHash` (espace-professionnel.html l.4047-4066) :
  inchange. Les anciens liens `#report=` (contenant adresse / siret /
  consommations brutes) continuent de s'ouvrir - seuls les nouveaux liens
  sont scrubes.
- `'unsafe-inline'` conserve sur `script-src` et `style-src` : contrainte
  buildless (Babel standalone + styles inline index.html). Dette
  acceptee documentee.
- Tailwind CDN (`cdn.tailwindcss.com`) et Iconify (`code.iconify.design`)
  restent sans SRI : bundles dynamiques par domaine, SRI casserait le
  chargement.

### Tests effectues

- **Lot 4** : 9/9 scenarios `assertAllowedOrigin` PASS (no origin, strict,
  prod, www, preview vercel, preview typo, evil.com, referer fallback,
  URL invalide).
- **Lot 5** : 3/3 scenarios `csp-report` PASS (GET->405, POST object->204,
  POST string body->204 sans crash).
- **Lot 3** : scrub-test PASS (17 cles sensibles absentes, 7 cles utiles
  preservees) + backward compat PASS (ancien lien avec adresse / siret /
  elecKwh lisible par `parseSharedReportFromHash`).
- **Lot 1** : validation JSON + presence des 10 directives critiques
  dans la CSP + Referrer-Policy no-referrer x3 routes + COOP global + COOP
  /espace-professionnel : tous OK.
- **Lot 2** : 8/8 SRI hashes re-fetches et verifies coherents avec le
  contenu actuel des CDN unpkg et jsdelivr.

### Actions ops restantes (hors code)

1. **Google Cloud Console** - restreindre la cle `GOOGLE_STREETVIEW_SERVER_KEY` :
   - API restrictions : Street View Static API + Street View Metadata uniquement
   - Application restrictions : IP addresses (plages Vercel) ou referrers vides
   - Quota : cap 1000 requetes/jour
   - Alerting Billing : alerte a 10 EUR/jour
2. **Preview Vercel** : verifier qu'aucune violation `/api/csp-report` ne
   remonte dans les logs pendant 48h apres deploy (faux positifs eventuels).
3. **Test end-to-end** : parcours diagnostic + parcours Pro (login + creation
   dossier + partage `#report=` + export PDF) sur preview avant promotion main.

## [style - Nouveau favicon flaticon-document (identite visuelle unifiee site + blog)] - 2026-04-20

### Style

- **Nouveau favicon** : remplacement du badge texte "DT" par l'icone flaticon-document (document violet avec graphiques camembert + barres) pour cohérence avec le blog diag-tertiaire.fr/blog.
- **Source unique** : `favicon-source.png` (256x256) remplace par le PNG flaticon-document. Les 5 PNGs derives (16, 32, 180 apple-touch, 192, 512 android-chrome) sont regeneres via sharp depuis cette source (processus partage avec le blog, meme script `scripts/gen-favicons.mjs` cote blog).

### Fichiers modifies

- `favicon-source.png` : remplace (source flaticon-document).
- `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png` : regenerees.
- `favicon.ico` : supprime (navigateurs modernes + PNG favicons suffisent, aligne avec le blog).
- `favicon.svg` : supprime (ancien badge "DT" qui aurait ete prefere par les navigateurs modernes au detriment du nouveau PNG).
- `index.html`, `diagnostic.html`, `exemple-rapport.html`, `espace-professionnel.html`, `public-report-print.html`, `cookies.html`, `conditions-generales-utilisation.html`, `mentions-legales.html`, `methode.html`, `partenaire.html`, `politique-confidentialite.html`, `diagtertiaire-pro-alpha.html` (12 HTML) : bloc `<link rel="icon">` nettoye. Suppression des 2 lignes SVG et de la ligne ICO, `<link rel="apple-touch-icon">` reoriente vers `/apple-touch-icon.png` (180x180).
- `site.webmanifest` : inchange (theme_color bleu `#2563EB` brand conserve, l'icone violette n'affecte que l'onglet).
- `CHANGELOG.md` : cette entree.

### Points de vigilance

- **Cache navigateur** : les favicons sont tenaces, tester en fenetre privee apres deploiement Vercel.
- **Pas de version SVG** : le flaticon-document n'est disponible qu'en PNG. Si un SVG vectoriel est souhaite plus tard, commander au designer.
- **Fichier `logo-preview.html`** : non touche (page interne de preview, setup distinct).

## [style - Animations subtiles page Pro (stagger, count-up, progress bar)] - 2026-04-16

### Style

- **Barre de progression de scroll** (`espace-professionnel.html`) : barre 2px fixe en haut de page, degrade blue-600/700/400, mise a jour via `requestAnimationFrame` (passive scroll listener).
- **Stagger reveal** : les enfants `[data-stagger-item]` des sections `.reveal` apparaissent en cascade (80ms decalage, fade-up easing `cubic-bezier(0.22, 1, 0.36, 1)`). Applique sur Benefits KPI, Audience cards, Proof cards.
- **Count-up KPI** : les chiffres des cartes Benefits s'incrementent (cubic ease-out, 1.1s) quand la section entre dans le viewport. Conserve signe, decimales et suffixe (%, min, etc.). Idempotent via `data-countup-done`.
- **Steps badges pop** : entree `scale(0.7)->1` avec overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`), 150ms decalage entre cartes. Filet horizontal central qui se dessine de gauche a droite (1s ease).
- **Card lift** : Audience et Steps cards passent en `translateY(-4px) scale(1.012)` au hover (transition 0.35s smooth). Proof cards : barre coloree gauche s'epaissit 4->6px au hover.
- **Bouton submit shimmer** : passage de lumiere au hover (translation skewed, 0.9s, une passe).
- **Focus inputs** : pulse-ring bleu sur focus (0.7s, animation unique).
- **Accessibilite** : tout respecte `prefers-reduced-motion: reduce` (animations/transitions desactivees, opacite/transform forces a 1/none).

### Implementation

- Pas de framework ajoute (Framer Motion / GSAP / Lenis ecartes : page buildless React+Babel CDN, le cout d'integration depasse le benefice). 100% CSS @keyframes + extension de l'`IntersectionObserver` deja present.

### Fichiers modifies

- `espace-professionnel.html` : bloc CSS `/* PRO LANDING ANIMATIONS */` ajoute, observer etendu pour stagger + count-up, listener scroll progress, attributs `data-*` et classes ajoutes sur JSX (Benefits/Steps/Audience/Proof/Form CTA).
- `CHANGELOG.md` : cette entree.

## [style - Lisibilite etapes + alternance tonale sections Pro] - 2026-04-16

### Style

- **Typographie des etapes** (`espace-professionnel.html`) : remplacement du chiffre display Syne (`pro-v2-step-num`) par un badge circulaire Inter 900 (`pro-v2-step-badge`) 52px, fond degrade blue-600->blue-700, chiffre blanc. Coherent avec les KPI Benefits, meilleure lisibilite a toutes les tailles.
- **Alternance tonale des sections** : introduction de 3 bandes de couleur douce (`pro-v2-band-warm` ivoire/amber sur Steps, `pro-v2-band-sage` vert pale sur Audience, `pro-v2-band-peach` peche sur Proof). Benefits et Form conservent la bande bleue (`pro-v2-section-band`) renforcee (#EEF4FF au lieu de #F8FBFF). Chaque bande a son radial pattern teinte et ses bordures assorties.
- **Details** : icones Audience passees en emerald-50/700 (au lieu de blue), guillemet Syne des temoignages en amber-400 (harmonie peche), filet central Steps repasse en amber-300/50.

### Fichiers modifies

- `espace-professionnel.html` : CSS `.pro-v2-step-badge` + variantes `.pro-v2-band-warm/sage/peach` + `.pro-v2-role-icon-sage`, JSX Steps/Audience/Proof mis a jour.
- `CHANGELOG.md` : cette entree.

## [style - Refonte UI page Pro landing (ProLanding)] - 2026-04-16

### Style

- **Refonte visuelle `ProLanding`** (`espace-professionnel.html`) : direction hybride editoriale, coherente avec index.html. Hero (mockup portfolio) preserve a l'identique. Aucun texte modifie (tous les libelles viennent de `copy.*`).
- **Reordonnancement des sections** via wrapper `.pro-v2-stack` (flex-column + order-*) : Hero -> Benefits (KPI) -> Steps -> Audience -> Proof -> Form -> Footer. Le funnel construit la valeur avant le formulaire.
- **Nouveau bloc CSS `.pro-v2-*`** (prefixe dedie, zero collision) : typographie editoriale (`pro-v2-display`, `pro-v2-step-num`, `pro-v2-quote`), bande sectionnee avec grid pattern radial (`pro-v2-section-band`), carte formulaire premium (`pro-v2-form-card`), colonnes KPI avec separateurs (`pro-v2-kpi-col`), role-icons (`pro-v2-role-icon`).
- **Responsive** : grilles 1/2/3/4/5 colonnes selon breakpoints, display KPI en `clamp()`, form en colonne unique < xl, filets verticaux KPI devenus horizontaux < md.

### Fichiers modifies

- `espace-professionnel.html` : bloc CSS `.pro-v2-*` ajoute, JSX `ProLanding` sections Benefits/Steps/Audience/Proof/Form restylees et reordonnees.
- `CHANGELOG.md` : cette entree.

## [v1.6.2 - Hotfix suppression ACT20, audit aid_pct conservateur, bascule engine.js] - 2026-04-15

ENGINE_VERSION : 1.6.1 -> 1.6.2

### Corrections

- **Suppression ACT20** (recuperation chaleur clim) : action retiree de `NEW_DIAGNOSTIC_ACTIONS_LIBRARY` (zero code mort). Nettoyage du filtre `hasCooling` + suppression du filtre `selectable` redondant dans `filterAndScoreActions`. Nettoyage equivalent dans `exemple-rapport.html`.
- **Audit aid_pct conservateur** : valeurs revues a la baisse pour rester sous les primes CEE/Fonds Chaleur reellement obtenues en tertiaire 2026 (politique : "le client doit avoir une bonne surprise a la demande"). ACT02 0.20->0.15, ACT06 0.20->0.15, ACT07 0.20->0.15, ACT08 0.20->0.15, ACT09 0.25->0.15, ACT10 0.20->0.15, ACT13 0.22->0.15, ACT14 0.28->0.18, ACT15 0.22->0.15, ACT16 0.22->0.15, ACT17 0.12->0.08, ACT18 0.15->0.12.
- **Bascule `engine.min.js` -> `engine.js`** : diagnostic.html chargeait un `engine.min.js` stale (date 2026-04-10, anterieur a la release V1.6.1). Suppression du fichier minifie et chargement direct de `src/engine.js` (conforme a la regle CLAUDE.md "buildless, source unique").
- **Invalidation localStorage** : bump `ENGINE_VERSION` a `1.6.2` force `isStaleEngine = true` et purge les payloads `newDiagnosticLatestReport` anterieurs (evite la fuite ACT20 via payload cache).

### Fichiers modifies

- `src/engine.js` : ENGINE_VERSION 1.6.2, suppression ACT20 (action + filtres), audit aid_pct.
- `src/engine.min.js` : supprime (stale, non regenere).
- `diagnostic.html` : `<script src="/src/engine.js">` au lieu de `.min.js`, garde localStorage ACT20 conservee (retire ACT18 du test, reintroduit comme action legitime).
- `exemple-rapport.html` : suppression ACT20 (action + 2 filtres).
- `CHANGELOG.md`, `AI-CONTEXT.md` : synchronises.

## [v1.6.1 - Fourchette capex +/- 15 %, fallback reseau de chaleur, garde CET > 2000 L] - 2026-04-15

ENGINE_VERSION : 1.6.0 -> 1.6.1

### Corrections consortium (BUG-001 a BUG-007)

- **BUG-001** : `ENGINE_VERSION` passe de `'1.6.0'` a `'1.6.1'` (+ `ENGINE_LAST_UPDATED` 2026-04-15).
- **BUG-002** : ACT18 (CET) reintroduit dans `top_actions`. Retrait de la ligne de filtre inconditionnelle (ACT20 reste exclu). Correction de la regle d'eligibilite qui excluait a tort les cas `ecsSameSystem && mainHeating !== 'pac'`. ACT20 est desormais retire AVANT la selection top 3 heavy pour preserver les slots.
- **BUG-003 + exigence fourchette +/- 15 %** : refonte des tiers ACT13 et ACT18. Nouvelle structure `{ power_kw|volume_l, capex_low, capex_mid, capex_high, capex }` avec `capex_low = round(mid x 0.85)` et `capex_high = round(mid x 1.15)`. `capex = capex_mid` (retro-compat ROI). Nouveau champ action `capex_range: { low, mid, high, formatted }` pour l'UI (format FR espace insecable, tiret demi-cadratin U+2013 dans la string formatee uniquement).
  - ACT13 PAC air/eau (mid) : 10 kW 15 000 EUR, 20 kW 28 000, 50 kW 62 000, 100 kW 120 000, 200 kW 230 000.
  - ACT18 CET (mid) : 200 L 4 600 EUR, 300 L 5 800, 500 L 9 200, 1 000 L 17 500, 2 000 L 34 000.
- **BUG-004** : suppression du tier 5 000 L / 84 000 EUR. Si le volume calcule depasse 2 000 L, `newDiagnosticComputeCetSizing` retourne desormais une sentinelle `{ needsStudy: true, reason: 'volume_exceeds_max_tier', V_L_raw }`. Le resolveur d'action ACT18 la transforme en action ACT18_STUDY (`capex: null`, `gainKwh: null`, `study_required: true`, `badge: 'Etude technique requise'`).
- **BUG-005** : pour ACT13, si `puissanceKwRaw > 200`, conservation du tier 200 kW mais ajout de `oversized: true` et `badge: 'Hors grille tarifaire - etude dediee'` dans la sortie.
- **BUG-006** : defense en profondeur dans `newDiagnosticComputeCetSizing` : retour `null` immediat si `ecsSource === 'pac'` (meme si `filterAndScoreActions` filtre deja l'action).
- **BUG-007** : fallback reseau de chaleur dans `newDiagnosticResolveEcsSource` et `newDiagnosticResolveHeatSource`. Si `source === 'gas'` et `gasKwh === 0` alors que `networkUsed && mainHeating === 'network'`, lecture de `networkKwh` avec rendement 0.95 (table reseau de chaleur). Pour ECS, la meme logique s'applique a `ecsSystem === 'network_dedicated'`.

### Fichiers modifies

- `src/engine.js` : ENGINE_VERSION 1.6.1, tiers ACT13/ACT18 refondus, `newDiagnosticFormatCapexRange`, `newDiagnosticBuildCapexRange`, ajout `capex_range`/`oversized`/`study_required`/`badge` dans `top_actions[]`, fallback reseau dans les resolveurs, garde V > 2000 L.
- `scripts/qa-runner.js` : baseline engine_version cible V1.6.1, grille capex mise a jour, suppression warning V1.6.1-GAP obsolete sur ACT18, prise en compte sentinelle needsStudy.
- `diagnostic.html`, `public-report-print.html`, `exemple-rapport.html` : composant UI "Estimation indicative" (classe `.capex-estimate` + pill + hint) affiche la fourchette `capex_range.formatted` avec fallback retro-compat. Bloc `.capex-study-block` pour ACT18_STUDY / oversized. Badge warning pour `action.badge`. Disclaimer V1.6.1 en pied de rapport (`.report-v161-disclaimer`).
- `CHANGELOG.md`, `AI-CONTEXT.md`, `.claude/context/architecture.md` : synchronises.

### Tests

- `node scripts/qa-runner.js` : 30/30 PASS, 0 erreur, 0 warning V1.6.1-GAP.
- `node scripts/qa-network-probe.js` : N1 et N4 resolvent desormais l'ECS via le reseau (BUG-007 leve). N4 depasse 2 000 L et bascule en etude dediee (BUG-004).
- 4 scenarios CLAUDE.md : intensite > 0, actions >= 3, breakdown = 100 %, aucun NaN, ACT18 visible sur Hotel 720 m2, `capex_range` present sur ACT13/ACT18.

## [v1.6.0 - Chiffrage CET + PAC air/eau dynamique (facture-based)] - 2026-04-14

ENGINE_VERSION : 1.5.3 -> 1.6.0

### Refonte chiffrage

**Capex CET (ACT18) et PAC air/eau (ACT13) entierement dynamiques** : les capex sont desormais derives de la facture energetique reelle et de tiers commerciaux, plus aucune valeur forfaitaire (fini les `capex_med: 4500` et les tranches de surface arbitraires).

- **Resolveur central** dans `src/engine.js` : toutes les invocations capex CET / PAC air/eau passent par `newDiagnosticComputeCetSizing(data, breakdown)` et `newDiagnosticComputePacEauSizing(data, breakdown)`. Si la source energetique n'est pas declaree dans la facture, le resolveur retourne `null` et l'action est exclue de `topActions`.
- **Methodologie** : conso facturee x part poste (camembert sectoriel reutilise du breakdown existant) x rendement source actuelle (gaz/fioul 0.85, elec Joule 0.95, PAC 2.5), puis ponderation climatique H1/H2/H3 deduit du code postal, enfin tier commercial immediat au-dessus.
- **Tiers CET TTC installe** : 200L/4600 EUR, 300L/5800, 500L/9200, 1000L/17500, 2000L/34000, 5000L/84000.
- **Tiers PAC air/eau TTC installe** : 10kW/17800, 20kW/29000, 50kW/64000, 100kW/122000, 200kW/232000.
- **Pas de plancher/plafond de securite** : la facture est la source de verite.

### Fichiers modifies

- `src/engine.js` (ENGINE_VERSION 1.6.0)
  - Nouvelles constantes : `NEW_DIAGNOSTIC_CET_TIERS`, `NEW_DIAGNOSTIC_PAC_EAU_TIERS`, `NEW_DIAGNOSTIC_RENDEMENT_SOURCE`, `NEW_DIAGNOSTIC_CLIMAT_ZONES_H1`, `NEW_DIAGNOSTIC_CLIMAT_ZONES_H3`
  - Nouvelles fonctions : `newDiagnosticResolveEcsSource`, `newDiagnosticResolveHeatSource`, `newDiagnosticResolveClimatZone`, `newDiagnosticComputeCetSizing`, `newDiagnosticComputePacEauSizing`
  - Suppressions : `newDiagnosticEstimateRooms`, `newDiagnosticComputeCetCapex` (remplacees par le resolveur central, aucun autre callsite)
  - Fiche ACT18 : suppression `capex_low/med/high` hardcodes, conservation de `capex_method: 'cet_sized'`
  - Bascules ACT13 (gaz/fioul -> elec, convecteurs -> PAC) : remplacement des formules de surface par le sizing PAC
  - Bascules ACT18 (gaz -> CET, ballon elec -> CET) : remplacement du capex forfaitaire par le sizing CET
  - Branche standard `capex_method === 'pac_tranches'` / `'cet_sized'` : routee vers le resolveur central
  - Filtrage `newDiagnosticFilterAndScoreActions` : exclusion des actions dont `calculateActionGain` retourne `null`
  - Payload `newDiagnosticBuildReportData` : ajout du champ `engine_version` pour invalidation cache
- `diagnostic.html` : invalidation du cache `newDiagnosticLatestReport` si `engine_version` != `ENGINE_VERSION` courant

### Bug corrige

- Hotel 720 m² affichait un capex CET de 4500 EUR (fallback hardcode de la fiche ACT18). Avec le resolveur dynamique, le capex reflete desormais le volume de ballon reellement necessaire d'apres la facture et tombe sur le tier commercial approprie (typiquement 1000-2000L pour ce profil, soit 17500-34000 EUR).

## [v1.5.3 - Retrait inconditionnel ACT18 + ACT20] - 2026-04-14

ENGINE_VERSION : 1.5.2 -> 1.5.3

### Corrections

**Retrait systematique ACT18 (chauffe-eau thermodynamique) et ACT20 (recuperation chaleur clim)** : ces deux actions ne doivent plus jamais apparaitre dans le plan d'actions. La PAC air/eau reste la seule solution ECS proposee cote moteur, le partenaire precise les alternatives pertinentes au cas par cas.

- `src/engine.js` L1889-1892 : filtre unconditionnel apres `topActions = [...lightActions, ...heavyActions]`. L'ancienne logique conditionnelle (retrait uniquement si ACT13 retenue) laissait passer ACT18/ACT20 lorsque ACT13 etait ecartee (tout elec, ROI > 10 ans, eligibilite).
- `diagnostic.html` L9109-9112 : invalidation du cache `newDiagnosticLatestReport` si le payload stocke contient encore ACT18 ou ACT20 (force un recalcul propre cote front).

Code potentiellement mort a nettoyer apres validation : branches `cetAction` (L1256-1260 `newDiagnosticComputeTargetElecKwh`) et `cetAction` helper L692-730 de NEW_DIAGNOSTIC_ACTIONS (fiches ACT18 + ACT20). A conserver tant que la recette preview n'est pas validee.

## [v1.5.2 - Hotfix libelles, capex CET dynamique, cartouche installation] - 2026-04-14

ENGINE_VERSION : 1.5.1 → 1.5.2

### Corrections

**Lot 1.1 - displayName ACT13 dynamique** : le libelle de l'action "Installer une pompe a chaleur" etait toujours "Remplacer la chaudiere gaz par une PAC air/eau" meme en l'absence de chaudiere gaz (ex : fioul, convecteurs elec). Ajout d'un `displayName` calcule au runtime dans la bascule ACT13 :
- combustible fioul : "Remplacer la chaudiere fioul par une pompe a chaleur air/eau"
- combustible gaz + ECS couplee : "Remplacer la chaudiere gaz par une pompe a chaleur air/eau (chauffage et eau chaude)"
- combustible gaz : "Remplacer la chaudiere gaz par une pompe a chaleur air/eau"
- convecteurs electriques : "Remplacer les radiateurs electriques par une pompe a chaleur"

**Lot 1.2 - capex ACT18 (CET) dynamique pour CHR** : le capex forfaitaire 4 500 EUR etait sous-dimensionne pour les hotels, residences et EHPAD. Helpers ajoutes dans `src/engine.js` :
- `newDiagnosticEstimateRooms(activity, surface)` : estimation chambres (surface / 25 a 30 selon typologie)
- `newDiagnosticComputeCetCapex(activity, surface, numberOfRooms)` : capex borne 8 000 - 45 000 EUR pour CHR, 6 000 - 22 000 EUR pour restauration, 8 000 - 30 000 EUR pour sport/piscine/spa, 4 500 EUR par defaut
- Ajout `capex_low` / `capex_high` (+/- 25%) exposes dans `top_actions`
- Fiche ACT18 : `capex_method: 'cet_sized'`

**Lot 2.3 - installation_summary exposee** : helper `newDiagnosticBuildInstallationSummary(formData)` ajoute dans `src/engine.js`. Retourne une phrase decrivant chauffage / ECS / climatisation declares. Expose via `inputs_summary.installation_summary`.

**Lot 3.1 - cartouche "Votre installation declaree"** : insertion d'un encart visuel (fond gris clair, icone maison, titre 14px semi-bold) entre les KPI du header et la synthese rapide dans les 3 rapports :
- `diagnostic.html` (SPA)
- `exemple-rapport.html` (demo marketing, chaine hardcodee)
- `public-report-print.html` (PDF serveur)

**Lot 3.2 - fallback displayName dans les rendus** : `{action.name}` → `{action.displayName || action.name}` dans les 3 fichiers HTML (9 spots au total).

**Docs** : CLAUDE.md mis a jour (chiffres de lignes reels : engine.js 2 821, diagnostic.html 9 608, exemple-rapport.html 11 135, public-report-print.html 2 192 ; 4e scenario test hotel 720m2 convecteurs ajoute). Backlog ENGINE_PRO ouvert pour porter les changements cote espace-professionnel.html.

### Fichiers modifies

- `src/engine.js` (ENGINE_VERSION 1.5.2)
- `diagnostic.html`
- `exemple-rapport.html`
- `public-report-print.html`
- `CLAUDE.md`
- `.claude/context/backlog.md`
- `CHANGELOG.md`

## [v1.5.1 - Corrections moteur post-audit expert] - 2026-04-06

ENGINE_VERSION : 1.5.0 → 1.5.1

### Corrections IMPORTANT (moteur + formulaire)

**W1 - Seuils scoring (simulate30.js)** : La divergence de seuils A-E observee a l'audit etait dans le script de simulation, pas dans la production. `simulate30.js` utilisait 0.85/1.15/1.60 au lieu de 0.90/1.20/1.70. Corrige : le script est desormais aligne sur les seuils de production (`index.html` et `public-report-print.html` etaient deja corrects).

**W2 - ACT13 (PAC) absente pour fioul** : Angle mort corrige. Le filtre eligibilite excluait `mainHeating = 'fuel'` de la PAC. Fix : `fuel` ajoute aux sources eligibles. Gain PAC calcule avec le prix fioul (0.125 EUR/kWh). Label `energy_switch_note` desormais correct ("chaudiere fioul" au lieu de "chaudiere gaz").

**W4 - COP PAC irrealiste sur batiments anciens** : COP fixe a 3.5 remplace par une table modulee par `buildingAge` :
- pre1975 : COP 2.8 (regime haute temperature 70/55, label degrade)
- 1975_2000 : COP 3.0
- 2001_2012 : COP 3.5
- post2012 : COP 4.0
Impact : ROI PAC pre-1975 passe de ~2.6 ans a ~4-5 ans (plus realiste).

**W5 - PAC recommandee a tort (post-2012 tout electrique)** : Garde ajouteee -- `buildingAge = 'post2012' + mainHeating = 'electric'` → ACT13 exclue (RT2012 = systeme electrique performant probable).

**W6 - Reseau de chaleur sans kWh dedie** : Champ reseau de chaleur ajoute dans le formulaire (etape 3 consommations), conditionnel a `mainHeating = 'network'`. Le bloc gaz est masque pour les utilisateurs reseau. Validation mise a jour. Engine.js integre `networkKwh` dans `totalKwh` et le split energetique. PDF synchronise.

**W7-BIS - Distinction convecteur / PAC electrique** :
- Formulaire : option "Electrique" scindee en "Convecteurs / Radiateurs electriques" (`electric_convector`) et "Pompe a chaleur (PAC)" (`electric_pac`)
- Champ optionnel `pacAge` affiche si `electric_pac` (under5 / 5to15 / over15)
- Moteur : `HEATING_TYPE_NORMALIZE` mappe les nouvelles valeurs vers les valeurs internes (`electric_convector → electric`, `electric_pac → pac`)
- ACT13 exclue si `electric_pac` (PAC existante) sauf `pacAge = over15` (remplacement PAC vieillissante)
- ACT18 (CET) exclue si ECS = `heat_pump` (CET deja installe) ou PAC double service
- ACT04 (entretien chaudiere) exclue pour `pac` (sans objet)
- Backward compat : `mainHeating = 'electric'` (anciens diagnostics) auto-remapping vers `electric_convector` au chargement du formulaire
- `HEATING_LABELS` et `newDiagnosticGetHeatingLabel()` ajoutes dans `index.html`

### Fichiers modifies

- `src/engine.js` (ENGINE_VERSION 1.5.1)
- `index.html`
- `public-report-print.html`
- `scripts/simulate30.js`
- `CHANGELOG.md`

---

## [Audit PDF - anti-coupure + sync] - 2026-04-05

### Corrections critiques (public-report-print.html)

- **TIER_CONF** : ajout des cles `light` et `heavy` (moteur engine.js). Tous les badges d'action affichaient "Equipement" en fallback — desormais "Action rapide" (light, vert) et "Investissement" (heavy, ambre).
- **Budget recap** : `breakInside: 'avoid'` inline sur le conteneur 4-cells du budget global. La cascade CSS (`.budget-row { break-inside: auto }` apres `.pba`) annulait la protection — corrige par style inline prioritaire.
- **Section-summary projection** : meme correction `breakInside: 'avoid'` inline (meme bug de cascade).
- **CTA "Prochaine etape"** : ajout `className="pba"` sur le wrapper externe du bloc gradient bleu. Seul le titre interne etait protege — les bullets et proof line pouvaient se retrouver sur une page differente.

### Corrections importantes (public-report-print.html)

- **Signal de pret Puppeteer** : ajout d'une garde `hasProjectionChart = top_actions.length > 0` avant le polling SVG. Evite 2.4s d'attente inutile quand 0 actions (pas de graphique dans le DOM).
- **Positionnement sectoriel** : regroupement des 3 children (gapText + jauge + source) dans un div unique — devient `firstChild` dans `section-start (.pba)`. La jauge ne peut plus etre separee du titre.
- **Footer anti-veuve** : `breakBefore: 'avoid'` sur le footer pour empecher qu'il se retrouve seul en tete de page.
- **Grid hypotheses/limites** : `breakInside: 'avoid'` inline sur `.cols-2` pour maintenir les 2 colonnes sur la meme page.
- **Section wrapper** : `overflow: 'hidden'` -> `overflow: 'visible'` pour eviter le clipping Chromium/Puppeteer aux bords de page. La barre gradient du titre conserve son `borderRadius` via une propriete directe.

### Ameliorations (public-report-print.html)

- **CO2 equivalence km** : ajout de la 3eme equivalence (km voiture evites / an, facteur 0,193 kg/km ADEME). Synchronisation avec `newDiagnosticGetCO2Equivalences` de index.html.
- **Typographie** : labels hero mini-KPIs `7.5px` -> `8.5px`, labels Decret Tertiaire `7.5px` -> `8.5px`. Seuil minimum lisible a l'impression (6pt = 8px CSS).

### Fichiers modifies

- `public-report-print.html`
- `CHANGELOG.md`

## [Audit post-refonte formulaire] - 2026-04-05

### Regressions corrigees dans engine.js

- **Lead scoring - hScore** : ajout des nouvelles valeurs de decisionHorizon (`6months`, `1year`, `later`) qui tombaient sur le fallback 8 au lieu de 24/16/8 attendus. Backward compat : anciennes valeurs (`3to6months`, `6to12months`, `over1year`) conservees.
- **Lead scoring - oScore** : ajout de `compliance` (= 9, alias de `comply_regulation`) et `valorization` (= 7, alias de `valorise_asset`) introduits par la refonte. Backward compat : anciennes valeurs conservees.
- **inputs_summary** : correction des references vers les anciens noms de champs (`primaryGoal` -> `projectObjective`, `projectHorizon` -> `decisionHorizon`, `decisionRole` -> `role` avec fallback backward-compat). Ces champs etaient `null` pour tous les nouveaux diagnostics depuis la refonte.
- **buildingAge fallback** : `'2006_2012'` remplace par `'post2012'` (la valeur n'existait plus dans les 4 nouvelles tranches).

### Corrections visuelles dans index.html

- **Stepper** : label etape 5 corrige de "Rapport" -> "Contact" (l'etape 5 est le formulaire de contact, le rapport est genere apres).
- **Toggle climatisation** : couleur active corrigee de vert (`#16A34A`) vers bleu (`#1D4ED8`) pour etre coherent avec tous les autres toggles du formulaire.
- **Boutons Step3** : fleches `←` / `→` supprimees sur les boutons Retour/Continuer pour harmoniser avec les etapes 1, 2, 4 et 5.

### Enrichissement payload Supabase (index.html)

- `newDiagnosticBuildDiagnosticLeadPayload` - correction des anciens noms de champs (`primaryGoal`, `projectHorizon`) vers les nouveaux avec fallback.
- `raw_payload` : ajout de `budget_range`, `works_done`, `decision_horizon`, `is_decision_maker`, `building_age`, `first_name`.

### Ajout mineur

- `DEFAULT_CEILING_HEIGHT` : ajout de `commerce_alim: 3.2` (activite presentante dans ACTIVITIES mais absente du mapping).
- Commentaire DEFAULT_FORM_DATA : `surface` documente comme deplacee en etape 1.

### Fichiers modifies

- `src/engine.js`
- `index.html`
- `CHANGELOG.md`

## [Formulaire 5 etapes] - 2026-04-05

### Refonte formulaire public (4 -> 5 etapes)
- Step1 (Batiment) : activite, adresse, surface, cover image - role retire, surface ajoutee
- Step2 (Equipements) : chauffage, ECS, buildingAge, toiture - surface/ceilingHeight retires, boilerAge conditionnel gaz+fioul, bloc accordeon pour roofInsulation/wallInsulation/VMC/GTB
- Step3 (Consommations) : elec + gaz - champs abonnement retires de l'UI
- Step4 (Projet) : NOUVEAU - travaux, role, objectif, horizon, budgetRange, decideur
- Step5 (Rapport) : NOUVEAU - prenom, email, telephone, societe, RGPD, opt-in
- CTA final : "Generer mon rapport gratuit"
- Stepper mis a jour : 5 etapes avec labels Batiment/Equipements/Consommations/Projet/Rapport

### Nouveau champ budgetRange
- Ajoute dans NEW_DIAGNOSTIC_DEFAULT_FORM_DATA
- Constante NEW_DIAGNOSTIC_BUDGET_RANGES (5 options)
- Transmis au lead scoring (25 pts max)

### buildingAge simplifie (6 -> 4 tranches)
- Synchronise avec engine.js : pre1975, 1975_2000, 2001_2012, post2012

### GA4 tracking mis a jour
- diagnostic_step5_completed ajoute (step_name: contact)
- Labels refactorises : building, equipment, energy, project, contact

### Fichiers modifies
- index.html, exemple-rapport.html (synchronises), ga4.js

## [SEO Phase 2] - 2026-04-03

### Donnees structurees
- Ajout JSON-LD WebSite sur index.html
- Ajout inLanguage: "fr" dans les 3 JSON-LD existants (WebApplication, Article, WebPage)
- Ajout BreadcrumbList JSON-LD sur methode.html et exemple-rapport.html

### Internationalisation
- Ajout hreflang fr + x-default sur les 7 pages publiques

### Maillage interne
- Footer statique enrichi (3 colonnes : DiagTertiaire, Outil, Legal)
- Liens vers pages privees retires de la section Ressources (saaspro, partenaire)
- Lien Espace Pro retire de la nav de methode.html et exemple-rapport.html

### PWA
- Revert site.webmanifest to minimal version (disable PWA install prompt)

### Corrige
- Restauration exemple-rapport.html complet (rapport simule 420 m2 Bordeaux) avec meta SEO conservees
- React passe en production sur exemple-rapport.html

## [SEO] - 2026-04-03

### Performance
- React passe de development a production build (index.html)
- Ajout resource hints : preconnect et dns-prefetch pour unpkg.com et cdn.tailwindcss.com
- Ajout preload pour react.production.min.js et react-dom.production.min.js

### Meta tags
- Ajout og:image et twitter:image sur les 7 pages publiques
- Ajout twitter:title et twitter:description sur methode.html et exemple-rapport.html

### Donnees structurees
- Ajout JSON-LD WebApplication sur index.html
- Ajout JSON-LD Article sur methode.html
- Ajout JSON-LD WebPage sur exemple-rapport.html

### Indexation
- sitemap.xml : suppression /diagnostic (doublon) et /espace-professionnel.html (prive), ajout lastmod
- robots.txt : blocage pages privees (saaspro, pro-alpha, diagnostic.html, public-report-print) et /api/
- vercel.json : ajout X-Robots-Tag noindex sur saaspro, pro-alpha et public-report-print
- diagnostic.html : ajout meta noindex

### Navigation statique
- Nav statique index.html : ajout methode.html, suppression liens vers pages noindex
- Enrichissement du contenu noscript

## [Gouvernance] - 2026-04-02

### Ajoute
- CLAUDE.md a la racine (lu automatiquement par Claude Code)
- .claude/commands/ : fix, feature, check, cleanup (commandes standardisees)
- Regles d'hygiene code : zero code mort, zero doublon, zero orphelin
- Tests moteur obligatoires (3 scenarios de reference)

### Supprime
- api/.claude/commands/ (remplace par les commandes racine)

## [Refactoring] - 2026-04-02

### Extrait
- src/engine.js : moteur de calcul public extrait de index.html (2 420 lignes, source unique)
- src/solar-icons.js : 118 icones SVG Solar extraites de index.html
- index.html reduit de ~11 000 a ~8 700 lignes
- espace-professionnel.html : icones SVG extraites, ENGINE_PRO reste inline (divergence acceptee)

### Modifie
- index.html charge engine.js et solar-icons.js via script tags
- espace-professionnel.html charge solar-icons.js via script tag
- Constantes partagees (BUILDING_AGES, BOILER_AGES, MAX_TOTAL_SAVINGS_PCT) deplacees dans engine.js

## [Nettoyage] - 2026-04-02

### Supprime
- tmp.js, tmp_pdf.js, Note, generate-favicons.mjs (fichiers temporaires)
- .vscode/tasks.json (config msbuild sans rapport)
- docs/RAPPORT-MULTI-AGENTS-EXPERTS.md, docs/WORKFLOW.md (docs obsoletes)
- supabase/migrations/20260315_seed_examples.sql (doublon)
- Doublons .claude dans api/

### Remplace
- diagnostic.html : remplace par redirection vers / (moteur desynchronise)
- methode.html : remplace par page legere dediee (sans moteur)
- exemple-rapport.html : remplace par page legere dediee (sans moteur)

### Ajoute
- AI-CONTEXT.md : documentation pour toutes les IA intervenantes
- .env.example : liste des variables d'environnement
- CHANGELOG.md : suivi des modifications

### Corrige
- Elimination du risque de divergence moteur (suppression des copies)
