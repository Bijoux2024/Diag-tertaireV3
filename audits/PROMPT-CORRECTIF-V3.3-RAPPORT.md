# PROMPT CORRECTIF V3.3 - AUDIT WORDING RAPPORT (WEB + PDF + ENGINE)

> Ce prompt contient toutes les corrections de wording validees par Yannis pour le rapport de resultats du diagnostic (version web affichee dans index.html, version PDF dans public-report-print.html, et textes du moteur dans src/engine.js).
>
> **Ordre d'execution** : V3 -> V3.1 -> V3.2 -> **V3.3 (ce prompt)**
>
> **Regle d'or** : suivre EXACTEMENT les CHERCHER/REMPLACER ci-dessous. Ne rien inventer. En cas de doute, demander a Yannis.

---

## CONTEXTE CRITIQUE

**Objectif business** : Le rapport de resultats doit rassurer Marc (persona commercant mefiant non-technique) et le pousser a demander NATURELLEMENT une mise en relation avec un expert partenaire.

**Terminologie obligatoire (regle absolue - V3)** :

| Terme interdit | Remplacement |
|---|---|
| pre-diagnostic / diagnostic | comparatif |
| batiment tertiaire / batiment | local professionnel / local |
| ADEME (texte visible) | sources publiques officielles / donnees de reference publiques |
| em dash (tiret cadratin) | tiret simple - |
| ECS | eau chaude |
| PAC | pompe a chaleur |
| VMC | ventilation mecanique |
| GTB | gestion automatisee |
| ROI | rentabilise en X annees / retour sur investissement |
| Decret Tertiaire | obligations reglementaires (decret Tertiaire) |
| CAPEX | couts / investissement |
| audit (texte visible rapport) | analyse detaillee / etude technique |
| Benchmarks | valeurs de reference |

**Regles CLAUDE.md a respecter imperativement** :
- Pas de code mort (supprimer, pas commenter)
- Pas de tiret long
- Moteur engine.js : seuls les textes affiches sont modifies, AUCUN calcul ne doit changer
- Tester 3 scenarios apres modification engine.js

---

## METHODE D'EXECUTION

1. **Lire entierement** CLAUDE.md + AI-CONTEXT.md avant toute modification
2. Pour CHAQUE CHERCHER/REMPLACER, utiliser grep d'abord pour verifier le nombre d'occurrences
3. Si une occurrence est introuvable, STOP et demander a Yannis
4. Si plusieurs occurrences identiques, utiliser plus de contexte pour disambiguer
5. Apres chaque fichier, executer les verifications grep de fin
6. **Aucune modification hors de ce prompt**

---


## PARTIE 1 - index.html : RAPPORT WEB (41 corrections)

### Fichier : `/home/user/Diag-tertaireV3/index.html`

---

### W1 - Badge header rapport (ligne ~7442)

CHERCHER :
```
                                                Rapport pré-diagnostic
```

REMPLACER PAR :
```
                                                Votre comparatif énergétique
```

---

### W2 - Fallback titre hero (ligne ~7455)

CHERCHER :
```
                                            const displayTitle = (!validSn || isFragment) ? (fullAddress || 'Bâtiment diagnostiqué') : sn;
```

REMPLACER PAR :
```
                                            const displayTitle = (!validSn || isFragment) ? (fullAddress || 'Votre local professionnel') : sn;
```

---

### W3 - KPI label ROI (ligne ~7548)

CHERCHER :
```
                                    <HeroKpiCard icon="solar:chart-square-bold" label="ROI indicatif" value={budgetProgram.roi_global_years !== null ? formatYears(budgetProgram.roi_global_years) : 'À confirmer'} sub="Ordre de grandeur à confirmer" tone={{ bg: 'bg-amber-50', text: 'text-amber-700' }} />
```

REMPLACER PAR :
```
                                    <HeroKpiCard icon="solar:chart-square-bold" label="Rentabilité estimée" value={budgetProgram.roi_global_years !== null ? formatYears(budgetProgram.roi_global_years) : 'À confirmer'} sub="Ordre de grandeur à confirmer" tone={{ bg: 'bg-amber-50', text: 'text-amber-700' }} />
```

---

### W4 - Colonne tableau ROI (ligne ~6440)

CHERCHER :
```
                    roi: 'ROI*'
```

REMPLACER PAR :
```
                    roi: "Retour sur l'investissement*"
```

---

### W5 - Budget tile ROI indicatif (ligne ~6447)

CHERCHER :
```
                    roi: 'ROI indicatif'
```

REMPLACER PAR :
```
                    roi: 'Retour estimé en années'
```

---

### W6 - Footnote ROI (ligne ~6450)

CHERCHER :
```
                footnote: '* ROI : temps de retour sur investissement'
```

REMPLACER PAR :
```
                footnote: "* Retour : temps estimé pour rentabiliser l'investissement"
```

---

### W7 - Tier subtitle ROI (ligne ~6041)

CHERCHER :
```
                subtitle: 'Faible investissement · ROI court · sans travaux lourds',
```

REMPLACER PAR :
```
                subtitle: 'Faible investissement · vite rentabilisé · sans travaux lourds',
```

---

### W8 - Action group subtitle (ligne ~7992)

CHERCHER :
```
                                            subtitle="Faible investissement · mise en œuvre simple · ROI rapide"
```

REMPLACER PAR :
```
                                            subtitle="Faible investissement · mise en œuvre simple · vite rentabilisé"
```

---

### W9 - Description plan ROI <= 10 ans (ligne ~7839)

CHERCHER :
```
                            <p className="text-sm text-slate-500 mt-1 mb-6">Actions sélectionnées selon le rapport gain/effort et un ROI ≤ 10 ans.</p>
```

REMPLACER PAR :
```
                            <p className="text-sm text-slate-500 mt-1 mb-6">Actions sélectionnées selon le rapport gain/effort, rentabilisées en 10 ans maximum.</p>
```

---

### W10 - Mobile card ROI label (ligne ~7925)

CHERCHER :
```
                                                    <p className="text-[9px] text-amber-700 font-bold uppercase tracking-wide mb-0.5">ROI</p>
```

REMPLACER PAR :
```
                                                    <p className="text-[9px] text-amber-700 font-bold uppercase tracking-wide mb-0.5">Temps de retour</p>
```

---

### W11 - Desktop header tableau ROI (ligne ~7957)

CHERCHER :
```
                                                                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">ROI</th>
```

REMPLACER PAR :
```
                                                                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">Temps de retour</th>
```

---

### W12 - Carte opportunite complementaire (ligne ~8034)

CHERCHER :
```
                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">ROI indicatif</p>
```

REMPLACER PAR :
```
                                                                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Retour estimé</p>
```

---

### W13 - Equivalence CO2 arbres "sequestration ADEME" (ligne ~8085)

CHERCHER :
```
                                            <p className="text-[10px] text-slate-400 mt-0.5">séquestration ADEME</p>
```

REMPLACER PAR :
```
                                            <p className="text-[10px] text-slate-400 mt-0.5">selon sources publiques officielles</p>
```

---

### W14 - Footer rapport (ligne ~8255)

CHERCHER :
```
                                <span className="text-xs text-slate-600 font-semibold">Pré-diagnostic énergétique · DiagTertiaire</span>
```

REMPLACER PAR :
```
                                <span className="text-xs text-slate-600 font-semibold">Comparatif énergétique · DiagTertiaire</span>
```

