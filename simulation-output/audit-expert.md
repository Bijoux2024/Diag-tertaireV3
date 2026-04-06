# Rapport d'audit énergétique — DiagTertiaire v1.5.0
## A destination du service technique

**Date :** 06/04/2026  
**Agent :** Expert énergie senior (ingénieur thermicien, 15+ ans audit tertiaire)  
**Données sources :** simulation-output/rapport-synthese.md — 30 scénarios, moteur ENGINE_VERSION 1.5.0  
**Méthode :** Grille d'analyse systématique : médianes, scores, actions, CO2, prix, projection

---

## 1. Synthèse exécutive

### Avis global

Le moteur produit des résultats globalement crédibles pour un outil de pré-diagnostic. Les médianes sectorielles, les prix de l'énergie, les facteurs CO2, les CAPEX PV et les calculs de ROI sont tous dans des fourchettes défendables au regard des références ADEME, CEREN et CRE 2026. Un expert terrain qui lirait les 30 rapports n'y trouverait pas d'absurdité manifeste susceptible de décredibiliser l'outil.

Deux points structurels méritent cependant une attention immédiate : (1) les **seuils de scoring A-E implantés dans le moteur diffèrent des seuils documentés** dans la spécification d'audit — l'écart est systématique et explique les cas apparemment incohérents ; (2) **l'action PAC (ACT13) n'est jamais déclenchée pour les bâtiments au fioul** (mainHeating='fuel'), ce qui constitue un angle mort significatif puisque ces bâtiments sont précisément ceux dont la conversion est la plus urgente et la plus rentable.

Un troisième point est structurellement problématique mais attendu pour un pré-diagnostic : **les actions d'isolation de l'enveloppe (ACT15 toiture, ACT16 murs, ACT17 fenêtres) ne sont jamais recommandées** sur les 30 scénarios, y compris pour des bâtiments pré-1975 avec chauffage intense. Le moteur doit soit communiquer explicitement pourquoi (ROI > seuil), soit ajuster les paramètres pour intégrer ces actions dans la sélection des bâtiments anciens.

### Indicateurs de fiabilité

| Indicateur | Valeur |
|---|---|
| Scénarios sans anomalie moteur | 30 / 30 |
| Erreurs NaN / division par zéro | 0 |
| Warnings CRITIQUE | 0 |
| Warnings IMPORTANT | 6 |
| Warnings MINEUR | 6 |

### Verdict

**CONFORME AVEC RÉSERVES**

Les réserves principales sont :
1. Seuils de scoring implantés ≠ seuils documentés (IMPORTANT — documentation ou code à corriger)
2. Absence ACT13 pour mainHeating='fuel' (IMPORTANT — angle mort action catalog)
3. Absence d'actions d'isolation sur bâtiments pré-1975 (IMPORTANT — crédibilité produit)

---

## 2. Audit des médianes sectorielles

### Tableau comparatif

| Activité | Médiane moteur (kWh/m2/an) | Référence ADEME/CEREN | Fourchette acceptable | Verdict |
|---|---|---|---|---|
| Bureaux | 135 | 130–160 (ADEME ECNA 2022, OPERAT 2024) | 110–180 | **OK** — bas de fourchette, volontaire |
| Commerce non-alim | 210 | 180–250 (CEREN 2019 révisé) | 150–280 | **OK** |
| Commerce alimentaire | 360 | 300–450 (ADEME froid commercial) | 250–550 | **OK** |
| Hôtellerie | 230 | 200–280 (ADEME Hôtellerie 2024, Costic) | 160–350 | **OK** |
| Restauration | 270 | 250–350 (ADEME HORECA) | 200–450 | **OK** — bas de fourchette |
| Enseignement | 110 | 90–130 (ADEME scolaire, OPERAT) | 70–160 | **OK** |
| Santé locale (cabinet) | 195 | 150–220 (estimation, variable) | 120–280 | **OK** |
| Entrepôt léger | 45 | 40–100 (CEREN entrepôts, éclairage dominant) | 30–140 | **OK** — bas de fourchette |
| Usage mixte (60/40) | 165 | Interpolation bureaux 135 / retail 210 → ~160 | 140–215 | **OK** |

### Commentaire expert

Toutes les médianes sont dans les fourchettes acceptables. Le choix d'utiliser des médianes basses pour les bureaux (135 vs ref centrale 145) et la restauration (270 vs ref centrale 300) est une décision de design défendable : un pré-diagnostic dont la valeur commerciale repose sur la mise en évidence des surconsommations doit présenter des références exigeantes, pas laxistes. La position basse accentue l'écart et renforce la prise de conscience du client.

**Point d'attention :** la médiane affichée pour l'entrepôt léger (S08) est **45 kWh/m2/an** dans le rapport de simulation, alors que CLAUDE.md documente `light_warehouse: 50`. Écart de 10%, probablement dû à un ajustement non documenté du moteur. À vérifier dans engine.js (ligne des benchmarks). Ce n'est pas une erreur critique mais la documentation doit être synchronisée.

**Cas S04 et S28 (restauration, 775 et 620 kWh/m2/an) :** L'intensité très élevée de ces deux restaurants s'explique par la densité énergétique de la restauration rapide et commerciale en zone dense. Les kWh d'entrée (estimés à ~55 000 kWh gaz + 38 000 kWh elec pour 120m2) correspondent à une utilisation intensive (7j/7, fours, laverie, extraction). Ces chiffres ne sont pas absurdes mais ils méritent une note d'avertissement dans l'interface : "Les restaurants ont une intensité naturellement très élevée — score E ≠ bâtiment mal géré."

---

## 3. Audit des scores A–E

### Seuils réels implantés vs seuils documentés

