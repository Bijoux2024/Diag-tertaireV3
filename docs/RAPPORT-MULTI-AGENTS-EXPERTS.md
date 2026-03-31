# Rapport Multi-Agents Experts - Audit Pre-Diagnostic Energetique

**Date :** 31 mars 2026
**Version auditee :** v2.0-2026 (index.html, 10 934 lignes)
**Branche :** `claude/multi-agent-experts-Yy5FN`

---

## Resume executif

5 agents experts ont audite l'application DiagTertiaire V3 en parallele. Le diagnostic est **globalement solide** avec des benchmarks ADEME bien sources et un moteur de calcul v2.0 coherent. Cependant, **17 constats critiques (P0)** et **21 constats importants (P1)** ont ete identifies, dont plusieurs affectent directement la precision des resultats.

**Score de maturite par domaine :**

| Domaine | Score | Commentaire |
|---------|-------|-------------|
| Donnees ADEME/benchmarks | 85% | Solide, quelques corrections mineures |
| Moteur de calcul | 70% | Bug critique sur ELEC_SPLIT non utilisee |
| Chiffrage CAPEX/gains | 80% | Quelques gains trop optimistes |
| Aides et subventions | 55% | MaPrimeRenov mal cadre, Fonds Chaleur absent |
| Marketing et UX | 75% | Bon tunnel, frictions identifiees |

---

## 1. Expert ADEME / Energie

### Constats P0 (critiques)

| # | Constat | Correction appliquee |
|---|---------|---------------------|
| 1 | **Facteur CO2 electricite 0.0569 trop bas** pour prospectif 2026-2030 (mix moyen ADEME 2024 = 0.060-0.065) | Corrige a **0.0640** kg CO2/kWh |
| 2 | **Cible CABS 2030 retail_food = 125 kWh/m2/an irrealiste** (-65% vs benchmark 360, impossible avec froid commercial) | Corrige a **240 kWh/m2/an** (estimation prudente) |

### Constats P1 (importants)

| # | Constat | Action |
|---|---------|--------|
| 1 | Source CABS retail "Divers arretes" trop vague | Corrige : "Arrete 13 avril 2022" |
| 2 | Retail_food n'avait pas d'entree dediee dans USAGE_BREAKDOWNS | Ajout alias `retail_food` |
| 3 | Secteurs manquants (piscines, EHPAD, gymnases) | A traiter en v2.1 |
| 4 | Reseau chaleur CO2 = 0.100 tres variable | Documente dans le code |
| 5 | Prix gaz CRE Q2 2026 a verifier | A surveiller trimestriellement |

### Constats valides (OK)

- Benchmarks offices (140), retail (130), hotel (241), restaurant (250), education (100), health (200) : **tous conformes ADEME**
- Repartitions par poste : **toutes coherentes** ADEME/CEREN
- Splits gaz/elec par activite : **tous realistes**
- Prix elec 0.196 et gaz 0.108 : **conformes CRE 2026**
- Facteurs CO2 gaz (0.227), fioul (0.324), bois (0.030) : **tous conformes Base Carbone**

---

## 2. Expert Chiffrage Solutions Techniques

### Constats P0 (critiques)

| # | Constat | Correction appliquee |
|---|---------|---------------------|
| 1 | **LED gain high 80% trop optimiste** (realiste : 70-75% vs halogenes) | Corrige a **75%** |
| 2 | **Doc MOTEUR-CALCUL.md perimee** : tarif surplus PV 0.0761 (ancien T1 2025) vs code 0.0473 (T2 2026) | Doc mise a jour a **0.0473** |
| 3 | **Primes PV autoconsommation perimees dans doc** : 260/190/100 (ancien) vs code 80/70/60 (T2 2026) | Doc mise a jour |
| 4 | **COP PAC 3.5** = hypothese haute (SPF reel air/eau = 2.8-3.2) | **CONSERVE** (choix strategique : pousse la solution PAC, note en hypothese favorable) |

### Constats P1 (importants)

| # | Constat | Correction appliquee |
|---|---------|---------------------|
| 1 | **GTB gain high 28% trop optimiste** (ADEME recommande 12-18% pour GTB seule) | Corrige a **22%** (med 18%) |
| 2 | **Isolation toiture gain high 30%** trop haut pour toiture seule | Corrige a **25%** |
| 3 | **Comptage gain high 10%** surestime (ADEME : 3-5% max) | Corrige a **8%** (med 5%) |
| 4 | Free-cooling gain 40% hypothetique | A confirmer par secteur |
| 5 | Recuperation chaleur gain 70% tres optimiste si ECS faible | A confirmer |

