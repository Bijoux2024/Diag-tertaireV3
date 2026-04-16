# Whitepaper méthodologique — DiagTertiaire V3

**Version moteur :** 1.7.0 (2026-04-16)
**Audience :** ADEME, experts énergéticiens, organismes de contrôle, consortium de validation.
**Objet :** documenter de façon exhaustive les hypothèses, tables de référence, formules et algorithmes utilisés par la plateforme DiagTertiaire pour produire un pré-diagnostic énergétique d'un bâtiment tertiaire à partir d'un formulaire court.

> DiagTertiaire est un **outil d'orientation décisionnelle**, pas un audit énergétique réglementaire. Les résultats ne se substituent pas à une étude thermique, un DPE tertiaire, ni à un audit ISO 50002. L'outil est calibré pour produire des ordres de grandeur prudents afin qu'un maître d'ouvrage puisse décider de lancer ou non une étude approfondie.

---

## 1. Périmètre fonctionnel

### 1.1 Ce que fait la plateforme

1. Collecte 12 à 25 informations via formulaire (selon branches).
2. Convertit les consommations déclarées en kWh d'énergie finale annuelle.
3. Calcule l'intensité énergétique kWh/m²/an et la compare à une médiane sectorielle.
4. Répartit l'énergie par poste (chauffage, ECS, éclairage, ventilation, froid, cuisson, autre).
5. Filtre 20 actions de travaux selon l'éligibilité contextuelle.
6. Calcule pour chaque action : gain kWh, gain €, CAPEX, aide, CAPEX net, ROI simple.
7. Compose un top 3 light (quick wins < 3 000 €) + top 3 heavy (structurel).
8. Projette les économies cumulées sur 10 ans avec inflation énergie différenciée.
9. Signale les travaux d'enveloppe (bâtiments pré-2000) hors seuil ROI.

### 1.2 Ce que la plateforme ne fait pas

- Simulation thermique dynamique (STD) ou calcul conventionnel Méthode 3CL / TH-BCE.
- Relevé métrologique sur site, sous-comptage, audit ISO 50002.
- Éligibilité contractuelle des aides (simple estimation de taux indicatif).
- Validité juridique au sens du Décret Tertiaire (déclaration OPERAT).

---

## 2. Inputs du formulaire

### 2.1 Identification

| Champ | Unité / format | Usage moteur |
|---|---|---|
| `activity` | enum (9 secteurs + `mixed`) | sélection médiane + répartition postes |
| `surface` | m² | intensité, capex/m², seuils |
| `levels` | entier | surface de toiture pour PV = surface/niveaux |
| `postalCode` | code INSEE | zone climatique H1/H2/H3 + rendement PV départemental |
| `buildingAge` | `pre1975` \| `1975_2000` \| `2001_2012` \| `post2012` | COP PAC, coef feasibility enveloppe, déblocage `envelope_opportunities` |
| `address` + coords lat/lon | BAN / geoapify | rendement PV plus précis via approximation PVGIS locale |

### 2.2 Usage mixte

Si `activity = mixed`, pondération linéaire :

```
median_mixte = median_u1 × p1 + median_u2 × p2
breakdown_i_mixte = arrondi(breakdown_i_u1 × p1 + breakdown_i_u2 × p2)
```
avec renormalisation du résidu dans `other_specific_pct` pour garantir Σ = 100 %.

### 2.3 Consommations

| Champ | Unité | Règle de traitement |
|---|---|---|
| `elecUsed` / `elecKwh` / `elecEuro` | bool / kWh / € | cf. §3.1 |
| `gasUsed` / `gasKwh` / `gasEuro` | bool / kWh / € | idem |
| `networkUsed` / `networkKwh` / `networkEuro` | bool / kWh / € | prix réseau 0,095 €/kWh |
| `*IncludesSubscription` + `*SubscriptionYearly` | bool + € | déduction avant conversion (option B) |

### 2.4 Installation

| Champ | Usage |
|---|---|
| `mainHeating` | `electric_convector` \| `electric_pac` \| `pac` \| `gas` \| `fuel` \| `network` \| `other`. Normalisé via `HEATING_TYPE_NORMALIZE`. |
| `emitterType` | enrichit le libellé (plancher chauffant, radiateurs à inertie, etc.) |
| `boilerAge` \| `pacAge` | priorité déclenchement ACT13 |
| `ecsSameSystem` + `ecsSystem` | détermine la source ECS (`gas_boiler`, `gas_instant`, `electric_boiler`, `heat_pump`, `solar`, `network_dedicated`) |
| `hasCooling` | active ACT19 (rafraîchissement nocturne) |
| `roofType` + `roofOrientation` + `roofAccessible` | coefficient PV + surface exploitable |
| `roofInsulation` / `wallInsulation` | exclusion ACT15 / ACT16 si `yes` |
| `worksDone[]` | exclusions massives : `led_done`, `regulation_done`, `pac_done`, `boiler_recent`, `roof_done`, `walls_done`, `windows_done`, `gtb_done`, `dhw_done`, `vmc_df_done`, `pv_done` |
| `hasGtb` | exclut ACT14, ACT21 |

### 2.5 Qualification commerciale

`decisionHorizon`, `budgetRange`, `projectObjective`, `role`, `isDecisionMaker`, `phone`, `contactOptIn` : alimentent un score de qualification commerciale (§9), sans impact sur le calcul énergétique.

---

## 3. Normalisation des consommations

### 3.1 Conversion € → kWh (option B)