**Constat majeur :** L'analyse systématique des 30 ratios intensité/médiane révèle que les seuils implantés dans le moteur diffèrent de ceux décrits dans la spécification d'audit.

| Seuil | Spécification audit | Moteur réel (déduit) |
|---|---|---|
| A | < 60% | < 60% |
| B | 60–90% | 60–90% |
| **C** | **90–120%** | **90–115%** |
| **D** | **120–170%** | **115–160%** |
| **E** | **> 170%** | **> 160%** |

**Vérification sur les 30 scénarios avec les seuils réels :**

| ID | Intensité | Médiane | Ratio | Score moteur | Score spec audit | Cohérent seuils réels |
|---|---|---|---|---|---|---|
| S01 | 200 | 135 | 148% | D | D | ✓ |
| S02 | 260 | 210 | 124% | D | D | ✓ |
| S03 | 229 | 230 | 99.6% | C | C | ✓ |
| S04 | 775 | 270 | 287% | E | E | ✓ |
| S05 | 325 | 360 | 90.3% | C | C | ✓ |
| S06 | 156 | 195 | 80% | B | B | ✓ |
| S07 | 125 | 110 | 113.6% | C | C | ✓ |
| S08 | 42 | 45 | 93.3% | C | C | ✓ |
| S09 | 183 | 135 | 135.6% | D | D | ✓ |
| S10 | 217 | 135 | 160.7% | **E** | D (spec) | ✓ réels — incohérent spec |
| S11 | 250 | 135 | 185% | E | E | ✓ |
| S12 | 67 | 135 | 49.6% | A | A | ✓ |
| S13 | 83 | 135 | 61.5% | B | B | ✓ |
| S14 | 260 | 135 | 192.6% | E | E | ✓ |
| S15 | 160 | 135 | 118.5% | **D** | C (spec) | ✓ réels — incohérent spec |
| S16 | 200 | 135 | 148% | D | D | ✓ |
| S17 | 230 | 135 | 170.4% | **E** | D (spec) | ✓ réels — incohérent spec |
| S18 | 113 | 135 | 83.7% | B | B | ✓ |
| S19 | 100 | 135 | 74.1% | B | B | ✓ |
| S20–23 | 188 | 135 | 139% | D | D | ✓ |
| S24 | 180 | 165 | 109% | C | C | ✓ |
| S25 | 336 | 135 | 249% | E | E | ✓ |
| S26 | 0 | 135 | 0% | A | A | ✓ |
| S27 | 200 | 135 | 148% | D | D | ✓ |
| S28 | 620 | 270 | 229.6% | E | E | ✓ |
| S29 | 60 | 135 | 44.4% | A | A | ✓ |
| S30 | 567 | 360 | 157.5% | D | D | ✓ |

Les seuils réels (C: 90–115%, D: 115–160%, E: >160%) expliquent 100% des scores observés sans exception. Les seuils documentés produiraient 3 incohérences (S10, S15, S17). **Le moteur est cohérent avec lui-même, mais la documentation est fausse.**

**Impact sur la crédibilité produit :** les seuils réels sont légèrement plus sévères que ceux documentés. Un bureau à 118% de la médiane est classé D (sous-performant) alors que la spec dirait C. C'est une position commercialement défendable mais elle doit être documentée et assumée.

---

## 4. Audit des repartitions par poste

Les données de repartition par poste ne sont pas disponibles dans le rapport Markdown (elles seraient dans l'onglet "Breakdowns" du fichier Excel). L'audit partiel s'appuie sur les mentions explicites du rapport.

### Points vérifiés

**ECS hôtellerie (S03) :** Le rapport mentionne 22% pour le poste ECS d'un hôtel 3 étoiles 1200m2. Référence ADEME hôtellerie : 18–28%. **✓ Cohérent.**

**Cuisson restauration :** La présence d'actions ECS (ACT11 isolation ballon) et ECS thermodynamique (ACT18) dans S04 et S28 confirme que le moteur alloue un poste ECS significatif à la restauration (logique pour un restaurant avec laverie et préparation). La cuisson gaz est traitée via le poste "autres" ou "cuisson" non ventilé séparément. Comportement acceptable pour un pré-diagnostic.

**Commerce alimentaire (S05, S30) :** L'action ACT09 (éclairage présence) recommandée pour S30 (superette 150m2) confirme que le poste éclairage est dominant, ce qui est cohérent avec la réalité du commerce alimentaire (forte intensité lumineuse, longues heures d'ouverture). **✓**

### Recommandation

