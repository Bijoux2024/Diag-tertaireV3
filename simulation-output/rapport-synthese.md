# Rapport de simulation energetique - DiagTertiaire v1.5.1

**Date de simulation :** 06/04/2026  
**Moteur :** ENGINE_VERSION 1.5.1 (2026-04-06)

---

## A. Resume executif

- **Simulations executees :** 30/30
- **Erreurs moteur :** 0 (Aucune)
- **Anomalies CRITIQUE :** 0
- **Anomalies WARNING :** 0
- **Repartition des scores A-E :** A=3 | B=4 | C=6 | D=11 | E=6 | ERR/NA=0
- **Intensite observee :** min=42 | max=775 | moy=231 kWh/m2/an
- **Cout annuel :** min=1 304 EUR | max=143 200 EUR

### Tableau de synthese global

| ID | Nom scenario | Score | Intensite | Mediane | Ecart | Cout EUR | Actions | Economies EUR | Statut |
|---|---|---|---|---|---|---|---|---|---|
| S01 | Bureau standard Paris | **D** | 200 | 135 | +48% | 10 024 | 6 | 6 516 | OK |
| S02 | Commerce retail Lyon | **D** | 260 | 210 | +24% | 10 192 | 6 | 6 625 | OK |
| S03 | Hotel 3 etoiles Nice | **C** | 229 | 230 | +0% | 38 060 | 6 | 22 702 | OK |
| S04 | Restaurant Toulouse | **E** | 775 | 270 | +187% | 13 388 | 6 | 6 667 | OK |
| S05 | Commerce alimentaire Lille | **C** | 325 | 360 | -10% | 25 480 | 5 | 13 931 | OK |
| S06 | Cabinet medical Bordeaux | **B** | 156 | 195 | -20% | 2 744 | 3 | 409 | OK |
| S07 | Ecole primaire Nantes | **C** | 125 | 110 | +14% | 13 880 | 5 | 7 936 | OK |
| S08 | Entrepot logistique Marseille | **C** | 42 | 45 | -7% | 13 540 | 4 | 4 928 | OK |
| S09 | Bureau tout electrique (convecteurs) | **D** | 183 | 135 | +36% | 10 780 | 6 | 7 007 | OK |
| S10 | Bureau gaz + ECS electrique separee | **D** | 217 | 135 | +61% | 8 780 | 6 | 4 964 | OK |
| S11 | Bureau fioul (mainHeating=fuel) | **E** | 250 | 135 | +85% | 9 420 | 6 | 6 123 | OK |
| S12 | Bureau reseau chaleur (mainHeating=network) | **A** | 67 | 135 | -50% | 3 920 | 3 | 2 548 | OK |
| S13 | Bureau PAC deja installee | **B** | 83 | 135 | -39% | 4 900 | 4 | 3 185 | OK |
| S14 | Bureau gaz chaudiere > 20 ans | **E** | 260 | 135 | +93% | 10 008 | 6 | 6 369 | OK |
| S15 | Micro-bureau recent (50m2) | **C** | 160 | 135 | +19% | 1 304 | 2 | 201 | OK |
| S16 | Bureau ancien enorme (5000m2 pre-1975) | **D** | 200 | 135 | +48% | 143 200 | 6 | 57 289 | OK |
| S17 | Bureau annees 80 moyen (500m2) | **E** | 230 | 135 | +70% | 16 380 | 6 | 10 647 | OK |
| S18 | Bureau RT2005 (800m2) | **B** | 113 | 135 | -16% | 14 120 | 5 | 9 178 | OK |
| S19 | Bureau RT2012+ tres performant (300m2) | **B** | 100 | 135 | -26% | 5 000 | 5 | 3 250 | OK |
| S20 | Bureau toiture plate (PV coeff 0.85) | **D** | 188 | 135 | +39% | 10 740 | 5 | 6 351 | OK |
| S21 | Bureau toiture sud optimale (PV coeff 1.00) | **D** | 188 | 135 | +39% | 10 740 | 5 | 6 351 | OK |
| S22 | Bureau toiture nord degradee (PV coeff 0.55) | **D** | 188 | 135 | +39% | 10 740 | 4 | 3 169 | OK |
| S23 | Bureau sans toiture (aucun PV) | **D** | 188 | 135 | +39% | 10 740 | 4 | 3 169 | OK |
| S24 | Usage mixte 60/40 bureau-commerce (500m2) | **C** | 180 | 165 | +9% | 13 240 | 5 | 7 919 | OK |
| S25 | Saisie en euros uniquement (sans kWh) | **E** | 336 | 135 | +149% | 14 700 | 6 | 9 555 | OK |
| S26 | Aucune conso saisie (elec=false, gaz=false) | **A** | 0 | 135 | -100% | 0 | 0 | 0 | OK |
| S27 | Tous travaux deja realises (0 action attendue) | **D** | 200 | 135 | +48% | 11 280 | 3 | 4 744 | OK |
| S28 | Restaurant gastronomique ancien (250m2) | **E** | 620 | 270 | +130% | 22 020 | 6 | 7 806 | OK |
| S29 | Immeuble bureaux recent performant (2000m2) | **A** | 60 | 135 | -56% | 23 520 | 5 | 15 288 | OK |
| S30 | Superette de quartier (150m2) | **D** | 567 | 360 | +57% | 16 660 | 6 | 8 896 | OK |

---

## B. Analyse par activite

### Bureaux

**Benchmark moteur :** mediane = 135 | Q1 = 85 | Q3 = 195 kWh/m2/an

| ID | Surface | Age | Score | Intensite | Ecart mediane | Nb actions | Actions principales |
|---|---|---|---|---|---|---|---|
| S01 | 350m2 | 2001_2012 | **D** | 200 kWh/m2 | +48% | 6 | ACT01, ACT03, ACT02 |
| S09 | 300m2 | 2001_2012 | **D** | 183 kWh/m2 | +36% | 6 | ACT01, ACT03, ACT02 |
| S10 | 300m2 | 1975_2000 | **D** | 217 kWh/m2 | +61% | 6 | ACT01, ACT03, ACT11 |
| S11 | 300m2 | pre1975 | **E** | 250 kWh/m2 | +85% | 6 | ACT01, ACT03, ACT02 |
| S12 | 300m2 | 2001_2012 | **A** | 67 kWh/m2 | -50% | 3 | ACT01, ACT22, ACT14 |
| S13 | 300m2 | post2012 | **B** | 83 kWh/m2 | -39% | 4 | ACT01, ACT03, ACT14 |
| S14 | 300m2 | pre1975 | **E** | 260 kWh/m2 | +93% | 6 | ACT01, ACT03, ACT02 |
| S15 | 50m2 | post2012 | **C** | 160 kWh/m2 | +19% | 2 | ACT08, ACT03 |
| S16 | 5000m2 | pre1975 | **D** | 200 kWh/m2 | +48% | 6 | ACT01, ACT02, ACT21 |
| S17 | 500m2 | 1975_2000 | **E** | 230 kWh/m2 | +70% | 6 | ACT01, ACT03, ACT02 |
| S18 | 800m2 | 2001_2012 | **B** | 113 kWh/m2 | -16% | 5 | ACT01, ACT05, ACT21 |
| S19 | 300m2 | post2012 | **B** | 100 kWh/m2 | -26% | 5 | ACT01, ACT05, ACT03 |
| S20 | 400m2 | 2001_2012 | **D** | 188 kWh/m2 | +39% | 5 | ACT01, ACT03, ACT02 |
| S21 | 400m2 | 2001_2012 | **D** | 188 kWh/m2 | +39% | 5 | ACT01, ACT03, ACT02 |
| S22 | 400m2 | 2001_2012 | **D** | 188 kWh/m2 | +39% | 4 | ACT01, ACT03, ACT02 |
| S23 | 400m2 | 2001_2012 | **D** | 188 kWh/m2 | +39% | 4 | ACT01, ACT03, ACT02 |
| S25 | 300m2 | 2001_2012 | **E** | 336 kWh/m2 | +149% | 6 | ACT01, ACT03, ACT08 |
| S26 | 300m2 | 2001_2012 | **A** | 0 kWh/m2 | -100% | 0 |  |
| S27 | 400m2 | 2001_2012 | **D** | 200 kWh/m2 | +48% | 3 | ACT04, ACT19, ACT22 |
| S29 | 2000m2 | post2012 | **A** | 60 kWh/m2 | -56% | 5 | ACT05, ACT11, ACT19 |

