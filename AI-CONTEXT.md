# AI-CONTEXT.md - DiagTertiaire V3

> Lis ce fichier EN ENTIER avant toute modification du code.

## Ce que fait ce projet

DiagTertiaire est un outil de pre-diagnostic energetique pour batiments tertiaires.
L'utilisateur repond a quelques questions simples et recoit :
- une estimation energetique vs reference sectorielle
- un score de performance
- un top 3 d'actions prioritaires avec gains estimes
- un rapport PDF telechargeable

C'est un outil d'ORIENTATION DECISIONNELLE, pas un audit energetique.

## Architecture technique

- **Front** : HTML statique + React 18 (CDN) + Tailwind (CDN) - PAS de bundler, PAS de build
- **Backend** : Vercel Serverless Functions (Node.js)
- **BDD** : Supabase (PostgreSQL)
- **PDF** : Puppeteer + @sparticuz/chromium cote serveur (Vercel)
- **Deploiement** : Vercel (auto-deploy sur push main)
- **Analytics** : GA4 via ga4.js
- **Consentement** : cookie-consent.js

## Fichiers critiques

| Fichier | Role | Attention |
|---|---|---|
| `src/engine.js` | Moteur de calcul public (source unique) | ENGINE_VERSION 1.6.2 - toute modif = tester les 4 scenarios de CLAUDE.md |
| `src/solar-icons.js` | Dictionnaire des 118 icones SVG Solar | Partage entre index.html et espace-professionnel.html |
| `index.html` | Landing + composants React + rapport (~8 700 lignes) | Charge engine.js et solar-icons.js via script tags |
| `espace-professionnel.html` | Espace professionnel (auth, workspace, branding) | Moteur Pro independant (ENGINE_PRO), pas encore migre sur engine.js. Divergence connue et acceptee a ce stade |
| `public-report-print.html` | Template de rendu PDF serveur (Puppeteer) | Doit rester synchronise avec le moteur |
| `/api/` | Endpoints serverless Vercel | Bien decoupe, ne pas fusionner |
| `/supabase/migrations/` | Schema BDD | Executer dans l'ordre chronologique |

## Regles absolues (a ne jamais violer)

1. **Buildless** : pas de bundler, pas de build step. Tout est charge directement via `<script>` ou CDN
2. **Pas de tiret long** (cadratin) dans le code ou le texte genere
3. **Pas de division par zero**, pas de NaN, pas de valeur undefined non geree
4. **Cumul des gains sequentiel** et non additif (le gain de l'action 2 s'applique sur le reste apres action 1)
5. **localStorage = fallback legacy**, Supabase = source de verite pour le Pro
6. **Ne pas casser le mode #report=** (partage de rapport sans authentification)
7. **Toute modification du moteur** doit etre testee sur minimum 3 scenarios (bureau, restaurant, commerce)
8. **Exclusion des actions deja realisees** dans le calcul des recommandations

## Prix de reference (2026 - mis a jour)

| Parametre | Valeur | Source |
|---|---|---|
| Electricite | 0.196 euros/kWh TTC | TRVE pro <= 36 kVA, CRE fev 2026 |
| Gaz | 0.108 euros/kWh TTC | CRE prix repere pro 2026 |
| Fioul | 0.118 euros/kWh | Prix livraison pro Q1 2026 |
| Reseau chaleur | 0.095 euros/kWh | Moyenne nationale SNCU |
| Facteur emission elec | 0.079 kgCO2/kWh | ADEME RE2020 mensualisee par usage |
| Facteur emission gaz | 0.227 kgCO2/kWh | Base Carbone ADEME 2024 |
| Facteur emission fioul | 0.324 kgCO2/kWh | Base Carbone ADEME 2024 |

## Seuils de scoring A-E (index.html ligne 6523)

Le score est calcule sur le ratio intensite / mediane sectorielle :

| Score | Seuil ratio | Signification |
|---|---|---|
| A | ratio < 60% | Tres performant |
| B | ratio < 90% | Performant |
| C | ratio < 120% | Dans la reference |
| D | ratio < 170% | Sous-performant |
| E | ratio >= 170% | Tres sous-performant |

## Medianes sectorielles (src/engine.js - NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY)

| Activite | Mediane kWh/m2/an | Source |
|---|---|---|
| offices (bureaux) | 135 | ADEME ECNA 2022 |
| retail (commerce non-alim) | 210 | CEREN 2019 revise |
| retail_food / commerce_alim | 360 | ADEME froid alimentaire |
| hotel | 230 | ADEME Hotellerie 2024 |
| restaurant | 270 | ADEME HORECA |
| education (enseignement) | 110 | ADEME / OPERAT |
| health_local (sante) | 195 | Estimation |
| warehouse_heated (entrepot chauffe) | 135 | Estimation |
| light_warehouse (entrepot leger) | 45 | CEREN Logistique |

