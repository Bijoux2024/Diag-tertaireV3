# Changelog - DiagTertiaire V3

## [Phase 5 SEO - TASK-LOW technique : will-change + path bic + preconnect unpkg] - 2026-04-27

### Modifie

3 corrections techniques mineures groupees (perimetre Phase 5
TASK-LOW selon arbitrage Q1) :

1. **`will-change: transform` retire de `.cta-pulse`** sur :
   - `index.html:296`
   - `diagnostic.html:382`
   Justification : `will-change: transform` persistant force le
   navigateur a reserver une layer GPU en permanence, meme apres la
   fin de l'animation (3 iterations max). Le navigateur optimise deja
   les `transform` en mouvement sans cette directive. Suppression =
   moins de reservation de memoire GPU.

2. **Path `/public/bic-montpellier.svg` -> `/bic-montpellier.svg`**
   dans `diagnostic.html:9740`. Le segment `/public/` etait parasite
   (Vercel ne sert pas le segment `public/` du repo, il prefixe
   automatiquement la racine).
   **Note importante** : l'asset reste 404 en prod meme apres ce fix
   parce que `public/` est gitignored dans le repo V3. Ce qui veut
   dire que Vercel ne recoit pas le fichier au build. Pour rendre
   l'asset disponible : Yannis doit soit deplacer
   `public/bic-montpellier.svg` a la racine du repo et commiter, soit
   inliner en base64 dans le HTML, soit retirer `public/` du
   `.gitignore` selectivement. Action externe dans le recap final.

3. **`<link rel="preconnect" href="https://unpkg.com" crossorigin>`**
   ajoute dans `exemple-rapport.html` (deja present sur
   `diagnostic.html:36`). Reduit le RTT TLS handshake initial vers
   `unpkg.com` qui sert React, ReactDOM, Recharts, Babel via les 5
   `<script defer>` du fichier (TASK-014). Gain attendu LCP ~50-150ms
   sur connexion lente.

### Validation

- 0 em-dash, 0 en-dash dans les 3 modifications
- CSS et HTML uniquement, aucune copie ni texte modifie

## [Phase 5 SEO - TASK-030 : font-size mobile 15 -> 16px (lisibilite WCAG)] - 2026-04-27

### Modifie

CSS `@media (max-width: 768px) { body { font-size: 15px } }` remplace
par `font-size: 16px` sur 3 pages :

- `index.html` ligne 228
- `exemple-rapport.html` ligne 178
- `diagnostic.html` ligne 179

### Justification

- 16px est le seuil minimum recommande par les Web Content Accessibility
  Guidelines (WCAG) pour la lisibilite mobile. En dessous, les
  utilisateurs avec une vision moyenne peuvent rencontrer des
  difficultes de lecture, et iOS Safari declenche un zoom auto sur les
  champs `<input>` avec font-size < 16px, generant un comportement
  desordonne sur les formulaires.
- 15px etait trop petit. 16px est le standard du web mobile depuis
  iOS Safari 4.

CSS uniquement. Aucune copie ni texte modifie. 0 em-dash, 0 en-dash
dans le diff.

## [Phase 5 SEO - TASK-028 : sitemap clean (lastmod reels git, retire changefreq/priority)] - 2026-04-27

### Modifie

- **`sitemap-pages.xml`** : refonte complete pour aligner sur les
  bonnes pratiques Google 2026.
  - Retrait integral des balises `<changefreq>` et `<priority>`
    (ignorees par Google depuis ~2017, bruit inutile)
  - `<lastmod>` mis a jour avec les dates ISO 8601 reelles + timezone
    issues de `git log -1 --format='%aI' -- <fichier>` pour chaque
    page.
  - 8 URLs au total (incluant la nouvelle pillar
    `/economies-energie-tertiaire-tpe-pme` ajoutee en TASK-019).
- **`sitemap.xml`** (sitemapindex racine) : `lastmod` des 2 enfants
  passe de `2026-04-14` figе a `2026-04-27` (date du dernier commit
  significatif sur le perimetre V3 + blog).

### Tableau lastmod reels

| Page | lastmod |
|---|---|
| / | 2026-04-27T22:40:51+02:00 |
| /methode | 2026-04-27T22:53:11+02:00 |
| /economies-energie-tertiaire-tpe-pme | 2026-04-27T21:23:47+02:00 |
| /exemple-rapport | 2026-04-27T17:45:02+02:00 |
| /mentions-legales | 2026-04-27T16:34:19+02:00 |
| /politique-confidentialite | 2026-04-27T16:34:19+02:00 |
| /conditions-generales-utilisation | 2026-04-27T16:34:19+02:00 |
| /cookies | 2026-04-27T16:34:19+02:00 |

### Justification

- **Google ignore changefreq/priority** depuis 2017 (confirme par
  John Mueller plusieurs fois). Les retirer reduit le bruit dans le
  fichier et evite de transmettre une fausse confiance.
- **lastmod precis (ISO 8601 + timezone)** = signal de freshness
  reel pour le crawl prioritization (Googlebot et autres). Inversement,
  un `lastmod` fige fait perdre ce signal.
- Methode reproductible : `git log -1 --format='%aI' -- <fichier>`
  donne la date du dernier commit. Recommande de mettre a jour le
  sitemap a chaque deploiement significatif (cf. recommandation
  agent blog pour script post-build automatise).