### Commerce non-alim

**Benchmark moteur :** mediane = 210 | Q1 = 140 | Q3 = 300 kWh/m2/an

| ID | Surface | Age | Score | Intensite | Ecart mediane | Nb actions | Actions principales |
|---|---|---|---|---|---|---|---|
| S02 | 200m2 | 1975_2000 | **D** | 260 kWh/m2 | +24% | 6 | ACT01, ACT03, ACT08 |

### Hotellerie

**Benchmark moteur :** mediane = 230 | Q1 = 140 | Q3 = 380 kWh/m2/an

| ID | Surface | Age | Score | Intensite | Ecart mediane | Nb actions | Actions principales |
|---|---|---|---|---|---|---|---|
| S03 | 1200m2 | 1975_2000 | **C** | 229 kWh/m2 | +0% | 6 | ACT01, ACT11, ACT10 |

### Restauration

**Benchmark moteur :** mediane = 270 | Q1 = 190 | Q3 = 400 kWh/m2/an

| ID | Surface | Age | Score | Intensite | Ecart mediane | Nb actions | Actions principales |
|---|---|---|---|---|---|---|---|
| S04 | 120m2 | pre1975 | **E** | 775 kWh/m2 | +187% | 6 | ACT03, ACT01, ACT11 |
| S28 | 250m2 | pre1975 | **E** | 620 kWh/m2 | +130% | 6 | ACT01, ACT03, ACT11 |

### Commerce alimentaire

**Benchmark moteur :** mediane = 360 | Q1 = 250 | Q3 = 500 kWh/m2/an

| ID | Surface | Age | Score | Intensite | Ecart mediane | Nb actions | Actions principales |
|---|---|---|---|---|---|---|---|
| S05 | 400m2 | 2001_2012 | **C** | 325 kWh/m2 | -10% | 5 | ACT01, ACT08, ACT21 |
| S30 | 150m2 | 1975_2000 | **D** | 567 kWh/m2 | +57% | 6 | ACT08, ACT09, ACT01 |

### Sante locale

**Benchmark moteur :** mediane = 195 | Q1 = 125 | Q3 = 310 kWh/m2/an

| ID | Surface | Age | Score | Intensite | Ecart mediane | Nb actions | Actions principales |
|---|---|---|---|---|---|---|---|
| S06 | 90m2 | post2012 | **B** | 156 kWh/m2 | -20% | 3 | ACT03, ACT01, ACT08 |

### Enseignement

**Benchmark moteur :** mediane = 110 | Q1 = 75 | Q3 = 165 kWh/m2/an

| ID | Surface | Age | Score | Intensite | Ecart mediane | Nb actions | Actions principales |
|---|---|---|---|---|---|---|---|
| S07 | 800m2 | 1975_2000 | **C** | 125 kWh/m2 | +14% | 5 | ACT01, ACT02, ACT03 |

### Entrepot leger

**Benchmark moteur :** mediane = 45 | Q1 = 20 | Q3 = 75 kWh/m2/an

| ID | Surface | Age | Score | Intensite | Ecart mediane | Nb actions | Actions principales |
|---|---|---|---|---|---|---|---|
| S08 | 2500m2 | 1975_2000 | **C** | 42 kWh/m2 | -7% | 4 | ACT01, ACT02, ACT04 |

### Usage mixte

| ID | Surface | Age | Score | Intensite | Ecart mediane | Nb actions | Actions principales |
|---|---|---|---|---|---|---|---|
| S24 | 500m2 | 2001_2012 | **C** | 180 kWh/m2 | +9% | 5 | ACT01, ACT03, ACT05 |

---

## C. Analyse des actions

### Top actions les plus frequemment recommandees

| Rang | ID | Nom | Frequence | Gain min EUR | Gain max EUR | ROI min | ROI max |
|---|---|---|---|---|---|---|---|
| 1 | ACT01 | Réglage horaires et abaissement chauffage | 26/30 | 98 | 6 843 | 0.1 | 5.1 |
| 2 | ACT14 | Gestion automatisée / Supervision centralisée | 24/30 | 706 | 25 776 | 1.5 | 8.2 |
| 3 | ACT22 | Panneaux solaires pour produire votre propre électricit | 24/30 | 1 941 | 14 928 | 5.2 | 7.8 |
| 4 | ACT03 | Robinets thermostatiques (zonage) | 20/30 | 29 | 667 | 0.9 | 8.9 |
| 5 | ACT02 | Pilotage automatique du chauffage | 12/30 | 599 | 8 554 | 0.4 | 5.3 |
| 6 | ACT13 | Remplacement de la chaudière gaz par une pompe à chaleu | 9/30 | 1 333 | 3 311 | 4.5 | 9.9 |
| 7 | ACT08 | Passage à l'éclairage LED dans tous les locaux | 6/30 | 176 | 3 249 | 1.7 | 9.9 |
| 8 | ACT11 | Isolation du ballon d'eau chaude | 5/30 | 127 | 933 | 0.5 | 3.7 |

**Actions jamais recommandees dans les 30 scenarios :** ACT06, ACT15, ACT16, ACT17

> Note: Cela peut indiquer que les conditions declenchantes ne sont pas remplies pour les scenarios testes (ex: ACT07 "VMC CO2" necessite high_occupancy, ACT17 "fenetres" a ROI souvent > 10 ans), ou que ces actions sont eclipsees par d'autres plus rentables.

---

## D. Analyse CO2


**Facteurs CO2 utilises par le moteur :**

