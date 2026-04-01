# Moteur de Calcul DiagTertiaire — v2.0

**Version :** v2.0-2026-energy-split  
**Fichier :** `index.html` (~700 Ko, React/Babel standalone)  
**Date :** 2026-03-27

---

## ⚠️ Problème corrigé dans v2.0

L'ancien moteur (v1.0) additionnait les kWh électriques et gaz dans un `totalKwh`, puis appliquait des pourcentages statistiques sur ce total. **Résultat incorrect** : pour un commerce avec 5 000 € d'élec (≈ 24 300 kWh) et 20 000 € de gaz (≈ 185 000 kWh) :
- Ancien : `lighting_kwh = 209 000 × 32% = 66 880 kWh` → gain LED ≈ 8 000 €/an (**×6 surestimé**)
- Nouveau : `lighting_kwh = 24 300 × 48% = 11 660 kWh` → gain LED ≈ 1 400 €/an (**correct**)

---

## Règle fondamentale

> **On raisonne toujours en énergie finale.** Jamais d'énergie primaire dans les calculs de gains ou de coûts.

---

## Pipeline complet

```
1. Normalisation inputs (surface, activity)
2. Conversion € → kWh (par source : élec, gaz séparément)
   2bis. Séparation flux par source → splitResult
3. Intensité kWh/m²/an (totalKwh = élec + gaz)
4. Benchmark vs activité
5. Répartition postes (depuis splitResult)
6. Déclenchement + scoring des actions
7. Calcul gains/économies/ROI (par poste, au bon prix)
8. Tri actions (impact × faisabilité / CAPEX)
9. Output payload standardisé
```

---

## Principe de séparation des flux — `newDiagnosticSplitByEnergySource`

### Le gaz ne sert QU'au chauffage et à l'ECS

```
gasKwh → Split selon NEW_DIAGNOSTIC_GAS_SPLIT_BY_ACTIVITY
         → gasHeatingKwh + gasEcsKwh
```

### L'électricité alimente tout le reste

```
elecKwh → elecForHeating (si chauffage électrique)
        → elecForEcs     (si ECS électrique)
        → elecForOtherUses = elecKwh - elecForHeating - elecForEcs
           → Split selon NEW_DIAGNOSTIC_ELEC_SPLIT_BY_ACTIVITY
              → lighting / cooling / ventilation / other
```

### Objet splitResult

```js
{
    elecKwh, gasKwh, totalKwh,
    posts: {
        heating:     { kwh, source: 'gas'|'elec', pricePerKwh: 0.108|0.206 },
        ecs:         { kwh, source, pricePerKwh },
        lighting:    { kwh, source: 'elec', pricePerKwh: 0.206 },
        cooling:     { kwh, source: 'elec', pricePerKwh: 0.206 },
        ventilation: { kwh, source: 'elec', pricePerKwh: 0.206 },
        other:       { kwh, source: 'elec', pricePerKwh: 0.206 }
    },
    breakdown_pct: { heating_pct, dhw_pct, lighting_pct, cooling_pct, vent_aux_pct, other_specific_pct },
    heatingSource: 'gas'|'elec',
    ecsSource:     'gas'|'elec'
}
```

---

## Tables de données

### `NEW_DIAGNOSTIC_GAS_SPLIT_BY_ACTIVITY`
Répartition du gaz entre chauffage et ECS par activité.

| Activité      | Chauffage | ECS |
|--------------|-----------|-----|
| offices      | 88%       | 12% |
| retail       | 92%       | 8%  |
| hotel        | 60%       | 40% |
| restaurant   | 65%       | 35% |
| education    | 90%       | 10% |
| health_local | 78%       | 22% |
| light_warehouse | 95%    | 5%  |

### `NEW_DIAGNOSTIC_ELEC_SPLIT_BY_ACTIVITY`
Répartition de l'électricité non-thermique (hors chauffage/ECS).

| Activité     | Éclairage | Clim | Ventilation | Autres |
|-------------|-----------|------|-------------|--------|
| offices     | 30%       | 18%  | 15%         | 37%    |
| retail      | 48%       | 15%  | 10%         | 27%    |
| hotel       | 28%       | 12%  | 18%         | 42%    |
| restaurant  | 20%       | 8%   | 22%         | 50%    |
| commerce_alim | 25%    | 5%   | 8%          | 62%    |

---

## Calcul des gains par action — `newDiagnosticCalculateActionGain`

**Nouveau pipeline** (signature : `action, splitResult, surface, formData, energyPrices`):