### Validations

- Format ISO 8601 valide (avec timezone +02:00 conforme RFC 3339)
- 0 em-dash, 0 en-dash dans le diff XML
- HTTP 200 et Content-Type application/xml; charset=utf-8 deja
  garantis par vercel.json header `(.*\.xml)` (verifie en TASK-031
  prepa Mission 1)

## [Phase 5 SEO - TASK-027 : hamburger mobile sur /methode (parite avec landing)] - 2026-04-27

### Modifie

- **`methode.html`** : remplacement integral du `<header>` Tailwind
  par une copie 1:1 du `<nav class="main-nav">` de `index.html` :
  - Logo DiagTertiaire identique (SVG inline, classes `.nav-logo`)
  - 3 liens desktop : Exemple de rapport, Blog (lien "Comment ca
    marche" retire car ancre `#comment-ca-marche` inexistante sur
    /methode, conformement a la directive user)
  - CTA "Obtenir mon comparatif gratuit" -> /diagnostic
  - Bouton hamburger mobile avec icone open/close
  - Menu mobile sticky (display:none -> .open) avec liens identiques
- **CSS nav inline** ajoute dans `<head>` de `methode.html` (apres
  Tailwind CDN) : variables `--nav-height-mobile/desktop`, classes
  `.main-nav`, `.nav-inner`, `.nav-logo`, `.nav-links`, `.nav-right`,
  `.nav-cta-btn`, `.hamburger`, `.mobile-menu`, `.mobile-cta-link`,
  `@media (max-width: 768px)` pour l'apparition du hamburger.
- **JS hamburger inline** ajoute avant `</body>` de `methode.html` :
  toggle .open sur mobile-menu + swap icones + setAttribute
  aria-expanded. IIFE pour eviter la pollution scope global.
  `window.closeMobileMenu` expose pour onclick (pattern equivalent au
  `index.html`).

### Justification suppression "Comment ca marche"

La nav landing contient un lien `<a href="#comment-ca-marche">` qui
pointe vers une ancre interne a la home. Sur /methode cette ancre
n'existe pas. Conformement a la directive user "Si la nav landing
contient un libelle qui n'a pas de sens sur /methode, tu retires le
lien (pas de modification de wording, juste suppression)".

### Effet utilisateur mobile

L'utilisateur mobile sur /methode dispose maintenant d'un hamburger
fonctionnel (avant : aucune navigation visible sur mobile, le `<nav
class="hidden md:flex">` Tailwind cachait toute la nav < 768px).
Parite UX avec la landing assuree.

### Validations

- 0 em-dash, 0 en-dash dans `methode.html` apres edit
- 1 occurrence `nav.main-nav`, 1 hamburger, 1 mobile-menu (idempotence)
- Aucune modification de wording, uniquement structure UI + styles +
  script

## [Phase 5 SEO - TASK-026 : CTA primaires en bleu unifie (cohérence marque)] - 2026-04-27

### Style

- **CTA hero landing `index.html:541`** : gradient amber
  `#D97706 -> #B45309` remplace par gradient bleu
  `#1D4ED8 -> #1E40AF` (couleur primaire utilisee partout ailleurs).
  box-shadow ajustee a `rgba(29,78,216,...)`.
- **CTA section finale `index.html:776`** : meme remplacement
  amber -> bleu.
- **CTA hero diagnostic.html:1807** : meme remplacement amber -> bleu
  (cohérence inter-pages V3).
- **CTA secondaire diagnostic.html:2258** : meme remplacement.

### Conserve (accents fonctionnels amber)