| Energie | Facteur kgCO2/kWh | Source |
|---|---|---|
| Electricite | 0.079 | ADEME RE2020 mensualisee par usage (valeur prospective 2026-2030) |
| Gaz naturel | 0.227 | Base Carbone ADEME 2024 |
| Fioul | 0.324 | Base Carbone ADEME 2024 |
| Reseau chaleur | 0.1 | Moyenne nationale (tres variable) |
| Bois granules | 0.03 | Base Carbone ADEME 2024 |

> **Note critique :** Le facteur CO2 electricite de 0.079 kgCO2/kWh est la valeur ADEME RE2020 prospective (methode mensualisee par usage, 2026-2030). La valeur courante ACV (analyse du cycle de vie) ADEME 2023 est ~0.052 kgCO2/kWh, et la valeur "contenu carbone moyen" RTE est ~0.062 kgCO2/kWh. Ce choix methodologique est determinant sur le comparatif gaz/elec.


**CO2 par scenario (calcule en post-traitement) :**

| ID | Nom | CO2 total kg/an | CO2 evite kg/an | Equiv arbres/an |
|---|---|---|---|---|
| S01 | Bureau standard Paris | 11 746 | 9 820 | 446 |
| S02 | Commerce retail Lyon | 4 108 | 4 898 | 223 |
| S03 | Hotel 3 etoiles Nice | 48 365 | 24 571 | 1117 |
| S04 | Restaurant Toulouse | 15 487 | 9 829 | 447 |
| S05 | Commerce alimentaire Lille | 10 270 | 6 753 | 307 |
| S06 | Cabinet medical Bordeaux | 1 106 | 173 | 8 |
| S07 | Ecole primaire Nantes | 17 520 | 7 926 | 360 |
| S08 | Entrepot logistique Marseille | 20 135 | 6 750 | 307 |
| S09 | Bureau tout electrique (convecteurs) | 4 345 | 5 883 | 267 |
| S10 | Bureau gaz + ECS electrique separee | 11 795 | 4 793 | 218 |
| S11 | Bureau fioul (mainHeating=fuel) | 20 625 | 16 211 | 737 |
| S12 | Bureau reseau chaleur (mainHeating=network) | 1 580 | 1 314 | 60 |
| S13 | Bureau PAC deja installee | 1 975 | 1 698 | 77 |
| S14 | Bureau gaz chaudiere > 20 ans | 15 042 | 12 066 | 548 |
| S15 | Micro-bureau recent (50m2) | 1 076 | 131 | 6 |
| S16 | Bureau ancien enorme (5000m2 pre-1975) | 167 800 | 57 041 | 2593 |
| S17 | Bureau annees 80 moyen (500m2) | 19 445 | 15 777 | 717 |
| S18 | Bureau RT2005 (800m2) | 13 030 | 5 053 | 230 |
| S19 | Bureau RT2012+ tres performant (300m2) | 3 850 | 1 852 | 84 |
| S20 | Bureau toiture plate (PV coeff 0.85) | 12 585 | 5 777 | 263 |
| S21 | Bureau toiture sud optimale (PV coeff 1.00) | 12 585 | 5 777 | 263 |
| S22 | Bureau toiture nord degradee (PV coeff 0.55) | 12 585 | 4 393 | 200 |
| S23 | Bureau sans toiture (aucun PV) | 12 585 | 4 393 | 200 |
| S24 | Usage mixte 60/40 bureau-commerce (500m2) | 14 510 | 5 500 | 250 |
| S25 | Saisie en euros uniquement (sans kWh) | 16 457 | 12 540 | 570 |
| S26 | Aucune conso saisie (elec=false, gaz=false) | 0 | 0 | 0 |
| S27 | Tous travaux deja realises (0 action attendue) | 13 720 | 2 290 | 104 |
| S28 | Restaurant gastronomique ancien (250m2) | 26 305 | 14 999 | 682 |
| S29 | Immeuble bureaux recent performant (2000m2) | 9 480 | 6 026 | 274 |
| S30 | Superette de quartier (150m2) | 6 715 | 4 944 | 225 |

---

## E. Anomalies et alertes

> Aucune anomalie detectee sur les 30 scenarios.

---

## F. Questions pour l'expert energie

_Basees sur les resultats observes, a soumettre pour validation metier._


**Q1 - Mediane bureaux :** Pour un bureau de 350m2 chauffage gaz (28k kWh elec + 42k kWh gaz), le moteur calcule une intensite de **200 kWh/m2/an**. La mediane sectorielle est de **135 kWh/m2/an** (score **D**). Ces references bureaux sont-elles coherentes avec la realite 2024-2025 ?

**Q2 - Intensite restauration :** Le restaurant S04 (120m2, 775 kWh/m2/an) obtient un score **E** vs mediane 270. S28 (250m2 gastronomique ancien) : 620 kWh/m2/an, score **E**. La mediane 270 kWh/m2/an pour la restauration vous semble-t-elle realiste ? L'ecart type constate en pratique est-il tres large ?

**Q3 - Score commerce alimentaire :** S05 (400m2 superette, 325 kWh/m2/an) obtient un score **C** vs mediane sectorielle 360 kWh/m2/an. Ce score reflete-t-il correctement la realite du commerce alimentaire avec froid commercial ? La mediane 360 kWh/m2/an est-elle representative des petites superettes ?

**Q4 - ROI PAC :** L'action PAC (ACT13) est recommandee sur 9 scenarios. ROI observe : S01=9.9ans, S02=7.6ans, S04=4.5ans, S09=5.8ans, S11=5.8ans, S14=8.4ans, S17=9.7ans, S25=6.4ans, S30=8.8ans. Ces ROI de remplacement chaudiere gaz par PAC air/eau sont-ils realistes ? En particulier pour les grandes surfaces (>500m2) ou le CAPEX depasse 30 000 EUR ?

**Q5 - Facteur CO2 fioul :** Le moteur utilise 0.324 kgCO2/kWh pour le fioul (Base Carbone ADEME 2024). S11 (bureau fioul, 300m2) genere un total CO2 de 20 625 kg/an. La valeur ADEME Base Carbone pour le fioul domestique (EF = 0.324 kgCO2/kWh) vous semble-t-elle correcte ? Certaines sources citent 0.276 (NCV). La distinction NCV/GCV peut-elle expliquer l'ecart ?

**Q6 - Facteur CO2 electricite (DEBAT METHODOLOGIQUE) :** Le moteur utilise 0.079 kgCO2/kWh (ADEME RE2020 prospective 2026-2030). La valeur ACV ADEME 2023 est ~0.052, et la valeur "moyen" RTE est ~0.062. Ce choix a un impact fort : avec 0.079, un kWh elec "vaut" 35% d'un kWh gaz en CO2. Avec 0.052, il ne vaudrait que 23%. Quelle valeur recommandez-vous pour un pre-diagnostic tertiaire grand public ?