```
si elecKwh renseigné → kwh = elecKwh,         méthode "kwh_provided"
sinon si elecEuro renseigné →
    montant = elecEuro − subscriptionYearly (si inclus)
    kwh = round(montant / prix_par_defaut_elec)
    méthode "euro_converted_*"
sinon kwh = 0
```

### 3.2 Prix de référence énergie (v1.1-2026)

| Vecteur | €/kWh TTC | Source | Validité |
|---|---:|---|---|
| Électricité | 0,196 | CRE TRVE fév 2026, profil pro ≤ 36 kVA | France métropolitaine, hors abonnement |
| Gaz | 0,108 | CRE — Prix repère gaz pro 2026 | Profil chauffage, < 150 MWh/an |
| Réseau de chaleur | 0,095 | Moyenne nationale SNCU | — |
| Fioul | 0,125 | Prix livraison pro Q1 2026 | — |
| Bois granulés | 0,068 | Marché 2025-2026 | — |
| Solaire thermique | 0,02 | Maintenance ramenée au kWh | — |

### 3.3 Inflation énergie (projection 10 ans)

| Vecteur | Taux annuel | Hypothèse |
|---|---:|---|
| Électricité | 3,5 % | Hausse ARENH + TURPE |
| Gaz | 4,5 % | Stabilisation post-crise, phase-out progressif |
| Réseau chaleur | 3,0 % | Stable, part renouvelable |
| Fioul | 6,0 % | Taxe carbone croissante |
| Bois granulés | 2,5 % | Marché mature |

Taux appliqué = barycentre des vecteurs présents, pondéré par la part € initiale.

### 3.4 Facteurs d'émission (kgCO₂/kWh)

| Vecteur | kgCO₂/kWh | Source |
|---|---:|---|
| Électricité | 0,079 | ADEME RE2020, méthode mensualisée par usage (borne prospective 2026-2030) |
| Gaz | 0,227 | Base Carbone 2024 |
| Fioul | 0,324 | Base Carbone 2024 |
| Réseau chaleur | 0,100 | Moyenne nationale |
| Bois granulés | 0,030 | Base Carbone 2024 |

---

## 4. Benchmarks sectoriels (v3.0-2026)

Intensités `kWh EF/m²/an` (énergie finale, statistique médiane + quartiles Q1/Q3).

| Secteur (clé) | Médiane | Q1 | Q3 | Source |
|---|---:|---:|---:|---|
| Bureaux (`offices`) | 135 | 85 | 195 | ADEME ECNA 2022 |
| Commerce non-alim (`retail`) | 210 | 140 | 300 | CEREN 2019 révisé |
| Commerce alim (`retail_food`) | 510 | 355 | 710 | CEREN 2023 Fiche 7 (révision V1.7.0) |
| Hôtel (`hotel`) | 230 | 140 | 380 | ADEME Hôtellerie 2024 |
| Restaurant (`restaurant`) | 270 | 190 | 400 | ADEME HORECA |
| Enseignement (`education`) | 110 | 75 | 165 | ADEME / OPERAT |
| Entrepôt chauffé (`warehouse_heated`) | 120 | 70 | 180 | Estimation CEREN Logistique |
| Entrepôt léger (`light_warehouse`) | 45 | 20 | 75 | CEREN Logistique |
| Santé local (`health_local`) | 195 | 125 | 310 | Estimation ADEME santé |

**Positionnement** : `below_range` < Q1, `in_range` entre Q1 et Q3, `above_range` > Q3, `far_above_range` > 1,2 × Q3.

### 4.1 Cibles Décret Tertiaire 2030 (Cabs)

Appliquées uniquement en affichage pédagogique pour les bâtiments > 1 000 m². Sources : Arrêtés 13 avril 2022 et 28 novembre 2023 (kWh/m²/an) — `offices` 103, `education` 80, `health_local` 165, `hotel` 170, `restaurant` 185, `retail` 125, `retail_food` 240 (estimation prudente), `warehouse_heated` / `light_warehouse` 135.

---

## 5. Répartition par postes

### 5.1 Table globale (% de l'énergie finale totale)

| Secteur | Chauff. | Froid | Vent. | Éclair. | ECS | Cuisson | Autre |
|---|---:|---:|---:|---:|---:|---:|---:|
| Bureaux | 43 | 10 | 8 | 20 | 5 | 0 | 14 |
| Commerce non-alim | 30 | 12 | 7 | 32 | 3 | 0 | 16 |
| Commerce alim | 12 | 35 | 7 | 24 | 3 | 5 | 14 |
| Hôtel | 38 | 8 | 8 | 15 | 22 | 5 | 4 |
| Restaurant | 25 | 5 | 12 | 18 | 10 | 20 | 10 |
| Santé local | 35 | 8 | 18 | 15 | 12 | 0 | 12 |
| Enseignement | 52 | 3 | 8 | 20 | 7 | 2 | 8 |
| Entrepôt chauffé | 50 | 0 | 5 | 28 | 2 | 0 | 15 |
| Entrepôt léger | 35 | 0 | 5 | 40 | 2 | 0 | 18 |

Un garde-fou exécuté au chargement vérifie Σ = 100 ± 0,5 % par secteur.

### 5.2 Séparation par source (pipeline actuel)

La répartition % est indicative. Le moteur applique ensuite une **séparation par vecteur** (`newDiagnosticSplitByEnergySource`) :

