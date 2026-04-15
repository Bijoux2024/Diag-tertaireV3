# Dossier d'arbitrage consortium — Release V1.6.1

**Projet** : DiagTertiaire — moteur de calcul énergétique tertiaire FR
**Version testée** : V1.6.0 (baseline) → cible V1.6.1
**Date** : 2026-04-15
**Périmètre QA** : 30 simulations + 4 probes ciblées, lecture seule sur `src/engine.js`
**Livrables sources** : `docs/qa-v1.6.1-report.md`, `scripts/qa-runner.js`, `scripts/qa-network-probe.js`, `scripts/qa-results.json`

---

## 1. Pourquoi ce document

La release V1.6.1 vise **85 % de précision** vs réalité terrain artisan FR Q4 2025 sur le dimensionnement PAC air/eau (ACT13) et CET (ACT18). La campagne QA a confirmé les deux bugs pré-identifiés qui motivent la release, **et découvert 5 anomalies supplémentaires** qui requièrent votre arbitrage avant patch.

Aucune modification de code n'a été effectuée. Ce dossier liste ce qui doit être décidé collectivement avant la release V1.6.1.

---

## 2. État de santé du moteur V1.6.0

| Indicateur | Résultat |
|---|---|
| Scénarios exécutés | 30/30 sans crash |
| `breakdown_total = 100 %` | 30/30 |
| Aucun NaN / Infinity / undefined | 30/30 |
| Intensité > 0 si conso > 0 | 30/30 |
| Tiers ACT13 conformes au code | 9/9 |
| Tiers ACT18 conformes au code (calcul interne) | 26/26 |
| Zones climatiques H1/H2/H3 (CP) | 30/30 correctes |
| Formules `V_L = besoin/19.053` et `P_kW = besoin/1800` | Conformes |
| Rendements sources (gaz 0.85, élec 0.95, PAC 2.5) | Conformes |
| Pondération zone chauff H1 ×1.10 / H3 ×0.90 et ECS ×1.03 / ×0.97 | Conformes |

**Conclusion partielle** : le moteur est robuste (zéro crash, zéro NaN) et ses fondamentaux physiques sont corrects. Les écarts observés sont des **décisions produit à trancher**, pas des bugs de calcul.

---

## 3. Bugs pré-identifiés (motivant V1.6.1)