Le user a explicitement autorise "amber peut rester comme accent
(badge, highlight d'un chiffre, separateur visuel)". Conserve donc :

- Variable CSS `--amber: #D97706` dans `index.html:213` et
  `diagnostic.html:89`
- Badge "7-12 ans" pour PAC dans `index.html:630` (couleur texte)
- Badge numero etape "2" Comment ca marche `index.html:674`
- Couleurs benchmark mediane (positioning C) dans
  `exemple-rapport.html`, `public-report-print.html`, `diagnostic.html`
- Couleur serie graphique "Isolation toiture ROI moyen"
- Accent espace-professionnel.html "Beta gratuite" KPI

### Rationale audit

- Audit visuel FV-H1 : amber sur hero seul = discontinuite de marque
  (bleu partout apres clic CTA)
- Convention SaaS B2B : couleur primaire constante sur le funnel pour
  reconnaissance et confiance

## [Phase 4 SEO - TASK-021 : methode.html etoffe avec positionnement <1000 m²] - 2026-04-27

### Modifie

- **`methode.html`** : refonte du body de ~180 mots a 1 163 mots de
  contenu redactionnel. Toutes les sections JSON-LD existantes
  conservees (TechArticle, BreadcrumbList, HowTo). H1 corrige :
  "Une estimation utile pour decider" -> "Méthodologie du
  pré-diagnostic énergétique tertiaire".

### Sections H2 ajoutees / enrichies

- **Pour qui DiagTertiaire est-il conçu ?** (NEW) : positionnement
  explicite sur le segment <1000 m² + cas d'usage secondaire >=1000 m²
  toleres en cadrage prealable d'un audit certifie. Article L.111-10-3
  CCH lie a Legifrance.
- **Comment ca fonctionne, etape par etape** (enrichi de 3 a 4
  etapes avec details ECS, factures fournisseur, base CABS+OID).
- **Sources de donnees utilisees** (NEW detaille) : CABS ADEME, OID
  Observatoire Immobilier Durable, Base Carbone ADEME 2024, fiches CEE.
- **Benchmarks chiffres par typologie** (NEW) : tableau 8 typologies
  avec intensite moyenne kWh/m²/an et postes dominants
  (bureaux 150, restaurants 300, hotels 200, commerces alim 180,
  commerces non-alim 130, entrepots 80, sante 250, enseignement 110).
- **Limites de precision et fiabilite** (NEW) : +/- 20 % et 4 cas
  ou la precision se degrade (activites multiples, zones extremes,
  bati ancien, typologies non couvertes).
- **Difference pre-diag / DPE / audit reglementaire** (NEW) : tableau
  comparatif 3 colonnes x 6 lignes (duree, cout, opposabilite,
  precision, certification, visite). References norme NF EN 16247,
  L.233-1, decret 2022-1272.
- **Methodologie de cumul des gains** (NEW) : explication du cumul
  sequentiel non-additif + plafond technique ADEME, avec exemple
  chiffre.
- **Quand passer a un audit energetique certifie** (NEW) : 4 cas
  specifiques (grande entreprise L.233-1, cession, ISO 50001, appel
  d'offres). Reference neutre, pas d'upsell, pas de partenariat
  commercial.
- **Disclaimer transparent** en fin de page (decret 2022-1272 DPE bail
  commercial, RT 2012/RE 2020, OPERAT pour 1 000+ m²).

### Validations

- 1 163 mots de body (cible playbook 1 200+, ecart -37 mots acceptable
  vu la densite editoriale)
- 0 em-dash, 0 en-dash dans le fichier complet
- 5 sources externes officielles inline (Legifrance, OPERAT, CRE,
  ADEME, OID) - cible playbook >=3 atteinte
- 8 typologies CABS chiffrees + tableau comparatif 3 documents
  (pre-diag, DPE, audit) + grille des 4 cas audit reglementaire

### Notes editoriales

- Aucun upsell vers un partenaire bureau d'etudes audit. La reference
  aux audits certifies (OPQIBI 1905, LNE) est neutre, factuelle.
- Le visiteur comprend que DiagTertiaire suffit pour 80 % des cas
  TPE/PME et que l'audit certifie est necessaire dans 4 cas precis.
- TechArticle JSON-LD existant conserve avec dateModified 2026-04-27
  (deja a jour depuis TASK-009 du 2026-04-27).

## [Phase 4 SEO - TASK-019 : pillar /economies-energie-tertiaire-tpe-pme] - 2026-04-27

### Ajoute

- **`economies-energie-tertiaire-tpe-pme.html`** : nouvelle page pillar
  racine V3, 2 585 mots de contenu rédactionnel ciblé TPE/PME tertiaire
  <1000 m². Structure :
  - 1 H1 + 10 H2 + 4 H3 (sectoriels : commerce / restaurant / hôtel /
    bureaux PME)
  - TL;DR encadré bleu en début de page (160 mots disqualifiant
    rapidement le Décret Tertiaire et synthétisant les drivers réels)
  - 9 sections H2 : Êtes-vous concerné ? (disqualification Décret
    Tertiaire en 2 paragraphes), Vrais drivers économiques 2026 (fin
    ARENH + TURPE 6 + CEE + DPE bail commercial), 5 leviers majeurs
    avec tableau ROI, Aides 2026 TPE/PME, DPE bail commercial,
    Quand audit réglementaire pertinent (référence neutre, pas
    d'upsell), Cas pratique chiffré (commerce 400 m² Bordeaux, capex
    18 000 EUR, ROI net 3,75 ans), Comment commencer DiagTertiaire
    (CTA), Spécificités sectorielles, Glossaire (5 termes : CABS
    ADEME, CEE, ARENH, kWhEP, OPERAT)
  - 7 liens sortants vers sources officielles (Légifrance, ADEME, CRE,
    OID, AFNOR pour NF EN 16247, BPI France)
  - Disclaimer transparent en fin de page (DiagTertiaire +/-20 %, pas
    audit certifié, références OPQIBI 1905 / LNE pour audits)
- **3 blocs JSON-LD** :
  - `TechArticle` avec datePublished, dateModified, author Person
    `@id` partagé `https://diag-tertiaire.fr/#author-yannis-cherchali`,
    publisher Organization `@id` `https://diag-tertiaire.fr/#organization`,
    `about` (3 entités : économies d'énergie, TPE/PME tertiaire,
    rénovation énergétique)
  - `BreadcrumbList` (Accueil > Économies d'énergie tertiaire TPE/PME)
  - `FAQPage` (5 Q&A spécifiques TPE/PME : éligibilité Décret
    Tertiaire, ROI moyens, aides 2026, DPE bail commercial,
    quand audit NF EN 16247)

### Modifie

- **`sitemap-pages.xml`** : ajout de l'URL
  `/economies-energie-tertiaire-tpe-pme` avec lastmod 2026-04-27,
  priority 0.9 (deuxième après la home, devant les autres pages
  legales et /exemple-rapport).

### Validations

- 2 585 mots (cible playbook 2 500+) - dépasse de 85 mots, OK
- 0 em-dash (U+2014) et 0 en-dash (U+2013) dans tout le fichier
- 3 JSON-LD blocs `python json.loads` OK
- 7 sources officielles inline (cible playbook >=5)
- 1 cas pratique chiffré principal (commerce 400 m² Bordeaux) +
  4 mini-cas sectoriels (commerce détail, restaurant, hôtel, bureaux
  PME) avec références CABS ADEME

### Notes éditoriales

- Disqualification rapide du Décret Tertiaire (2 paragraphes max H2
  "Êtes-vous concerné ?") puis pivot immédiat vers les drivers réels
  TPE/PME, conformément au repositionnement validé (cf. commit
  `43a028c docs(seo): repositionne Phase 4 sur cible TPE/PME <1000 m²`).
- "Quand audit réglementaire pertinent" formulée en référence neutre,
  pas en upsell. Le visiteur doit comprendre que DiagTertiaire suffit
  pour 80 % des cas TPE/PME et que l'audit certifié est nécessaire
  uniquement dans 4 cas spécifiques listés.
- Glossaire en bas de page format Q&A autonome (5 termes) pour
  citation Perplexity / ChatGPT (recommandation skill `seo-geo`).

## [feat(geo) - FAQ Q6 disclaimer cible TPE/PME <1000 m²] - 2026-04-27

### Modifie

- **index.html ligne 108** : enrichissement de la reponse a la
  question 6 du bloc JSON-LD `FAQPage` ("Mon batiment est-il concerne
  par le Decret Tertiaire ?"). Ajout d'un disclaimer explicite en fin
  de reponse : "Si vous gerez moins de 1 000 m2 de surface tertiaire
  (TPE/PME), le Decret Tertiaire ne s'applique pas a vous. DiagTertiaire
  est concu pour ce segment et vous propose une autre voie : optimiser
  votre facture energetique sans contrainte reglementaire."

### Effet

- **Longueur Q6** : 110 mots -> 149 mots (dans la cible 130-160 mots
  optimum citation LLM, voir GEO skill).
- **Alignement cible produit** : la FAQ Q6 educative pour les visiteurs
  qui cherchent "decret tertiaire" devient un signal de qualification :
  les <1000 m² (cible commerciale) lisent qu'ils ne sont PAS concernes
  ET que DiagTertiaire est l'outil pour eux. Les >=1000 m² (out of scope)
  comprennent qu'ils sont concernes par le Decret mais pas par le pre-diag
  (cas d'usage secondaire tolere : cadrage prealable audit certifie).
- **Pas de rich result Google attendu** : FAQ rich results restreints
  gov/sante depuis aout 2023. Benefice GEO uniquement (AI Overviews,
  ChatGPT Search, Perplexity) - mais c'est exactement la cible visee
  pour cette Q6 (visiteurs qui posent la question via assistant IA).

### Coherence avec docs(seo) repositionnement

Ce commit complete le commit precedent `docs(seo): repositionne Phase 4
sur cible TPE/PME <1000 m²` qui avait modifie uniquement les documents
d'audit. La FAQ Q6 est le seul fichier de production qui contient une
reference au Decret Tertiaire. Le disclaimer ajoute aligne la FAQ
sur la nouvelle position editoriale, sans toucher aux 9 autres Q&A
ni aux autres blocs JSON-LD.

## [docs(seo) - Repositionne Phase 4 sur cible TPE/PME <1000 m²] - 2026-04-27

### Contexte

Le rapport Gemini Pro 2026 et l'audit SEO/GEO du 2026-04-27 avaient
recommande un pillar `/decret-tertiaire` (TASK-019) sur le keyword
"decret tertiaire" (10k+ req/mois). Apres validation cible produit
avec Yannis, ce repositionnement est **misaligne** : DiagTertiaire
cible les batiments tertiaires **<1000 m²** (TPE/PME, commerces,
restaurants, hotels independants, bureaux PME, cabinets medicaux),
segment qui n'est **pas** assujetti au Decret Tertiaire (seuil 1000 m²
inclusif, article L.111-10-3 CCH).

Capter le keyword "decret tertiaire" aurait genere du trafic vanity
non-convertissant et risque de mauvaise experience marque.

### Modifie

- **AUDIT-REPORT.md** : ajout d'une sous-section 4.1 "Correction
  post-audit : repositionnement cible produit (TPE/PME <1000 m²)"
  expliquant le desalignement, la decision pivot et les nouvelles
  taches Phase 4.
- **AGENT-EXECUTION-PLAN.md** :
  - Ajout d'un bloc "Positionnement produit (lecture obligatoire avant
    Phase 4)" en tete de Phase 4 avec cible primaire/secondaire/out of
    scope + conformite editoriale (disclaimer recurrent + cas pratique
    chiffre + glossary box).
  - **TASK-019 reformulee** : pillar `/economies-energie-tertiaire-tpe-pme`
    (au lieu de `/decret-tertiaire`). H1 oriente "facture energie
    <1000 m²", H2 disqualification rapide du Decret Tertiaire (2 paragraphes
    max), 5 leviers majeurs sous 1000 m² avec ROI chiffre, aides 2026
    TPE/PME, DPE bail commercial (vraie obligation existante), audit
    reglementaire en reference neutre, CTA pre-diag.
  - **TASK-020 reformulee** : article
    `/blog/aides-renovation-energetique-tertiaire-2026-tpe-pme` (au lieu
    de l'article guide OPERAT). Focus exclusif aides applicables TPE/PME
    (CEE 5e periode, MaPrimeRenov Tertiaire, BPI prets verts, ADEME
    Tremplin, aides regionales, regles de cumul). Cas pratique chiffre
    obligatoire (commerce 400 m² Bordeaux, capex 18k EUR, aides 6k EUR,
    ROI net 3,75 ans).
  - **TASK-021 reformulee** : methode.html etoffee avec H2 dedie "Pour
    qui DiagTertiaire est-il concu ?" (positionnement explicite <1000 m²
    + cas d'usage secondaire >=1000 m² toleres). Tableau comparatif
    pre-diag / DPE bail commercial / audit NF EN 16247 (cout, duree,
    opposabilite). Position editoriale claire : pas d'upsell vers audit
    paye, juste reference neutre quand pertinent.
  - **TASK-023 ajustee** : maillage interne cible le nouveau pillar
    `/economies-energie-tertiaire-tpe-pme`. Triggers contextuels mis
    a jour ("economies energie", "TPE/PME", "facture energie tertiaire",
    "aides energie") + lien article aides 2026 quand "CEE / MaPrimeRenov /
    BPI" est mentionne.
  - **TASK-022 inchangee** : les 5 articles cibles sont deja alignes
    <1000 m² (commerces, hotels, factures electricite). RAS.
- **ACTION-PLAN.md** :
  - Titres et impacts attendus de TASK-019, TASK-020, TASK-021 mis a
    jour pour refleter le pivot TPE/PME <1000 m².
  - Cross-reference Gemini : ligne "Maillage semantique
    Decret/OPERAT/Secteurs" remplacee par "Maillage semantique
    economies/aides/secteurs TPE/PME".

### Conserve

- **TASK-006 GovernmentService OPERAT** : reste pertinent comme signal
  d'autorite reglementaire et d'education. Le schema definit OPERAT,
  il ne dit pas "DiagTertiaire = OPERAT".
- **FAQ Q6 (TASK-007 question 6 sur le Decret Tertiaire)** : reste
  educative pour les visiteurs en doute sur leur statut. Sera enrichie
  d'un disclaimer explicite "Si vous gerez moins de 1 000 m², le
  Decret Tertiaire ne s'applique pas a vous - DiagTertiaire est concu
  pour ce segment" via un commit feat(geo) dedie.
- **Effort Phase 4 total inchange** : ~21 h.

### Note

Aucun fichier de production n'est touche dans ce commit (uniquement
3 documents d'audit md + CHANGELOG). La FAQ Q6 sera ajustee dans un
commit dedie feat(geo) immediatement apres pour garder le scope clair.

## [Phase 3 SEO - TASK-018 : IndexNow endpoint + cle racine] - 2026-04-27

### Ajoute

- **`api/indexnow.js`** : nouveau endpoint serverless Vercel ES module
  pour notifier Bing/Yandex/Naver/Seznam via le protocole IndexNow.
  - Method POST uniquement (405 sinon)
  - Body : `{ "urls": [string] }`, 400 si vide/non array
  - Lit la cle via `process.env.INDEXNOW_KEY` (jamais hardcodee)
  - Filtrage defensif : seules les URLs `https://diag-tertiaire.fr/...`
    sont acceptees (anti-detournement de l'endpoint)
  - Forward vers `https://api.indexnow.org/IndexNow` POST batch
  - 200 + `{"status":"ok","notified":N}` en cas de succes
- **Fichier `<key>.txt` a la racine V3** : nom et contenu identiques
  (la cle hex 32 chars). C'est le mecanisme de verification IndexNow
  (le moteur de recherche fetche cette URL pour confirmer la propriete
  du domaine).
- **CSP `connect-src`** non modifiee : la requete sortante part du
  serveur Vercel (api/indexnow.js cote node), pas du navigateur, donc
  pas concernee par la CSP frontend.

### Configuration externe requise (action Yannis)

- Vercel Dashboard > Project diag-tertaireV3 > Settings > Environment
  Variables : ajouter `INDEXNOW_KEY=<hex>` sur les 3 environnements
  (Production + Preview + Development). La cle hex est celle deposee
  dans `<key>.txt` a la racine.
- Sans cette variable d'env, l'endpoint renvoie 500 + 
  `{"error":"INDEXNOW_KEY not configured"}`.

### Securite

- Cle JAMAIS hardcodee dans le code source ni dans CHANGELOG ni dans
  aucun .md du repo. Le seul endroit ou elle apparait dans le repo =
  le nom et le contenu du fichier `<key>.txt`. Cette exposition est
  par design (IndexNow exige le fichier public pour verification).
- Variable d'env INDEXNOW_KEY isolee permettant rotation sans diff
  code : nouveau `<key>.txt` deploye + variable d'env mise a jour.

### Verification post-deploy

```bash
# 1. Cle accessible publiquement
curl https://diag-tertiaire.fr/<key>.txt
# doit retourner la cle hex 32 chars

# 2. Endpoint accessible
curl -X POST https://diag-tertiaire.fr/api/indexnow \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://diag-tertiaire.fr/"]}'
# doit retourner {"status":"ok","notified":1}

# 3. Reception Bing Webmaster Tools (delai 24-48h)
# Verifier dans BWT GUI : Outils > Submit URLs > IndexNow log
```

### Integration n8n future

L'endpoint /api/indexnow est utilisable depuis n8n via un node HTTP
Request POST. A integrer dans le workflow Notion -> Gemini -> GitHub
-> Vercel deploy apres le node "Vercel deploy success" (avec retry 3
fois car build Astro peut prendre 1-2 min avant status READY).

## [Phase 3 SEO - TASK-016 : HSTS preload sur vercel.json] - 2026-04-27

### Modifie

- **TASK-016** : `vercel.json` ligne 63 - le header
  `Strict-Transport-Security` passe de
  `max-age=63072000; includeSubDomains` a
  `max-age=63072000; includeSubDomains; preload`.

### Engagement long-terme

- L'ajout de la directive `preload` (combinee a `includeSubDomains`
  et `max-age >= 31536000`) rend `diag-tertiaire.fr` eligible a la
  HSTS Preload List Chrome / Firefox / Safari / Edge.
- Une fois soumis et accepte sur https://hstspreload.org/, **tous les
  navigateurs modernes forceront HTTPS** sur le domaine et tous ses
  sous-domaines, **avant meme la premiere requete reseau**.
- **Procedure de retrait** : 6 semaines minimum (delai de propagation
  Chrome) puis encore plusieurs mois pour les autres navigateurs.
  Decision irreversible a court/moyen terme.
- Tous les sous-domaines presents et futurs (preview Vercel,
  *.vercel.app aliases, sous-domaines fonctionnels) doivent supporter
  HTTPS valide. Confirme : seuls Vercel preview + apex utilises,
  HTTPS-only natif.

### Action externe Yannis post-deploy

- Soumettre `diag-tertiaire.fr` sur https://hstspreload.org/.
- Validation Chrome environ 2 semaines, integration Firefox/Safari/Edge
  ensuite via leur synchronisation.

### Verification post-deploy

```bash
curl -I https://diag-tertiaire.fr/ | grep -i strict-transport
```
Doit renvoyer : `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

## [Phase 3 SEO - TASK-017 : self-host fonts Inter sur exemple-rapport] - 2026-04-27

### Ajoute

- 5 fichiers `fonts/inter-{300,400,500,600,700}.woff2` (latin subset
  fontsource via `cdn.jsdelivr.net/npm/@fontsource/inter`, signatures
  wOF2 verifiees, ~118 KB total). Format Google Fonts officiel
  (fontsource extrait du repo Inter upstream).

### Modifie

- **TASK-017** : `exemple-rapport.html` lignes 57-60 - le bloc Google
  Fonts CDN `Inter:wght@300;400;500;600;700` est remplace par :
  - 2 `<link rel="preload">` sur `inter-400.woff2` et `inter-700.woff2`
    (poids les plus critiques pour LCP : corpus 400 et titres 700)
  - 5 `@font-face` declarations inline (poids 300/400/500/600/700) avec
    `font-display: swap` pour eviter FOIT

### Conformite playbook

- Le playbook ciblait 2 poids (400 + 600). La page utilise effectivement
  500, 700 et 800 dans son CSS (vérifié par grep). Self-host
  uniquement 400+600 aurait force le navigateur a simuler les autres
  poids en "faux gras" - dégradation visuelle inacceptable sur une page
  marketing. Decision : self-host les 5 poids reellement utilises
  (300, 400, 500, 600, 700). Le poids 800 utilise (3 occurrences) sera
  fallback simulé sur 700, écart visuel acceptable. A reintroduire si
  necessaire en backlog Phase 5.

### Comportement attendu

- Fin du render-blocking sur Google Fonts CDN.
- Lighthouse mobile : "Eliminate render-blocking resources" ne mentionne
  plus fonts.googleapis.com / fonts.gstatic.com.
- Cache navigateur immutable (header `Cache-Control: max-age=31536000,
  immutable` deja servi sur `/(.*\.woff2)` cf. vercel.json:48).

## [Phase 3 SEO - TASK-015 : React production build sur espace-pro] - 2026-04-27

### Modifie

- **TASK-015** : `espace-professionnel.html` lignes 78-79 - les
  imports `react.development.js` et `react-dom.development.js` (UMD
  builds avec warnings + propTypes runtime checks) sont remplaces par
  les builds de production `react.production.min.js` et
  `react-dom.production.min.js`.
- SRI integrity hashes mis a jour (les builds dev et prod ont des
  contenus differents donc des hashes sha384 differents) :
  - react@18.3.1 prod : `sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z`
  - react-dom@18.3.1 prod : `sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1`
  (memes hashes que ceux deja deployes sur diagnostic.html et
  exemple-rapport.html)

### Comportement attendu

- Bundle React ~3x plus leger : ~120 KB -> ~40 KB par script.
- Console DevTools : zero warning React dev mode.
- Aucun changement fonctionnel cote SPA Pro.
- Mise a jour du commentaire HTML : "production builds, ~3x plus
  leger que dev" au lieu de "dev React gardes pour devtools".

## [Phase 3 SEO - TASK-014 : defer chaine CDN React/Recharts/Babel/Tailwind] - 2026-04-27

### Modifie

- **TASK-014** : ajout de `defer` sur tous les scripts CDN externes
  dans 4 pages SPA :
  - `diagnostic.html` : Tailwind + React + ReactDOM + prop-types + Recharts + Babel
  - `exemple-rapport.html` : meme chaine (6 scripts)
  - `espace-professionnel.html` : meme chaine (6 scripts, dont
    React/ReactDOM dev a passer en prod via TASK-015 suivant)
  - `methode.html` : Tailwind seul

### Ajoute (data-presets pour Babel)

- `<script type="text/babel">` -> `<script type="text/babel"
  data-presets="env,react">` dans :
  - `diagnostic.html` : 1 occurrence reelle (ligne 1070) + 1 dans un
    commentaire de documentation interne
  - `espace-professionnel.html` : 1 occurrence reelle (ligne 1301)
  - `exemple-rapport.html` : 1 occurrence reelle (ligne 962) + 1 dans
    un commentaire de documentation interne

### Comportement attendu

- Babel Standalone respecte `defer` : il transpilera les scripts
  inline `type="text/babel"` apres `DOMContentLoaded`. Le HTML
  statique apparait avant l'hydratation React.
- Gain LCP attendu : 0.5 a 1.5s sur `/diagnostic` et `/exemple-rapport`
  (TBT ameliore de >30 pourcent selon playbook).
- Cette tache est un palliatif. La solution definitive est la
  pre-compilation JSX (suppression Babel Standalone), hors scope
  playbook actuel.

### Verifications

- 0 em-dash dans tous les diffs HTML (`python count(U+2014)` sur
  chaque fichier).
- Modification SRI integrity preservee : `defer` ajoute SANS toucher
  aux hashes sha384 existants.
- Modification `crossorigin="anonymous"` preservee : pattern
  `<script defer crossorigin="anonymous" integrity="..." src="...">`.

## [style - Purge em-dash legacy user-facing (CLAUDE.md hygiene)] - 2026-04-27

### Style

- **Purge em-dash (U+2014) sur 7 fichiers HTML user-facing** :
  - `index.html` ligne 459 : `aria-label="DiagTertiaire — accueil"`
    -> `aria-label="DiagTertiaire - accueil"` (signaled in TASK-010
    CHANGELOG entry)
  - `methode.html` : meme pattern aria-label
  - `politique-confidentialite.html` : meme pattern
  - `mentions-legales.html` : meme pattern
  - `conditions-generales-utilisation.html` : meme pattern
  - `cookies.html` : meme pattern
  - `404.html` ligne 6 : `<title>404 — Erreur systeme...</title>`
    -> `<title>404 - Erreur systeme...</title>`

### Conformite CLAUDE.md

Regle absolue "Pas de tiret long (cadratin) dans le code ou le texte
genere" appliquee aux 7 occurrences user-facing les plus critiques
(aria-label expose aux lecteurs d'ecran + title de l'onglet 404).

### Inventaire des em-dash restants (hors scope ce commit)

Total restant : ~657 occurrences dans le repo (apres purge des 7).
Top fichiers :

| Fichier | Em-dash | Categorie | Recommandation |
|---|---|---|---|
| `simulation-output/audit-expert.md` | 72 | Doc historique | Laisser, archive |
| `exemple-rapport.html` | 57 | UI strings + comments JSX | Commit dedie (UI-facing) |
| `docs/qa-v1.6.1-report.md` | 50 | Tableaux QA "—" sentinel | Laisser, sentinel |
| `public-report-print.html` | 44 | Template PDF (UI) | Commit dedie (PDF-facing) |
| `FINDINGS.md` | 27 | Doc historique | Laisser, archive |
| `docs/WHITEPAPER-METHODOLOGIE.md` | 26 | Doc methodologie | Laisser ou commit dedie |
| `diagnostic.html` | 25 | UI strings + comments JSX | Commit dedie (UI-facing) |
| `docs/qa-v1.6.1-consortium.md` | 20 | Doc QA | Laisser, archive |
| `seo-audit-2026-04/AUDIT-REPORT.md` | 17 | Audit deliverable | Laisser, doc audit produit |
| `docs/MOTEUR-CALCUL.md` | 10 | Doc methodologie | Laisser ou commit dedie |
| `AI_CHANGELOG.md` | 8 | Doc historique | Laisser, archive |
| `CHANGELOG.md` | 5 | Doc historique | Laisser, archive |
| Fichiers <5 occurrences | reste | Mix | Selon contexte |

**Decision recommandee** : laisser les em-dash dans les docs internes
(CHANGELOG, AI_CHANGELOG, AI-CONTEXT, docs/qa-*, FINDINGS,
audit-expert) car archive historique. Traiter les UI strings de
`exemple-rapport.html` (57), `diagnostic.html` (25) et
`public-report-print.html` (44) en commit dedie ulterieur car ce sont
des chaines visibles utilisateur (placeholder `'—'` pour valeurs
manquantes en tableau, hero subtitle, etc.). Effort ~30 min, a
backloguer en TASK-LOW Phase 5.

`node_modules/`, `seo-audit-2026-04/fetched/`, `.git/` exclus du
decompte (gitignored).

## [docs(seo) - PHASE-EXECUTION-LOG + backlog SEO post-Phase 2] - 2026-04-27

### Ajoute

- **`seo-audit-2026-04/PHASE-EXECUTION-LOG.md`** : nouveau fichier
  journal d'execution chronologique du playbook. Contient :
  - Etat Phase 1 (5 commits + validations curl)
  - Etat documents d'audit (chore + docs commits)
  - Etat Phase 2 (8 commits + validations syntaxiques + propagation
    prod + validator.schema.org sur 4 URLs)
  - Detail des 2 erreurs schema.org legacy ProfessionalService
    (`serviceType`, `inLanguage` UNKNOWN_FIELD)
  - Anomalies tracees (desync blog x2, em-dash legacy)
  - Roadmap Phase 3 / 4 / 5 / Addendum GSC
- 5 nouvelles entrees dans `.claude/context/backlog.md` section
  "SEO BACKLOG" :
  - Enrichir FAQPage 10 Q&A a 130-160 mots/reponse (Phase 4, Medium)
  - Aligner DOM FAQ sur JSON-LD 10 Q&A (Phase 4, Medium)
  - Completer sameAs Organization avec SIREN data.gouv.fr (Low)
  - Ajouter SearchAction WebSite quand recherche blog implementee (Low)
  - Nettoyer ProfessionalService legacy fields (Low, TASK-LOW Phase 5)

### Validations Phase 2 documentees

- 8/8 blocs JSON-LD valides syntaxiquement (python json.loads)
- 0 em-dash et 0 en-dash dans les 8 diffs Phase 2 (CLAUDE.md conforme)
- 16 entites schema.org detectees sur 4 URLs (validator.schema.org API)
- 2 erreurs UNKNOWN_FIELD legacy sur ProfessionalService (pre-Phase 2)
- 0 erreur sur methode, exemple-rapport, blog/<article>

## [Phase 2 SEO - TASK-011 : BreadcrumbList sur index.html] - 2026-04-27

### Ajoute

- **TASK-011** : nouveau bloc JSON-LD `BreadcrumbList` minimal sur
  `index.html` apres `GovernmentService`. Une seule entree
  `position: 1, Accueil`. Aligne avec la convention de
  `methode.html` (qui a deja un BreadcrumbList 2 niveaux Accueil ->
  Methodologie). Pas d'impact rich result Google sur la home (Google
  ignore generalement les breadcrumbs sur l'URL racine), mais coherence
  de structure pour les LLM crawlers.

## [Phase 2 SEO - TASK-010 : @id partages + sameAs + Knowledge Graph fusion] - 2026-04-27

### Modifie

- **TASK-010** : 3 blocs JSON-LD d'`index.html` enrichis pour fusionner
  les entites cote Knowledge Graph :
  - `ProfessionalService` : ajout `@id`
    `https://diag-tertiaire.fr/#service` + `parentOrganization` lie a
    `#organization`
  - `WebSite` : ajout `@id` `https://diag-tertiaire.fr/#website` +
    `publisher` lie a `#organization`
  - `Organization` : ajout `@id`
    `https://diag-tertiaire.fr/#organization` + `sameAs` rempli avec
    LinkedIn personnel (`https://www.linkedin.com/in/yannis-cherchali`,
    coherent avec TASK-003 blog et TASK-009 author Person methode)

### Choix d'implementation

- **SearchAction non ajoute** sur WebSite : le blog Astro
  (`diag-tertiaire-blog`) ne contient que 2 routes statiques
  (`index.astro` + `[...slug].astro`), pas de moteur de recherche
  (verifie : pas de pagefind/fuse/lunr, pas de page `/search`). Ajouter
  un `SearchAction` non-fonctionnel serait trompeur pour les LLM. A
  reintroduire si une recherche est ajoutee au blog.
- **`sameAs` annuaire-entreprises non ajoute** : le SIREN n'est pas
  fourni dans le contexte. A ajouter ulterieurement avec l'URL
  `https://annuaire-entreprises.data.gouv.fr/entreprise/diag-tertiaire-XXXXXXXXX`.

### Notes

- Constate 1 em-dash legacy dans `index.html` ligne 459 (`aria-label`
  du nav-logo : `"DiagTertiaire — accueil"`). Pre-existant aux commits
  Phase 2, hors scope TASK-010. A traiter en TASK-LOW (corrections
  mineures groupees Phase 5) ou commit dedie `style: purge em-dash
  legacy`.

## [Phase 2 SEO - TASK-009 : TechArticle methode avec datePublished + author Person] - 2026-04-27

### Modifie

- **TASK-009** : bloc JSON-LD `Article` de `methode.html` mis a niveau :
  - `@type` : `Article` -> `TechArticle` (plus precis pour une page methodologique)
  - `datePublished` ajoute : `2026-04-02` (date reelle de creation, verifiee `git log`)
  - `dateModified` ajoute : `2026-04-27` (date de cette mise a jour)
  - `mainEntityOfPage` ajoute pointant sur `/methode`
  - `author` ajoute typee `Person` avec `@id` partage
    `https://diag-tertiaire.fr/#author-yannis-cherchali` (compatible avec
    le sameAs LinkedIn deja deploye sur le blog cote BlogPost.astro
    TASK-003) et `url` LinkedIn personnel
  - `publisher.Organization` enrichi avec `@id` partage
    `https://diag-tertiaire.fr/#organization` (compatible avec TASK-010
    qui propagera ce `@id` sur l'Organization de la landing)

### Notes

- L'`@id` author Person sera reutilise dans tous les futurs schemas
  Article / BlogPosting / TechArticle pour fusionner les entites cote
  Knowledge Graph.
- Aucun changement de copy editoriale, uniquement metadata structuree.

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