---

### W15 - Titre section Decret Tertiaire (ligne ~7745)

CHERCHER :
```
                                            Décret Tertiaire : votre bâtiment est concerné
```

REMPLACER PAR :
```
                                            Obligations réglementaires : votre local est concerné (décret Tertiaire)
```

---

### W16 - Texte Decret Tertiaire (ligne ~7749)

CHERCHER :
```
                                            votre bâtiment est soumis au Décret Tertiaire (dispositif Éco Énergie Tertiaire).
```

REMPLACER PAR :
```
                                            votre local professionnel est soumis à des obligations réglementaires de réduction des consommations (dispositif Éco Énergie Tertiaire, décret Tertiaire).
```

---

### W17 - Texte Decret suite "pré-diagnostic" (ligne ~7764)

CHERCHER :
```
                                            et établir un plan d'actions pour atteindre les objectifs. Ce pré-diagnostic peut servir de base
```

REMPLACER PAR :
```
                                            et établir un plan d'actions pour atteindre les objectifs. Ce comparatif peut servir de base
```

---


### W18 - Label breakdown ECS (ligne ~6550)

CHERCHER (avec contexte suffisant pour disambiguer) :
```
                    ecs: 'ECS'
```

REMPLACER PAR :
```
                    ecs: 'Eau chaude'
```

NOTE : si cette forme ne correspond pas, chercher le mapping label des postes d'usage dans la section `BREAKDOWN_LABELS` ou equivalent, et remplacer `'ECS'` par `'Eau chaude'` uniquement dans l'objet de labels affiches (pas dans les cles).

---

### W19 - Legende camembert ECS (ligne ~7639)

CHERCHER :
```
n: 'ECS'
```

REMPLACER PAR :
```
n: 'Eau chaude'
```

VERIFIER que cette occurrence est bien dans le composant de camembert/donut des usages du rapport (pas dans le moteur).

---

### W20 - Decision card "Diagnostic" (ligne ~7558)

CHERCHER (avec contexte) :
```
                                                title: 'Diagnostic',
```

REMPLACER PAR :
```
                                                title: 'Situation',
```

---

### W21 - Decision card "Risque principal" (ligne ~7559)

CHERCHER :
```
                                                title: 'Risque principal',
```

REMPLACER PAR :
```
                                                title: 'Point de vigilance',
```

---

### W22 - Legende graphique "Situation actuelle" (ligne ~6175)

CHERCHER :
```
                                    name: 'Situation actuelle',
```

REMPLACER PAR :
```
                                    name: 'Si vous ne faites rien',
```

VERIFIER que c'est bien dans le composant graphique de projection financiere du rapport.

---

### W23 - Legende graphique "Actions legeres + travaux" (ligne ~6185)

CHERCHER :
```
                                    name: 'Actions légères + travaux',
```

REMPLACER PAR :
```
                                    name: 'En appliquant ces changements',
```

---

### W24 - Loading 1 (ligne ~8342)

CHERCHER :
```
'Analyse du site en cours…'
```

REMPLACER PAR :
```
'Analyse de votre local en cours…'
```

---

### W25 - Loading 2 (ligne ~8343)

CHERCHER :
```
'Structuration des recommandations…'
```

REMPLACER PAR :
```
'Préparation de vos recommandations…'
```

---

### W26 - Loading 3 (ligne ~8344)

CHERCHER :
```
'Votre rapport est prêt.'
```

REMPLACER PAR :
```
'Votre comparatif est prêt.'
```

---

### W27 - Disclaimer etiquette "diagnostic reglementaire" (ligne ~7540)

CHERCHER :
```
Étiquette estimative relative à votre activité. Elle n'a pas valeur de diagnostic réglementaire.
```

REMPLACER PAR :
```
Étiquette estimative relative à votre activité. Elle n'a pas valeur de diagnostic certifiant.
```

---

### W28 - Disclaimer footer rapport (ligne ~8258)

CHERCHER :
```
Estimations fondées sur données déclaratives et références sectorielles. Non substitutif à un audit réglementaire.
```

REMPLACER PAR :
```
Résultats estimés à partir de vos réponses et de sources publiques officielles. Ce comparatif ne remplace pas un diagnostic certifié.
```

---

### W29 - Titre section hypotheses (ligne ~8224)

CHERCHER :
```
Hypothèses et limites
```

REMPLACER PAR :
```
Comment on a calculé tout ça
```

NOTE : cette chaine peut apparaitre plusieurs fois. Cibler uniquement le titre de section visible dans le rapport (balise h2/h3). Verifier le contexte.

---

### W30 - Sous-titre hypotheses (ligne ~8226)

CHERCHER :
```
Le rapport reste volontairement simple et prudent. Les hypothèses et limites ci-dessous expliquent ce qui soutient le résultat et ce qui reste à confirmer.
```

REMPLACER PAR :
```
Ce comparatif s'appuie sur une méthode transparente. Les précisions ci-dessous vous aident à comprendre la portée des résultats.
```

---

### W31 - Accordion titre 1 (ligne ~8229)

CHERCHER :
```
Hypothèses du calcul
```

REMPLACER PAR :
```
Comment nous calculons
```

---

### W32 - Accordion titre 2 (ligne ~8239)

CHERCHER :
```
Limites de l'approche
```

REMPLACER PAR :
```
Ce que ce comparatif ne couvre pas
```

---

### W33 - Impact titre (ligne ~6453)

CHERCHER :
```
                    impactTitle: 'Impact écologique estimé',
```

REMPLACER PAR :
```
                    impactTitle: 'Votre impact environnemental',
```

---

### W34 - Impact sous-titre (ligne ~6454)

CHERCHER :
```
                    impactSubtitle: "À gains constants, ce plan réduit aussi les émissions liées à l'exploitation du site.",
```

REMPLACER PAR :
```
                    impactSubtitle: "En plus des économies, ces actions réduisent l'empreinte carbone de votre local.",
```

---

### W35 - Label CO2 (ligne ~6455)

CHERCHER :
```
                    co2Label: 'CO2 évité estimé / an',
```

REMPLACER PAR :
```
                    co2Label: 'CO2 en moins chaque année',
```

NOTE : adapter si la casse du CO2 differe (CO₂, CO2, etc.), verifier avec grep avant.

---

### W36 - Hint arbres "equivalent annuel indicatif" (ligne ~6458)

CHERCHER :
```
                    treesHint: 'équivalent annuel indicatif',
```

REMPLACER PAR :
```
                    treesHint: "C'est comme planter autant d'arbres chaque année",
```

---

### W37 - Action vide "cadrage expert" (ligne ~6449)

CHERCHER :
```
Aucune action prioritaire suffisamment robuste ne ressort avec le niveau de données actuel. Un cadrage expert est recommandé avant arbitrage.
```

REMPLACER PAR :
```
Les données fournies ne permettent pas de dégager des actions fiables. Un échange avec un expert vous aidera à y voir plus clair.
```

---

### W38 - Label "Partie prenante" (ligne ~7213)

CHERCHER :
```
'Partie prenante'
```

REMPLACER PAR :
```
'Responsable du site'
```

VERIFIER qu'il s'agit bien du fallback role (ni locataire ni proprietaire) et pas d'un autre usage.

---

### W39 - Source benchmark protection "ADEME" (ligne ~7577)

