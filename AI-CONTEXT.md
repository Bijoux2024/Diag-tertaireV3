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
| `src/engine.js` | Moteur de calcul public (source unique, 2 420 lignes) | ENGINE_VERSION 1.4.0 - toute modif = tester 3 scenarios |
| `src/solar-icons.js` | Dictionnaire des 118 icones SVG Solar | Partage entre index.html et index.saaspro.html |
| `index.html` | Landing + composants React + rapport (~8 700 lignes) | Charge engine.js et solar-icons.js via script tags |
| `index.saaspro.html` | Espace professionnel (auth, workspace, branding) | Moteur Pro independant (ENGINE_PRO), pas encore migre sur engine.js. Divergence connue et acceptee a ce stade |
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

## Prix de reference (MVP V1)

| Parametre | Valeur | Source |
|---|---|---|
| Electricite | 0.194 euros/kWh | Simplifie |
| Gaz | 0.10 euros/kWh | Simplifie |
| Facteur emission elec | 0.0640 kgCO2/kWh | Base Carbone ADEME 2024 (corrige prospectif) |

## Structure du moteur de calcul (src/engine.js)

Le moteur est extrait dans `src/engine.js` (2 420 lignes, source unique). Charge via `<script src="/src/engine.js">` avant le bloc Babel.

- **Constantes partagees** : NEW_DIAGNOSTIC_BUILDING_AGES, BOILER_AGES, MAX_TOTAL_SAVINGS_PCT
- **Fonctions de formatage** : newDiagnosticFormatNumber, FormatInteger, FormatDecimal
- **Tables de reference** : benchmarks, breakdowns par activite, CABS, prix energie, facteurs CO2
- **Bibliotheque des 22 actions** : LED, PAC, isolation, PV, etc. (NEW_DIAGNOSTIC_ACTIONS_LIBRARY)
- **Tables de split energetique** et constantes PV
- **Fonctions de calcul** : split energetique, calcul PV, gains par action, CAPEX, scoring
- **Pipeline principal** : `newDiagnosticBuildReportData(formData)` - retourne l'objet rapport complet
- **Projection** : `newDiagnosticBuildProjectionData({...})` - projection 10 ans avec inflation

Note : `index.saaspro.html` utilise son propre moteur (`ENGINE_PRO`, inline) qui diverge de engine.js. Migration future prevue mais pas prioritaire.

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

## Avant de modifier quoi que ce soit

1. Lire CE FICHIER en entier
2. Lire CLAUDE.md pour les regles operationnelles detaillees
3. Identifier les fichiers concernes par la modification
4. Verifier qu'aucune regle absolue n'est violee
5. Tester sur preview Vercel avant de merger