1. Le **gaz** ne sert physiquement qu'au chauffage + ECS (table `GAS_SPLIT_BY_ACTIVITY`).
2. L'**électricité non thermique** est répartie sur éclairage / froid / ventilation / autre via `ELEC_SPLIT_BY_ACTIVITY`.
3. Si `mainHeating ∈ {gas, fuel, network}`, les postes thermiques consomment le gaz/fioul/réseau avec le rendement 0,85 (0,95 pour réseau).
4. Si `mainHeating ∈ {electric, pac}`, ils consomment l'élec.
5. Le poste `other` absorbe le résidu d'arrondi pour garantir la conservation (Σ kWh poste = totalKwh).

Un warning console signale toute incohérence > 30 % entre postes théoriques et vecteurs déclarés.

### 5.3 Répartition gaz par activité

Source principale : chauffage + ECS uniquement.

| Secteur | Chauff. (%) | ECS (%) |
|---|---:|---:|
| Bureaux | 88 | 12 |
| Commerce non-alim | 92 | 8 |
| Hôtel | 60 | 40 |
| Restaurant | 65 | 35 |
| Enseignement | 90 | 10 |
| Santé | 78 | 22 |
| Commerce alim | 90 | 10 |
| Entrepôts | 95 | 5 |

### 5.4 Répartition élec non thermique

| Secteur | Éclair. | Froid | Vent. | Autre |
|---|---:|---:|---:|---:|
| Bureaux | 30 | 18 | 15 | 37 |
| Commerce non-alim | 48 | 15 | 10 | 27 |
| Hôtel | 28 | 12 | 18 | 42 |
| Restaurant | 20 | 8 | 22 | 50 |
| Santé | 25 | 15 | 30 | 30 |
| Enseignement | 35 | 5 | 15 | 45 |
| Entrepôt léger | 60 | 0 | 8 | 32 |
| Commerce alim | 25 | 5 | 8 | 62 (froid commercial dans `other`) |

---

## 6. Bibliothèque d'actions (20 actions)

Chaque action porte : `gain_pct_low|med|high`, `capex_low|med|high`, `aid_pct`, `aid_tags`, `gain_scope`, `tier` (`light` ≤ 3 000 € / `heavy`), `trigger_rules`. Le moteur utilise `gain_pct_med` et `capex_med` pour le calcul principal ; la fourchette est affichée au client via `capex_range` (±15 %).

### 6.1 Liste complète

| ID | Nom | Tier | Scope | Gain médian | CAPEX médian | aid_pct | Fiche aide |
|---|---|---|---|---:|---|---:|---|
| ACT01 | Réglage horaires & abaissement chauffage | light | heating_post | 12 % | 500 € | 0 % | — |
| ACT02 | Pilotage automatique du chauffage | light | heating_post | 15 % | 4 000 € | 15 % | CEE |
| ACT03 | Robinets thermostatiques (zonage) | light | heating_post | 10 % | 50 €/radiateur | 15 % | CEE |
| ACT04 | Entretien chauffage | light | heating_post | 8 % | 2 500 € | 0 % | — |
| ACT05 | Arrêt ventilation hors ouverture | light | vent_aux_post | 25 % | 1 500 € | 15 % | CEE |
| ACT06 | VMC présence (bureaux/école/santé) | light | vent_aux_post | 30 % | 5 000 € | 15 % | CEE |
| ACT07 | VMC CO₂ (haute occupation) | heavy | vent_aux_post | 25 % | 7 000 € | 15 % | CEE |
| ACT08 | Passage LED | light | lighting_post | `gain_by_age` (cf. §7bis.3) | 30 €/m² | 15 % | CEE BAT-EQ-162 |
| ACT09 | Éclairage détection présence | light | lighting_post | 25 % | 20 €/m² | 15 % | CEE |
| ACT10 | Isolation tuyaux ECS | light | dhw_post | 15 % | 1 500 € | 15 % | CEE |
| ACT11 | Isolation ballon ECS | light | dhw_post | 12 % | 500 € | 5 % | — |
| ACT13 | PAC air/eau (chauffage + ECS si couplé) | heavy | heating_post | 50 % | dynamique tiers | 18–30 % | CEE BAT-TH-113 + Fonds Chaleur |
| ACT14 | Gestion automatisée / supervision | heavy | total | 13 % | 25 €/m² min 8 000 € | 18 % | CEE BAT-TH-116 |
| ACT15 | Isolation toiture | heavy | heating_post | 20 % | 80 €/m² | 15 % | CEE BAT-EN-101 |
| ACT16 | Isolation murs extérieurs (ITE) | heavy | heating_post | 18 % | 190 €/m² × 0,6 | 15 % | CEE BAT-EN-102 |
| ACT17 | Remplacement fenêtres | heavy | heating_post | 12 % | 550 €/m² vitré | 8 % | CEE BAT-EN-104 |
| ACT18 | Chauffe-eau thermodynamique | heavy | dhw_post | `gain_by_activity` (cf. §7bis.3) | dynamique tiers | 12 % | CEE BAT-TH-116 |
| ACT19 | Rafraîchissement nocturne | light | cooling_post | 25 % | 2 000 € | 0 % | — |
| ACT21 | Sous-comptage | light | total | 5 % | 3 000 € | 0 % | — |
| ACT22 | PV autoconsommation | heavy | elec_post | modèle dédié | 1 050-1 400 €/kWc | 6-10 % | Prime CRE S21 |