CHERCHER (forme approximative) :
```
Source : {benchmark.source_ref || 'Références sectorielles'}
```

REMPLACER PAR :
```
Source : {(benchmark.source_ref && !/ADEME/i.test(benchmark.source_ref)) ? benchmark.source_ref : 'Sources publiques officielles'}
```

NOTE : adapter la syntaxe JSX exacte selon le code reel. L'objectif : ne JAMAIS afficher une chaine contenant "ADEME" a l'utilisateur.

---

### W40 - Fallback em dash (lignes ~6736, 6742, 6748, 7862, 7901)

CHERCHER (toutes les occurrences de fallback em dash dans les composants d'affichage d'action) :
```
'—'
```

REMPLACER PAR :
```
'-'
```

**ATTENTION** : utiliser grep d'abord pour lister TOUTES les occurrences du caractere em dash dans index.html. Remplacer UNIQUEMENT les occurrences dans les fallbacks d'affichage du rapport (pas dans les commentaires JS). Commande de verification :
```bash
grep -n '—' /home/user/Diag-tertaireV3/index.html
```

---

### W41 - PV autoconsommation em dash (ligne ~6799)

CHERCHER :
```
— {xxx} kWh valorisés
```

NOTE : cette chaine contient un em dash a remplacer par un tiret simple dans le texte affiche PV. Chercher les 2 occurrences em dash dans la section PV (lignes ~6799 et ~6803) et remplacer par "-".

---


## PARTIE 2 - index.html : FORMULAIRE (11 corrections de coherence)

### Fichier : `/home/user/Diag-tertaireV3/index.html`

---

### F1 - Checkbox GTB (ligne ~3289)

CHERCHER :
```
'GTB / Supervision installée'
```

REMPLACER PAR :
```
'Gestion automatisée / Supervision installée'
```

---

### F2 - Checkbox ECS (ligne ~3290)

CHERCHER :
```
'ECS optimisée (calorifugeage, ballon thermo)'
```

REMPLACER PAR :
```
'Eau chaude optimisée (calorifugeage, ballon thermo)'
```

---

### F3 - Checkbox VMC (ligne ~3291)

CHERCHER :
```
'VMC double flux installée'
```

REMPLACER PAR :
```
'Ventilation mécanique double flux installée'
```

---

### F4 - Objectif Decret Tertiaire (ligne ~3299)

CHERCHER :
```
{ id: 'compliance', label: 'Me mettre en conformité (Décret Tertiaire)', icon: 'solar:document-text-linear' },
```

REMPLACER PAR :
```
{ id: 'compliance', label: 'Me mettre en conformité (obligations réglementaires)', icon: 'solar:document-text-linear' },
```

---

### F5 - Select option PAC (ligne ~5313)

CHERCHER :
```
'PAC thermodynamique'
```

REMPLACER PAR :
```
'Pompe à chaleur thermodynamique'
```

---

### F6 - Validation ECS (ligne ~5185)

CHERCHER :
```
'Veuillez sélectionner le système ECS'
```

REMPLACER PAR :
```
"Veuillez sélectionner le système de production d'eau chaude"
```

---

### F7 - Label VMC batiment (ligne ~5436)

CHERCHER :
```
"Le bâtiment dispose d'une VMC"
```

REMPLACER PAR :
```
"Le local dispose d'une ventilation mécanique"
```

NOTE : adapter si les quotes sont differents (simple/double). Verifier d'abord avec grep.

---

### F8 - Select option VMC (ligne ~5444)

CHERCHER :
```
'-- Type de VMC --'
```

REMPLACER PAR :
```
'-- Type de ventilation --'
```

---

### F9 - Label GTB formulaire (ligne ~5585)

CHERCHER :
```
'GTB / Domotique en place'
```

REMPLACER PAR :
```
'Gestion automatisée / Domotique en place'
```

---

### F10 - Option chauffage PAC (ligne ~5246)

CHERCHER :
```
'Électrique (PAC, convecteurs…)'
```

REMPLACER PAR :
```
'Électrique (pompe à chaleur, convecteurs…)'
```

NOTE : verifier si les trois points sont des vrais ellipsis (…) ou trois points ASCII (...).

---

### F11 - Sous-texte chauffage PAC (ligne ~5288)

CHERCHER :
```
'Chaudière mixte, PAC, ou réseau urbain'
```

REMPLACER PAR :
```
'Chaudière mixte, pompe à chaleur, ou réseau urbain'
```

---


## PARTIE 3 - index.html : CTA & CONVERSION (12 corrections critiques)

### Fichier : `/home/user/Diag-tertaireV3/index.html`

**Objectif** : pousser Marc a demander NATURELLEMENT une mise en relation. Marc a filtre chaque texte. Voici les versions validees.

---

### C1 - CTA principal mise en relation (ligne ~8143)

CHERCHER :
```
Demander un échange
```

REMPLACER PAR :
```
Échanger avec un expert (gratuit)
```

---

### C2 - CTA confirmation demande (ligne ~8209)

CHERCHER :
```
Confirmer ma demande de contact
```

REMPLACER PAR :
```
Oui, je souhaite être contacté
```

---

### C3 - Message succes apres envoi (ligne ~8179, aussi ~6474)

CHERCHER :
```
Votre demande est enregistrée. Nous reviendrons vers vous avec une première orientation adaptée à votre site.
```

REMPLACER PAR :
```
C'est noté ! Un expert vous rappelle sous 48h pour en discuter.
```

---

### C4 - Titre section next step (ligne ~6463)

CHERCHER :
```
                    nextStepTitle: 'Confirmez vos leviers avec un expert',
```

REMPLACER PAR :
```
                    nextStepTitle: 'Un expert peut vous aider à y voir plus clair',
```

---

### C5 - Sous-titre CTA (ligne ~6464)

CHERCHER :
```
                    nextStepIntro: "Chaque bâtiment est différent. Un échange de 20 à 30 minutes avec un professionnel permet de confirmer les actions prioritaires, d'affiner le budget réel et de lancer les premières étapes.",
```

REMPLACER PAR :
```
                    nextStepIntro: "Chaque local est différent. Un coup de fil avec un pro, c'est le meilleur moyen de savoir par où commencer.",
```

---

### C6 - Bullet 1 (ligne ~6466)

CHERCHER :
```
                    nextStepBullet1: 'Confirmer les postes à fort potentiel selon votre configuration réelle.',
```

REMPLACER PAR :
```
                    nextStepBullet1: "Identifier les vraies sources d'économies selon votre situation.",
```

---

### C7 - Bullet 3 (ligne ~6468)

CHERCHER :
```
                    nextStepBullet3: 'Identifier les actions faisables rapidement, sans grands travaux.',
```

REMPLACER PAR :
```
                    nextStepBullet3: 'Savoir ce que vous pouvez faire tout de suite, sans gros travaux.',
```

---

### C8 - Bullet 4 (ligne ~6469)

CHERCHER :
```
                    nextStepBullet4: 'Structurer un plan adapté à votre horizon de décision.',
```

REMPLACER PAR :
```
                    nextStepBullet4: 'Savoir dans quel ordre faire les choses.',
```

---

### C9 - Preuve sous CTA (ligne ~6471)

CHERCHER :
```
                    nextStepProof: "Gratuit, sans engagement. Si vous le souhaitez, votre demande peut être étudiée pour un accompagnement adapté.",
```