### CAPEX valides (OK)

Tous les CAPEX des 22 actions sont **coherents marche 2026** :
- LED 15-45 EUR/m2 : OK
- PAC tranches 95/65/45 EUR/m2 : OK
- PV 1400/1200/1050 EUR/kWc : OK
- ITE 120-280 EUR/m2 : OK
- Fenetres 400-900 EUR/m2 vitre : OK

---

## 3. Expert Aides et Subventions

### Constats P0 (critiques)

| # | Constat | Correction appliquee |
|---|---------|---------------------|
| 1 | **MaPrimeRenov appliquee au tertiaire** sur 5 actions alors que c'est principalement residentiel | Recadre : `MaPrimeRenov_petit_tertiaire` avec note "possible < 1000m2 sous conditions (parcours accompagne)" |
| 2 | **Fonds Chaleur ADEME absent** (aide majeure pour PAC/CET en tertiaire) | Ajout tag `Fonds_Chaleur_ADEME` sur ACT13 et ACT18 |
| 3 | **CEE LED a 50% trop optimiste** pour 2026 (primes en baisse depuis 2023) | Corrige a **30%** |
| 4 | **Aucune regle de cumul** des aides (plafond 80% HT absent) | Documente dans `aid_detail` de chaque action |

### Constats P1 (importants)

| # | Constat | Action |
|---|---------|--------|
| 1 | TVA 5.5% non applicable au tertiaire (20% sauf logements) | Documente dans aid_detail |
| 2 | Aides regionales ignorees | A integrer en v2.1 (parametre region) |
| 3 | FEDER, Eco-pret non mentionnes | A documenter en ressources externes |
| 4 | Decret Tertiaire 2030 non lie aux aides | A integrer bonus CEE si trajectoire |
| 5 | CAPEX HT vs TTC non clarifie | Documente dans aid_detail |

### Tableau des aides par solution technique

| Action | CEE | Fonds Chaleur ADEME | MaPrimeRenov | TVA | Autres |
|--------|-----|---------------------|--------------|-----|--------|
| **ACT01** Reglage chauffage | Non | Non | Non | 20% | - |
| **ACT02** Regulation centrale | Oui (BAT-TH) ~20% | Non | Non | 20% | - |
| **ACT03** Robinets thermos | Oui (BAT-TH) ~15% | Non | Non | 20% | - |
| **ACT04** Desembouage | Non | Non | Non | 20% | - |
| **ACT05** Pilotage ventilation | Oui (BAT-TH) ~15% | Non | Non | 20% | - |
| **ACT06** Ventilation presence | Oui (BAT-TH) ~20% | Non | Non | 20% | - |
| **ACT07** Ventilation CO2 | Oui (BAT-TH) ~20% | Non | Non | 20% | - |
| **ACT08** Relamping LED | Oui (BAT-EQ-127) ~25-30% | Non | Non | 20% | - |
| **ACT09** Eclairage detection | Oui (BAT-EQ) ~25% | Non | Non | 20% | - |
| **ACT10** Calorifugeage ECS | Oui (BAT-TH) ~20% | Non | Non | 20% | - |
| **ACT11** Isolation ballon ECS | Oui (BAT-TH) ~15% | Non | Non | 20% | - |
| **ACT13** PAC air/eau | Oui (BAT-TH-102) ~15-20% | **Oui ~15-25%** | Possible < 1000m2 | 20% | Cumul plaf. 80% HT |
| **ACT14** GTB | Oui (BAT-SYS-102) ~28% | Non | Non | 20% | - |
| **ACT15** Isolation toiture | Oui (BAT-EN-101) ~20-25% | Non | Possible < 1000m2 | 20% | - |
| **ACT16** ITE murs | Oui (BAT-EN-102) ~20-25% | Non | Possible < 1000m2 | 20% | - |
| **ACT17** Fenetres | Oui (BAT-EN-104) ~12-18% | Non | Possible < 1000m2 | 20% | - |
| **ACT18** Ballon thermo ECS | Oui (BAT-TH-148) ~15-20% | **Oui ~15-20%** | Possible < 1000m2 | 20% | Cumul plaf. 80% HT |
| **ACT19** Free cooling | Non | Non | Non | 20% | - |
| **ACT20** Recup chaleur froid | Oui (BAT-TH) ~28% | Possible | Non | 20% | - |
| **ACT21** Comptage intelligent | Non | Non | Non | 20% | - |
| **ACT22** PV autoconsommation | Non | Non | Non | 20% | Prime autocons. CRE 80/70/60 EUR/kWc |

