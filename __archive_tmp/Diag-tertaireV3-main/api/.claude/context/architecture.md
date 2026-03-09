# Architecture — DiagTertiaire V3

## Fichiers principaux

### index.html (5 475 lignes)
Rôle : Landing publique + formulaire diagnostic gratuit + moteur de calcul + rapport
- Formulaire 4 étapes : Identification → Bâtiment → Énergies → Contact
- Moteur ENGINE_PRO + nouveau moteur NEW_DIAGNOSTIC_*
- Rapport généré côté client, stocké en localStorage
- Collecte lead → envoi Supabase au submit

### index.saaspro.html (2 083 lignes)
Rôle : Interface SaaS Pro complète (fusion de pro.html prévue)
- Login (demo : demo@cabinet-conseil.fr)
- Dashboard + liste dossiers clients
- Wizard diagnostic Pro 5 étapes
- Rapport détaillé Pro
- Configuration marque blanche (logo, couleur, nom)

### pro.html (2 115 lignes)
Rôle : Landing marketing B2B avec plans tarifaires
⚠️ À fusionner dans index.saaspro.html (tâche N13 du backlog)

### api/pdf.js (~80 lignes)
Rôle : Handler Vercel serverless → génération PDF
⚠️ PDFShift remplacé par solution locale (@sparticuz/chromium-min + puppeteer-core)
Clé lue depuis : process.env.PDFSHIFT_API_KEY (variable Vercel)

## Clés localStorage

| Clé | Fichier | Contenu |
|-----|---------|---------|
| `newDiagnosticLatestSubmission` | index.html | Données brutes du formulaire |
| `newDiagnosticLatestReport` | index.html | Résultats calculés du rapport |
| `proAuth` | index.saaspro.html | Session Pro (email + token) |
| `proCases` | index.saaspro.html | Liste des dossiers clients |
| `proDiagDraft` | index.saaspro.html | Brouillon wizard en cours |
| `proAccent` | index.saaspro.html | Couleur marque blanche (#hex) |

## Supabase

- URL : https://wwyguahxlfokqbdmeylt.supabase.co
- Clé anon (frontend) : sb_publishable_NUFaO1qroQFMfFfMXqUmNA_cvAODvvm
- Clé secrète (api/ uniquement) : dans Vercel env vars → SUPABASE_SERVICE_KEY

### Table `leads`
```sql
id, email, prenom, telephone, entreprise,
opt_in_partenaire, opt_in_politique,
activite, surface, ville, code_postal,
annee_construction, energie_principale,
score_lettre, score_ratio, intensite_kwh_m2,
mediane_secteur, economies_annuelles_eur,
capex_total_eur, roi_annees, score_confiance,
tags_qualification, profil, source, created_at,
-- À ajouter (migration prévue) :
prenom, societe, objectif, horizon_decision
```

## Namespaces protégés
Ne jamais modifier ou renommer :
- `NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY`
- `NEW_DIAGNOSTIC_ENERGY_PRICES`
- `NEW_DIAGNOSTIC_ACTIONS_LIBRARY`
- `NEW_DIAGNOSTIC_MAX_TOTAL_SAVINGS_PCT`
- `newDiagnosticBuildReportData()`

## Vercel
- Production : branche main
- Preview : toute branche / PR génère une URL automatique
- Variables d'environnement configurées :
  - SUPABASE_URL
  - SUPABASE_SERVICE_KEY
  - PDFSHIFT_API_KEY (à remplacer par solution locale)

## Benchmarks énergétiques validés (Expert Énergie)
Énergie Finale, tous usages, kWh EF/m²/an

| Activité | Q1 | Médiane | Q3 |
|----------|----|---------|----|
| bureau | 120 | 180 | 280 |
| commerce_non_alim | 200 | 320 | 500 |
| commerce_alim | 450 | 650 | 900 |
| hotel | 200 | 280 | 420 |
| restauration | 350 | 500 | 800 |
| enseignement | 100 | 150 | 220 |
| entrepot_chauffe | 50 | 80 | 130 |
| entrepot_non_chauffe | 25 | 45 | 70 |
| sante | 160 | 220 | 350 |

## Prix énergie (CRE T3 2024)
- Électricité : 0.196 €/kWh TTC
- Gaz naturel : 0.105 €/kWh TTC
- Réseau de chaleur : 0.092 €/kWh TTC
- Fioul : 0.118 €/kWh TTC
- Bois/granulés : 0.065 €/kWh TTC