REMPLACER PAR :
```
                    nextStepProof: 'Gratuit, sans engagement. Un expert vous rappelle sous 48h pour en discuter.',
```

---

### C10 - Reassurance badge (ligne ~8153)

CHERCHER :
```
Échange adapté à votre situation
```

REMPLACER PAR :
```
Conseils personnalisés pour votre local
```

---

### C11 - Sous le bouton "Gratuit | Sans engagement | Reponse 48h" (ligne ~8211)

CHERCHER :
```
Gratuit | Sans engagement | Réponse sous 48h
```

REMPLACER PAR :
```
Gratuit - Sans engagement - Réponse sous 48h
```

NOTE : verifier si les separateurs sont des pipes `|` ou autre caractere. Cibler la ligne exacte.

---

### C12 - Sous-titre CTA panel (ligne ~8173)

CHERCHER :
```
pour approfondir votre situation
```

REMPLACER PAR :
```
pour identifier vos meilleures économies
```

---


## PARTIE 4 - public-report-print.html : RAPPORT PDF (21 corrections)

### Fichier : `/home/user/Diag-tertaireV3/public-report-print.html`

---

### P1 - Title HTML (ligne ~6)

CHERCHER :
```
<title>DiagTertiaire - Rapport PDF</title>
```

REMPLACER PAR :
```
<title>DiagTertiaire - Comparatif énergétique</title>
```

---

### P2 - Badge hero (ligne ~1089)

CHERCHER :
```
Pré-diagnostic énergétique tertiaire
```

REMPLACER PAR :
```
Comparatif énergétique - local professionnel
```

---

### P3 - Fallback site normalizeSiteDisplay (ligne ~171)

CHERCHER :
```
'Bâtiment diagnostiqué'
```

REMPLACER PAR :
```
'Local professionnel analysé'
```

---

### P4 - Label donut USAGE_KEYS ECS (ligne ~847)

CHERCHER :
```
ecs: 'ECS'
```

REMPLACER PAR :
```
ecs: 'Eau chaude'
```

NOTE : si la forme est differente (objet USAGE_KEYS avec cle `ecs`), cibler uniquement le label affiche.

---

### P5 - Sous-titre donut "profil du batiment" (ligne ~890)

CHERCHER :
```
selon l'activité et le profil du bâtiment
```

REMPLACER PAR :
```
selon l'activité et le profil du local
```

---

### P6 - Disclaimer donut "audit approfondi" (ligne ~931)

CHERCHER :
```
Lecture indicative avant audit approfondi.
```

REMPLACER PAR :
```
Lecture indicative avant analyse détaillée sur site.
```

---

### P7 - Alt image "Photo du batiment" (ligne ~505)

CHERCHER :
```
Photo du bâtiment
```

REMPLACER PAR :
```
Photo du local
```

---

### P8 - Overlay image "Vue du batiment" (ligne ~518)

CHERCHER :
```
Vue du bâtiment
```

REMPLACER PAR :
```
Vue du local
```

---

### P9 - KPI label "Retour sur investissement" (ligne ~1043)

CHERCHER :
```
Retour sur investissement
```

REMPLACER PAR :
```
Rentabilité estimée
```

NOTE : cette chaine peut apparaitre ailleurs. Cibler uniquement le KPI card du hero/synthese du PDF, pas les footnotes.

---

### P10 - Sous-titre plan actions "ROI <= 10 ans + avant audit" (ligne ~1497)

CHERCHER :
```
Actions sélectionnées selon le rapport gain/effort et ROI ≤ 10 ans. Estimations indicatives avant audit.
```

REMPLACER PAR :
```
Actions sélectionnées selon le rapport gain/effort, rentabilisées en 10 ans maximum. Estimations indicatives avant analyse détaillée.
```

---

### P11 - Subtitle light "ROI rapide" (ligne ~1471)

CHERCHER :
```
Faible investissement · mise en œuvre simple · ROI rapide
```

REMPLACER PAR :
```
Faible investissement · mise en œuvre simple · rentabilité rapide
```

---

### P12 - ActionRow label "Retour" (ligne ~610)

CHERCHER (avec contexte) :
```
<div class="action-meta-label">Retour</div>
```

REMPLACER PAR :
```
<div class="action-meta-label">Rentabilisé en</div>
```

NOTE : verifier la classe CSS exacte. L'objectif : renommer le label affiche au-dessus de la valeur "X,X ans" dans chaque ligne d'action du PDF.

---

### P13 - Equivalence CO2 "sequestration ADEME" (ligne ~1561)

CHERCHER :
```
séquestration ADEME
```

REMPLACER PAR :
```
source publique officielle
```

---

### P14 - Section CTA "Chaque batiment est different" (ligne ~1622)

CHERCHER :
```
Chaque bâtiment est différent.
```

REMPLACER PAR :
```
Chaque local est différent.
```

---

### P15 - Limites "Ce pre-diagnostic est indicatif" (ligne ~1723)

CHERCHER :
```
Ce pré-diagnostic est indicatif et non opposable.
```

REMPLACER PAR :
```
Ce comparatif est indicatif et non opposable.
```

---

### P16 - Footer ligne 1 (ligne ~1751)

CHERCHER :
```
Pré-diagnostic énergétique indicatif · Lecture selon activité déclarée
```

REMPLACER PAR :
```
Comparatif énergétique indicatif · Lecture selon activité déclarée
```

---

### P17 - Footer ligne 2 "audit certifie RGE" (ligne ~1753)

CHERCHER :
```
Pour un audit certifié, contactez un bureau d'études RGE agréé. Ce document est à usage informatif.
```

REMPLACER PAR :
```
Pour une analyse certifiée, rapprochez-vous d'un bureau d'études qualifié. Ce document est à usage informatif.
```

---

### P18 - Tiret long fallback gain (ligne ~619)

CHERCHER :
```
'—'
```

REMPLACER PAR :
```
'-'
```

NOTE : cibler le fallback de valeur null dans la section PV/actions du PDF. Utiliser grep pour lister toutes les occurrences de em dash et les remplacer uniquement dans les fallbacks d'affichage.

---

### P19 - Tiret long CTA "sans engagement" (ligne ~1668)

CHERCHER :
```
Gratuit, sans engagement — échange confidentiel
```

REMPLACER PAR :
```
Gratuit, sans engagement - échange confidentiel
```

---

### P20 - Card titre "Diagnostic" (ligne ~1261)

CHERCHER :
```
>Diagnostic<
```

REMPLACER PAR :
```
>Analyse<
```

NOTE : cibler uniquement le titre de la card "Diagnostic" dans la section decision readout. Verifier le contexte pour ne pas toucher d'autres occurrences de "Diagnostic".

---

### P21 - Protection source_ref benchmark affiche (ligne ~1383)

CHERCHER (forme approximative) :
```
Source : ${bench.source_ref}
```

REMPLACER PAR :
```
Source : ${bench.source_ref && !/ADEME/i.test(bench.source_ref) ? bench.source_ref : 'Sources publiques officielles'}
```

NOTE : adapter la syntaxe template literal / interpolation selon le code reel. L'objectif : ne JAMAIS afficher une chaine contenant "ADEME" dans le PDF.

---


## PARTIE 5 - src/engine.js : MOTEUR (37 corrections textuelles)