**Q7 - Reseau de chaleur sans kWh declares :** S12 (bureau reseau chaleur, 300m2) : elec seule declaree (20 000 kWh), pas de kWh reseau. Le moteur estime une intensite de **67 kWh/m2/an**. Le traitement du reseau de chaleur comme "chauffage non declare" est-il acceptable ? Le moteur devrait-il avoir un champ separe "chaleur reseau kWh/an" pour mieux traiter ce cas ?

**Q8 - Aucune consommation saisie :** S26 (bureau 300m2, ni elec ni gaz declared) retourne une intensite de **0 kWh/m2/an** et 0 action(s). Le moteur ne refuse pas cette configuration - il renvoie simplement totalKwh=0. Ce comportement est-il acceptable ? Faut-il une estimation par defaut basee sur la surface et l'activite ?

**Q9 - Decret tertiaire :** 4 scenarios depassent 1 000m2 (S03: 1200m2, S08: 2500m2, S16: 5000m2, S29: 2000m2). Le moteur mentionne le Decret Tertiaire mais ne bloque pas sur les CAbs. Pour S03 (hotel 1 200m2), l'intensite 229 kWh/m2/an depasse-t-elle la CAbs 2030 de 170 kWh/m2/an pour l'hotellerie ? Comment le moteur devrait-il integrer le Decret de facon plus proactive ?

**Q10 - ROI LED :** L'action LED (ACT08) est recommandee sur 6/30 scenarios. ROI observe : S02=2.4ans, S05=3ans, S06=9.9ans, S15=6.8ans, S25=4.7ans, S30=1.7ans. Un ROI LED < 3 ans est generalement consideré tres optimiste - le plafond de gain LED (75%) est-il realiste ? Le CAPEX de 30 EUR/m2 est-il representatif 2025 ?

**Q11 - Entrepot logistique :** S08 (entrepot leger 2500m2) : intensite **42 kWh/m2/an**, mediane 45, score **C**. La mediane 45 kWh/m2/an pour "entrepot leger" integre-t-elle le chauffage ? Pour un entrepot gaz (80 000 kWh gaz), la mediane de 45 kWh/m2/an (eclairage seul) semble tres basse. Y aurait-il une erreur de categorisation dans le plan de simulation ?

**Q12 - Cap des economies a 65% :** Le moteur plafonne les economies composees a 65% de la facture totale. Le scenario maximum est S16 avec 57 289 EUR/an d'economies (38% de reduction). Ce plafond de 65% vous semble-t-il conservateur, realiste ou trop permissif pour un pre-diagnostic ?

**Q13 - Impact orientation toiture sur PV :** Meme batiment (bureau 400m2, 75 kWh elec+gaz) en variant la toiture:
  - S20 plate: 26 kWc, 3881 EUR/an
  - S21 sud: 22.1 kWc, 3881 EUR/an
  - S22 nord: 40.2 kWc, 3883 EUR/an
  - S23 sans toiture: N/A kWc

Ces ecarts reflètent-ils la realite terrain ? Le dimensionnement PV (m2 utile = surface/niveaux * 0.60) est-il correct pour une toiture plate ?

**Q14 - ECS hotellerie :** Pour S03 (hotel 1200m2), le moteur affiche 22% en ECS sur le breakdown. Avec 180 000 kWh gaz (source principale), cela represente ~39 600 kWh/an pour l'ECS. En hotellerie, l'ECS est typiquement 15-25% de la consommation totale (ADEME). Le moteur utilise 22% pour ce poste. Cela vous semble-t-il coherent pour un hotel 3 etoiles de 1200m2 ?

**Q15 - Gestion du "fioul" dans le formulaire :** Le moteur ne possede pas de champ "fioul_kwh" separe. Pour S11 (bureau fioul), la conso fioul a ete renseignee dans le champ "gaz" (gasUsed=true, gasKwh=60000) avec mainHeating='fuel'. Le moteur ajuste alors correctement le prix (0.125 EUR/kWh) mais la methode de saisie est ambigue pour l'utilisateur. Faut-il ajouter un champ "fioul_kwh" distinct dans le formulaire ? Ou un champ generique "autre_thermique_kwh" ?

---

## G. Annexe - Detail par scenario