### BUG-001 — `engine_version` non incrémenté
- **État code** : `ENGINE_VERSION = '1.6.0'` ([src/engine.js:12](../src/engine.js#L12))
- **Cible V1.6.1** : `'1.6.1'`
- **Décision à prendre** : ✅ bump trivial — pas d'arbitrage nécessaire.

### BUG-002 — ACT18 (CET) filtré inconditionnellement
- **État code** : [src/engine.js:2068-2071](../src/engine.js#L2068-L2071) retire ACT18 (et ACT20) du plan d'actions final, indépendamment de l'éligibilité.
- **Impact mesuré** : 0/30 scénarios présentent ACT18 dans `top_actions[]`, alors que le calcul interne (`newDiagnosticComputeCetSizing`) fournit un dimensionnement cohérent sur 26/30.
- **Question au consortium** :
  - (A) **Retirer le filtre L2071** → ACT18 redevient visible client. Cohérent avec un moteur dont le CET est un levier ECS majeur.
  - (B) **Maintenir le filtre et supprimer tout le code mort** associé (`newDiagnosticComputeCetSizing`, action ACT18, tiers CET) → position claire « CET non commercialisé, le partenaire prescrit au cas par cas ».
  - **Actuellement** : état hybride (code fonctionnel + sortie masquée) qui coûte de la maintenance sans valeur.

---

## 4. Bugs nouveaux à arbitrer

### BUG-003 — Tiers ACT13 (PAC air/eau) code vs brief

| Puissance (kW) | Brief V1.6.1 | Code V1.6.0 | Écart |
|---:|---:|---:|---:|
| 10 | 13 000 € | 17 800 € | **+37 %** |
| 20 | 24 000 € | 29 000 € | +21 % |
| 50 | 58 000 € | 64 000 € | +10 % |
| 100 | 110 000 € | 122 000 € | +11 % |
| 200 | 210 000 € | 232 000 € | +10 % |

**Impact métier** : 9 scénarios affectés sur 30. Sur une PAC 10 kW (petit tertiaire 100-300 m²), l'écart de 4 800 € fausse le ROI et peut exclure l'action du plan (filtre ROI ≤ 10 ans).

**Question au consortium** : quelle grille est la source de vérité pour Q4 2025 ?
- (A) Grille brief (13/24/58/110/210 k€) — cible V1.6.1 déclarée.
- (B) Grille code (17.8/29/64/122/232 k€) — probablement calibrée sur devis haut de fourchette.
- (C) Grille tierce à fournir (médiane sur N devis artisans référents).

**Pré-requis** : idéalement, fournir la source (nom fournisseur / échantillon devis / date) pour traçabilité dans le commit de release.

### BUG-004 — Tier CET 5000 L / 84 000 € hors brief

- **État code** : [src/engine.js:1476](../src/engine.js#L1476) ajoute un tier 5000 L au-delà du plafond brief de 2000 L.
- **Impact mesuré** : 7/26 scénarios CET atteignent ce tier. Sur le plus gros (hôtel 20 000 m², BUG-004 cumulé avec BUG-006), le besoin calculé est de 1 540 880 kWh/an → volume théorique ~80 000 L, massivement sous-dimensionné même par le tier 5000 L.
- **Question au consortium** :
  - (A) **Supprimer le tier 5000 L** → plafonner à 2000 L conforme au brief, et afficher un warning explicite « besoin > plafond — étude spécifique nécessaire » quand `V_L raw > 2000`.
  - (B) **Conserver le tier 5000 L** → mais alors assumer qu'il représente une installation multi-ballons et documenter le mode de calcul.
  - (C) **Ajouter un garde** : si `V_L raw > tier max`, exclure ACT18 et proposer une action générique « étude technique dédiée ».

### BUG-005 — Plafond PAC 200 kW saturé sur très grandes surfaces

- **Constat** : 2 scénarios 20 000 m² retournent le tier 200 kW, alors que le besoin théorique est 468 kW et 1 579 kW. Le capex réel installé serait significativement supérieur à 232 k€.
- **Question au consortium** :
  - (A) Ajouter un tier 500 kW (capex à documenter).
  - (B) Exclure ACT13 si `P_kW raw > 200` avec message « hors grille tarifaire courante, étude dédiée ».
  - (C) Accepter la sous-cotation comme « ordre de grandeur minimum pour amorcer la conversation commerciale » — mais alors le flag doit être explicite dans le rapport client.

### BUG-006 — PAC→PAC / CET→CET incohérent thermiquement

- **Constat** : `newDiagnosticComputeCetSizing` multiplie la conso élec par le COP PAC (2.5) quand la source ECS actuelle est déjà une PAC. Résultat : remplacement PAC→CET retourné comme « action pertinente » avec 5000 L / 84 k€, alors que le gain thermique est marginal (~15 %).
- **Protection existante** : la fonction `filterAndScoreActions` ([src/engine.js:2007-2008](../src/engine.js#L2007-L2008)) exclut bien ACT18 si l'ECS est déjà thermodynamique. **L'utilisateur final ne voit donc pas le problème aujourd'hui.**
- **Question au consortium** : faut-il durcir le resolveur (`ComputeCetSizing` retourne `null` si source=pac) pour éviter toute régression future si quelqu'un réutilise le resolveur ailleurs ? Recommandation QA : **oui**, cohérence > confiance dans un filtrage externe.

### BUG-007 — Réseau de chaleur : ECS perdue silencieusement

- **Constat (probe 4 scénarios)** :
  - N1 (`mainHeating='network'`, `ecsSameSystem=true`) : le split alloue 48 000 kWh/an à l'ECS, mais `resolveEcsSource` retourne `null` (lit `gasKwh=0`) → ACT18 invisible.
  - N4 (`ecsSameSystem=false`, `ecsSystem='network_dedicated'`) : idem avec 240 000 kWh/an perdus pour le dimensionnement.
- **Incohérence** entre `splitByEnergySource` (qui sait lire le réseau) et `resolveEcsSource` / `resolveHeatSource` (qui lisent uniquement `gasKwh`).
- **Correctif V1.6.1 proposé** :
  ```
  Dans newDiagnosticResolveEcsSource (et HeatSource) :
    if (source === 'gas' && gasKwh === 0 && data.networkUsed && mainHeating === 'network') {
       consoKwh = parseFloat(data.networkKwh) || 0;
       rendement = 0.95;  // table réseau de chaleur
    }
  ```
- **Question au consortium** : valider le correctif ? Cas limite : un bâtiment sur réseau de chaleur avec ECS décarbonée (vapeur haute température) doit-il quand même se voir proposer un CET ? Recommandation QA : **oui**, la décarbonation du réseau reste une hypothèse non vérifiable côté diagnostic express.

---

## 5. Questions de scope

### Q1 — Nombre d'actions dynamiques

Le brief V1.6.1 mentionne « 2 actions dynamiques uniquement : ACT13 + ACT18 ». Le moteur produit en pratique **5 à 6 actions par rapport** : ACT01, ACT02, ACT03, ACT05, ACT07, ACT08, ACT10, ACT11, ACT14, ACT21, ACT22 apparaissent aussi.

**Question** : le périmètre QA doit-il se restreindre à ACT13/ACT18, ou les autres actions font-elles partie du contrat de précision 85 % ? Les tiers capex et les formules de gain de ACT01-ACT22 n'ont pas été auditées dans cette campagne.

### Q2 — Traitement du brief « pas de clim » dans V1.6.1

Le brief dit « PAS de climatisation, PAS de PAC réversible, PAS de hasCooling dans le scope calcul ». Or :
- `hasCooling` est toujours lu côté front et passé au moteur.
- ACT19 (remplacement clim) et ACT20 (récup calories clim) existent toujours dans le code (ACT20 filtré L2071).

**Question** : faut-il purger tout le code lié à la clim (actions + inputs front) pour V1.6.1, ou garder le scope actuel en retirant uniquement les mentions « PAC réversible » ?

### Q3 — Précision cible 85 % : protocole de mesure ?

Pour valider que V1.6.1 atteint 85 %, il faut un **étalon terrain**. Options :
- (A) Panel de N études réelles (DPE tertiaire, audits énergétiques) dont on connaît les capex réellement dépensés → comparer les tiers code vs factures.
- (B) Panel de N devis artisans récents sur scénarios types → comparer les tiers code vs médianes devis.
- (C) Sans étalon formel, on s'appuie sur le dire d'expert du consortium — traçabilité plus faible.

**Question** : quel protocole le consortium retient-il, et avec quel budget/timeline ?

---

## 6. Proposition de feuille de route V1.6.1

### Patch minimal (si les arbitrages convergent)

1. Bump `ENGINE_VERSION = '1.6.1'` — trivial.
2. Retirer filtre L2071 sur ACT18 (si option 3-A retenue) OU supprimer code CET (si 3-B).
3. Remplacer tiers ACT13 selon décision BUG-003.
4. Ajouter fallback `networkKwh` dans `resolveEcsSource` + `resolveHeatSource` (BUG-007).
5. Gérer plafonds saturés : warning ou garde (BUG-004, BUG-005).
6. Durcir `ComputeCetSizing` : retourner `null` si source=pac (BUG-006).
7. Mettre à jour `CHANGELOG.md` + `AI-CONTEXT.md` + `.claude/context/architecture.md`.

### Tests de non-régression V1.6.1

- Rejouer `scripts/qa-runner.js` → 30/30 PASS attendu.
- Les 56 warnings V1.6.1-GAP doivent tomber à 0.
- Ajouter 4 probes réseau de chaleur (N1-N4) au jeu de régression permanent.
- Vérifier scénarios CLAUDE.md (bureau 500 m², resto 200 m², commerce alim 1000 m², hôtel 720 m²).

### Estimation effort

- Patch moteur : ~2 h
- Mise à jour docs (3 fichiers) : ~30 min
- QA automatisée (rejouer + ajouter probes) : ~1 h
- **Total** : ~3.5 h une fois les arbitrages reçus.

---

## 7. Décisions attendues du consortium

| # | Sujet | Options | Décideur proposé |
|---|---|---|---|
| D1 | BUG-002 : stratégie ACT18 | A (remettre visible) / B (supprimer code) | Produit |
| D2 | BUG-003 : source tiers ACT13 | A (brief) / B (code) / C (nouvelle grille) | Expert métier + Produit |
| D3 | BUG-004 : tier CET 5000 L | A (supprimer) / B (garder) / C (garde) | Expert métier |
| D4 | BUG-005 : plafond PAC 200 kW | A (tier 500 kW) / B (exclure) / C (accepter) | Expert métier |
| D5 | BUG-006 : durcir resolveur | Oui / Non | Technique |
| D6 | BUG-007 : fallback réseau | Correctif proposé : Oui / Non | Technique |
| D7 | Q1 : scope QA à ACT13/ACT18 ou étendu | Restreint / Étendu | Produit |
| D8 | Q2 : purge clim V1.6.1 | Purge totale / Partielle / Aucune | Produit |
| D9 | Q3 : protocole 85 % | A (études) / B (devis) / C (dire d'expert) | Consortium |

---

## 8. Annexes — données et reproduction

- **Rapport QA technique détaillé** : `docs/qa-v1.6.1-report.md`
- **Runner 30 scénarios** : `node scripts/qa-runner.js` → `scripts/qa-results.json`
- **Probe BUG-007 (4 scénarios réseau)** : `node scripts/qa-network-probe.js`
- **Tiers du code** :
  - PAC air/eau : `NEW_DIAGNOSTIC_PAC_EAU_TIERS` ([src/engine.js:1480-1486](../src/engine.js#L1480-L1486))
  - CET : `NEW_DIAGNOSTIC_CET_TIERS` ([src/engine.js:1470-1477](../src/engine.js#L1470-L1477))
- **Formules dimensionnement** :
  - CET : [src/engine.js:1594-1620](../src/engine.js#L1594-L1620)
  - PAC : [src/engine.js:1623-1648](../src/engine.js#L1623-L1648)

---

*Document généré par la campagne QA automatisée. Pour toute question technique, rejouer les scripts fournis permet de reproduire intégralement les résultats.*
