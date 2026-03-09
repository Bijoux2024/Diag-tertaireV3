# Architecture DiagTertiaire Pro — index.saaspro.html

## Principes fondamentaux
- **BUILDLESS** : zéro npm, zéro bundler. Babel CDN + Recharts CDN (`Recharts.X`).
- Pas d'imports ES6 Recharts. Accès via `Recharts.BarChart`, `Recharts.ResponsiveContainer`, etc.
- Fichier unique : `index.saaspro.html` (305 KB+). Ne jamais modifier `index.html`, `index.html.bak`, `index.html.final`.

## CDN utilisés
- React 18 UMD, ReactDOM 18 UMD
- Babel standalone (JSX dans `<script type="text/babel">`)
- Recharts 2.12.7 UMD
- Tailwind CSS (CDN)
- Iconify (solar icons)
- Inter (Google Fonts)

## Clés localStorage
| Clé | Usage |
|-----|-------|
| `proAuth` | `'true'` si connecté |
| `proCases` | Dossiers générés par wizard (PRO-*) |
| `proCasesRaw` | Dossiers raw (mocks + imports) |
| `proDiagDraft` | Brouillon wizard en cours |
| `proAccent` | Couleur accent UI |
| `proLogoImg` | Logo base64 du cabinet |
| `proLogoName` | Nom du cabinet |

## Composants principaux
- `ProLogin` — authentification demo (`test.demo`)
- `ProDashboard` — shell principal avec sidebar
- `ProCases` — tableau des dossiers + colonne qualification
- `ProCaseReport` — rapport complet dossier
- `ProNewDiag` — wizard 7 étapes (= ProWizard)
- `ProSettings` — logo, couleur, équipe
- `ProPlans` — tarification

## Structure d'un dossier Pro (objet dans proCasesRaw)

### Champs communs (mocks + wizard)
| Champ | Type | Description |
|-------|------|-------------|
| id | string | 'case_XXX' (mock) ou 'PRO-timestamp' (wizard) |
| clientName | string | Nom du prospect / entreprise |
| activity | string | Activité bâtiment (Bureau, Restauration, etc.) |
| buildingArea | number | Surface en m² |
| annualConsumption | number | kWh/an total |
| annualCost | number | €/an total factures |
| intensityPerSqm | number | kWh/m²/an |
| score | 'A'|'B'|'C'|'D'|'E' | Indice DiagTertiaire |
| scoreApresTravauxLabel | string | Score cible après travaux |
| scoreMaturite | number | Score 0–5 qualification prospect |
| postes | object | { chauffage, clim, ventil, eclairage, ecs, autres: { pct, kwh, eur } } |
| actions | array | { name, savingsEuro, capex, roi, eligCEE, fichesCEE, scope, description } |
| projectionData | array | [{ annee, sans_travaux, avec_travaux }] |
| graphiquePubliable | boolean | true si ROI entre 0.5 et 20 ans |

### Champs PRO uniquement (jamais dans lien de partage)
| Champ | Type | Description |
|-------|------|-------------|
| noteInterne | string | Note du professionnel — JAMAIS partagée |
| scoreMaturite | number | Score qualification 0–5 |
| urgenceVerbatim | string | Verbatim urgence saisi par le pro |
| contact.phone | string | Téléphone prospect — JAMAIS partagé |
| email | string | Email prospect — JAMAIS partagé |

### Champs générés par le wizard (absents des mocks)
| Champ | Type | Description |
|-------|------|-------------|
| engineResult | object | Résultat brut ENGINE_PRO.compute() |
| formData | object | Formulaire complet saisi dans le wizard |

### Résolution du rapport (ProCaseReport)
```javascript
// Priorité de résolution de `r` (résultat moteur) :
const r = c.engineResult                            // 1er choix : résultat wizard
    || (c.formData ? ENGINE_PRO.compute(c.formData) : null) // 2ème : recompute
    || buildEngineResultFromMock(c);                // 3ème : adaptateur mocks
```

## Benchmarks sectoriels (kWh/m²/an)
| Activité | Q1 | Médiane | Q3 |
|----------|----|---------|----|
| Bureau | 120 | 180 | 280 |
| Restauration | 350 | 500 | 800 |
| Santé | 160 | 220 | 350 |
| Entrepôt | 50 | 80 | 130 |
| Commerce | 450 | 650 | 900 |
| Hôtellerie | 200 | 300 | 450 |