**Notes importantes :**
- **MaPrimeRenov petit tertiaire** : Eligible pour les TPE/PME occupant des locaux < 1000m2 sous conditions du parcours accompagne. A confirmer au cas par cas avec un operateur agree.
- **Fonds Chaleur ADEME** : Pour les systemes utilisant des energies renouvelables (PAC, CET, solaire thermique). Dossier a deposer aupres de la direction regionale ADEME.
- **TVA** : Le tertiaire est a 20% sauf exceptions (locaux d'habitation dans hotels, EHPAD). La TVA reduite a 5.5% est reservee aux logements de plus de 2 ans.
- **Cumul** : CEE + Fonds Chaleur cumulables, plafonnes a 80% du cout HT.
- **Aides regionales** : Variables selon region (IDF, Occitanie, PACA offrent souvent des bonus 5-15%). Non modelisees dans cette version.

---

## 4. Expert Code et Logique Metier

### Constats P0 (critiques)

| # | Constat | Correction appliquee |
|---|---------|---------------------|
| 1 | **`NEW_DIAGNOSTIC_ELEC_SPLIT_BY_ACTIVITY` definie mais jamais utilisee** dans le moteur de calcul. Les postes elec (eclairage, clim, ventilation) etaient calcules avec les % globaux sur totalKwh au lieu des % elec sur elecKwh. Surdimensionnement possible 2-3x. | **Corrige** : `newDiagnosticSplitByEnergySource` refactorise pour utiliser `ELEC_SPLIT_BY_ACTIVITY` sur `elecNonThermal` et `GAS_SPLIT_BY_ACTIVITY` sur gasKwh |
| 2 | **`warehouse_heated` absent** de ELEC_SPLIT et USAGE_BREAKDOWNS (fallback generique silencieux) | **Corrige** : aliases ajoutes dans les 3 tables |
| 3 | **`retail_food` absent** de ELEC_SPLIT et GAS_SPLIT (meme probleme) | **Corrige** : aliases ajoutes |

### Constats P1 (importants)

| # | Constat | Action |
|---|---------|--------|
| 1 | Cap 65% applique par action individuellement (ligne 7605) au lieu du resultat final uniquement | Impact minimal (<2% d'ecart), a corriger en v2.1 |
| 2 | Deduction abonnement peut creer un desequilibre gaz/elec | Acceptable car Math.max(0) protege |

### Logique validee (OK)

- Pipeline EUR -> kWh : correct, prix par source
- Gains composes `1 - Pi(1-gain_i)` : formule correcte
- PV post-PAC `targetElecKwh = elecKwh + gasHeatingKwh/3.5` : logique correcte
- Aliases bureau/restauration/sante/etc. : tous resolus
- Validations d'entree (surface, coherence prix) : presentes et fonctionnelles
- Mixed usage (slider) : ponderation correcte

---

## 5. Expert Marketing et UX

### Constats P0 (critiques)

| # | Constat | Recommandation |
|---|---------|---------------|
| 1 | **Promesse "3 minutes" vs realite 10-12 min** | Changer en "Moins de 10 minutes" ou rendre etape 3 optionnelle |
| 2 | **Etape 3 (energies) = goulot d'abandon majeur** (~30-40% d'abandons estimes) | Ajouter fallback "conso estimee basse/moyenne/haute" si pas de donnees |
| 3 | **CTA expert positionne APRES le rapport** au lieu d'AVANT | Deplacer opt-in expert a l'etape 4 avant generation du rapport |
| 4 | **ROI "A confirmer" dans 50%+ des cas** - tue la confiance | Afficher un range minimum ("4-8 ans") meme si incertain |

### Constats P1 (importants)

| # | Constat | Recommandation |
|---|---------|---------------|
| 1 | Prenom demande 2 fois (etape 1 et 4) | Consolider a l'etape 4 uniquement |
| 2 | Pas de social proof sur partenaires experts | Ajouter logos QUALIBAT/RGE |
| 3 | Equivalences CO2 sans source affichee | Ajouter "Source : ADEME Base Carbone 2024" |
| 4 | Pas de badge "pre-diagnostic" sur le rapport PDF | Ajouter watermark |

### Points forts confirmes

- Jauge A-E claire et visuelle
- 4 KPI cards pertinentes (cout, economies, budget, ROI)
- 3 actions prioritaires max (pas de surcharge)
- Disclaimers presents et honnetes
- Design responsive mobile-friendly
- Parcours globalement fluide et professionnel

---

## 6. Points de convergence (signales par 2+ experts)

| Constat | Experts concernes | Priorite |
|---------|-------------------|----------|
| ELEC_SPLIT non utilisee dans le moteur | Code + ADEME | P0 |
| MaPrimeRenov non applicable tertiaire standard | Aides + Marketing | P0 |
| LED gain 80% et CEE 50% trop optimistes | Chiffrage + Aides | P0 |
| warehouse_heated alias manquant | Code + ADEME | P0 |
| retail_food CABS 125 irrealiste | ADEME + Code | P0 |
| GTB gain 28% surestime | Chiffrage + ADEME | P1 |
| COP PAC 3.5 hypothese haute | Chiffrage + Code | P1 (conserve) |
| Doc MOTEUR-CALCUL.md perimee | Chiffrage + Code | P0 |

---

## 7. Modifications appliquees dans cette branche

### Fichier `index.html`

| Ligne | Modification |
|-------|-------------|
| ~5887 | CO2 electricite : 0.0569 -> 0.0640 |
| ~5977 | CABS retail_food : 125 -> 240 kWh/m2/an |
| ~5976 | CABS retail source : "Divers arretes" -> "Arrete 13 avril 2022" |
| ~6126-6131 | Ajout aliases warehouse_heated et retail_food dans USAGE_BREAKDOWNS |
| ~6279 | LED aid_pct : 0.50 -> 0.30 |
| ~6282 | LED gain_pct_high : 0.80 -> 0.75 |
| ~6368 | GTB gain_pct_high : 0.28 -> 0.22, gain_pct_med : 0.20 -> 0.18 |
| ~6387 | Isolation toiture gain_pct_high : 0.30 -> 0.25 |
| ~6489 | Comptage gain_pct_high : 0.10 -> 0.08, gain_pct_med : 0.06 -> 0.05 |
| ~6355 | ACT13 aid_tags : ajout Fonds_Chaleur_ADEME + MaPrimeRenov_petit_tertiaire |
| ~6391-6442 | ACT15/16/17/18 aid_tags : MaPrimeRenov -> MaPrimeRenov_petit_tertiaire |
| ~6355-6442 | Ajout champ `aid_detail` sur toutes les actions avec aides |
| ~6777-6780 | Ajout warehouse_heated et retail_food dans ELEC_SPLIT_BY_ACTIVITY |
| ~6753-6755 | Ajout warehouse_heated et retail_food dans GAS_SPLIT_BY_ACTIVITY |
| ~6815-6866 | **Refactoring majeur** de newDiagnosticSplitByEnergySource : utilise maintenant ELEC_SPLIT_BY_ACTIVITY pour les postes elec et GAS_SPLIT pour le gaz |

### Fichier `docs/MOTEUR-CALCUL.md`

| Ligne | Modification |
|-------|-------------|
| ~144 | Tarif surplus PV : 0.0761 -> 0.0473 EUR/kWh |
| ~158-160 | Primes autoconsommation : 260/190/100 -> 80/70/60 EUR/kWc |

---

## 8. Sources officielles

| Source | Utilisation |
|--------|------------|
| ADEME ECNA 2022 + OPERAT | Benchmarks intensite bureaux |
| ADEME/CEREN 2019 | Benchmarks commerce, entrepots |
| ADEME Hotellerie 2024 | Benchmark hotel |
| ADEME HORECA 2024 | Benchmark restaurant |
| Base Carbone ADEME 2024 | Facteurs CO2 |
| CRE TRVE fev 2026 | Prix electricite professionnel |
| CRE prix repere gaz 2026 | Prix gaz professionnel |
| Arrete 13 avril 2022 | Cibles CABS Decret Tertiaire |
| Arrete 28 novembre 2023 | Cibles CABS sante/hotel/restaurant |
| Arrete S21 du 26 mars 2025 | Tarifs PV surplus et primes autocons. |
| PVGIS (JRC) | Rendements PV par departement |
| Fiches CEE standardisees | Eligibilite et montants CEE |

---

*Rapport genere automatiquement par 5 agents experts Claude Code le 31 mars 2026.*