> Hygiène V1.6.2 : **aucun ACT20** (récupération chaleur clim) n'est généré — retrait définitif après consortium. Tous les `aid_pct` ont été ramenés à la fourchette basse plausible pour que le client soit **positivement surpris** par le retour terrain, jamais déçu.

> **IDs réservés non utilisés** : `ACT12` n'a jamais été émis, `ACT20` a été supprimé en V1.6.2. Ces identifiants restent réservés — aucun nouveau chantier ne doit les réattribuer, au risque de casser les dossiers archivés qui contiennent peut-être encore des références historiques.

### 6.2 Formule du gain standard

```
gainKwh = round(baseKwh × gain_pct_med)
gainEuro = round(gainKwh × prix_source_du_poste)
aidAmount = round(capex × aid_pct)
capexNet = round(capex × (1 − aid_pct))
roi_years = round(capexNet / gainEuro × 10) / 10    # ROI simple
priorityScore = (gainEuro × feasibility) / max(1, capexNet)
```

Où `baseKwh` est le kWh du poste cible (`heating_post`, `dhw_post`, `lighting_post`, `cooling_post`, `vent_aux_post`, `elec_post`, ou `total`) issu de `splitResult.posts`.

> **Résolution du gain unitaire (V1.7.0)** : pour les actions marquées `gain_by_age` (ACT08) ou `gain_by_activity` (ACT18), le gain unitaire n'est pas `gain_pct_med` mais le résultat de `newDiagnosticResolveActionGain(action, formData)`, qui consulte les tables conditionnelles décrites en §7bis.3. Pour toutes les autres actions, le gain reste `gain_pct_med`.

### 6.3 Feasibility (feasibility coefficient)

| Condition | Multiplicateur |
|---|---:|
| Enveloppe (roof/walls/windows) | × 0,55 |
| Chauffage avec CAPEX > 10 000 € | × 0,65 |
| Éclairage | × 1,30 |
| tier = light | × 1,30 |
| tier = heavy | × 0,70 |
| Enveloppe + bâtiment pré-2000 | × `buildingAgeCoef` (1,40 pré-75 / 1,15 1975-2000) |
| ACT13 avec chaudière ≥ 15 ans | × 1,50 |

### 6.4 Filtres d'éligibilité

- `worksDone` → exclusion catégorielle (LED, régulation, PAC, chaudière récente, toiture, murs, fenêtres, GTB, ECS, VMC double flux, PV).
- `ACT04` (entretien chaudière) : exclu si électrique ou PAC.
- `ACT13` : gaz/fioul/convecteurs autorisés ; exclu post-2012 électrique (PAC RT2012 probable) ; autorisé si PAC existante avec `pacAge = over15`.
- `ACT18` : exclu si `ecsSystem = heat_pump`, ou ECS couplé à PAC.
- `ACT06` : pertinent uniquement bureaux / école / santé / coworking.
- `ACT07` : haute occupation (restaurant, hôtel, école, santé, grands bureaux ≥ 500 m²).
- `ACT19` : uniquement si `hasCooling = true`.
- `ACT22` : surface ≥ 100 m² et toiture existante.
- Actions filtrées après scoring si `roi_years > 10 ans` ou `gainEuro ≤ 0` (sauf fiches `study_required`).

### 6.5 Sélection top actions

Tri par `priorityScore` décroissant, puis **3 light + 3 heavy** maximum. Le PV complémentaire est affiché séparément si son ROI est entre 10 et 15 ans et qu'il n'est pas déjà dans le top.

---

## 7. Modèles de calcul spécifiques

### 7.1 ACT13 — PAC air/eau (bascule énergétique)

**Cas gaz/fioul → élec**
```
COP = COP_PAC_BY_BUILDING_AGE[buildingAge]
      # V1.7.0 : 2,4 (pré-1975) / 2,8 (1975-2000) / 3,2 (post-2000)
      # Source : Fiche 1 Conception — consortium énergie ADEME 2024.
      # Dégradation volontaire vs V1.6.x pour intégrer réalité terrain
      # (émetteurs inadaptés, pertes de distribution, cycles de givrage).
heatingKwh_couvert = posts.heating.kwh + (ECS couplée ? posts.ecs.kwh : 0)
newElecKwh = round(heatingKwh_couvert / COP)
gainEuro = heatingKwh_couvert × prix_ancien_vecteur − newElecKwh × prix_élec
gainKwh = heatingKwh_couvert − newElecKwh
```

**Cas convecteurs → PAC**
```
newElecKwh = round(posts.heating.kwh / COP)
gainKwh = posts.heating.kwh − newElecKwh
gainEuro = gainKwh × prix_élec
```

**Dimensionnement CAPEX (`newDiagnosticComputePacEauSizing`)**

```
zone_climat = H1 (×1,10) | H2 (×1,00) | H3 (×0,90)
besoin_utile = conso_source × part_chauffage × rendement_source
besoin_pondéré = besoin_utile × coef_zone
puissance_kW = besoin_pondéré / 1800 h      # 1800 h équivalentes pleine puissance tertiaire
tier = premier tier ≥ puissance_kW (dans [10, 20, 50, 100, 200] kW)
```

Grille CAPEX (consortium artisan FR Q4 2025, fourchette ±15 %) :

| Puissance (kW) | CAPEX bas | CAPEX médian | CAPEX haut |
|---:|---:|---:|---:|
| 10 | 12 750 | 15 000 | 17 250 |
| 20 | 23 800 | 28 000 | 32 200 |
| 50 | 52 700 | 62 000 | 71 300 |
| 100 | 102 000 | 120 000 | 138 000 |
| 200 | 195 500 | 230 000 | 264 500 |