### S01 - Bureau standard Paris

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 350 m2 |
| Chauffage | gas |
| Age | 2001_2012 |
| **Score** | **D** |
| Intensite site | 200 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +48% |
| Cout annuel estime | 10 024 EUR/an |
| Confiance | Fort |
| CO2 total | 11 746 kgCO2/an |
| Economies estimees | 6 516 EUR/an (65%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 479 EUR | 1 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 399 EUR | 2.5 ans | 1 150 EUR | 978 EUR | 173 EUR |
| ACT02 | Pilotage automatique du chauffage | 599 EUR | 5.3 ans | 4 000 EUR | 3 200 EUR | 800 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 1 804 EUR | 3.5 ans | 8 750 EUR | 6 300 EUR | 2 450 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (24.3 kWc) | 3 627 EUR | 7.2 ans | 29 160 EUR | 26 244 EUR | 2 916 EUR |
| ACT13 | Remplacement de la chaudière gaz par une pompe à chaleur air/eau | 2 184 EUR | 9.9 ans | 28 750 EUR | 21 563 EUR | 7 188 EUR |

### S02 - Commerce retail Lyon

| Parametre | Valeur |
|---|---|
| Activite | retail |
| Surface | 200 m2 |
| Chauffage | electric |
| Age | 1975_2000 |
| **Score** | **D** |
| Intensite site | 260 kWh/m2/an |
| Mediane sectorielle | 210 kWh/m2/an |
| Ecart mediane | +24% |
| Cout annuel estime | 10 192 EUR/an |
| Confiance | Fort |
| CO2 total | 4 108 kgCO2/an |
| Economies estimees | 6 625 EUR/an (65%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 367 EUR | 1.4 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 306 EUR | 1.8 ans | 650 EUR | 553 EUR | 98 EUR |
| ACT08 | Passage à l'éclairage LED dans tous les locaux | 1 967 EUR | 2.4 ans | 6 000 EUR | 4 800 EUR | 1 200 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 1 835 EUR | 3.1 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (24 kWc) | 4 310 EUR | 6 ans | 28 800 EUR | 25 920 EUR | 2 880 EUR |
| ACT13 | Remplacement de la chaudière gaz par une pompe à chaleur air/eau | 2 038 EUR | 7.6 ans | 19 000 EUR | 15 580 EUR | 3 420 EUR |

### S03 - Hotel 3 etoiles Nice

| Parametre | Valeur |
|---|---|
| Activite | hotel |
| Surface | 1200 m2 |
| Chauffage | gas |
| Age | 1975_2000 |
| **Score** | **C** |
| Intensite site | 229 kWh/m2/an |
| Mediane sectorielle | 230 kWh/m2/an |
| Ecart mediane | +0% |
| Cout annuel estime | 38 060 EUR/an |
| Confiance | Fort |
| CO2 total | 48 365 kgCO2/an |
| Economies estimees | 22 702 EUR/an (52%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 1 400 EUR | 0.4 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT11 | Isolation du ballon d'eau chaude | 933 EUR | 0.5 ans | 500 EUR | 475 EUR | 25 EUR |
| ACT10 | Isolation des tuyaux d'eau chaude | 1 166 EUR | 1 ans | 1 500 EUR | 1 200 EUR | 300 EUR |
| ACT20 | Récupération de la chaleur produite par la climatisation | 3 888 EUR | 1.5 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 6 851 EUR | 3.2 ans | 30 000 EUR | 21 600 EUR | 8 400 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (72.9 kWc) | 13 709 EUR | 5.3 ans | 76 545 EUR | 72 171 EUR | 4 374 EUR |

### S04 - Restaurant Toulouse

| Parametre | Valeur |
|---|---|
| Activite | restaurant |
| Surface | 120 m2 |
| Chauffage | gas |
| Age | pre1975 |
| **Score** | **E** |
| Intensite site | 775 kWh/m2/an |
| Mediane sectorielle | 270 kWh/m2/an |
| Ecart mediane | +187% |
| Cout annuel estime | 13 388 EUR/an |
| Confiance | Fort |
| CO2 total | 15 487 kgCO2/an |
| Economies estimees | 6 667 EUR/an (61%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT03 | Robinets thermostatiques (zonage) | 386 EUR | 0.9 ans | 400 EUR | 340 EUR | 60 EUR |
| ACT01 | Réglage horaires et abaissement chauffage | 463 EUR | 1.1 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT11 | Isolation du ballon d'eau chaude | 249 EUR | 1.9 ans | 500 EUR | 475 EUR | 25 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 2 410 EUR | 2.4 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (14.4 kWc) | 2 588 EUR | 6 ans | 17 280 EUR | 15 552 EUR | 1 728 EUR |
| ACT13 | Remplacement de la chaudière gaz par une pompe à chaleur air/eau | 2 090 EUR | 4.5 ans | 11 400 EUR | 9 348 EUR | 2 052 EUR |

### S05 - Commerce alimentaire Lille

| Parametre | Valeur |
|---|---|
| Activite | commerce_alim |
| Surface | 400 m2 |
| Chauffage | electric |
| Age | 2001_2012 |
| **Score** | **C** |
| Intensite site | 325 kWh/m2/an |
| Mediane sectorielle | 360 kWh/m2/an |
| Ecart mediane | -10% |
| Cout annuel estime | 25 480 EUR/an |
| Confiance | Fort |
| CO2 total | 10 270 kgCO2/an |
| Economies estimees | 13 931 EUR/an (52%) |

**Actions recommandees (5) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 367 EUR | 1.4 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT08 | Passage à l'éclairage LED dans tous les locaux | 3 249 EUR | 3 ans | 12 000 EUR | 9 600 EUR | 2 400 EUR |
| ACT21 | Suivi détaillé de ce qui consomme quoi dans votre local | 1 274 EUR | 2.4 ans | 3 000 EUR | 3 000 EUR | 0 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 4 586 EUR | 1.6 ans | 10 000 EUR | 7 200 EUR | 2 800 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (48 kWc) | 7 664 EUR | 6.2 ans | 50 400 EUR | 47 520 EUR | 2 880 EUR |

### S06 - Cabinet medical Bordeaux

| Parametre | Valeur |
|---|---|
| Activite | health_local |
| Surface | 90 m2 |
| Chauffage | electric |
| Age | post2012 |
| **Score** | **B** |
| Intensite site | 156 kWh/m2/an |
| Mediane sectorielle | 195 kWh/m2/an |
| Ecart mediane | -20% |
| Cout annuel estime | 2 744 EUR/an |
| Confiance | Fort |
| CO2 total | 1 106 kgCO2/an |
| Economies estimees | 409 EUR/an (15%) |

**Actions recommandees (3) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT03 | Robinets thermostatiques (zonage) | 96 EUR | 2.7 ans | 300 EUR | 255 EUR | 45 EUR |
| ACT01 | Réglage horaires et abaissement chauffage | 115 EUR | 4.3 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT08 | Passage à l'éclairage LED dans tous les locaux | 218 EUR | 9.9 ans | 2 700 EUR | 2 160 EUR | 540 EUR |

### S07 - Ecole primaire Nantes

| Parametre | Valeur |
|---|---|
| Activite | education |
| Surface | 800 m2 |
| Chauffage | gas |
| Age | 1975_2000 |
| **Score** | **C** |
| Intensite site | 125 kWh/m2/an |
| Mediane sectorielle | 110 kWh/m2/an |
| Ecart mediane | +14% |
| Cout annuel estime | 13 880 EUR/an |
| Confiance | Fort |
| CO2 total | 17 520 kgCO2/an |
| Economies estimees | 7 936 EUR/an (48%) |

**Actions recommandees (5) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 758 EUR | 0.7 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT02 | Pilotage automatique du chauffage | 948 EUR | 3.4 ans | 4 000 EUR | 3 200 EUR | 800 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 632 EUR | 3.6 ans | 2 650 EUR | 2 253 EUR | 398 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 2 498 EUR | 5.8 ans | 20 000 EUR | 14 400 EUR | 5 600 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (31.9 kWc) | 4 481 EUR | 7.7 ans | 38 280 EUR | 34 452 EUR | 3 828 EUR |

### S08 - Entrepot logistique Marseille

| Parametre | Valeur |
|---|---|
| Activite | light_warehouse |
| Surface | 2500 m2 |
| Chauffage | gas |
| Age | 1975_2000 |
| **Score** | **C** |
| Intensite site | 42 kWh/m2/an |
| Mediane sectorielle | 45 kWh/m2/an |
| Ecart mediane | -7% |
| Cout annuel estime | 13 540 EUR/an |
| Confiance | Fort |
| CO2 total | 20 135 kgCO2/an |
| Economies estimees | 4 928 EUR/an (30%) |

**Actions recommandees (4) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 985 EUR | 0.5 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT02 | Pilotage automatique du chauffage | 1 231 EUR | 2.6 ans | 4 000 EUR | 3 200 EUR | 800 EUR |
| ACT04 | Entretien du chauffage pour qu'il consomme moins | 657 EUR | 3.8 ans | 2 500 EUR | 2 500 EUR | 0 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (16 kWc) | 2 227 EUR | 7.8 ans | 19 200 EUR | 17 280 EUR | 1 920 EUR |

### S09 - Bureau tout electrique (convecteurs)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 300 m2 |
| Chauffage | electric |
| Age | 2001_2012 |
| **Score** | **D** |
| Intensite site | 183 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +36% |
| Cout annuel estime | 10 780 EUR/an |
| Confiance | Fort |
| CO2 total | 4 345 kgCO2/an |
| Economies estimees | 7 007 EUR/an (65%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 556 EUR | 0.9 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 464 EUR | 1.8 ans | 1 000 EUR | 850 EUR | 150 EUR |
| ACT02 | Pilotage automatique du chauffage | 695 EUR | 4.6 ans | 4 000 EUR | 3 200 EUR | 800 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 1 940 EUR | 3 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (36 kWc) | 5 374 EUR | 7.2 ans | 43 200 EUR | 38 880 EUR | 4 320 EUR |
| ACT13 | Remplacement de la chaudière gaz par une pompe à chaleur air/eau | 3 311 EUR | 5.8 ans | 25 500 EUR | 19 125 EUR | 6 375 EUR |

### S10 - Bureau gaz + ECS electrique separee

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 300 m2 |
| Chauffage | gas |
| Age | 1975_2000 |
| **Score** | **D** |
| Intensite site | 217 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +61% |
| Cout annuel estime | 8 780 EUR/an |
| Confiance | Fort |
| CO2 total | 11 795 kgCO2/an |
| Economies estimees | 4 964 EUR/an (45%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 513 EUR | 1 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 428 EUR | 2 ans | 1 000 EUR | 850 EUR | 150 EUR |
| ACT11 | Isolation du ballon d'eau chaude | 127 EUR | 3.7 ans | 500 EUR | 475 EUR | 25 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 1 580 EUR | 3.6 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |
| ACT18 | Chauffe-eau thermodynamique (eau chaude haute performance) | 706 EUR | 5.4 ans | 4 500 EUR | 3 825 EUR | 675 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (17.4 kWc) | 2 598 EUR | 7.2 ans | 20 880 EUR | 18 792 EUR | 2 088 EUR |

### S11 - Bureau fioul (mainHeating=fuel)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 300 m2 |
| Chauffage | fuel |
| Age | pre1975 |
| **Score** | **E** |
| Intensite site | 250 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +85% |
| Cout annuel estime | 9 420 EUR/an |
| Confiance | Fort |
| CO2 total | 20 625 kgCO2/an |
| Economies estimees | 6 123 EUR/an (65%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 792 EUR | 0.6 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 660 EUR | 1.3 ans | 1 000 EUR | 850 EUR | 150 EUR |
| ACT02 | Pilotage automatique du chauffage | 990 EUR | 3.2 ans | 4 000 EUR | 3 200 EUR | 800 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 1 879 EUR | 3.1 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |
| ACT13 | Remplacement de la chaudière gaz par une pompe à chaleur air/eau | 3 300 EUR | 5.8 ans | 25 500 EUR | 19 125 EUR | 6 375 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (13 kWc) | 1 941 EUR | 7.2 ans | 15 600 EUR | 14 040 EUR | 1 560 EUR |

### S12 - Bureau reseau chaleur (mainHeating=network)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 300 m2 |
| Chauffage | network |
| Age | 2001_2012 |
| **Score** | **A** |
| Intensite site | 67 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | -50% |
| Cout annuel estime | 3 920 EUR/an |
| Confiance | Fort |
| CO2 total | 1 580 kgCO2/an |
| Economies estimees | 2 548 EUR/an (65%) |

**Actions recommandees (3) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 98 EUR | 5.1 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (17.4 kWc) | 2 598 EUR | 7.2 ans | 20 880 EUR | 18 792 EUR | 2 088 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 706 EUR | 8.2 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |

### S13 - Bureau PAC deja installee

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 300 m2 |
| Chauffage | electric |
| Age | post2012 |
| **Score** | **B** |
| Intensite site | 83 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | -39% |
| Cout annuel estime | 4 900 EUR/an |
| Confiance | Fort |
| CO2 total | 1 975 kgCO2/an |
| Economies estimees | 3 185 EUR/an (65%) |

**Actions recommandees (4) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 253 EUR | 2 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 211 EUR | 4 ans | 1 000 EUR | 850 EUR | 150 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 882 EUR | 6.5 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (21.7 kWc) | 3 239 EUR | 7.2 ans | 26 040 EUR | 23 436 EUR | 2 604 EUR |

### S14 - Bureau gaz chaudiere > 20 ans

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 300 m2 |
| Chauffage | gas |
| Age | pre1975 |
| **Score** | **E** |
| Intensite site | 260 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +93% |
| Cout annuel estime | 10 008 EUR/an |
| Confiance | Fort |
| CO2 total | 15 042 kgCO2/an |
| Economies estimees | 6 369 EUR/an (65%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 684 EUR | 0.7 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 570 EUR | 1.5 ans | 1 000 EUR | 850 EUR | 150 EUR |
| ACT02 | Pilotage automatique du chauffage | 855 EUR | 3.7 ans | 4 000 EUR | 3 200 EUR | 800 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 1 801 EUR | 3.2 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (15.6 kWc) | 2 329 EUR | 7.2 ans | 18 720 EUR | 16 848 EUR | 1 872 EUR |
| ACT13 | Remplacement de la chaudière gaz par une pompe à chaleur air/eau | 2 280 EUR | 8.4 ans | 25 500 EUR | 19 125 EUR | 6 375 EUR |

### S15 - Micro-bureau recent (50m2)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 50 m2 |
| Chauffage | gas |
| Age | post2012 |
| **Score** | **C** |
| Intensite site | 160 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +19% |
| Cout annuel estime | 1 304 EUR/an |
| Confiance | Fort |
| CO2 total | 1 076 kgCO2/an |
| Economies estimees | 201 EUR/an (14%) |

**Actions recommandees (2) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT08 | Passage à l'éclairage LED dans tous les locaux | 176 EUR | 6.8 ans | 1 500 EUR | 1 200 EUR | 300 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 29 EUR | 8.8 ans | 300 EUR | 255 EUR | 45 EUR |

### S16 - Bureau ancien enorme (5000m2 pre-1975)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 5000 m2 |
| Chauffage | gas |
| Age | pre1975 |
| **Score** | **D** |
| Intensite site | 200 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +48% |
| Cout annuel estime | 143 200 EUR/an |
| Confiance | Fort |
| CO2 total | 167 800 kgCO2/an |
| Economies estimees | 57 289 EUR/an (38%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 6 843 EUR | 0.1 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT02 | Pilotage automatique du chauffage | 8 554 EUR | 0.4 ans | 4 000 EUR | 3 200 EUR | 800 EUR |
| ACT21 | Suivi détaillé de ce qui consomme quoi dans votre local | 7 160 EUR | 0.4 ans | 3 000 EUR | 3 000 EUR | 0 EUR |
| ACT07 | Ventilation qui se déclenche quand l'air est saturé | 2 940 EUR | 1.9 ans | 7 000 EUR | 5 600 EUR | 1 400 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 25 776 EUR | 3.5 ans | 125 000 EUR | 90 000 EUR | 35 000 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (100 kWc) | 14 928 EUR | 6.6 ans | 105 000 EUR | 99 000 EUR | 6 000 EUR |

### S17 - Bureau annees 80 moyen (500m2)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 500 m2 |
| Chauffage | gas |
| Age | 1975_2000 |
| **Score** | **E** |
| Intensite site | 230 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +70% |
| Cout annuel estime | 16 380 EUR/an |
| Confiance | Fort |
| CO2 total | 19 445 kgCO2/an |
| Economies estimees | 10 647 EUR/an (65%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 798 EUR | 0.6 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 665 EUR | 2.1 ans | 1 650 EUR | 1 403 EUR | 248 EUR |
| ACT02 | Pilotage automatique du chauffage | 998 EUR | 3.2 ans | 4 000 EUR | 3 200 EUR | 800 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 2 948 EUR | 3.1 ans | 12 500 EUR | 9 000 EUR | 3 500 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (39.1 kWc) | 5 837 EUR | 6.6 ans | 41 055 EUR | 38 709 EUR | 2 346 EUR |
| ACT13 | Remplacement de la chaudière gaz par une pompe à chaleur air/eau | 2 987 EUR | 9.7 ans | 38 500 EUR | 28 875 EUR | 9 625 EUR |

### S18 - Bureau RT2005 (800m2)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 800 m2 |
| Chauffage | gas |
| Age | 2001_2012 |
| **Score** | **B** |
| Intensite site | 113 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | -16% |
| Cout annuel estime | 14 120 EUR/an |
| Confiance | Fort |
| CO2 total | 13 030 kgCO2/an |
| Economies estimees | 9 178 EUR/an (51%) |

**Actions recommandees (5) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 456 EUR | 1.1 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT05 | Arrêt automatique de la ventilation en dehors des horaires d'ouverture | 368 EUR | 3.5 ans | 1 500 EUR | 1 275 EUR | 225 EUR |
| ACT21 | Suivi détaillé de ce qui consomme quoi dans votre local | 706 EUR | 4.2 ans | 3 000 EUR | 3 000 EUR | 0 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 2 542 EUR | 5.7 ans | 20 000 EUR | 14 400 EUR | 5 600 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (43.4 kWc) | 6 479 EUR | 6.6 ans | 45 570 EUR | 42 966 EUR | 2 604 EUR |

### S19 - Bureau RT2012+ tres performant (300m2)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 300 m2 |
| Chauffage | gas |
| Age | post2012 |
| **Score** | **B** |
| Intensite site | 100 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | -26% |
| Cout annuel estime | 5 000 EUR/an |
| Confiance | Fort |
| CO2 total | 3 850 kgCO2/an |
| Economies estimees | 3 250 EUR/an (54%) |

**Actions recommandees (5) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 114 EUR | 4.4 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT05 | Arrêt automatique de la ventilation en dehors des horaires d'ouverture | 147 EUR | 8.7 ans | 1 500 EUR | 1 275 EUR | 225 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 95 EUR | 8.9 ans | 1 000 EUR | 850 EUR | 150 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 900 EUR | 6.4 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (17.4 kWc) | 2 598 EUR | 7.2 ans | 20 880 EUR | 18 792 EUR | 2 088 EUR |

### S20 - Bureau toiture plate (PV coeff 0.85)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 400 m2 |
| Chauffage | gas |
| Age | 2001_2012 |
| **Score** | **D** |
| Intensite site | 188 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +39% |
| Cout annuel estime | 10 740 EUR/an |
| Confiance | Fort |
| CO2 total | 12 585 kgCO2/an |
| Economies estimees | 6 351 EUR/an (49%) |

**Actions recommandees (5) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 513 EUR | 1 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 428 EUR | 2.7 ans | 1 350 EUR | 1 148 EUR | 203 EUR |
| ACT02 | Pilotage automatique du chauffage | 642 EUR | 5 ans | 4 000 EUR | 3 200 EUR | 800 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 1 933 EUR | 3.7 ans | 10 000 EUR | 7 200 EUR | 2 800 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (26 kWc) | 3 881 EUR | 7.2 ans | 31 200 EUR | 28 080 EUR | 3 120 EUR |

### S21 - Bureau toiture sud optimale (PV coeff 1.00)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 400 m2 |
| Chauffage | gas |
| Age | 2001_2012 |
| **Score** | **D** |
| Intensite site | 188 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +39% |
| Cout annuel estime | 10 740 EUR/an |
| Confiance | Fort |
| CO2 total | 12 585 kgCO2/an |
| Economies estimees | 6 351 EUR/an (49%) |

**Actions recommandees (5) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 513 EUR | 1 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 428 EUR | 2.7 ans | 1 350 EUR | 1 148 EUR | 203 EUR |
| ACT02 | Pilotage automatique du chauffage | 642 EUR | 5 ans | 4 000 EUR | 3 200 EUR | 800 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 1 933 EUR | 3.7 ans | 10 000 EUR | 7 200 EUR | 2 800 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (22.1 kWc) | 3 881 EUR | 6.1 ans | 26 520 EUR | 23 868 EUR | 2 652 EUR |

### S22 - Bureau toiture nord degradee (PV coeff 0.55)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 400 m2 |
| Chauffage | gas |
| Age | 2001_2012 |
| **Score** | **D** |
| Intensite site | 188 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +39% |
| Cout annuel estime | 10 740 EUR/an |
| Confiance | Fort |
| CO2 total | 12 585 kgCO2/an |
| Economies estimees | 3 169 EUR/an (33%) |

**Actions recommandees (4) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 513 EUR | 1 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 428 EUR | 2.7 ans | 1 350 EUR | 1 148 EUR | 203 EUR |
| ACT02 | Pilotage automatique du chauffage | 642 EUR | 5 ans | 4 000 EUR | 3 200 EUR | 800 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 1 933 EUR | 3.7 ans | 10 000 EUR | 7 200 EUR | 2 800 EUR |

### S23 - Bureau sans toiture (aucun PV)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 400 m2 |
| Chauffage | gas |
| Age | 2001_2012 |
| **Score** | **D** |
| Intensite site | 188 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +39% |
| Cout annuel estime | 10 740 EUR/an |
| Confiance | Fort |
| CO2 total | 12 585 kgCO2/an |
| Economies estimees | 3 169 EUR/an (33%) |

**Actions recommandees (4) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 513 EUR | 1 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 428 EUR | 2.7 ans | 1 350 EUR | 1 148 EUR | 203 EUR |
| ACT02 | Pilotage automatique du chauffage | 642 EUR | 5 ans | 4 000 EUR | 3 200 EUR | 800 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 1 933 EUR | 3.7 ans | 10 000 EUR | 7 200 EUR | 2 800 EUR |

### S24 - Usage mixte 60/40 bureau-commerce (500m2)

| Parametre | Valeur |
|---|---|
| Activite | mixed |
| Surface | 500 m2 |
| Chauffage | gas |
| Age | 2001_2012 |
| **Score** | **C** |
| Intensite site | 180 kWh/m2/an |
| Mediane sectorielle | 165 kWh/m2/an |
| Ecart mediane | +9% |
| Cout annuel estime | 13 240 EUR/an |
| Confiance | Fort |
| CO2 total | 14 510 kgCO2/an |
| Economies estimees | 7 919 EUR/an (47%) |

**Actions recommandees (5) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 570 EUR | 0.9 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 475 EUR | 3 ans | 1 650 EUR | 1 403 EUR | 248 EUR |
| ACT05 | Arrêt automatique de la ventilation en dehors des horaires d'ouverture | 294 EUR | 4.3 ans | 1 500 EUR | 1 275 EUR | 225 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 2 383 EUR | 3.8 ans | 12 500 EUR | 9 000 EUR | 3 500 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (34.7 kWc) | 5 287 EUR | 7.1 ans | 41 640 EUR | 37 476 EUR | 4 164 EUR |

### S25 - Saisie en euros uniquement (sans kWh)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 300 m2 |
| Chauffage | gas |
| Age | 2001_2012 |
| **Score** | **E** |
| Intensite site | 336 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +149% |
| Cout annuel estime | 14 700 EUR/an |
| Confiance | Moyen |
| CO2 total | 16 457 kgCO2/an |
| Economies estimees | 9 555 EUR/an (65%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 655 EUR | 0.8 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 546 EUR | 1.6 ans | 1 000 EUR | 850 EUR | 150 EUR |
| ACT08 | Passage à l'éclairage LED dans tous les locaux | 1 530 EUR | 4.7 ans | 9 000 EUR | 7 200 EUR | 1 800 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 2 646 EUR | 2.2 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (36 kWc) | 5 374 EUR | 7.2 ans | 43 200 EUR | 38 880 EUR | 4 320 EUR |
| ACT13 | Remplacement de la chaudière gaz par une pompe à chaleur air/eau | 2 985 EUR | 6.4 ans | 25 500 EUR | 19 125 EUR | 6 375 EUR |

### S26 - Aucune conso saisie (elec=false, gaz=false)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 300 m2 |
| Chauffage | gas |
| Age | 2001_2012 |
| **Score** | **A** |
| Intensite site | 0 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | -100% |
| Cout annuel estime | 0 EUR/an |
| Confiance | Moyen |
| CO2 total | 0 kgCO2/an |
| Economies estimees | 0 EUR/an (0%) |

**Actions : Aucune (filtrees ou budget trop faible)**

### S27 - Tous travaux deja realises (0 action attendue)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 400 m2 |
| Chauffage | gas |
| Age | 2001_2012 |
| **Score** | **D** |
| Intensite site | 200 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | +48% |
| Cout annuel estime | 11 280 EUR/an |
| Confiance | Fort |
| CO2 total | 13 720 kgCO2/an |
| Economies estimees | 4 744 EUR/an (27%) |

**Actions recommandees (3) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT04 | Entretien du chauffage pour qu'il consomme moins | 380 EUR | 6.6 ans | 2 500 EUR | 2 500 EUR | 0 EUR |
| ACT19 | Rafraîchissement naturel par ventilation nocturne | 265 EUR | 7.5 ans | 2 000 EUR | 2 000 EUR | 0 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (26 kWc) | 3 881 EUR | 7.2 ans | 31 200 EUR | 28 080 EUR | 3 120 EUR |

### S28 - Restaurant gastronomique ancien (250m2)

| Parametre | Valeur |
|---|---|
| Activite | restaurant |
| Surface | 250 m2 |
| Chauffage | gas |
| Age | pre1975 |
| **Score** | **E** |
| Intensite site | 620 kWh/m2/an |
| Mediane sectorielle | 270 kWh/m2/an |
| Ecart mediane | +130% |
| Cout annuel estime | 22 020 EUR/an |
| Confiance | Fort |
| CO2 total | 26 305 kgCO2/an |
| Economies estimees | 7 806 EUR/an (44%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT01 | Réglage horaires et abaissement chauffage | 800 EUR | 0.6 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT03 | Robinets thermostatiques (zonage) | 667 EUR | 1.1 ans | 850 EUR | 723 EUR | 128 EUR |
| ACT11 | Isolation du ballon d'eau chaude | 431 EUR | 1.1 ans | 500 EUR | 475 EUR | 25 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 3 964 EUR | 1.5 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |
| ACT18 | Chauffe-eau thermodynamique (eau chaude haute performance) | 1 419 EUR | 2.7 ans | 4 500 EUR | 3 825 EUR | 675 EUR |
| ACT20 | Récupération de la chaleur produite par la climatisation | 1 796 EUR | 3.2 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |

### S29 - Immeuble bureaux recent performant (2000m2)

| Parametre | Valeur |
|---|---|
| Activite | offices |
| Surface | 2000 m2 |
| Chauffage | electric |
| Age | post2012 |
| **Score** | **A** |
| Intensite site | 60 kWh/m2/an |
| Mediane sectorielle | 135 kWh/m2/an |
| Ecart mediane | -56% |
| Cout annuel estime | 23 520 EUR/an |
| Confiance | Fort |
| CO2 total | 9 480 kgCO2/an |
| Economies estimees | 15 288 EUR/an (59%) |

**Actions recommandees (5) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT05 | Arrêt automatique de la ventilation en dehors des horaires d'ouverture | 459 EUR | 2.8 ans | 1 500 EUR | 1 275 EUR | 225 EUR |
| ACT11 | Isolation du ballon d'eau chaude | 141 EUR | 3.4 ans | 500 EUR | 475 EUR | 25 EUR |
| ACT19 | Rafraîchissement naturel par ventilation nocturne | 550 EUR | 3.6 ans | 2 000 EUR | 2 000 EUR | 0 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (100 kWc) | 14 928 EUR | 6.6 ans | 105 000 EUR | 99 000 EUR | 6 000 EUR |
| ACT20 | Récupération de la chaleur produite par la climatisation | 588 EUR | 9.8 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |

### S30 - Superette de quartier (150m2)

| Parametre | Valeur |
|---|---|
| Activite | commerce_alim |
| Surface | 150 m2 |
| Chauffage | electric |
| Age | 1975_2000 |
| **Score** | **D** |
| Intensite site | 567 kWh/m2/an |
| Mediane sectorielle | 360 kWh/m2/an |
| Ecart mediane | +57% |
| Cout annuel estime | 16 660 EUR/an |
| Confiance | Fort |
| CO2 total | 6 715 kgCO2/an |
| Economies estimees | 8 896 EUR/an (52%) |

**Actions recommandees (6) :**

| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |
|---|---|---|---|---|---|---|
| ACT08 | Passage à l'éclairage LED dans tous les locaux | 2 124 EUR | 1.7 ans | 4 500 EUR | 3 600 EUR | 900 EUR |
| ACT09 | Éclairage automatique par détection de présence | 885 EUR | 2.5 ans | 3 000 EUR | 2 250 EUR | 750 EUR |
| ACT01 | Réglage horaires et abaissement chauffage | 240 EUR | 2.1 ans | 500 EUR | 500 EUR | 0 EUR |
| ACT14 | Gestion automatisée / Supervision centralisée | 2 999 EUR | 1.9 ans | 8 000 EUR | 5 760 EUR | 2 240 EUR |
| ACT22 | Panneaux solaires pour produire votre propre électricité (18 kWc) | 3 716 EUR | 5.2 ans | 21 600 EUR | 19 440 EUR | 2 160 EUR |
| ACT13 | Remplacement de la chaudière gaz par une pompe à chaleur air/eau | 1 333 EUR | 8.8 ans | 14 250 EUR | 11 685 EUR | 2 565 EUR |