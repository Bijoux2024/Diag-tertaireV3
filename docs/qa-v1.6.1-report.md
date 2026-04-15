# Rapport QA V1.6.1 — 30 simulations

**Cible** : V1.6.1 (non mergée)
**Baseline testée** : V1.6.0 (`src/engine.js:12` → `ENGINE_VERSION = '1.6.0'`)
**Date** : 2026-04-14
**Runner** : `scripts/qa-runner.js` (lecture seule, sandbox `vm.createContext`)
**Précision estimée vs réalité terrain artisan FR Q4 2025** : **~72 %** (gap principal : tiers ACT13 surcotés de +21 % à +37 %, plafonds CET/PAC inadaptés aux très grands volumes).

---

## Bugs bloquants pré-identifiés (baseline V1.6.0 → cible V1.6.1)

- **BUG-001** : `engine_version = '1.6.0'` au lieu de `'1.6.1'` ([src/engine.js:12](../src/engine.js#L12)). Impact : 30/30 scénarios retournent `1.6.0`. À bumper à `1.6.1` dans la release.
- **BUG-002** : ACT18 filtré inconditionnellement ([src/engine.js:2068-2071](../src/engine.js#L2068-L2071)) — invisible côté client. Impact : 0/30 scénarios retournent ACT18 dans `top_actions[]`, alors que le dimensionnement interne (`newDiagnosticComputeCetSizing`) est fonctionnel sur 26/30 et produit des volumes/capex cohérents. À arbitrer : soit on retire le filtre L2071 (position V1.6.1), soit on documente ACT18 comme désactivé côté UI et on supprime aussi le code de calcul mort.

---

## Synthèse

- **Taux de passage hors gaps V1.6.1** : **30/30** (aucun crash, aucun NaN, aucun `breakdown_total` hors tolérance, toutes les intensités > 0 quand conso > 0).
- **Gaps V1.6.1 confirmés** : **56 warnings** (30× BUG-001 + 26× BUG-002 sur scénarios avec ACT18 interne calculé).
- **Bugs nouveaux découverts (consortium)** : **5** (BUG-003 à BUG-007, détaillés plus bas).
- **Alertes plausibilité** : 2 scénarios au plafond PAC 200 kW sous-dimensionnés (grand hôtel 20000m², grande logistique), 1 scénario conceptuellement douteux (remplacement PAC→PAC sur ECS thermodynamique déjà installée).

---

## Périmètre vérifié

| Critère | Résultat |
|---|---|
| Aucun NaN / Infinity / undefined | ✅ 30/30 |
| `breakdown.total ≈ 100 %` | ✅ 30/30 (100.0 % sur toutes les décompositions) |
| `intensity > 0` si conso > 0 | ✅ 30/30 |
| `actions.length >= 1` si éligible | ✅ 30/30 (2 à 6 actions selon scénario) |
| ACT13 capex ∈ tiers code `{17800,29000,64000,122000,232000}` | ✅ 9/9 (quand présent) |
| ACT18 capex interne ∈ tiers code `{4600,5800,9200,17500,34000,84000}` | ✅ 26/26 (quand calculable) |
| `V_L ≤ 2000` (plafond brief) | ❌ 7/26 dépassent (tier 5000L existe — voir BUG-004) |
| `P_kW ≤ 200` (plafond brief) | ✅ 30/30 (plafond implicite du code = 200 kW) |
| ACT18 absent de `top_actions[]` (baseline L2071) | ✅ 30/30 |
| `engine_version === '1.6.0'` (baseline) | ✅ 30/30 |
| `engine_version === '1.6.1'` (cible) | ❌ 0/30 → BUG-001 |

---

## Tableau récapitulatif

| # | Activité | Surface (m²) | CP / Zone | Chauff source | ECS source | ACT13 kW/€ | ACT18 (interne) L/€ | Statut |
|---|---|---:|---|---|---|---:|---:|---|
| 1 | offices | 100 | 75008 H2 | gas | gas | — | 200 / 4 600 | OK |
| 2 | offices | 500 | 67000 H1 | elec_conv | electric | — | 300 / 5 800 | OK |
| 3 | offices | 1000 | 21000 H1 | fuel | electric | — | 200 / 4 600 | OK |
| 4 | offices | 5000 | 75012 H2 | network | — (gas via network) | — | — | ⚠ ECS non résolue |
| 5 | offices | 20000 | 06000 H3 | pac | pac | — | **5000 / 84 000** | ⚠ PAC→PAC (BUG-007) |
| 6 | restaurant | 100 | 75001 H2 | gas | gas | — | 200 / 4 600 | OK |
| 7 | restaurant | 200 | 69000 H1 | gas | electric | — | 300 / 5 800 | OK |
| 8 | restaurant | 500 | 13000 H3 | fuel | fuel | — | 500 / 9 200 | OK |
| 9 | restaurant | 1000 | 44000 H2 | elec_conv | electric | — | 2000 / 34 000 | OK |
| 10 | restaurant | 5000 | 88000 H1 | gas | gas | — | **5000 / 84 000** | ⚠ plafond |
| 11 | commerce_alim | 1000 | 33000 H2 | gas | gas | 10 / 17 800 | 200 / 4 600 | OK |
| 12 | commerce_alim | 5000 | 57000 H1 | network | — | — | — | ⚠ ECS non résolue (network) |
| 13 | commerce_nonalim | 500 | 34000 H3 | elec_conv | electric | 20 / 29 000 | 200 / 4 600 | OK |
| 14 | commerce_nonalim | 100 | 54000 H1 | gas | gas | — | 200 / 4 600 | OK |
| 15 | hotel | 200 | 44000 H2 | gas | gas | — | 1000 / 17 500 | OK |
| 16 | hotel | 720 | 67000 H1 | elec_conv | electric | — | **5000 / 84 000** | ⚠ plafond |
| 17 | hotel | 1000 | 25000 H1 | fuel | fuel | — | **5000 / 84 000** | ⚠ plafond |
| 18 | hotel | 5000 | 06000 H3 | gas | gas | — | **5000 / 84 000** | ⚠ plafond |
| 19 | sport | 1000 | 75014 H2 | gas | gas | 100 / 122 000 | 1000 / 17 500 | OK |
| 20 | health | 5000 | 68000 H1 | network | — | — | — | ⚠ ECS non résolue |
| 21 | school (education) | 500 | 90000 H1 | fuel | electric | — | 200 / 4 600 | OK |
| 22 | logistique (commerce_nonalim) | 20000 | 45000 H1 | gas | gas | 200 / 232 000 | **5000 / 84 000** | ⚠ plafond |
| 23 | offices (100m² tiny) | 100 | 44000 H2 | elec_conv | electric | — | 200 / 4 600 | OK |
| 24 | hotel (20000m² max) | 20000 | 67000 H1 | gas | gas | 200 / 232 000 | **5000 / 84 000** | ❌ plafonds saturés (besoin réel ≈ 1 579 kW / 80 868 L) |
| 25 | offices (ECS solar) | 1000 | 75008 H2 | pac | — (solar) | — | — (null attendu) | ✅ filtrage solar OK |
| 26 | offices | 1000 | 13008 H3 | gas | gas | 20 / 29 000 | 200 / 4 600 | OK |
| 27 | commerce_alim | 500 | 30000 H3 | fuel | fuel | 10 / 17 800 | 200 / 4 600 | OK |
| 28 | hotel | 200 | 20000 H3 | elec_conv | electric | — | 1000 / 17 500 | OK |
| 29 | offices (boiler_recent) | 500 | 44000 H2 | gas | gas | — (exclu) | 200 / 4 600 | ✅ ACT13 filtré |
| 30 | hotel (pac_done) | 1000 | 75000 H2 | pac | pac | — (exclu) | **5000 / 84 000** | ⚠ PAC→PAC (BUG-007) |

Notes :
- Colonne « ACT13 » = présent dans `top_actions[]`. Quand absent, soit non éligible (PAC déjà là, chaudière <5 ans), soit filtré en amont (ROI > 10 ans), soit source chauffage non-gaz/fioul/elec/conv.
- Colonne « ACT18 (interne) » = sortie de `newDiagnosticComputeCetSizing` **avant** filtre L2071. ACT18 n'apparaît jamais dans `top_actions[]` en V1.6.0 (BUG-002).
- Zones climat vérifiées sur tous les CP via `newDiagnosticResolveClimatZone` : cohérent avec la table H1/H3 du code (45000 = H1, 44000 = H2, 75xxx = H2, 06/13/20/30/34 = H3). Brief QA ne contredit pas.

---

## Bugs nouveaux (à arbitrer par le consortium)

### BUG-003 — Tiers ACT13 (PAC air/eau) divergents du brief V1.6.1
**Gravité** : haute (impacte 9 scénarios / précision capex).

| Puissance (kW) | Brief V1.6.1 (€) | Code V1.6.0 ([engine.js:1480-1486](../src/engine.js#L1480-L1486)) | Écart |
|---:|---:|---:|---:|
| 10 | 13 000 | 17 800 | +37 % |
| 20 | 24 000 | 29 000 | +21 % |
| 50 | 58 000 | 64 000 | +10 % |
| 100 | 110 000 | 122 000 | +11 % |
| 200 | 210 000 | 232 000 | +10 % |

**Hypothèse de cause** : le brief cible des tiers « mediane artisan FR Q4 2025 » plus agressifs ; le code actuel semble calibré sur un haut de fourchette (ou sur d'anciennes hypothèses coût). Arbitrage requis : les tiers du code sont-ils correctement sourcés (devis ≥ 3 artisans) ou doit-on appliquer les tiers du brief pour V1.6.1 ?

### BUG-004 — Tier CET 5000L / 84 000€ non prévu au brief (plafond réel > 2000L)
**Gravité** : moyenne (plausibilité des très gros bâtiments).

Le brief affirme un plafond à 2000L/34 000€. Le code ajoute un tier 5000L/84 000€ ([engine.js:1476](../src/engine.js#L1476)), déclenché sur 7 scénarios (#5, #10, #16-18, #22, #24, #30). Sur #24 (hôtel 20 000m²), le besoin utile calculé est de 1 540 880 kWh/an → volume théorique ≈ 80 868 L, massivement sous-dimensionné par le tier 5000L.

**Arbitrage** : soit supprimer le tier 5000L (plafonner à 2000L conforme au brief), soit assumer le 5000L et documenter explicitement dans la release note — et ajouter un warning « besoin > plafond tier » dans les cas qui dépassent.

### BUG-005 — Plafond PAC air/eau 200 kW saturé sur très grandes surfaces
**Gravité** : moyenne.

Scénarios #22 (logistique 20 000m²) et #24 (hôtel 20 000m²) retournent tier 200 kW / 232 000€, alors que le besoin utile calculé est respectivement 841 500 kWh et 2 842 400 kWh → puissance théorique 468 kW et 1 579 kW. Le capex réel installé serait >> 232 000€.

**Arbitrage** : ajouter un tier 500 kW ? Ou exclure ACT13 si `puissanceKwRaw > 200` (message « installation nécessite étude spécifique, hors grille tarifaire ») ?

### BUG-006 — Rendement PAC 2.5 gonfle artificiellement le besoin utile si la source est déjà PAC
**Gravité** : moyenne (cohérence conceptuelle).

Scénarios #5 (bureau 20 000m² PAC+PAC) et #30 (hôtel 1000m² PAC+PAC) : la formule `besoinUtile = consoKwh × partPost × rendement` multiplie la conso élec par **2.5** (COP PAC) pour obtenir le besoin utile. Résultat : volume CET 5000L / capex 84 000€ pour remplacer une PAC existante par un CET — ce qui n'a pas de sens thermique (COP CET ≈ 3 vs COP PAC actuelle 2.5 = gain ECS résiduel ~15 %).

Note : la règle d'éligibilité ACT18 ([engine.js:2007-2008](../src/engine.js#L2007-L2008)) exclut `ecsSystem='heat_pump'` et `ecsSameSystem && mainHeating='pac'`, donc ACT18 serait **correctement filtré** en aval — mais `newDiagnosticComputeCetSizing` produit quand même un résultat plausible-mais-absurde si appelé directement. **Arbitrage** : soit court-circuiter le resolveur ECS pour retourner `null` quand source='pac' (proprement), soit documenter que `ComputeCetSizing` ne doit être appelé qu'après filtrage d'éligibilité.

### BUG-007 — Réseau de chaleur → ECS non résolue → ACT18 silencieusement absent
**Gravité** : faible (cohérent mais non documenté).

Scénarios #4, #12, #20 (mainHeating='network', ecsSameSystem=true) : `newDiagnosticResolveEcsSource` retourne `source='gas'` mais lit `gasKwh` à 0 (car `gasUsed=false`, seul `networkKwh` est rempli) → `consoKwh = 0` → `return null`. Résultat : ACT18 jamais proposé pour les bâtiments sur réseau de chaleur, même si l'ECS pourrait tirer sur le réseau.

**Arbitrage** : pour `mainHeating='network' && ecsSameSystem=true`, fallback sur `networkKwh` au lieu de `gasKwh`. Même logique pour `ResolveHeatSource`.

---

## Détails anomalies

### A1. Zone H1 attendue vs reçue : 100 % concordance
Tous les CP testés renvoient la zone attendue selon la table H1/H3 du code. Aucun écart.

### A2. Ponderation zone H1/H3 (chauff ×1.10/×0.90, ECS ×1.03/×0.97)
Vérifié conforme au brief sur [engine.js:1604](../src/engine.js#L1604) (CET) et [engine.js:1633](../src/engine.js#L1633) (PAC).

### A3. Rendements source : conforme brief
gaz/fioul 0.85, elec/conv 0.95, PAC 2.5 ([engine.js:1489-1499](../src/engine.js#L1489-L1499)).

### A4. Formules dimensionnement : conforme brief
- V_L (CET) = besoin / 19.053 → [engine.js:1609](../src/engine.js#L1609)
- P_kW (PAC) = besoin / 1800h → [engine.js:1637](../src/engine.js#L1637)

### A5. Ratios capex/m² plausibilité (hors plafonds)
- PAC 10 kW @ 1000m² alim (#11) → 17.8 €/m² — **sur-conservateur** vs ratio terrain ~12-15 €/m²
- PAC 20 kW @ 500m² commerce (#13) → 58 €/m² — haut, cohérent petit volume
- PAC 100 kW @ 1000m² sport (#19) → 122 €/m² — élevé mais cohérent (piscine-like)
- CET 200L @ bureau 100m² → 46 €/m² — cohérent
- CET 1000L @ hôtel 200m² → 87 €/m² — cohérent

Les ordres de grandeur sont globalement plausibles sauf sur les plafonds saturés (BUG-004, BUG-005).

---

## Points à arbitrer par le consortium

1. **Tiers ACT13** : valider la grille brief (13/24/58/110/210 k€) ou maintenir la grille code (17.8/29/64/122/232 k€) ? → décision sur source de vérité (artisan FR Q4 2025).
2. **Plafonds** : 2000L/200kW suffisent-ils pour tertiaire courant, ou ajouter tiers 5000L déjà présent + tier 500 kW PAC pour grands ensembles ?
3. **ACT18 filtré L2071** : stratégie produit claire ? Soit retrait du filtre et affichage, soit suppression du code mort (`newDiagnosticComputeCetSizing` + action `ACT18`) pour économiser la maintenance.
4. **PAC→PAC / CET→PAC** : introduire un garde au niveau du resolveur (retourner `null` si source déjà thermodynamique) ou garder le filtrage au niveau de `filterAndScoreActions` ?
5. **Réseau de chaleur** : fallback `networkKwh` dans les resolveurs ECS/Heat pour ne pas « perdre » l'éligibilité ACT18 sur ces bâtiments.
6. **Bump `engine_version` à `'1.6.1'`** dans la release : trivial mais doit être explicite.
7. **Harmonisation brief vs code** : le brief QA V1.6.1 dit « 2 actions dynamiques » (ACT13 + ACT18) — or le moteur en produit 5 à 6 (ACT01, ACT02, ACT03, ACT05, ACT07, ACT08, ACT10, ACT11, ACT14, ACT21, ACT22 apparaissent aussi). Scope réel à confirmer avec le consortium.

---

## Annexes

- Données brutes : `scripts/qa-results.json` (30 lignes, toutes les entrées + sorties)
- Script reproductible : `scripts/qa-runner.js` (lecture seule sur `src/engine.js`, aucun patch appliqué)
- Commandes : `node scripts/qa-runner.js`

### Annexe 1 — Probe ciblée BUG-007 (réseau de chaleur)

Script : `scripts/qa-network-probe.js`. 4 scénarios `mainHeating='network'` avec variations ECS :

| # | Config ECS | `newDiagnosticResolveEcsSource` | `dhw_pct` split | `ComputeCetSizing` |
|---|---|---|---:|---|
| N1 | `ecsSameSystem=true` (ECS via réseau) | **null** ❌ | 5 % (48 000 kWh!) | null (perdue) |
| N2 | `ecsSameSystem=false`, ballon élec | `{source:'electric', conso:60000}` ✅ | 5 % | V=200L / 4 600€ |
| N3 | `ecsSameSystem=false`, chaudière gaz (gasUsed=true) | `{source:'gas', conso:50000}` ✅ | 22 % | V=1000L / 17 500€ |
| N4 | `ecsSameSystem=false`, `ecsSystem='network_dedicated'` | **null** ❌ | 22 % (240 000 kWh!) | null (perdue) |

**Conclusion BUG-007** : confirmé sur N1 et N4. Le resolveur ECS map `source='gas'` mais lit `gasKwh=0` (car `gasUsed=false` sur réseau de chaleur pur), d'où `return null`. Pourtant le `splitResult` **alloue bien** du kWh au poste ECS (48 000 kWh en N1, 240 000 kWh en N4) — donc le besoin existe dans le split mais est invisible pour le dimensionnement CET. **Incohérence confirmée** entre `splitByEnergySource` (qui attribue l'ECS au réseau) et `resolveEcsSource` (qui ne sait pas lire le réseau).

**Correctif V1.6.1 proposé** : dans `newDiagnosticResolveEcsSource`, quand `source='gas'` et `gasKwh=0` mais `networkUsed && mainHeating='network'`, lire `networkKwh` au lieu de `gasKwh`. Idem pour `ResolveHeatSource`. Rendement à utiliser : 0.95 (table réseau de chaleur) au lieu de 0.85 (gaz).