Au-delà de 200 kW : flag `oversized` + badge « Hors grille tarifaire — étude dédiée ». CAPEX conservé pour ordre de grandeur, client prévenu.

**Aides dégressives selon surface :**

- ≤ 200 m² : 18 % (CEE seul, Fonds Chaleur inaccessible < 30 kW)
- ≤ 600 m² : 25 % (CEE + Fonds Chaleur partiel)
- > 600 m² : 30 % (CEE + Fonds Chaleur plein)

### 7.2 ACT18 — Chauffe-eau thermodynamique

**Gain énergétique**
```
COP_CET = 3,0
newElecKwh = round(ecsKwh / 3,0)
gainEuro = ecsKwh × prix_ancien_vecteur − newElecKwh × prix_élec   # gaz → élec
         ou (ecsKwh − newElecKwh) × prix_élec                       # élec existant → CET
```

**Dimensionnement volume (`newDiagnosticComputeCetSizing`)**

```
besoin_utile_kWh = conso_ECS × part_ECS × rendement_source
coef_zone = 1,03 (H1) | 1,00 (H2) | 0,97 (H3)
V_L_raw = (besoin_utile × coef_zone) / 19,053
```

Le dénominateur 19,053 = 365 × 45 °C × 1,16 Wh/L/°C / 1000. Il représente l'énergie utile nécessaire pour chauffer 1 L d'eau à 45 °C de ΔT 365 jours par an.

Tiers CAPEX (grille consortium FR Q4 2025, fourchette ±15 %) :

| Volume (L) | CAPEX bas | CAPEX médian | CAPEX haut |
|---:|---:|---:|---:|
| 200 | 3 910 | 4 600 | 5 290 |
| 300 | 4 930 | 5 800 | 6 670 |
| 500 | 7 820 | 9 200 | 10 580 |
| 1 000 | 14 875 | 17 500 | 20 125 |
| 2 000 | 28 900 | 34 000 | 39 100 |

Si `V_L_raw > 2 000 L` : sentinelle `needsStudy` → action `ACT18_STUDY` (étude multi-ballons), sans chiffrage direct.

Si source ECS déjà thermodynamique (`ecsSource = 'pac'`) : action exclue (défense en profondeur BUG-006).

### 7.3 ACT22 — Photovoltaïque autoconsommation

**Production**
```
rendement_base = PV_YIELD_BY_DEPARTMENT[préfixe CP]
                 # 1110 (N-E) à 1450 kWh/kWc/an (Corse)
si lat/lon valides : ajustement PVGIS approximé, pondération 0,65/0,35 coord/département
coef_orientation = ROOF_TYPE_COEFF (plat 0,85 | sud 1,00 | SE/SO 0,93 | E/O 0,82 | N 0,55)
rendement_effectif = rendement_base × coef_orientation

surface_toiture = surface / levels
ratio_utilisable = 0,60 (toiture déclarée) | 0,48 (défaut)
surface_PV = surface_toiture × ratio_utilisable
kWc_toiture = surface_PV × 0,20             # 200 Wc/m² installés

taux_autoconso = PV_SELF_CONSUMPTION_BY_ACTIVITY (0,48 entrepôt à 0,82 commerce alim)
facteur_dim = 0,90 si autoconso ≥ 55 %, sinon 0,75
kWc_charge = élec_cible_post_travaux × facteur_dim / rendement_effectif
kWc_installé = clamp(min(kWc_toiture, kWc_charge, 100), 0,5, 100)

production = kWc × rendement_effectif
autoconso = min(production × taux_autoconso, élec_cible × 0,95)
surplus = production − autoconso
```

**Économie**
```
gain_autoconso = autoconso × 0,196 €/kWh
revenu_surplus = surplus × tarif_CRE
                 # 0,0400 €/kWh (≤ 9 kWc) | 0,0473 €/kWh (9-100 kWc), CRE S21 T2 2026
```

**CAPEX et aide**
```
€/kWc = 1400 (≤ 9) | 1200 (≤ 36) | 1050 (36-100)
prime_autoconso = 80 (≤ 9) | 120 (≤ 36) | 60 €/kWc (36-100)   # CRE S21 T2 2026
CAPEX_net = CAPEX − prime_autoconso × kWc
```

### 7.4 Autres actions (standard)

`gainKwh = baseKwh × gain_pct_med` où `baseKwh` est lu dans `splitResult.posts[scope].kwh`, puis `gainEuro = gainKwh × pricePerKwh_source`.

---

## 6.5 Journal d'hypothèses (traçabilité)

Pour chaque rapport produit, le moteur expose un journal des hypothèses appliquées (`engineResult.assumptions_journal`) :