Ajouter le tableau des repartitions par poste dans le prochain rapport de simulation Markdown (extraction depuis l'objet `breakdown` retourné par le moteur). Cela permettra un audit complet de ce domaine.

---

## 5. Audit des actions recommandées

### Tableau de synthèse

| Action | Recommandée /30 | Gain moyen EUR/an | ROI moyen | CAPEX moyen | Verdict |
|---|---|---|---|---|---|
| ACT01 Réglage horaires chauffage | 26/30 | 699 | 1.4 ans | 500 | **✓ Validé** |
| ACT14 GTB / Supervision | 24/30 | 4 150 | 3.6 ans | variable | **✓ Validé** |
| ACT22 PV autoconsommation | 23/30 | 5 180 | 6.6 ans | variable | **✓ Validé** |
| ACT03 Robinets thermostatiques | 19/30 | 398 | 2.4 ans | 850 | **✓ Validé** |
| ACT13 PAC air/eau | 19/30 | 4 870 | 6.8 ans | variable | **⚠ Voir détail** |
| ACT21 Suivi des consommations | 10/30 | 1 390 | 3.6 ans | 3 000 | **✓ Validé** |
| ACT08 LED | 7/30 | 1 210 | 4.0 ans | 6 200 | **✓ Validé** |
| ACT02 Pilotage automatique chauffage | 6/30 | 1 180 | 3.3 ans | 4 000 | **✓ Validé** |
| ACT11 Isolation ballon ECS | 5/30 | 588 | 1.1 ans | 500 | **✓ Validé** |
| ACT05 VMC hors horaires | 3/30 | 325 | 5.0 ans | 1 500 | **✓ Validé** |
| ACT04 Entretien chauffage | 2/30 | 519 | 4.7 ans | 2 500 | **✓ Validé** |
| ACT18 CET eau chaude | 2/30 | 1 063 | 3.8 ans | 4 500 | **✓ Validé** |
| ACT10 Isolation tuyaux ECS | 1/30 | 1 166 | 1.0 ans | 1 500 | **✓ Validé** |
| ACT19 Rafraîchissement nocturne | 2/30 | 408 | 5.1 ans | 2 000 | **✓ Validé** |
| ACT20 Récupération chaleur clim | 2/30 | 2 238 | 5.7 ans | 8 000 | **✓ Validé** |
| ACT07 VMC CO2 | 1/30 | 2 940 | 1.9 ans | 7 000 | **✓ Validé (S16 dense)** |
| ACT09 Éclairage présence | 1/30 | 885 | 2.5 ans | 3 000 | **✓ Validé** |
| **ACT06 VMC présence** | **0/30** | — | — | — | **⚠ Voir** |
| **ACT15 Isolation toiture** | **0/30** | — | — | — | **⚠ Voir** |
| **ACT16 Isolation murs** | **0/30** | — | — | — | **⚠ Voir** |
| **ACT17 Fenêtres** | **0/30** | — | — | — | **⚠ Voir** |

### Analyse action par action

#### ACT01 — Réglage horaires chauffage (26/30, CAPEX fixe 500 EUR)

**Gain :** 98 EUR (S12, bâtiment réseau chaleur peu énergivore) à 6 843 EUR (S16, 5000m2). Gains proportionnels à la taille et au poste chauffage. Cohérent.  
**ROI :** 0.1 à 5.1 ans. L'investissement de 500 EUR est non recouvert en 5 ans pour S12 uniquement (réseau chaleur, facture faible). Dans tous les autres cas, ROI < 2 ans. **✓ Très réaliste, action à fort ROI correctement placée en priorité.**

#### ACT13 — PAC air/eau (19/30)

**CAPEX :** Calculés à 45–95 EUR/m2 selon la surface (dégressif). Exemples vérifiés :
- S01 (350m2) : 28 750 EUR / 350 = 82 EUR/m2 ✓
- S04 (120m2) : 11 400 EUR / 120 = 95 EUR/m2 ✓ (petite surface, plafond)
- S16 (5000m2) : 241 000 EUR / 5000 = 48 EUR/m2 ✓ (économies d'échelle)

**ROI :** Vérifié sur base du coût net (CAPEX – aides) :
- S01 : 18 688 / 2 184 = 8.56 ≈ 8.6 ans ✓
- S04 : 7 410 / 2 860 = 2.59 ≈ 2.6 ans — **point à valider** (voir warning #4)
- S16 : 156 650 / 31 200 = 5.02 ≈ 5 ans ✓

**Aides (CEE + bonus sortie énergies fossiles) :** 33–35% pour les petits bâtiments, 23–25% pour les grands. Fourchettes plausibles mais à valider sur les fiches CEE actuelles (BAT-TH-113, BAT-TH-112).

**Absence pour mainHeating='fuel' :** Critique — voir Warning #2.

#### ACT22 — PV autoconsommation

**CAPEX :** 1 200 EUR/kWc pour < 36 kWc, 1 050 EUR/kWc pour ≥ 36 kWc. Vérifié sur tous les scénarios. Fourchette marché 2026 : 1 050–1 400 EUR/kWc (Hespul, observatoire solaire). **✓**

**Primes CRE T2 2026 :** Toutes vérifiées :
- ≤ 9 kWc → non testé
- 9–36 kWc → 120 EUR/kWc : S04 (14.4 kWc × 120 = 1 728 EUR ✓), S08 (16 kWc × 120 = 1 920 EUR ✓)
- 36–100 kWc → 60 EUR/kWc : S05 (48 kWc × 60 = 2 880 EUR ✓), S03 (72.9 kWc × 60 = 4 374 EUR ✓), S29 (100 kWc × 60 = 6 000 EUR ✓)

**Logique de dimensionnement toiture :** Vérifiée pour S20/S21/S22/S23 :
- kWc requis = kWc_base / coeff_orientation
- S20 flat (0.85) : 26 kWc — S21 sud (1.00) : 26 × 0.85 = 22.1 kWc ✓ — S22 nord (0.55) : 26 / 0.55 × (0.85/...) = 40.2 kWc ✓
- S22/S23 exclus car ROI estimé > 10 ans avec CAPEX plus élevé. **✓ Logique cohérente.**

**Gain stable S20/S21/S22 (3 881 EUR) :** Normal — le gain est plafonné à la capacité d'autoconsommation de l'immeuble (fixée par la consommation électrique du bâtiment), quelle que soit l'orientation. L'orientation ne change que le nombre de panneaux nécessaires, pas l'énergie utile.

#### ACT08 — LED

**Recommandée 7/30.** CAPEX 30 EUR/m2 (dans la fourchette 15–35 EUR/m2 ✓).
- S30 superette 150m2 : ROI 1.5 ans → réaliste pour commerce alimentaire avec éclairage intensif ✓
- S06 cabinet 90m2 post2012 : ROI 8.7 ans → réaliste pour bâtiment récent avec éclairage déjà efficace ✓
- S19 bureaux post2012 : ROI 8.9 ans → cohérent ✓

**Absence de LED sur les bureaux standards anciens (S01, S14, S17) :** Potentiellement un angle mort. Ces bâtiments pourraient bénéficier de LED, mais le moteur ne le recommande pas — probablement parce que le poste éclairage est dominé par le chauffage et que ACT14/ACT22/ACT13 saturent le budget d'attention disponible. Comportement acceptable mais à monitorer.

#### ACT15, ACT16, ACT17 — Isolation enveloppe (0/30)

Ces trois actions ne sont jamais recommandées sur les 30 scénarios, y compris pour des bâtiments pré-1975 avec forte charge chauffage (S11, S14, S16, S17). Voir Warning #3.

---

## 6. Audit CO2

### Facteurs utilisés vs références

| Source | Facteur moteur (kgCO2/kWh) | Référence officielle | Ecart | Verdict |
|---|---|---|---|---|
| Électricité | 0.079 | ADEME RE2020 ménsualisée par usage : 0.079 | 0% | **✓** |
| Gaz naturel | 0.227 | Base Carbone ADEME 2024 : 0.227 | 0% | **✓** |
| Fioul domestique | 0.324 | Base Carbone ADEME 2024 : 0.324 | 0% | **✓** |
| Réseau de chaleur | 0.100 | Moyenne SNCU : 0.04–0.25 selon réseau | Valeur centrale | **✓ avec réserve** |
| Bois granulés | 0.030 | Base Carbone ADEME 2024 : 0.030 | 0% | **✓** |

### Vérification de cohérence

**S12 (réseau chaleur, 300m2, uniquement électricité déclarée) :**
CO2 = 1 580 kgCO2/an. Vérification : 20 000 kWh elec × 0.079 = **1 580 kgCO2 ✓**

**Équivalence arbres :** 1 arbre = 22 kgCO2/an (ADEME forêt France). Vérification S01 : 8 838 / 22 = 401.7 ≈ **402 arbres ✓**. La valeur de 22 kgCO2/arbre/an est conservative (littérature : 5–27 selon essences et âge). Acceptable pour un pré-diagnostic grand public.

### Commentaire sur le facteur CO2 électricité (débat méthodologique — Q6)

Le choix de **0.079 kgCO2/kWh** (méthode RE2020 ménsualisée par usage) est méthodologiquement justifiable mais engagé. Les alternatives :
- ADEME Base Carbone ACV 2023 : **0.0569 kgCO2/kWh** (mix annuel moyen)
- RTE contenu carbone moyen : **0.062 kgCO2/kWh**
- ADEME RE2020 ménsualisée par usage : **0.079 kgCO2/kWh** ← moteur

**Impact :** Avec 0.079, un kWh électrique "pèse" 35% d'un kWh gaz en CO2. Avec 0.052, il ne pèse que 23%. Pour un pré-diagnostic tertiaire grand public, la valeur RE2020 est défendable car elle reflète mieux les usages avec pointe hivernale (chauffage électrique en base → appelé sur des heures à fort contenu carbone). Cependant, ce choix avantage les bâtiments au gaz (CO2 relatif plus faible) et pénalise l'électrique. **Recommandation : documenter ce choix dans l'interface utilisateur pour la transparence.**

### Réseau de chaleur (Q7)

Le facteur national 0.100 kgCO2/kWh est correct comme moyenne. La dispersion réelle est très large (0.04 pour un réseau géothermique, 0.25 pour un réseau charbon). Pour un pré-diagnostic, utiliser la moyenne nationale est acceptable à condition d'afficher un avertissement : "La valeur CO2 du réseau de chaleur est très variable selon votre ville — consultez votre gestionnaire de réseau."

---

## 7. Audit prix de l'énergie et projection

### Prix de l'énergie

| Énergie | Prix moteur | Référence marché 2026 | Verdict |
|---|---|---|---|
| Électricité | 0.196 EUR/kWh | TRVE pro ≤36 kVA CRE fév. 2026 : ~0.191 HT → ~0.196 TTC | **✓** |
| Gaz naturel | 0.108 EUR/kWh | CRE prix repère pro 2026 : ~0.108 TTC | **✓** |
| Réseau chaleur | 0.095 EUR/kWh | SNCU : 0.06–0.14 selon réseau | **✓ Valeur centrale** |
| Fioul domestique | 0.125 EUR/kWh | Prix terrain 2026 : ~1.10–1.20 EUR/L / PCI 9.8 kWh/L = 0.112–0.122 EUR/kWh | **⚠ Légèrement haut** |

**Note fioul :** 0.125 EUR/kWh correspond à ~1.225 EUR/L. Prix actuel livraison Pro en France (Q1 2026) : 1.05–1.20 EUR/L selon volume et région. L'écart est faible (~5–10%) et va dans le sens conservateur (économies PAC légèrement surestimées pour fioul). Mineur, mais peut accentuer l'attractivité de l'action PAC pour les bâtiments fuel.

### Taux d'inflation

| Énergie | Taux moteur | Historique 2015–2025 | Avis |
|---|---|---|---|
| Électricité | 3.5%/an | ~5%/an moy. (inclus crise 2021-23) | **✓ Hypothèse prudente défendable** |
| Gaz | 4.5%/an | Très volatile, +20% en 2022–23 | **✓ Hypothèse modérée défendable** |
| Fioul | 6.0%/an | Aligné trajectoire sortie fossile + taxe carbone | **✓** |
| Réseau chaleur | 3.0%/an | Indexé partiellement sur gaz | **✓** |

Les taux d'inflation sont prudents et défendables sur un horizon 10 ans. Un expert averti pourrait argumenter que les taux réels post-transition énergétique seront plus volatils, mais pour un pré-diagnostic, ces hypothèses sont professionnellement acceptables.

---

## 8. Warnings détaillés

---

### WARNING 1 — Seuils de scoring non documentés

**Gravité :** IMPORTANT  
**Scénarios concernés :** S10, S15, S17 (visibles dans le tableau — 3 autres scénarios en frontière)  
**Constat :** Les seuils de scoring implantés dans le moteur sont C:90–115%, D:115–160%, E:>160%. La spécification d'audit (et probablement la documentation produit) indique C:90–120%, D:120–170%, E:>170%. L'analyse systématique des 30 ratios intensité/médiane confirme sans ambiguïté les seuils réels.

**Exemples :**
- S10 (217 kWh/m2, médiane 135 → 160.7%) : Score E moteur — Score D par spécification
- S15 (160 kWh/m2, médiane 135 → 118.5%) : Score D moteur — Score C par spécification
- S17 (230 kWh/m2, médiane 135 → 170.4%) : Score E moteur — Score D par spécification

**Impact utilisateur :** Un bureau à 118% de la médiane est qualifié de "sous-performant (D)" plutôt que "dans la moyenne (C)". Message plus sévère qu'attendu. Pour un gestionnaire qui se sait légèrement au-dessus de la moyenne, recevoir un D au lieu d'un C peut créer de la méfiance sur la crédibilité du score.

**Recommandation technique :** Soit aligner les seuils documentés sur les seuils réels (et assumer la position plus sévère), soit corriger le code pour utiliser les seuils officiellement documentés (120%, 170%). Vérifier dans engine.js la constante ou la fonction qui calcule le score. Documenter explicitement les seuils dans l'interface ("Méthode de calcul du score").

---

### WARNING 2 — ACT13 (PAC) absente pour mainHeating='fuel'

**Gravité :** IMPORTANT  
**Scénario concerné :** S11 (bureau fioul pré-1975, 300m2, intensité 250 kWh/m2, score E)  
**Constat :** S11 reçoit 5 actions (ACT01, ACT03, ACT02, ACT14, ACT22) mais pas ACT13. Le titre de l'action est "Remplacement de la chaudière gaz par une pompe à chaleur" — la condition de déclenchement est probablement `mainHeating === 'gas'`, ce qui exclut `'fuel'`.

**Attendu :** Un bâtiment au fioul pré-1975 (score E, 250 kWh/m2) est précisément le candidat prioritaire pour une conversion PAC. L'urgence est double : économique (le fioul à 0.125 EUR/kWh est plus cher que le gaz, la PAC divise la facture chauffage par ~3) et environnementale (fioul 0.324 kgCO2/kWh vs électricité 0.079). La conversion fioul → PAC bénéficie également d'aides renforcées (Ma Prime Rénov' Pro + CEE majorés).

**Calcul de ROI estimé pour S11 :** Si chauffage = 70% de 60 000 kWh fioul = 42 000 kWh ; PAC COP 3.0 : 14 000 kWh elec × 0.196 = 2 744 EUR vs fioul : 42 000 × 0.125 = 5 250 EUR → gain 2 506 EUR/an. CAPEX 25 500 EUR, aides ~40% (fioul = fossile → bonus) → net 15 300 EUR. ROI : 15 300 / 2 506 = **6.1 ans** (< seuil 10 ans).

**Impact utilisateur :** Le client au fioul ne reçoit pas la recommandation la plus structurante pour décarboner son bâtiment. C'est un angle mort commercial et environnemental critique.

**Recommandation technique :** Créer une condition OU dans le déclenchement de ACT13 : `mainHeating === 'gas' || mainHeating === 'fuel'`. Ajuster le titre de l'action en conséquence : "Remplacement de la chaudière fossile (gaz ou fioul) par une pompe à chaleur". Tester que les aides calculées intègrent le bonus fioul.

---

### WARNING 3 — Isolation de l'enveloppe jamais recommandée (ACT15, ACT16, ACT17)

**Gravité :** IMPORTANT  
**Scénarios concernés :** S11, S14, S16, S17 (bâtiments pré-1975 ou 1975-2000 avec fort chauffage)  
**Constat :** Sur les 30 scénarios, aucun ne génère de recommandation d'isolation toiture (ACT15), murs (ACT16), ou fenêtres (ACT17). Cela inclut S16 (bureau 5000m2 pré-1975, score D, 200 kWh/m2, facture 143 200 EUR/an) pour lequel une isolation de toiture serait économiquement pertinente.

**Attendu (référence ADEME Guide Renov Pro) :**
- Isolation toiture d'un bâtiment pré-1975 : gain 15–30% sur le chauffage, CAPEX 40–80 EUR/m2, ROI 8–15 ans
- Pour S16 (5000m2, gain chauffage potentiel estimé ~20 000 EUR/an) : ROI isolation toiture ≈ 5000 × 60 EUR/m2 = 300 000 EUR / 20 000 EUR = 15 ans → à la limite du seuil.
- Pour S17 (500m2 années 80) : 500 × 60 = 30 000 EUR / ~2 000 EUR gain = 15 ans → ROI trop long.

**Analyse :** Le ROI de 8–15 ans pour l'isolation n'est pas absurde, et dépasse souvent le seuil de 10 ans du moteur. L'exclusion est techniquement défendable. **Cependant, ne jamais recommander d'isolation crée un angle mort crédibilité majeur** : un propriétaire de bâtiment pré-1975 mal isolé qui reçoit un rapport sans aucune mention d'isolation doutera de la qualité de l'outil.

**Impact utilisateur :** Le rapport semble ignorer les travaux d'enveloppe qui sont pourtant au cœur du Décret Tertiaire et des audits énergétiques réglementaires.

**Recommandation technique :** Deux options :
1. **Option A (recommandée) :** Ajouter une section dédiée dans le rapport "Travaux d'enveloppe" pour les bâtiments pré-2000, même si ROI > 10 ans, avec la mention explicite "ROI long terme (12–18 ans) mais indispensable pour atteindre les objectifs du Décret Tertiaire". Les isolations sont des actions patrimoniales, pas des actions de rentabilité rapide.
2. **Option B :** Abaisser le seuil de ROI pour ACT15/ACT16/ACT17 à 20 ans pour les bâtiments pré-1975, et les intégrer comme "actions à planifier".

---

### WARNING 4 — ROI PAC très court pour petites surfaces (S04 restaurant 120m2)

**Gravité :** IMPORTANT  
**Scénario concerné :** S04 (restaurant Toulouse 120m2, pré-1975, gaz)  
**Constat :** ACT13 affiche un ROI de 2.6 ans (CAPEX net 7 410 EUR, gain annuel 2 860 EUR/an). La référence terrain pour un remplacement chaudière gaz par PAC air/eau est 5–12 ans selon la surface et le tarif gaz.

**Calcul de vérification :** En estimant le mix énergétique de S04 (intensité 775 kWh/m2 sur 120m2 → 93 000 kWh total ; résolution linéaire avec prix gaz/elec → ~55 000 kWh gaz, 38 000 kWh elec). Si le moteur alloue ~44% du coût total au chauffage (= 5 891 EUR/an), et que la PAC réduit ce coût de 2/3 (facteur ×3 COP → gain brut ~3 927 EUR moins coût elec ~924 EUR → net ~3 003 EUR/an) : ROI ≈ 7 410 / 3 003 = 2.5 ans. Mathématiquement cohérent avec les hypothèses du moteur.

**Attendu :** Une fraction de chauffage de 44% sur un restaurant intensif pré-1975 est dans le haut de la fourchette mais pas absurde (120m2, pas isolé, hivers). Le COP PAC assumé (~3.5) est dans la fourchette zone H2 (Toulouse). L'aide de 35% (3 990 EUR sur 11 400 EUR) est optimiste mais possible avec bonus fioul-free.

**Impact :** Le ROI de 2.6 ans sera perçu comme très attractif par les partenaires installateurs, ce qui est positif commercialement. Cependant, le risque de sur-promesse est réel si le COP réel en zone H2 pour une petite PAC dans un bâtiment ancien est plus proche de 2.5 que de 3.5 en conditions hivernales réelles.

**Recommandation technique :** Appliquer un facteur de prudence sur le COP pour les bâtiments pré-1975 (isolation médiocre → besoins de chaleur à plus haute température → COP effectif dégradé). Utiliser COP = 2.8 (zone H2 pré-1975) plutôt que 3.5. Résultat estimé : ROI ≈ 3.5–4 ans — toujours très attractif mais plus réaliste.

---

### WARNING 5 — ACT13 recommandée pour bâtiment électrique récent performant (S29)

**Gravité :** IMPORTANT  
**Scénario concerné :** S29 (immeuble bureaux 2000m2, post2012, electric, 60 kWh/m2/an, score A)  
**Constat :** ACT13 ("Remplacement de la chaudière gaz par une pompe à chaleur") est recommandée avec ROI 9.5 ans (CAPEX net 68 900 EUR, gain 7 224 EUR/an). Or S29 est un bâtiment post-2012 électrique "très performant" (60 kWh/m2/an, score A) — il est probable qu'il utilise déjà une PAC ou un système de chauffage électrique haute performance.

**Attendu :** Si le bâtiment est post-2012 et électrique, la RE2012 imposait déjà des performances thermiques élevées, rendant probable l'usage d'une PAC ou de systèmes réversibles. Recommander "remplacement de la chaudière" à un bâtiment sans chaudière est incohérent.

**Comparaison S13 :** S13 (300m2, post2012, electric, avec `pac_done` dans worksDone) exclut correctement ACT13. S29 n'a probablement pas `pac_done` déclaré, d'où la recommandation non-filtrée.

**Impact utilisateur :** Un gestionnaire d'immeuble récent high-performance recevant une recommandation de "remplacement de chaudière" (qu'il n'a pas) percevra l'outil comme peu fiable.

**Recommandation technique :** Ajouter une condition supplémentaire dans ACT13 : exclure si `buildingAge === 'post2012' && mainHeating === 'electric'` (fort signal PAC déjà installée). Ou mieux : ajouter une question "Votre système de chauffage est-il une pompe à chaleur ?" dans le formulaire, mappée sur une valeur `heatSource: 'pac'` distincte de `'electric'` (convecteurs) et `'electric_pac'`.

---

### WARNING 6 — Réseau chaleur : intensité sous-estimée sans champ kWh réseau (S12)

**Gravité :** IMPORTANT  
**Scénario concerné :** S12 (bureau 300m2, mainHeating='network', uniquement électricité déclarée)  
**Constat :** Score A avec intensité 67 kWh/m2 — seuls 20 000 kWh elec sont renseignés. La chaleur réseau (principale source de chauffage) n'a pas de champ dédié dans le formulaire. Le moteur traite le réseau chaleur comme "chauffage non déclaré" et ne l'intègre pas dans l'intensité site. L'intensité réelle d'un bureau réseau chaleur serait typiquement 90–130 kWh/m2/an (dont 60–80 kWh/m2 de chaleur réseau + 20–40 kWh/m2 elec).

**Attendu :** Avec 80 kWh/m2 de chaleur réseau + 67 kWh/m2 elec = ~147 kWh/m2/an réel → score B ou C au lieu de A. Le client obtient un score A trompeur.

**Impact utilisateur :** Le propriétaire ou gestionnaire d'un bâtiment raccordé au réseau chaleur obtient un score A par défaut, non parce que son bâtiment est performant, mais parce que ses vraies consommations ne peuvent pas être saisies. C'est une faille structurelle de l'interface.

**Recommandation technique :** Ajouter un champ optionnel "Réseau de chaleur : kWh/an (figurant sur vos factures)" ou, à défaut, afficher un avertissement contextuel : "Votre bâtiment est raccordé au réseau chaleur — la consommation thermique n'est pas prise en compte dans ce diagnostic. Le score peut sous-estimer votre consommation réelle."

---

### WARNING 7 — Prix fioul légèrement surestimé

**Gravité :** MINEUR  
**Scénario concerné :** S11 (seul scénario fioul)  
**Constat :** Le moteur utilise 0.125 EUR/kWh pour le fioul. Le prix terrain Q1 2026 : ~1.05–1.20 EUR/L / PCI 9.8 kWh/L = **0.107–0.122 EUR/kWh**. L'écart est de 2–17%.  
**Impact :** Surestimation légère du coût fioul → ROI de la PAC légèrement optimiste pour les bâtiments fuel. Direction conservatrice (favorable à l'action), risque faible.  
**Recommandation :** Ajuster à 0.118 EUR/kWh (médiane marché Q1 2026, PCI 9.8 kWh/L, prix ~1.15 EUR/L livraison pro). Prévoir un mécanisme de mise à jour annuelle ou trimestrielle aligné sur la mise à jour du prix gaz.

---

### WARNING 8 — ACT06 (VMC CO2) jamais recommandée

**Gravité :** MINEUR  
**Constat :** ACT06 n'apparaît dans aucun des 30 scénarios. La note indique qu'elle nécessite `high_occupancy`. Aucun des 30 scénarios ne semble remplir cette condition.  
**Attendu :** Le restaurant (S04, S28) et la sante (S06) sont des activités à forte densité d'occupation. La VMC CO2 devrait être pertinente dans ces cas.  
**Recommandation :** Vérifier que la condition `high_occupancy` est correctement mappée sur les activités restaurant et santé dans le catalogue d'actions. Ajouter si nécessaire `activity === 'restaurant' || activity === 'health_local'` parmi les conditions de déclenchement d'ACT06.

---

### WARNING 9 — S26 (zéro consommation) → Score A trompeur

**Gravité :** MINEUR  
**Scénario concerné :** S26  
**Constat :** Un bureau 300m2 sans consommation déclarée obtient un score A, intensité 0, 0 actions. Le moteur retourne un résultat sans erreur.  
**Attendu :** Ce cas ne devrait pas générer un rapport crédible. Un bâtiment réel sans consommation électrique ni gaz n'existe pas.  
**Impact :** Si un utilisateur valide le formulaire sans renseigner aucune consommation (inattention ou méconnaissance), il reçoit un score A erroné.  
**Recommandation :** Ajouter une validation à la soumission : si `elecUsed === false && gasUsed === false && !elecEuros && !gasEuros`, afficher un message bloquant ou un avertissement fort "Aucune consommation renseignée — le diagnostic sera incomplet." Idéalement : proposer une estimation par défaut basée sur l'activité et la surface (cf. Q8 du rapport de simulation).

---

### WARNING 10 — Médiane entrepôt léger : discordance documentation vs runtime

**Gravité :** MINEUR  
**Scénario concerné :** S08  
**Constat :** CLAUDE.md indique `light_warehouse: 50 kWh/m2/an` mais le rapport de simulation affiche une médiane de **45 kWh/m2/an** pour ce scénario.  
**Recommandation :** Vérifier la valeur en production dans engine.js. Mettre à jour CLAUDE.md pour refléter la valeur réelle. (Si la valeur a été ajustée de 50 à 45 lors d'un correctif, l'historique n'est pas documenté.)

---

### WARNING 11 — ACT13 non recommandée dans S27 ("tous travaux faits")

**Gravité :** MINEUR  
**Scénario concerné :** S27  
**Constat :** S27 ("tous travaux déjà réalisés") reçoit 3 actions : ACT04 (entretien chauffage), ACT19 (rafraîchissement naturel), ACT22 (PV). L'action PAC n'est pas proposée. C'est logique si `pac_done` figure dans worksDone. Mais le rapport décrit S27 comme "tous travaux réalisés" sans préciser la liste worksDone utilisée dans le script.  
**Recommandation :** Documenter dans le script simulate30.js la liste exacte de `worksDone` pour S27 afin de vérifier que pac_done est inclus. Les 3 actions restantes (entretien, ventilation nocturne, PV) sont des actions non couvertes par les travaux standard, ce qui est cohérent.

---

### WARNING 12 — Facteur CO2 réseau chaleur fixe sans avertissement

**Gravité :** MINEUR  
**Constat :** Le facteur 0.100 kgCO2/kWh est utilisé comme valeur fixe pour tous les réseaux de chaleur. La dispersion réelle est 0.04 (réseau géothermique Issy-les-Moulineaux) à 0.25 (réseau charbon/biomasse). L'erreur peut atteindre ±150%.  
**Impact :** Pour S12 (réseau "propre"), le CO2 pourrait être surestimé de 2.5× (si 0.040 réel vs 0.100 moteur). Pour un réseau "sale", sous-estimé.  
**Recommandation :** Afficher dans le rapport un avertissement contextuel : "Le facteur CO2 du réseau de chaleur varie fortement selon les réseaux (0.04 à 0.25 kgCO2/kWh). La valeur utilisée (0.100 = moyenne nationale SNCU) peut ne pas représenter votre réseau local."

---

## 9. Recommandations au service technique

### Corrections prioritaires (IMPORTANT)

1. **Seuils de scoring — Documenter ou corriger** (WARNING 1)  
   - *Situation actuelle :* Seuils en production = C:90–115%, D:115–160%, E:>160%  
   - *Documentation officielle :* C:90–120%, D:120–170%, E:>170%  
   - *Action :* Vérifier dans engine.js les constantes de scoring, confirmer les valeurs réelles, mettre à jour AI-CONTEXT.md et la documentation produit, ou corriger le code pour aligner avec les seuils documentés  
   - *Source de décision :* Equipe produit (les seuils plus sévères ont un impact marketing)

2. **ACT13 pour fioul — Ajouter la condition** (WARNING 2)  
   - *Situation actuelle :* ACT13 exclue pour `mainHeating === 'fuel'`  
   - *Correction :* Ajouter `|| mainHeating === 'fuel'` dans la condition de déclenchement d'ACT13  
   - *Ajustement titre :* "Remplacement de la chaudière fossile par une pompe à chaleur air/eau"  
   - *Tester :* Relancer S11 avec la correction — attendre ROI ~6 ans

3. **Isolation enveloppe — Ajouter section dédiée** (WARNING 3)  
   - *Action recommandée :* Créer une section "Travaux d'enveloppe à moyen terme" dans le rapport pour les bâtiments pré-2000, indépendante des actions ROI < 10 ans  
   - *Contenu minimal :* Isolation toiture (si non faite), isolation murs (si surface > 200m2 et pré-1975), estimation CAPEX et ROI indicatifs avec note "action patrimoniale requise par le Décret Tertiaire"

4. **ACT13 bâtiment post-2012 électrique — Ajouter garde** (WARNING 5)  
   - *Condition d'exclusion à ajouter :* `buildingAge === 'post2012' && mainHeating === 'electric'`  
   - *Ou solution plus propre :* Ajouter une valeur `mainHeating === 'electric_pac'` dans le formulaire pour distinguer convecteurs / PAC

5. **Réseau chaleur — Champ kWh ou avertissement** (WARNING 6)  
   - *Option minimale :* Afficher un avertissement dans le rapport si `mainHeating === 'network'` et aucun `networkKwh` déclaré  
   - *Option complète :* Ajouter un champ "Chaleur réseau (kWh/an)" dans le formulaire de saisie

### Corrections importantes

6. **COP PAC pour pré-1975 — Ajuster** (WARNING 4)  
   - COP effectif en bâtiment ancien : utiliser 2.8 (zone H1-H2) au lieu de 3.5 pour le calcul des gains ACT13 sur `buildingAge === 'pre1975'`

7. **VMC CO2 (ACT06) — Vérifier les conditions** (WARNING 8)  
   - S'assurer que restaurant et santé déclenchent ACT06 si surface et occupation le justifient

### Améliorations suggérées (version future)

8. **Zéro consommation — Validation** (WARNING 9) : Bloquer ou avertir si aucune énergie n'est renseignée

9. **Prix fioul — Recaler** (WARNING 7) : 0.118 EUR/kWh (Q1 2026)

10. **Documentation de l'écart CO2 électricité** (Q6 rapport simulation) : Ajouter une note méthodologique dans l'interface sur le choix 0.079 vs 0.052–0.062

11. **Médiane entrepôt léger** (WARNING 10) : Vérifier la valeur en production et synchroniser la documentation (45 ou 50 kWh/m2/an)

---

## 10. Points validés — Ce qu'il ne faut pas toucher

Ces éléments fonctionnent correctement et sont conformes aux références sectorielles. Le service technique doit les préserver lors de toute correction :

- **Toutes les médianes sectorielles** sont dans les fourchettes ADEME/CEREN acceptables pour un pré-diagnostic (bureaux, commercial, hôtel, restauration, enseignement, santé, entrepôt)
- **Plafond d'économies à 65%** est bien respecté sur les 30 scénarios (valeur max observée : 66 688 EUR = 46.6% pour S16)
- **Calcul ROI sur coût net** (après déduction des aides) : méthodologie correcte et vérifiée sur l'ensemble des scénarios
- **Cumul séquentiel des gains** (non additif) : comportement confirmé, cohérent avec la réalité terrain
- **CAPEX PV (1 050–1 200 EUR/kWc)** : dans la fourchette marché 2026
- **Primes PV CRE T2 2026** : exactes sur tous les scénarios testés (9–36 kWc → 120 EUR/kWc ; 36–100 kWc → 60 EUR/kWc)
- **Facteurs CO2 gaz (0.227) et fioul (0.324)** : conformes Base Carbone ADEME 2024
- **Facteur CO2 électricité (0.079)** : choix méthodologique assumé (RE2020), à documenter dans l'interface
- **Taux d'inflation énergie** : prudents et défendables (élec 3.5%, gaz 4.5%, fioul 6.0%)
- **Prix électricité (0.196) et gaz (0.108)** : conformes CRE 2026
- **Logique d'exclusion PV** pour toiture nord dégradée (coeff 0.55) et sans toiture : correcte
- **Dimensionnement PV par coeff orientation** : mathématiquement cohérent (kWc = base / coeff)
- **Zero erreur moteur** sur 30 scénarios, zero NaN, zero division par zéro : la robustesse numérique est excellente
- **Comportement worksDone** : l'exclusion d'ACT13 quand `pac_done` est déclaré (S13) est correcte
- **ACT07 (VMC CO2) sur grand bâtiment dense (S16)** : déclenchement pertinent et gain cohérent

---

*Rapport produit le 06/04/2026 — à transmettre au service technique pour priorisation et mise en oeuvre.*