## Aides financieres par action (src/engine.js - aid_pct)

Les aides sont exclusivement en tertiaire commercial (hors MaPrimeRenov' Pro qui est residentiel uniquement) :

| Action | aid_pct | Dispositif |
|---|---|---|
| ACT13 PAC chauffage | 18-30% selon surface | CEE BAT-TH-113 + Fonds Chaleur si > 300 m² |
| ACT15 Isolation toiture | 22% | CEE BAT-EN-101 |
| ACT16 Isolation murs | 22% | CEE BAT-EN-102 |
| ACT08 LED | 20% | CEE BAT-EQ-162 |
| ACT14 GTB | 28% | CEE BAT-TH-116 (partiel) |
| ACT04 Entretien chauffage | 0% | Pas de fiche CEE |
| ACT19 Rafraichissement naturel | 0% | Pas de fiche CEE |
| ACT21 Sous-comptage | 0% | Pas de fiche CEE |

## Structure du moteur de calcul (src/engine.js)

Le moteur est extrait dans `src/engine.js` (source unique). Charge via `<script src="/src/engine.js">` avant le bloc Babel.

- **Constantes partagees** : NEW_DIAGNOSTIC_BUILDING_AGES, BOILER_AGES, MAX_TOTAL_SAVINGS_PCT, COP_PAC_BY_BUILDING_AGE
- **Fonctions de formatage** : newDiagnosticFormatNumber, FormatInteger, FormatDecimal
- **Tables de reference** : benchmarks, breakdowns par activite, CABS, prix energie, facteurs CO2
- **Bibliotheque des 22 actions** : LED, PAC, isolation, PV, etc. (NEW_DIAGNOSTIC_ACTIONS_LIBRARY)
- **Tables de split energetique** et constantes PV
- **Fonctions de calcul** : split energetique, calcul PV, gains par action, CAPEX, scoring
- **Pipeline principal** : `newDiagnosticBuildReportData(formData)` - retourne l'objet rapport complet
  - Inclut `envelope_opportunities` pour les batiments pre-2000 (travaux d'enveloppe hors seuil ROI)
  - Inclut `warnings` : NETWORK_HEAT_PARTIAL, NO_CONSUMPTION_DATA, PRICE_IMPLIED_OUT_OF_RANGE

### V1.6.1 - Tiers capex ACT13/ACT18 et champ `capex_range`

Depuis V1.6.1, chaque tier contient `{ power_kw|volume_l, capex_low, capex_mid, capex_high, capex }` ou `capex_low = round(capex_mid x 0.85)` et `capex_high = round(capex_mid x 1.15)`. `capex` est conserve (= `capex_mid`) pour retro-compatibilite des calculs ROI.

Chaque action de `top_actions[]` expose desormais :
- `capex_range: { low, mid, high, formatted }` - la chaine `formatted` est prete pour l'UI (format FR, espace insecable, tiret demi-cadratin U+2013 ex : "15 000 EUR - 17 250 EUR").
- `oversized: bool` + `badge` - ACT13 PAC > 200 kW, hors grille tarifaire.
- `study_required: bool` + `badge` - ACT18 > 2 000 L (volume CET depasse le dernier tier), action `ACT18_STUDY` dediee (capex null, gainKwh null).

Garde volume CET : `newDiagnosticComputeCetSizing` retourne une sentinelle `{ needsStudy: true, reason: 'volume_exceeds_max_tier', V_L_raw }` si le volume calcule depasse 2 000 L. Le tier 5 000 L / 84 000 EUR a ete supprime.

Defense en profondeur CET (BUG-006) : `newDiagnosticComputeCetSizing` retourne `null` si la source ECS resolue est deja thermodynamique (`ecsSource === 'pac'`).

Fallback reseau de chaleur (BUG-007) : `newDiagnosticResolveEcsSource` et `newDiagnosticResolveHeatSource` lisent `networkKwh` avec rendement 0.95 lorsque `gasKwh === 0` mais `networkUsed && mainHeating === 'network'`. La variante ECS gere aussi `ecsSystem === 'network_dedicated'`.
- **Projection** : `newDiagnosticBuildProjectionData({...})` - projection 10 ans avec inflation

Note : `espace-professionnel.html` utilise son propre moteur (`ENGINE_PRO`, inline) qui diverge de engine.js. Migration future prevue mais pas prioritaire.

## Modele economique (a respecter dans les decisions techniques)

- 100% scalable, ZERO intervention humaine
- Pas de visio, pas d'analyse manuelle, pas de prestation humaine
- Generation de leads qualifies automatisee
- Marque blanche B2B prevue (le moteur doit rester generique)

## Endpoints API existants

| Endpoint | Role |
|---|---|
| `/api/public-config` | Config runtime publique |
| `/api/public-report-pdf` | Generation PDF rapport public |
| `/api/public-report-view` | Lecture rapport partage |
| `/api/public-report-cover` | Gestion image de couverture |
| `/api/public-report-cover-upload` | Upload image de couverture |
| `/api/public-report-google-streetview` | Proxy Google Street View |
| `/api/pro-report-pdf` | Generation PDF rapport Pro |
| `/api/pro-delete-case` | Suppression securisee dossier Pro |
| `/api/send-email` | Envoi d'emails (leads, notifications) |

## Securite — Restrictions Google Cloud Console

Restrictions a appliquer manuellement dans Google Cloud Console sur la cle
`GOOGLE_STREETVIEW_SERVER_KEY` (hors code, cote ops) :

1. **API restrictions** : cocher uniquement "Street View Static API" et
   "Street View Metadata" (retirer toutes les autres APIs).
2. **Application restrictions** : "IP addresses" avec plages IP Vercel
   (documentation : https://vercel.com/docs/edge-network). Si la config IP
   est trop contraignante, laisser "HTTP referrers" vide et s'appuyer sur
   le rate limit serveur + quota Google.
3. **Quota quotidien** : definir un cap (exemple : 1000 requetes/jour) via
   la page "Quotas" de l'API Street View pour plafonner le cout en cas de
   fuite de cle.
4. **Alerting Billing** : configurer une alerte a 10 EUR/jour sur le projet
   GCP pour detecter un abus avant qu'il ne devienne couteux.

Cote code, le handler `api/public-report-google-streetview.js` applique :
- Rate limit ip+ua : 20 images / 10 min (60 pour metadata)
- Soft cap container : 300 requetes / jour
- Si la cle est absente : warning unique + 503 (plutot que crash 500)

## Securite — CSP et SRI

### Content-Security-Policy

La CSP globale est declaree dans `vercel.json` (bloc global `/(.*)`).
Directives actives :
- `'unsafe-inline'` conserve sur `script-src` et `style-src` : contrainte
  buildless (Babel standalone + styles inline index.html). Dette acceptee
  documentee.
- `worker-src`, `manifest-src`, `media-src`, `child-src`, `frame-src`,
  `frame-ancestors`, `object-src`, `base-uri`, `form-action` explicites.
- `upgrade-insecure-requests` : force HTTPS sur toute sous-requete.
- `report-uri /api/csp-report` : collecte les violations (log preview
  uniquement).

Domaines whitelistes :
- `script-src` : cdn.tailwindcss.com, unpkg.com, cdnjs.cloudflare.com,
  cdn.jsdelivr.net, code.iconify.design
- `style-src` : cdn.tailwindcss.com, fonts.googleapis.com
- `font-src` : fonts.gstatic.com
- `connect-src` : *.supabase.co, data.geopf.fr, panoramax.ign.fr,
  maps.googleapis.com

### SRI (Subresource Integrity)

Scripts **avec SRI** (bundles statiques, version pinnee) :
- React, ReactDOM (unpkg @18.3.1)
- prop-types (unpkg @15.8.1)
- Recharts (unpkg @2.12.7)
- @babel/standalone (unpkg @7.24.10)
- @supabase/supabase-js (jsdelivr, pinne)

Scripts **sans SRI** (bundles dynamiques generes par domaine) :
- Tailwind CDN (cdn.tailwindcss.com)
- Iconify (code.iconify.design)

Ajouter un SRI sur ces CDN casserait le chargement a chaque generation du
bundle cote serveur. Le risque residuel est attenue par la whitelist
script-src stricte et le rate limit cote client (Cloudflare).

## Avant de modifier quoi que ce soit

1. Lire CE FICHIER en entier
2. Lire CLAUDE.md pour les regles operationnelles detaillees
3. Identifier les fichiers concernes par la modification
4. Verifier qu'aucune regle absolue n'est violee
5. Tester sur preview Vercel avant de merger

## Gouvernance du code

Les regles de qualite sont definies dans `CLAUDE.md` a la racine. Ce fichier est lu automatiquement par Claude Code.

Commandes disponibles pour Claude Code :
- `/fix` : correction de bug avec checklist hygiene
- `/feature` : nouvelle fonctionnalite avec checklist hygiene
- `/check` : audit de conformite du code
- `/cleanup` : detection et suppression du code mort

Chaque intervention doit respecter les 5 points d'hygiene :
1. Zero code mort
2. Zero doublon
3. Zero fichier orphelin
4. Zero TODO non documente
5. Documentation synchronisee