| Champ | Contenu |
|---|---|
| `cop_pac_retenu` | COP PAC effectivement appliqué (selon `buildingAge`) |
| `benchmark_intensity` | Médiane sectorielle utilisée pour la position du site |
| `caps_segment_appliques` | Liste des caps segment effectivement appliqués (ex : `heating_post 38 %`) |
| `actions_capees` | Actions dont le gain a été tronqué par le cap segment |
| `aides_freshness_days` | Ancienneté du fichier `aides-tarifs.js` en jours |
| `aides_warning` | Si > 90 jours : drapeau pour invitation à vérifier auprès de la CCI/ADEME |
| `dju_retenu` | Zone climatique retenue (par défaut "moyenne nationale" en l'absence de DJU) |

Ce journal est restitué en bloc pliable au pied du rapport pour permettre une vérification immédiate par un auditeur.

## 6.6 Disclaimer méthodologique

> Cette méthode est **forfaitaire et indicative**, calibrée sur les médianes sectorielles ADEME et CEREN. Elle **ne se substitue en aucun cas** à un audit énergétique réglementaire au sens de la norme EN 16247-2 / ISO 50002, ni à un DPE tertiaire, ni à un calcul thermique conventionnel (méthodes 3CL ou TH-BCE). Les résultats produits sont des **ordres de grandeur** destinés à orienter une décision d'engager (ou non) une étude approfondie. Les coûts, gains et délais de retour sur investissement doivent être confirmés par un devis professionnel avant tout engagement de travaux.

---

## 7bis. Composition des gains — V1.7.0 (cap par segment ADEME)

### Pourquoi un changement structurel ?

La V1.6.x utilisait une composition multiplicative `1 − Π(1 − gᵢ)` qui présupposait l'**indépendance énergétique** des actions. Cette hypothèse est violée chaque fois qu'une action transversale (ACT14 GTB, scope `total`) coexiste avec une action segmentée (ACT22 PV, scope `elec_post`) sur un bâti tout-électrique : les deux actions revendiquent les **mêmes kWh économisés**, ce qui produit un double comptage structurel et une médiane des économies composites bloquée à 53,5 % en V1.6.3, hors du gabarit cible 25-45 %.

La règle CEE 6e période (BAT-TH / BAT-EQ) interdit le cumul multiplicatif sur une même Unité Énergétique. La V1.7.0 aligne le moteur sur cette règle.

### 7bis.1 Algorithme de composition par segment

```
1. Pour chaque action engagée, accumuler son gainKwh dans le bucket de son gain_scope :
   byScope[scope] += action.gainKwh

2. Pour chaque scope, lire la base kWh associée (issue de splitResult.posts) :
   heating_post → posts.heating.kwh
   dhw_post     → posts.ecs.kwh
   lighting_post → posts.lighting.kwh
   cooling_post → posts.cooling.kwh
   vent_aux_post → posts.ventilation.kwh
   elec_post    → splitResult.elecKwh
   total        → totalKwh

3. Appliquer le cap ADEME du segment :
   cappedGain[scope] = min(byScope[scope], baseKwh[scope] × CAP_SEGMENT[scope])

4. Agrégation additive (et non multiplicative) :
   totalGainKwh = Σ cappedGain[scope]
   compositePct = totalGainKwh / totalKwh

5. Cap réglementaire global (Décret Tertiaire -40 % à horizon 2030) :
   compositePct = min(compositePct, 0,45)
```

### 7bis.2 Caps par segment (table de référence ADEME)

| Segment (scope) | Cap | Source documentée |
|---|---:|---|
| `heating_post` | 38 % | ADEME Gisements tertiaire 2022 §chauffage |
| `dhw_post` (standard) | 28 % | ADEME Gisements tertiaire 2022 §ECS |
| `dhw_post` (bascule CET) | 55 % | ADEME idem — bascule fioul/gaz/élec → CET |
| `cooling_post` | 22 % | ADEME Gisements tertiaire 2022 §froid |
| `lighting_post` (pré-1975 + 1975-2000) | 55 % | ADEME idem + CSTB parc LED 2024 |
| `lighting_post` (2001-2012) | 35 % | idem |
| `lighting_post` (post-2012) | 20 % | idem (parc déjà partiellement LED) |
| `vent_aux_post` | 35 % | ADEME Gisements tertiaire 2022 §ventilation |
| `elec_post` | 12 % | ADEME idem §process/bureautique résiduel |
| `total` (transversal GTB) | 0,7 × cap chauffage = 26,6 % | ADEME GTB BAT-TH-116 |
| **Cap global compositePct** | **45 %** | Décret Tertiaire -40 % 2030 |

### 7bis.3 Gains conditionnels (par âge / par activité)

Certains gains unitaires sont devenus contextuels (V1.7.0), résolus en amont par `newDiagnosticResolveActionGain(action, formData)` qui prime sur `gain_pct_med` :

| Action | Conditionnement | Valeurs |
|---|---|---|
| ACT08 (LED) | `gain_by_age` | pré-1975 / 1975-2000 : 55 % · 2001-2012 : 40 % · post-2012 : 25 % |
| ACT18 (CET) | `gain_by_activity` | hôtel/restaurant/santé : 30 % · bureaux/retail/entrepôt/école : 8 % |

### 7bis.4 Composition en euros

Le même principe est appliqué en euros via `newDiagnosticCalculateCompositeSavingsEuro` : agrégation additive des gains capés par segment, puis cap global 45 % de la facture totale. Aucune addition multiplicative n'est conservée.

---

## 8. Gains composés (référence historique V1.6.x — ABROGÉE)

> **Cette section est conservée pour traçabilité historique uniquement.** L'algorithme `1 − Π(1 − gᵢ)` a été abrogé en V1.7.0 au profit du cap par segment décrit en §7bis. Aucun appelant ne doit utiliser cette formule.

```
[ABROGÉ V1.7.0]
g_i = min(0,65, gainKwh_i / totalKwh)
économies_totales_pct = 1 − Π(1 − g_i)
économies_totales_pct = min(économies_totales_pct, 0,65)
```

---

## 9. Projection financière 10 ans

```
part_elec = €_elec / (€_elec + €_gaz)
taux_inflation = part_elec × 3,5 % + part_gaz × 4,5 % + part_autre × 3,5 %

Année n :
   cumul_sans = Σ totalCoût × (1 + taux)^i
   cumul_avec = capex_net + Σ (totalCoût − économies) × (1 + taux)^i
   économies_nettes_n = cumul_sans − cumul_avec
```

**ROI global publié** uniquement si 0,5 ≤ ROI ≤ 20 ans et économies ≥ 1 % (`graphiquePubliable = true`).

**Scénario rapide** : sous-ensemble des actions `tier = light` ou capex < 3 000 €, projeté séparément pour permettre une lecture « premiers pas » versus « plan complet ».

---

## 10. Qualification prospect (lead scoring)

Score /100 sans impact sur le calcul énergétique, utilisé pour orienter le suivi commercial (champ `lead_qualification`).

| Axe | Poids max | Détail |
|---|---:|---|
| Urgence décision | 30 | `immediate` 30, `3to6months` 24, … `exploring` 4 |
| Budget annoncé | 25 | `over80k` 25, `20to80k` 20, `5to20k` 14, `under5k` 6 |
| Potentiel économies | 20 | ≥ 30 % composite : 20 ; ≥ 20 % : 14 ; ≥ 10 % : 8 |
| Pouvoir décisionnel | 15 | `owner` 15, decision_maker yes 12, need_approval 7 |
| Objectif projet | 10 | reduce_costs 10, comply_regulation 9, valorise 7 |

Niveau étoiles : 80+ Urgent, 65+ Très chaud, 48+ Chaud, 30+ Tiède, sinon Découverte.

---

## 11. Warnings standardisés

| Code | Trigger | Sévérité |
|---|---|---|
| `PRICE_IMPLIED_OUT_OF_RANGE` | Prix implicite €/kWh hors bornes | warning |
| `SUBSCRIPTION_INCLUDED_NO_VALUE` | `includesSubscription = true` mais montant absent | warning |
| `NETWORK_HEAT_NO_DATA` | Chauffage réseau mais aucune consommation déclarée | warning |
| `NETWORK_HEAT_PARTIAL` | Chauffage réseau : diagnostic thermique partiel | info |
| `NO_CONSUMPTION_DATA` | Ni élec, ni gaz déclarés | warning |

**Score de confiance** `/100` : pénalité −15 par conversion €, bonus +5 par kWh direct, pénalité −50 si aucune donnée énergie, −20 si benchmark en `pending_expert`.

---

## 12. Travaux d'enveloppe hors seuil ROI

Pour les bâtiments `pre1975` ou `1975_2000`, la section `envelope_opportunities` affiche ACT15 (toiture) et ACT16 (ITE murs si surface ≥ 300 m²) **même si ROI > 10 ans**, avec la note pédagogique : « requis pour atteindre le Décret Tertiaire −40 % en 2030 / −50 % en 2040 ».

Les CAPEX sont calculés à 80 €/m² (toiture) et 190 × 0,6 €/m² (ITE). Les gains sont estimés à 20 % (toiture) / 18 % (murs) du coût chauffage.

---

## 13. Modèle d'aides financières

Hypothèse structurante : **en tertiaire non résidentiel, MaPrimeRénov' ne s'applique pas** (réservée au résidentiel). Les dispositifs retenus sont :

| Dispositif | Actions concernées | Fourchette retenue |
|---|---|---|
| CEE BAT-TH-113 (PAC) | ACT13 | 15-20 % (intégré dans la grille 18/25/30 % selon surface) |
| CEE BAT-TH-116 (GTB) | ACT14, ACT18 | 12-18 % |
| CEE BAT-EN-101 (toiture) | ACT15 | 15 % (fourchette basse 15-22 %) |
| CEE BAT-EN-102 (murs) | ACT16 | 15 % |
| CEE BAT-EN-104 (fenêtres) | ACT17 | 8 % |
| CEE BAT-EQ-162 (LED) | ACT08 | 15 % |
| CEE régulation / VMC | ACT02, ACT03, ACT05, ACT06, ACT07, ACT09, ACT10 | 15 % |
| Fonds Chaleur ADEME | ACT13 si > 300 m² | intégré dans la grille PAC |
| Prime CRE autoconsommation PV | ACT22 | 60-120 €/kWc selon tranche |

> **Biais de prudence documenté** : les valeurs `aid_pct` stockées dans la bibliothèque correspondent systématiquement à la borne basse de la fourchette plausible 2026. L'outil sous-annonce volontairement les aides pour qu'un artisan ou un dossier réel produise une « bonne surprise » chez le maître d'ouvrage, jamais une désillusion. L'aide réellement perçue peut être égale ou supérieure, jamais inférieure à l'hypothèse moteur.

---

## 14. Simulations témoins — À RÉGÉNÉRER EN PHASE 6

> **Placeholder V1.7.0.** La dernière exécution de `scripts/whitepaper-sims.js` date de V1.6.2 (médiane composite observée 53,5 %, hors du gabarit cible 25-45 % fixé par le comité d'experts). Ces résultats sont obsolètes depuis la refonte structurelle de la composition en V1.7.0 (cap par segment ADEME, cf. §7bis). Cette section sera régénérée automatiquement à partir de `scripts/qa-results-1.7.0.json` en Phase 6 du plan de release. **Aucune valeur chiffrée ne doit être citée tant que cette section n'est pas régénérée** — toute référence externe à ces simulations doit attendre la publication de la V1.7.0 finale.

---

## 15. Garde-fous et tests automatisés

- **Anti-NaN / anti-division zéro** : contrôle explicite `surface > 0`, `totalKwh finite`, tous les ROI protégés par `gainEuro > 0`.
- **Cap absolu (V1.7.0)** : `NEW_DIAGNOSTIC_MAX_TOTAL_SAVINGS_PCT = 0,45` sur gains composés kWh et €, aligné sur le plafond Décret Tertiaire −40 % horizon 2030 (cf. §7bis.2). Cap d'affichage `NEW_DIAGNOSTIC_DISPLAYED_MAX_SAVINGS_PCT = 0,45` également.
- **Conservation** : Σ kWh postes = totalKwh (résidu absorbé par `other`).
- **Garde-fou breakdowns** : IIFE de chargement vérifie Σ = 100 % pour chaque secteur.
- **Invalidation cache** : `ENGINE_VERSION` incrémenté à chaque modification moteur ; le front écarte toute donnée `localStorage` produite par une version antérieure.
- **QA runner** (`scripts/qa-runner.js`) : 30 scénarios exécutés avant release, validation version + conservation + absence de NaN + plafonds + exclusions. Résultat V1.6.2 : **30/30 PASS**.
- **Tests unitaires en ligne** : `newDiagnosticRunSplitUnitTests()` (5 tests répartition) + `newDiagnosticRunReportTests()` (8 tests rapport).

---

## 16. Roadmap de validation externe

1. **Comparaison ADEME** : confronter les intensités médianes 2026 à l'édition OPERAT la plus récente (campagne 2024-2025 publiée mi-2026).
2. **Audit d'un échantillon** : soumettre 10 dossiers réels avec audits ISO 50002 en regard, mesurer l'écart absolu entre recommandations DiagTertiaire et plan d'actions auditeur.
3. **Contrôle aid_pct** : vérifier avec un opérateur CEE (ex. ATEE) la pertinence des taux 2026 sur 5 secteurs majeurs.
4. **Calibration PAC** : valider la grille puissance × CAPEX avec un panel de 3 installateurs partenaires.
5. **Révision annuelle** : prix énergie (CRE), aides (arrêtés), facteurs d'émission (Base Carbone), rendement PV (PVGIS publication annuelle).

---

## Annexe A — Références de tables (chemins)

| Constante | Rôle | Ligne src/engine.js |
|---|---|---|
| `NEW_DIAGNOSTIC_BUILDING_AGES` | Coefs âge bâtiment | 19 |
| `COP_PAC_BY_BUILDING_AGE` | COP PAC selon âge | 49 |
| `NEW_DIAGNOSTIC_ENERGY_PRICES` | Prix vecteurs | 84 |
| `INFLATION_ENERGIE` | Taux annuels | 121 |
| `CARBON_FACTORS_KG_CO2_PER_KWH` | Émissions | 140 |
| `NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY` | Médianes sectorielles | 153 |
| `DECRET_TERTIAIRE_CABS_2030` | Cibles Cabs | 224 |
| `NEW_DIAGNOSTIC_USAGE_BREAKDOWNS` | Répartitions % globales | 254 |
| `NEW_DIAGNOSTIC_ACTIONS_LIBRARY` | 20 actions (ACT12 et ACT20 : IDs réservés non utilisés) | 406 |
| `NEW_DIAGNOSTIC_PV_*` | Constantes PV | 954 |
| `NEW_DIAGNOSTIC_GAS_SPLIT_BY_ACTIVITY` | Répartition gaz | 986 |
| `NEW_DIAGNOSTIC_ELEC_SPLIT_BY_ACTIVITY` | Répartition élec non thermique | 1012 |
| `NEW_DIAGNOSTIC_CET_TIERS` | Tiers CAPEX CET | 1456 |
| `NEW_DIAGNOSTIC_PAC_EAU_TIERS` | Tiers CAPEX PAC air/eau | 1465 |
| `newDiagnosticBuildReportData` | Pipeline principal | 2543 |
| `newDiagnosticBuildProjectionData` | Projection 10 ans | 2947 |

## Annexe B — Glossaire rapide

- **EF** : énergie finale (celle facturée, avant coefficient de conversion en primaire).
- **COP** : Coefficient of Performance (rapport énergie utile / énergie électrique consommée).
- **CEE** : Certificats d'Économies d'Énergie (obligation B2B, prime versée par les obligés).
- **Fonds Chaleur** : aide ADEME dédiée aux installations ENR&R > 30 kW.
- **Cabs** : valeur absolue cible du Décret Tertiaire (consommation maximale /m²/an).
- **Composite savings (V1.7.0)** : gains agrégés additivement après application d'un cap ADEME par segment (`heating_post`, `dhw_post`, `lighting_post`, `cooling_post`, `vent_aux_post`, `elec_post`, `total`), puis cap réglementaire global à 45 % (Décret Tertiaire −40 % 2030). Cf. §7bis. La formule multiplicative historique `1 − Π(1 − gᵢ)` est abrogée (cf. §8).
- **Zone climatique** : zonage H1/H2/H3 (code postal) ajustant les besoins de chauffage et ECS.

---

*Document aligné sur le plan de refonte `src/engine.js` v1.7.0 (2026-04-16, Phase 1/6 doc). Le code moteur reste en v1.6.3 jusqu'à Phase 2. Toute évolution ultérieure du moteur impose la mise à jour de ce document dans le même commit.*