### Fichier : `/home/user/Diag-tertaireV3/src/engine.js`

**AVERTISSEMENT CRITIQUE** :
- engine.js est marque "ne jamais modifier sans validation explicite" dans CLAUDE.md
- Les modifications ci-dessous sont UNIQUEMENT textuelles (champs `name`, `source_ref`, `assumptions`, `limits`, `aid_detail`, `aid_tags`, fallbacks d'affichage)
- AUCUN calcul ne doit etre modifie
- AUCUNE valeur numerique ne doit etre touchee
- Apres modification, executer les 3 scenarios de test de CLAUDE.md (bureau 500m2, restaurant 200m2, commerce alim 1000m2)
- Chaque test doit retourner : intensity > 0, actions.length >= 3, aucun NaN, breakdown total = 100%

---

### E1 - ACT02 name (ligne ~400)

CHERCHER :
```
            name: 'Régulation centrale chauffage (sonde + programmation)',
```

REMPLACER PAR :
```
            name: 'Pilotage automatique du chauffage',
```

---

### E2 - ACT04 name (ligne ~434)

CHERCHER :
```
            name: 'Désembouage et équilibrage réseau chauffage',
```

REMPLACER PAR :
```
            name: "Entretien du chauffage pour qu'il consomme moins",
```

---

### E3 - ACT05 name (ligne ~451)

CHERCHER :
```
            name: 'Pilotage ventilation / extraction hors service',
```

REMPLACER PAR :
```
            name: "Arrêt automatique de la ventilation en dehors des horaires d'ouverture",
```

---

### E4 - ACT06 name (ligne ~468)

CHERCHER :
```
            name: 'Ventilation asservie présence',
```

REMPLACER PAR :
```
            name: "Ventilation qui s'adapte à la présence dans les locaux",
```

---

### E5 - ACT07 name (ligne ~485)

CHERCHER :
```
            name: 'Ventilation asservie CO2 / humidité',
```

REMPLACER PAR :
```
            name: "Ventilation qui se déclenche quand l'air est saturé",
```

---

### E6 - ACT08 name (ligne ~502)

CHERCHER :
```
            name: 'Relamping LED complet',
```

REMPLACER PAR :
```
            name: "Passage à l'éclairage LED dans tous les locaux",
```

---

### E7 - ACT09 name (ligne ~519)

CHERCHER :
```
            name: 'Éclairage détection présence et zonage',
```

REMPLACER PAR :
```
            name: 'Éclairage automatique par détection de présence',
```

---

### E8 - ACT10 name (ligne ~537)

CHERCHER :
```
            name: 'Calorifugeage conduites ECS',
```

REMPLACER PAR :
```
            name: "Isolation des tuyaux d'eau chaude",
```

---

### E9 - ACT11 name (ligne ~554)

CHERCHER :
```
            name: 'Isolation ballon ECS',
```

REMPLACER PAR :
```
            name: "Isolation du ballon d'eau chaude",
```

---

### E10 - ACT13 name (ligne ~571)

CHERCHER :
```
            name: 'Remplacement chaudière gaz par PAC air/eau',
```

REMPLACER PAR :
```
            name: 'Remplacement de la chaudière gaz par une pompe à chaleur air/eau',
```

---

### E11 - ACT14 name (ligne ~590)

CHERCHER :
```
            name: 'Installation GTB / Supervision centralisée',
```

REMPLACER PAR :
```
            name: 'Gestion automatisée / Supervision centralisée',
```

---

### E12 - ACT16 name (ligne ~627)

CHERCHER :
```
            name: 'Isolation thermique murs extérieurs (ITE)',
```

REMPLACER PAR :
```
            name: "Isolation thermique des murs par l'extérieur",
```

---

### E13 - ACT18 name (ligne ~663)

CHERCHER :
```
            name: 'Ballon ECS thermodynamique',
```

REMPLACER PAR :
```
            name: 'Chauffe-eau thermodynamique (eau chaude haute performance)',
```

---

### E14 - ACT19 name (ligne ~681)

CHERCHER :
```
            name: 'Free cooling / Sur-ventilation nocturne',
```

REMPLACER PAR :
```
            name: 'Rafraîchissement naturel par ventilation nocturne',
```

---

### E15 - ACT20 name (ligne ~698)

CHERCHER :
```
            name: 'Récupération chaleur sur groupe froid',
```

REMPLACER PAR :
```
            name: 'Récupération de la chaleur produite par la climatisation',
```

---

### E16 - ACT21 name (ligne ~715)

CHERCHER :
```
            name: 'Comptage intelligent / Sous-comptage',
```

REMPLACER PAR :
```
            name: 'Suivi détaillé de ce qui consomme quoi dans votre local',
```

---

### E17 - ACT22 name (ligne ~732)

CHERCHER :
```
            name: 'Installation photovoltaïque en autoconsommation',
```

REMPLACER PAR :
```
            name: 'Panneaux solaires pour produire votre propre électricité',
```

---


### E18 - energy_switch_note PAC (ligne ~1463)

CHERCHER :
```
`Remplacement chaudière gaz → PAC air/eau COP ${copPac}
```

NOTE : texte complet a remplacer - chercher dans la section `buildEnergySwitchNote` ou equivalent, la chaine qui contient "PAC" et "COP" pour le switch chaudiere->PAC. Reformuler en utilisant "pompe a chaleur", "eau chaude" (si ECS mentionne), et "coefficient de performance" pour COP.

REMPLACEMENT (adapter selon la structure exacte du template literal) :
```
`Remplacement de la chaudière gaz par une pompe à chaleur air/eau (coefficient de performance ${copPac})${ecsAlsoOnGasBoiler ? ' (chauffage + eau chaude)' : ''}. Suppression de ${deltaKwhGaz} kWh gaz, ajout de ${deltaKwhElec} kWh électriques. Gain net : ${gainNet} €/an.`
```

---

### E19 - energy_switch_note convecteurs -> PAC (ligne ~1495)

CHERCHER :
```
`Remplacement convecteurs élec (COP 1) → PAC COP ${copPac}
```

REMPLACER PAR :
```
`Remplacement des convecteurs électriques par une pompe à chaleur (coefficient de performance ${copPac}). Réduction de ${deltaKwhElec} kWh électriques.`
```

NOTE : adapter aux noms de variables exacts dans le code.

---

### E20 - energy_switch_note ECS gaz -> thermodynamique (ligne ~1525)

CHERCHER :
```
`Remplacement ECS gaz → ballon thermodynamique COP ${copCet}
```

REMPLACER PAR :
```
`Remplacement du chauffe-eau gaz par un chauffe-eau thermodynamique (coefficient de performance ${copCet}). Suppression de ${deltaKwhGaz} kWh gaz, ajout de ${deltaKwhElec} kWh électriques.`
```

---

### E21 - energy_switch_note ballon elec -> CET (ligne ~1553)

CHERCHER :
```
`Remplacement ballon élec (COP 1) → CET COP ${copCet}
```

REMPLACER PAR :
```
`Remplacement du ballon électrique classique par un chauffe-eau thermodynamique (coefficient de performance ${copCet}). Réduction de ${deltaKwhElec} kWh électriques.`
```

---

### E22 - PV hypothesis (ligne ~1353)

CHERCHER :
```
`Hypothèse de calcul : productible local ~${prod} kWh/kWc/an, autoconsommation ${autoc} %, surplus valorisé à ${prix} €/kWh.`
```

REMPLACER PAR :
```
`Estimation basée sur l'ensoleillement local (~${prod} kWh produits par kWc installé et par an), avec ${autoc} % d'électricité consommée directement sur place et le surplus revendu à ${prix} €/kWh.`
```

NOTE : adapter aux noms de variables exacts. Il y a aussi une variante ligne ~1366 a corriger de la meme facon.

---

### E23 - Note PV complementaire (ligne ~1861)

CHERCHER :
```
'Le photovoltaïque peut constituer un levier complémentaire à étudier pour réduire une partie des consommations électriques en journée et valoriser le site.'
```

REMPLACER PAR :
```
'Des panneaux solaires pourraient aussi réduire votre facture d\'électricité. Un expert peut évaluer le potentiel de votre toiture gratuitement.'
```

---

### E24 - Assumption 1 "Pre-diagnostic + audit" (ligne ~2314)

CHERCHER :
```
'Pré-diagnostic, non substituable à un audit énergétique réglementaire',
```

REMPLACER PAR :
```
'Comparatif indicatif, non substituable à une étude technique réglementaire',
```

---

### E25 - Assumption 2 "Benchmarks" (ligne ~2315)

CHERCHER :
```
'Benchmarks issus de données publiques statistiques',
```

REMPLACER PAR :
```
'Valeurs de référence issues de sources publiques officielles',
```

---

### E26 - Assumption 5 "ROI" (ligne ~2318)

CHERCHER :
```
'Gains et ROI indicatifs à confirmer avant travaux',
```

REMPLACER PAR :
```
'Gains et délais de rentabilité indicatifs, à confirmer avant travaux',
```

---

### E27 - Limit 4 "anti-surpromesse" (ligne ~2326)

CHERCHER :
```
'Gains cumulés plafonnés à 65% (anti-surpromesse)',
```

REMPLACER PAR :
```
'Gains cumulés plafonnés à 65%',
```

---

### E28 - Limit 5 "CAPEX" (ligne ~2327)

CHERCHER :
```
'CAPEX et aides à confirmer par devis professionnel',
```

REMPLACER PAR :
```
'Coûts et aides à confirmer par un devis professionnel',
```

---

### E29 - Fallback site_name "Batiment tertiaire" (ligne ~2188)

CHERCHER :
```
'Bâtiment tertiaire'
```

REMPLACER PAR :
```
'Local professionnel'
```

---

### E30 - source_ref benchmarks ADEME (lignes 130-178)

Les 8 benchmarks contiennent tous "ADEME" dans leur champ `source_ref`. Remplacer un par un :

#### E30.1 (ligne 130)
CHERCHER :
```
        source_level: 'source_partial', source_ref: 'ADEME ECNA 2022 + OPERAT',
```
REMPLACER PAR :
```
        source_level: 'source_partial', source_ref: 'Données de référence publiques (enquête nationale 2022)',
```

#### E30.2 (ligne 136)
CHERCHER :
```
        source_level: 'source_partial', source_ref: 'ADEME/CEREN 2019 révisé',
```
REMPLACER PAR :
```
        source_level: 'source_partial', source_ref: 'Données de référence publiques (commerce 2019)',
```

#### E30.3 (ligne 142)
CHERCHER :
```
        source_level: 'source_partial', source_ref: 'ADEME (froid alimentaire)',
```
REMPLACER PAR :
```
        source_level: 'source_partial', source_ref: 'Données de référence publiques (froid alimentaire)',
```

#### E30.4 (ligne 148)
CHERCHER :
```
        source_level: 'source_partial', source_ref: 'ADEME Hôtellerie 2024',
```
REMPLACER PAR :
```
        source_level: 'source_partial', source_ref: 'Données de référence publiques (hôtellerie 2024)',
```

#### E30.5 (ligne 154)
CHERCHER :
```
        source_level: 'source_partial', source_ref: 'ADEME HORECA 2024',
```
REMPLACER PAR :
```
        source_level: 'source_partial', source_ref: 'Données de référence publiques (restauration 2024)',
```

#### E30.6 (ligne 160)
CHERCHER :
```
        source_level: 'source_partial', source_ref: 'ADEME/OPERAT (-27% depuis 2010)',
```
REMPLACER PAR :
```
        source_level: 'source_partial', source_ref: 'Données de référence publiques (enseignement, -27% depuis 2010)',
```

#### E30.7 (ligne 172 - logistique, contient "CEREN")
CHERCHER :
```
source_ref: 'CEREN Logistique révisé'
```
REMPLACER PAR :
```
source_ref: 'Données de référence publiques (logistique)'
```

#### E30.8 (ligne 178)
CHERCHER :
```
        source_level: 'source_partial', source_ref: 'ADEME Santé',
```
REMPLACER PAR :
```
        source_level: 'source_partial', source_ref: 'Données de référence publiques (santé)',
```

---


### E31 - source_ref breakdown sectoriel ADEME (lignes ~238-313)

Les `source_ref` de la section `BREAKDOWN_BY_SECTOR` contiennent toutes "ADEME". Remplacer :

CHERCHER (motif recurrent) :
```
source_ref: 'ADEME - Répartition usages bureaux tertiaire',
```
REMPLACER PAR :
```
source_ref: 'Données de référence publiques - répartition usages bureaux',
```

CHERCHER :
```
source_ref: 'ADEME - Hôtellerie',
```
REMPLACER PAR :
```
source_ref: 'Données de référence publiques - hôtellerie',
```

CHERCHER :
```
source_ref: 'ADEME - Restauration commerciale, profil brasserie',
```
REMPLACER PAR :
```
source_ref: 'Données de référence publiques - restauration commerciale',
```

CHERCHER :
```
source_ref: 'ADEME Santé',
```
REMPLACER PAR :
```
source_ref: 'Données de référence publiques - santé',
```

CHERCHER :
```
source_ref: 'ADEME - Établissements scolaires',
```
REMPLACER PAR :
```
source_ref: 'Données de référence publiques - établissements scolaires',
```

NOTE : utiliser grep pour identifier TOUS les `source_ref:` qui commencent par "ADEME" dans engine.js, et les remplacer en preservant le contenu apres "ADEME".

---

### E32 - source_ref_gain actions ADEME (lignes ~394-709)

Les `source_ref_gain` des 22 actions contiennent toutes "ADEME". Strategie : parcourir chaque occurrence et reformuler en remplacant le prefixe "ADEME - " par "Données de référence publiques - ".

Liste des lignes a traiter :

- L.394 : `'ADEME - Réglages chauffage tertiaire'` -> `'Données de référence publiques - réglages chauffage'`
- L.411 : `'ADEME - Régulation centrale'` -> `'Données de référence publiques - régulation centrale'`
- L.412 : `'Retours installateurs + ADEME'` -> `'Retours installateurs + données publiques'`
- L.428 : `'ADEME - Robinets thermostatiques'` -> `'Données de référence publiques - robinets thermostatiques'`
- L.462 : `'ADEME - Ventilation tertiaire / extraction sur plages pilotées'` -> `'Données de référence publiques - ventilation sur plages pilotées'`
- L.479 : `'ADEME - Détection présence ventilation'` -> `'Données de référence publiques - détection présence ventilation'`
- L.480 : `'Estimation sondes + GTB'` -> `'Estimation sondes + gestion automatisée'`
- L.496 : `'ADEME - VAV CO2'` -> `'Données de référence publiques - ventilation à débit variable'`
- L.514 : `'ADEME - LED tertiaire, gains mesurés (plafonné 75%)'` -> `'Données de référence publiques - éclairage LED (gains mesurés, plafonné 75%)'`
- L.531 : `'ADEME - Détection présence éclairage'` -> `'Données de référence publiques - détection présence éclairage'`
- L.548 : `'ADEME - Calorifugeage ECS'` -> `"Données de référence publiques - isolation tuyaux d'eau chaude"`
- L.565 : `'ADEME - Isolation ballons'` -> `'Données de référence publiques - isolation ballons'`
- L.584 : `'ADEME - PAC air/eau vs chaudière gaz'` -> `'Données de référence publiques - pompe à chaleur vs chaudière gaz'`
- L.603 : `'ADEME - GTB tertiaire (gain plafonné 22%, ADEME recommande 12-18% pour GTB seule)'` -> `'Données de référence publiques - gestion automatisée (gain plafonné 22%)'`
- L.621 : `'ADEME - Isolation toiture tertiaire (plafonné 25%)'` -> `'Données de référence publiques - isolation toiture (plafonné 25%)'`
- L.639 : `'ADEME - ITE tertiaire'` -> `"Données de référence publiques - isolation murs par l'extérieur"`
- L.657 : `'ADEME - Menuiseries'` -> `'Données de référence publiques - menuiseries'`
- L.675 : `'ADEME - Chauffe-eau thermodynamique'` -> `'Données de référence publiques - chauffe-eau thermodynamique'`
- L.709 : `'ADEME - Récupération chaleur froid commercial'` -> `'Données de référence publiques - récupération chaleur froid'`

---

### E33 - source_ref_capex "GTB" (lignes 480 + 604)

CHERCHER (ligne 480) :
```
source_level_capex: 'hypothesis', source_ref_capex: 'Estimation sondes + GTB',
```
REMPLACER PAR :
```
source_level_capex: 'hypothesis', source_ref_capex: 'Estimation sondes + gestion automatisée',
```

CHERCHER (ligne 604) :
```
source_level_capex: 'hypothesis', source_ref_capex: 'Estimation intégrateurs GTB',
```
REMPLACER PAR :
```
source_level_capex: 'hypothesis', source_ref_capex: 'Estimation intégrateurs gestion automatisée',
```

---

### E34 - aid_detail PAC + CET (lignes 583 + 674)

CHERCHER (ligne 583) :
```
            aid_detail: 'CEE (fiche BAT-TH-102) ~15-20% + Fonds Chaleur ADEME ~15-25% si ENR. MaPrimeRenov possible petit tertiaire < 1000m2 sous conditions (parcours accompagné). Cumul plafonné 80% HT.',
```
REMPLACER PAR :
```
            aid_detail: "Aides cumulables : certificats d'économies d'énergie (15-20%) + fonds chaleur (15-25%) si énergies renouvelables. Aide rénovation possible pour local < 1000 m2 sous conditions. Cumul plafonné 80% HT.",
```

CHERCHER (ligne 674) :
```
            aid_detail: 'CEE (fiche BAT-TH-148) ~15-20%. Fonds Chaleur ADEME ~15-20% si ENR. MaPrimeRenov possible petit tertiaire < 1000m2. Cumul plafonné 80% HT.',
```
REMPLACER PAR :
```
            aid_detail: "Aides cumulables : certificats d'économies d'énergie (15-20%) + fonds chaleur (15-20%) si énergies renouvelables. Aide rénovation possible pour local < 1000 m2. Cumul plafonné 80% HT.",
```

---

### E35 - aid_detail LED "CAPEX" (ligne ~513)

CHERCHER :
```
            aid_detail: 'CEE (fiche BAT-EQ-127) ~25-30% du CAPEX en 2026 (primes en baisse depuis 2023). TVA 20% (tertiaire).',
```
REMPLACER PAR :
```
            aid_detail: "Certificats d'économies d'énergie : environ 25-30% du coût pris en charge en 2026 (primes en baisse depuis 2023). TVA 20%.",
```

Faire le meme traitement pour les autres `aid_detail` qui contiennent "petit tertiaire" (lignes ~241, 259, 277) : remplacer "petit tertiaire < 1000m2" par "local < 1000 m2".

---

### E36 - aid_tags ADEME (lignes 582, 673)

CHERCHER :
```
            aid_tags: ['CEE', 'Fonds_Chaleur_ADEME', 'MaPrimeRenov_petit_tertiaire'],
```
REMPLACER PAR (2 occurrences) :
```
            aid_tags: ['CEE', 'Fonds_Chaleur', 'MaPrimeRenov_pro'],
```

Faire le meme traitement pour les autres `aid_tags` contenant `MaPrimeRenov_petit_tertiaire` (lignes ~240, 258, 276) : remplacer par `MaPrimeRenov_pro`.

---

### E37 - Em dash dans source_ref et commentaires visibles (lignes 97, 745)

CHERCHER (ligne 97) :
```
source_ref: 'Estimation produit — maintenance annuelle ramenée au kWh'
```
REMPLACER PAR :
```
source_ref: 'Estimation produit - maintenance annuelle ramenée au kWh'
```

CHERCHER (ligne 745) :
```
source_ref_capex: 'Prix marché PV 2025 — 1,20€/Wc installé'
```
REMPLACER PAR :
```
source_ref_capex: 'Prix marché PV 2025 - 1,20€/Wc installé'
```

NOTE : ne pas toucher les em dashes dans les commentaires JS purs (lignes 103-107, 111, 120, 333, etc.) qui ne sont pas visibles par l'utilisateur.

---


## PARTIE 6 - VERIFICATIONS FINALES OBLIGATOIRES

Apres avoir execute TOUTES les modifications ci-dessus, lancer les commandes grep suivantes. Chacune doit retourner **0 resultat** (ou uniquement des resultats dans des commentaires JS purs pour engine.js).

### 6.1 - Terminologie interdite (doit retourner 0)

```bash
# Pre-diagnostic / pré-diagnostic
grep -in "pré-diagnostic\|pre-diagnostic" /home/user/Diag-tertaireV3/index.html /home/user/Diag-tertaireV3/public-report-print.html /home/user/Diag-tertaireV3/src/engine.js

# ROI (hors commentaires et variables internes)
grep -n "ROI" /home/user/Diag-tertaireV3/index.html /home/user/Diag-tertaireV3/public-report-print.html | grep -v "roi_years\|roi_global\|roi:\|roi_\|// "

# ECS (hors commentaires JS)
grep -n "ECS" /home/user/Diag-tertaireV3/index.html /home/user/Diag-tertaireV3/public-report-print.html
grep -n "'ECS'\|\"ECS\"\|name: 'ECS\| ECS \| ECS,\|(ECS)" /home/user/Diag-tertaireV3/src/engine.js

# PAC (hors commentaires et cles internes)
grep -n "PAC" /home/user/Diag-tertaireV3/index.html /home/user/Diag-tertaireV3/public-report-print.html | grep -v "// \|pacAirEau\|copPac\|PAC_"
grep -n "'PAC\|\"PAC\|par PAC\| PAC,\| PAC )" /home/user/Diag-tertaireV3/src/engine.js

# GTB (hors commentaires)
grep -n "GTB" /home/user/Diag-tertaireV3/index.html /home/user/Diag-tertaireV3/public-report-print.html
grep -n "'GTB\|\"GTB\|+ GTB\| GTB " /home/user/Diag-tertaireV3/src/engine.js

# VMC (hors commentaires)
grep -n "VMC" /home/user/Diag-tertaireV3/index.html

# Decret Tertiaire dans UI (doit rester "obligations reglementaires" partout sauf cas W15/W16/F4 ou il est reintroduit entre parentheses)
grep -n "Décret Tertiaire\|Decret Tertiaire" /home/user/Diag-tertaireV3/index.html /home/user/Diag-tertaireV3/public-report-print.html | grep -v "(décret Tertiaire)"

# Batiment tertiaire / batiment
grep -n "Bâtiment tertiaire\|batiment tertiaire" /home/user/Diag-tertaireV3/index.html /home/user/Diag-tertaireV3/public-report-print.html /home/user/Diag-tertaireV3/src/engine.js

# ADEME visible (hors commentaires JS)
grep -n "ADEME" /home/user/Diag-tertaireV3/index.html /home/user/Diag-tertaireV3/public-report-print.html
grep -n "source_ref.*ADEME\|aid_detail.*ADEME\|aid_tags.*ADEME\|ADEME'" /home/user/Diag-tertaireV3/src/engine.js

# CAPEX visible
grep -n "CAPEX" /home/user/Diag-tertaireV3/src/engine.js | grep -v "// "

# Benchmarks
grep -n "Benchmarks" /home/user/Diag-tertaireV3/src/engine.js

# Audit (texte visible rapport)
grep -n "audit réglementaire\|audit approfondi\|audit certifié\|avant audit" /home/user/Diag-tertaireV3/index.html /home/user/Diag-tertaireV3/public-report-print.html

# Em dash dans strings (doit rester uniquement dans commentaires JS d'engine.js)
grep -n "—" /home/user/Diag-tertaireV3/index.html /home/user/Diag-tertaireV3/public-report-print.html
```

### 6.2 - Tests moteur engine.js obligatoires

Dans la console navigateur ou via un script Node, executer les 3 scenarios de CLAUDE.md :

```javascript
// Scenario 1 : Bureau 500m2 tout elec
newDiagnosticBuildReportData({ activity: 'bureau', surface: 500, annualElecKwh: 100000, annualGasKwh: 0, heatingType: 'elec', coolingType: 'elec', dhwType: 'elec', completedActions: [] });

// Scenario 2 : Restaurant 200m2 gaz+elec
newDiagnosticBuildReportData({ activity: 'restauration', surface: 200, annualElecKwh: 40000, annualGasKwh: 30000, heatingType: 'gaz', coolingType: 'elec', dhwType: 'gaz', completedActions: [] });

// Scenario 3 : Commerce alimentaire 1000m2
newDiagnosticBuildReportData({ activity: 'commerce_alim', surface: 1000, annualElecKwh: 200000, annualGasKwh: 50000, heatingType: 'gaz', coolingType: 'elec', dhwType: 'elec', completedActions: [] });
```

Verifier pour chaque scenario :
- `intensity > 0`
- `actions.length >= 3`
- Aucun `NaN` dans le payload
- `breakdown` total = 100% (somme des parts)
- Les `name` des actions ne contiennent plus aucun jargon interdit (ECS, PAC, GTB, etc.)
- Les `assumptions` et `limits` ne contiennent plus "pre-diagnostic", "audit", "ROI", "CAPEX"
- Les `source_ref` ne contiennent plus "ADEME" en texte lisible

### 6.3 - Test visuel du rapport

1. Lancer le diagnostic complet dans index.html (remplir les 4 etapes du formulaire)
2. Verifier le rapport affiche :
   - Aucun terme interdit visible (scroll complet de la page)
   - CTA "Echanger avec un expert (gratuit)" affiche
   - Section "Un expert peut vous aider a y voir plus clair" avec les 4 bullets validees
   - Legende graphique "Si vous ne faites rien" + "En appliquant ces changements"
   - Badge header "Votre comparatif energetique"
   - Footer "Comparatif energetique - DiagTertiaire"
   - Aucun em dash visible

3. Generer un PDF (endpoint de rendu) et verifier :
   - Badge hero "Comparatif energetique - local professionnel"
   - KPI "Rentabilite estimee"
   - Plan d'actions avec labels "Rentabilise en X,X ans"
   - Footer "Comparatif energetique indicatif"
   - Aucun "ADEME", "ECS", "PAC", "GTB", "ROI", "pre-diagnostic", "audit"

---

## PARTIE 7 - HYGIENE FINALE (CLAUDE.md)

Avant de committer, verifier les 5 points d'hygiene :

1. **Zero code mort** : aucun texte remplace laisse en commentaire. Tout est supprime.
2. **Zero doublon** : les labels sont declares une seule fois.
3. **Zero fichier orphelin** : aucun fichier cree n'a ete laisse sans reference.
4. **Zero TODO non documente** : si un remplacement a ete approximatif (ex: W39, W40, P12, P21, E18-E22 qui necessitent adaptation), noter dans `.claude/context/backlog.md` les ajustements restants.
5. **Documentation synchronisee** :
   - Mettre a jour `CHANGELOG.md` avec une section `## [V3.3] - Audit wording rapport`
   - Lister les 110 corrections appliquees par fichier
   - Mentionner le filtrage Persona Marc
   - Noter que le moteur engine.js n'a subi AUCUN changement de calcul

---

## PARTIE 8 - COMMIT

Une fois toutes les verifications passees :

```bash
cd /home/user/Diag-tertaireV3
git add index.html public-report-print.html src/engine.js CHANGELOG.md
git status
git diff --stat
```

Verifier que les seuls fichiers modifies sont : `index.html`, `public-report-print.html`, `src/engine.js`, `CHANGELOG.md`.

Commit :
```
refactor: V3.3 audit wording rapport (web + PDF + engine)

- Supprime jargon technique interdit (ECS, PAC, GTB, VMC, ROI, CAPEX, ADEME) sur 110 occurrences
- Reecrit noms d'actions engine.js en langage non-technique (persona Marc)
- Reformule CTA et section mise en relation pour conversion naturelle
- Protege les source_ref benchmark contre affichage "ADEME"
- Corrige em dashes restants dans fallbacks d'affichage
- Aucun calcul moteur modifie - tests 3 scenarios OK
```

Push vers la branche `claude/update-audit-wording-VHmDp` :
```bash
git push -u origin claude/update-audit-wording-VHmDp
```

---

## RESUME DES MODIFICATIONS

| Fichier | Corrections | Nature |
|---|---|---|
| `index.html` | 64 (41 rapport + 11 formulaire + 12 CTA) | Terminologie + ton conversion |
| `public-report-print.html` | 21 | Terminologie PDF |
| `src/engine.js` | 37 (17 noms d'actions + 20 textes/refs) | Textes affiches uniquement |
| **TOTAL** | **122 corrections** | |

**Aucun calcul moteur n'est modifie. Seuls les textes affiches sont changes.**

---

**FIN DU PROMPT V3.3**

Si une CHERCHER/REMPLACER ne fonctionne pas (occurrence introuvable ou ambigue), STOP et demander a Yannis. Ne pas inventer. Ne pas deviner.