| gain_scope       | Base kWh utilisé           | Prix appliqué             |
|-----------------|---------------------------|--------------------------|
| `heating_post`  | `splitResult.posts.heating.kwh` | `posts.heating.pricePerKwh` (0.108 si gaz, 0.206 si élec) |
| `dhw_post`      | `splitResult.posts.ecs.kwh`     | `posts.ecs.pricePerKwh`       |
| `lighting_post` | `splitResult.posts.lighting.kwh` | 0.206 €/kWh                  |
| `cooling_post`  | `splitResult.posts.cooling.kwh`  | 0.206 €/kWh                  |
| `vent_aux_post` | `splitResult.posts.ventilation.kwh` | 0.206 €/kWh               |
| `elec_post`     | `splitResult.elecKwh`            | 0.206 €/kWh                  |
| `total`         | `splitResult.totalKwh`           | Prix moyen pondéré           |

---

## Dimensionnement PV — `newDiagnosticEstimatePhotovoltaicScenario`

### Changement v2.0

- `loadLimitedKwc = (estimatedSiteElecKwh × **0.90**) / localYield` (**autoconsommation prioritaire**)
- Ancienne valeur : 1.10 (surdimensionnement pour la revente)

### Post-PAC — `newDiagnosticEstimatePvSizing`

Si une PAC (ACT13) est recommandée, la conso élec future est recalculée :
```
targetElecKwh = elecKwh + round(gasHeatingKwh / 3.5)   // COP PAC = 3.5
```
Le PV est dimensionné sur cette cible post-travaux.

### Tarification surplus (arrêté S21 T2 2026)

| Puissance | Tarif surplus |
|-----------|--------------|
| ≤ 9 kWc   | 0.0400 €/kWh |
| 10–100 kWc | 0.0473 €/kWh |

### CAPEX PV dégressif

| Tranche | Prix |
|---------|------|
| ≤ 9 kWc | 1 400 €/kWc |
| 10–36 kWc | 1 200 €/kWc |
| 37–100 kWc | 1 050 €/kWc |

### Prime autoconsommation

| Tranche | Prime |
|---------|-------|
| ≤ 9 kWc | 80 €/kWc |
| 10–36 kWc | 70 €/kWc |
| 37–100 kWc | 60 €/kWc |

---

## CAPEX PAC — Tranches marginales (ACT13)

```
CAPEX(surface) =
  min(surface, 200) × 95 €/m²
  + max(0, min(surface-200, 400)) × 65 €/m²
  + max(0, surface-600) × 45 €/m²
  minimum = 10 000 €
```

---

## Gains composés — `newDiagnosticCalculateCompositeSavings`

```
gainPct_i = gainKwh_i / totalKwh     (sur totalKwh toutes sources)
composite = 1 - Π(1 - gainPct_i)
résultat = min(composite, 0.65)       // cap 65%
```

**Changement v2.0 :** signature `(actions, totalKwh)` — les gainKwh sont calculés par poste au bon prix, et la part totale est exprimée par rapport au totalKwh bi-source pour cohérence de l'intensité.

---

## Exemple — Commerce 400 m², 5 000 € élec + 20 000 € gaz, chauffage gaz

```
elecKwh = 5000 / 0.206 = 24 272 kWh
gasKwh  = 20000 / 0.108 = 185 185 kWh
totalKwh = 209 457 kWh (intensité = 523 kWh/m²)

Séparation gaz (retail: 92% chauff, 8% ECS) :
  gasHeating = 185 185 × 92% = 170 370 kWh à 0.108 €/kWh
  gasEcs     = 185 185 × 8%  = 14 815 kWh à 0.108 €/kWh

Séparation élec non-thermique (retail: 48% éclairage, 15% clim...) :
  elecLighting    = 24 272 × 48% = 11 651 kWh
  elecCooling     = 24 272 × 15% = 3 641 kWh
  elecVentilation = 24 272 × 10% = 2 427 kWh
  elecOther       = 24 272 × 27% = 6 553 kWh

Gain LED (ACT08, gain_pct_med = 60%) :
  gainKwh = 11 651 × 60% = 6 991 kWh
  gainEuro = 6 991 × 0.206 = 1 440 €/an
  (vs. ancien moteur : 209 457 × 32% × 60% × 0.206 ≈ 8 300 €/an → ×5.8)
```

---

## Garde-fous

- `elecLightingKwh + elecCoolingKwh + elecVentilationKwh + elecOtherKwh` ≤ `elecKwh` (garanti par construction)
- Gains plafonnés à 65% en cumulé
- PV : autoconsommation plafonnée à 95% de la conso élec
- ROI PV complémentaire : affiché seulement si 10 ≤ ROI ≤ 15 ans

---

## Limites

- Ce modèle est un **pré-diagnostic statistique**, non substituable à un audit énergétique réglementaire
- Les pourcentages de répartition sont issus de données ADEME/CEREN — non mesurés sur site
- Les gains et ROI sont indicatifs, à confirmer avant travaux par un professionnel
