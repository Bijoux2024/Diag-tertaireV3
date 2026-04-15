# Changelog - DiagTertiaire V3

## [v1.6.1 - Fourchette capex +/- 15 %, fallback reseau de chaleur, garde CET > 2000 L] - 2026-04-15

ENGINE_VERSION : 1.6.0 -> 1.6.1

### Corrections consortium (BUG-001 a BUG-007)

- **BUG-001** : `ENGINE_VERSION` passe de `'1.6.0'` a `'1.6.1'` (+ `ENGINE_LAST_UPDATED` 2026-04-15).
- **BUG-002** : ACT18 (CET) reintroduit dans `top_actions`. Retrait de la ligne de filtre inconditionnelle (ACT20 reste exclu). Correction de la regle d'eligibilite qui excluait a tort les cas `ecsSameSystem && mainHeating !== 'pac'`. ACT20 est desormais retire AVANT la selection top 3 heavy pour preserver les slots.
- **BUG-003 + exigence fourchette +/- 15 %** : refonte des tiers ACT13 et ACT18. Nouvelle structure `{ power_kw|volume_l, capex_low, capex_mid, capex_high, capex }` avec `capex_low = round(mid x 0.85)` et `capex_high = round(mid x 1.15)`. `capex = capex_mid` (retro-compat ROI). Nouveau champ action `capex_range: { low, mid, high, formatted }` pour l'UI (format FR espace insecable, tiret demi-cadratin U+2013 dans la string formatee uniquement).
  - ACT13 PAC air/eau (mid) : 10 kW 15 000 EUR, 20 kW 28 000, 50 kW 62 000, 100 kW 120 000, 200 kW 230 000.
  - ACT18 CET (mid) : 200 L 4 600 EUR, 300 L 5 800, 500 L 9 200, 1 000 L 17 500, 2 000 L 34 000.
- **BUG-004** : suppression du tier 5 000 L / 84 000 EUR. Si le volume calcule depasse 2 000 L, `newDiagnosticComputeCetSizing` retourne desormais une sentinelle `{ needsStudy: true, reason: 'volume_exceeds_max_tier', V_L_raw }`. Le resolveur d'action ACT18 la transforme en action ACT18_STUDY (`capex: null`, `gainKwh: null`, `study_required: true`, `badge: 'Etude technique requise'`).
- **BUG-005** : pour ACT13, si `puissanceKwRaw > 200`, conservation du tier 200 kW mais ajout de `oversized: true` et `badge: 'Hors grille tarifaire - etude dediee'` dans la sortie.
- **BUG-006** : defense en profondeur dans `newDiagnosticComputeCetSizing` : retour `null` immediat si `ecsSource === 'pac'` (meme si `filterAndScoreActions` filtre deja l'action).
- **BUG-007** : fallback reseau de chaleur dans `newDiagnosticResolveEcsSource` et `newDiagnosticResolveHeatSource`. Si `source === 'gas'` et `gasKwh === 0` alors que `networkUsed && mainHeating === 'network'`, lecture de `networkKwh` avec rendement 0.95 (table reseau de chaleur). Pour ECS, la meme logique s'applique a `ecsSystem === 'network_dedicated'`.

### Fichiers modifies

- `src/engine.js` : ENGINE_VERSION 1.6.1, tiers ACT13/ACT18 refondus, `newDiagnosticFormatCapexRange`, `newDiagnosticBuildCapexRange`, ajout `capex_range`/`oversized`/`study_required`/`badge` dans `top_actions[]`, fallback reseau dans les resolveurs, garde V > 2000 L.
- `scripts/qa-runner.js` : baseline engine_version cible V1.6.1, grille capex mise a jour, suppression warning V1.6.1-GAP obsolete sur ACT18, prise en compte sentinelle needsStudy.
- `CHANGELOG.md`, `AI-CONTEXT.md`, `.claude/context/architecture.md` : synchronises.

### Tests

- `node scripts/qa-runner.js` : 30/30 PASS, 0 erreur, 0 warning V1.6.1-GAP.
- `node scripts/qa-network-probe.js` : N1 et N4 resolvent desormais l'ECS via le reseau (BUG-007 leve). N4 depasse 2 000 L et bascule en etude dediee (BUG-004).
- 4 scenarios CLAUDE.md : intensite > 0, actions >= 3, breakdown = 100 %, aucun NaN, ACT18 visible sur Hotel 720 m2, `capex_range` present sur ACT13/ACT18.

## [v1.6.0 - Chiffrage CET + PAC air/eau dynamique (facture-based)] - 2026-04-14

ENGINE_VERSION : 1.5.3 -> 1.6.0

### Refonte chiffrage

**Capex CET (ACT18) et PAC air/eau (ACT13) entierement dynamiques** : les capex sont desormais derives de la facture energetique reelle et de tiers commerciaux, plus aucune valeur forfaitaire (fini les `capex_med: 4500` et les tranches de surface arbitraires).

- **Resolveur central** dans `src/engine.js` : toutes les invocations capex CET / PAC air/eau passent par `newDiagnosticComputeCetSizing(data, breakdown)` et `newDiagnosticComputePacEauSizing(data, breakdown)`. Si la source energetique n'est pas declaree dans la facture, le resolveur retourne `null` et l'action est exclue de `topActions`.
- **Methodologie** : conso facturee x part poste (camembert sectoriel reutilise du breakdown existant) x rendement source actuelle (gaz/fioul 0.85, elec Joule 0.95, PAC 2.5), puis ponderation climatique H1/H2/H3 deduit du code postal, enfin tier commercial immediat au-dessus.
- **Tiers CET TTC installe** : 200L/4600 EUR, 300L/5800, 500L/9200, 1000L/17500, 2000L/34000, 5000L/84000.
- **Tiers PAC air/eau TTC installe** : 10kW/17800, 20kW/29000, 50kW/64000, 100kW/122000, 200kW/232000.
- **Pas de plancher/plafond de securite** : la facture est la source de verite.

### Fichiers modifies

- `src/engine.js` (ENGINE_VERSION 1.6.0)
  - Nouvelles constantes : `NEW_DIAGNOSTIC_CET_TIERS`, `NEW_DIAGNOSTIC_PAC_EAU_TIERS`, `NEW_DIAGNOSTIC_RENDEMENT_SOURCE`, `NEW_DIAGNOSTIC_CLIMAT_ZONES_H1`, `NEW_DIAGNOSTIC_CLIMAT_ZONES_H3`
  - Nouvelles fonctions : `newDiagnosticResolveEcsSource`, `newDiagnosticResolveHeatSource`, `newDiagnosticResolveClimatZone`, `newDiagnosticComputeCetSizing`, `newDiagnosticComputePacEauSizing`
  - Suppressions : `newDiagnosticEstimateRooms`, `newDiagnosticComputeCetCapex` (remplacees par le resolveur central, aucun autre callsite)
  - Fiche ACT18 : suppression `capex_low/med/high` hardcodes, conservation de `capex_method: 'cet_sized'`
  - Bascules ACT13 (gaz/fioul -> elec, convecteurs -> PAC) : remplacement des formules de surface par le sizing PAC
  - Bascules ACT18 (gaz -> CET, ballon elec -> CET) : remplacement du capex forfaitaire par le sizing CET
  - Branche standard `capex_method === 'pac_tranches'` / `'cet_sized'` : routee vers le resolveur central
  - Filtrage `newDiagnosticFilterAndScoreActions` : exclusion des actions dont `calculateActionGain` retourne `null`
  - Payload `newDiagnosticBuildReportData` : ajout du champ `engine_version` pour invalidation cache
- `diagnostic.html` : invalidation du cache `newDiagnosticLatestReport` si `engine_version` != `ENGINE_VERSION` courant

### Bug corrige

- Hotel 720 m² affichait un capex CET de 4500 EUR (fallback hardcode de la fiche ACT18). Avec le resolveur dynamique, le capex reflete desormais le volume de ballon reellement necessaire d'apres la facture et tombe sur le tier commercial approprie (typiquement 1000-2000L pour ce profil, soit 17500-34000 EUR).

## [v1.5.3 - Retrait inconditionnel ACT18 + ACT20] - 2026-04-14

ENGINE_VERSION : 1.5.2 -> 1.5.3

### Corrections

**Retrait systematique ACT18 (chauffe-eau thermodynamique) et ACT20 (recuperation chaleur clim)** : ces deux actions ne doivent plus jamais apparaitre dans le plan d'actions. La PAC air/eau reste la seule solution ECS proposee cote moteur, le partenaire precise les alternatives pertinentes au cas par cas.

- `src/engine.js` L1889-1892 : filtre unconditionnel apres `topActions = [...lightActions, ...heavyActions]`. L'ancienne logique conditionnelle (retrait uniquement si ACT13 retenue) laissait passer ACT18/ACT20 lorsque ACT13 etait ecartee (tout elec, ROI > 10 ans, eligibilite).
- `diagnostic.html` L9109-9112 : invalidation du cache `newDiagnosticLatestReport` si le payload stocke contient encore ACT18 ou ACT20 (force un recalcul propre cote front).

Code potentiellement mort a nettoyer apres validation : branches `cetAction` (L1256-1260 `newDiagnosticComputeTargetElecKwh`) et `cetAction` helper L692-730 de NEW_DIAGNOSTIC_ACTIONS (fiches ACT18 + ACT20). A conserver tant que la recette preview n'est pas validee.

## [v1.5.2 - Hotfix libelles, capex CET dynamique, cartouche installation] - 2026-04-14

ENGINE_VERSION : 1.5.1 → 1.5.2

### Corrections

**Lot 1.1 - displayName ACT13 dynamique** : le libelle de l'action "Installer une pompe a chaleur" etait toujours "Remplacer la chaudiere gaz par une PAC air/eau" meme en l'absence de chaudiere gaz (ex : fioul, convecteurs elec). Ajout d'un `displayName` calcule au runtime dans la bascule ACT13 :
- combustible fioul : "Remplacer la chaudiere fioul par une pompe a chaleur air/eau"
- combustible gaz + ECS couplee : "Remplacer la chaudiere gaz par une pompe a chaleur air/eau (chauffage et eau chaude)"
- combustible gaz : "Remplacer la chaudiere gaz par une pompe a chaleur air/eau"
- convecteurs electriques : "Remplacer les radiateurs electriques par une pompe a chaleur"

**Lot 1.2 - capex ACT18 (CET) dynamique pour CHR** : le capex forfaitaire 4 500 EUR etait sous-dimensionne pour les hotels, residences et EHPAD. Helpers ajoutes dans `src/engine.js` :
- `newDiagnosticEstimateRooms(activity, surface)` : estimation chambres (surface / 25 a 30 selon typologie)
- `newDiagnosticComputeCetCapex(activity, surface, numberOfRooms)` : capex borne 8 000 - 45 000 EUR pour CHR, 6 000 - 22 000 EUR pour restauration, 8 000 - 30 000 EUR pour sport/piscine/spa, 4 500 EUR par defaut
- Ajout `capex_low` / `capex_high` (+/- 25%) exposes dans `top_actions`
- Fiche ACT18 : `capex_method: 'cet_sized'`

**Lot 2.3 - installation_summary exposee** : helper `newDiagnosticBuildInstallationSummary(formData)` ajoute dans `src/engine.js`. Retourne une phrase decrivant chauffage / ECS / climatisation declares. Expose via `inputs_summary.installation_summary`.

**Lot 3.1 - cartouche "Votre installation declaree"** : insertion d'un encart visuel (fond gris clair, icone maison, titre 14px semi-bold) entre les KPI du header et la synthese rapide dans les 3 rapports :
- `diagnostic.html` (SPA)
- `exemple-rapport.html` (demo marketing, chaine hardcodee)
- `public-report-print.html` (PDF serveur)

**Lot 3.2 - fallback displayName dans les rendus** : `{action.name}` → `{action.displayName || action.name}` dans les 3 fichiers HTML (9 spots au total).

**Docs** : CLAUDE.md mis a jour (chiffres de lignes reels : engine.js 2 821, diagnostic.html 9 608, exemple-rapport.html 11 135, public-report-print.html 2 192 ; 4e scenario test hotel 720m2 convecteurs ajoute). Backlog ENGINE_PRO ouvert pour porter les changements cote espace-professionnel.html.

### Fichiers modifies

- `src/engine.js` (ENGINE_VERSION 1.5.2)
- `diagnostic.html`
- `exemple-rapport.html`
- `public-report-print.html`
- `CLAUDE.md`
- `.claude/context/backlog.md`
- `CHANGELOG.md`

## [v1.5.1 - Corrections moteur post-audit expert] - 2026-04-06

ENGINE_VERSION : 1.5.0 → 1.5.1

### Corrections IMPORTANT (moteur + formulaire)

**W1 - Seuils scoring (simulate30.js)** : La divergence de seuils A-E observee a l'audit etait dans le script de simulation, pas dans la production. `simulate30.js` utilisait 0.85/1.15/1.60 au lieu de 0.90/1.20/1.70. Corrige : le script est desormais aligne sur les seuils de production (`index.html` et `public-report-print.html` etaient deja corrects).

**W2 - ACT13 (PAC) absente pour fioul** : Angle mort corrige. Le filtre eligibilite excluait `mainHeating = 'fuel'` de la PAC. Fix : `fuel` ajoute aux sources eligibles. Gain PAC calcule avec le prix fioul (0.125 EUR/kWh). Label `energy_switch_note` desormais correct ("chaudiere fioul" au lieu de "chaudiere gaz").

**W4 - COP PAC irrealiste sur batiments anciens** : COP fixe a 3.5 remplace par une table modulee par `buildingAge` :
- pre1975 : COP 2.8 (regime haute temperature 70/55, label degrade)
- 1975_2000 : COP 3.0
- 2001_2012 : COP 3.5
- post2012 : COP 4.0
Impact : ROI PAC pre-1975 passe de ~2.6 ans a ~4-5 ans (plus realiste).

**W5 - PAC recommandee a tort (post-2012 tout electrique)** : Garde ajouteee -- `buildingAge = 'post2012' + mainHeating = 'electric'` → ACT13 exclue (RT2012 = systeme electrique performant probable).

**W6 - Reseau de chaleur sans kWh dedie** : Champ reseau de chaleur ajoute dans le formulaire (etape 3 consommations), conditionnel a `mainHeating = 'network'`. Le bloc gaz est masque pour les utilisateurs reseau. Validation mise a jour. Engine.js integre `networkKwh` dans `totalKwh` et le split energetique. PDF synchronise.

**W7-BIS - Distinction convecteur / PAC electrique** :
- Formulaire : option "Electrique" scindee en "Convecteurs / Radiateurs electriques" (`electric_convector`) et "Pompe a chaleur (PAC)" (`electric_pac`)
- Champ optionnel `pacAge` affiche si `electric_pac` (under5 / 5to15 / over15)
- Moteur : `HEATING_TYPE_NORMALIZE` mappe les nouvelles valeurs vers les valeurs internes (`electric_convector → electric`, `electric_pac → pac`)
- ACT13 exclue si `electric_pac` (PAC existante) sauf `pacAge = over15` (remplacement PAC vieillissante)
- ACT18 (CET) exclue si ECS = `heat_pump` (CET deja installe) ou PAC double service
- ACT04 (entretien chaudiere) exclue pour `pac` (sans objet)
- Backward compat : `mainHeating = 'electric'` (anciens diagnostics) auto-remapping vers `electric_convector` au chargement du formulaire
- `HEATING_LABELS` et `newDiagnosticGetHeatingLabel()` ajoutes dans `index.html`

### Fichiers modifies

- `src/engine.js` (ENGINE_VERSION 1.5.1)
- `index.html`
- `public-report-print.html`
- `scripts/simulate30.js`
- `CHANGELOG.md`

---

## [Audit PDF - anti-coupure + sync] - 2026-04-05

### Corrections critiques (public-report-print.html)

- **TIER_CONF** : ajout des cles `light` et `heavy` (moteur engine.js). Tous les badges d'action affichaient "Equipement" en fallback — desormais "Action rapide" (light, vert) et "Investissement" (heavy, ambre).
- **Budget recap** : `breakInside: 'avoid'` inline sur le conteneur 4-cells du budget global. La cascade CSS (`.budget-row { break-inside: auto }` apres `.pba`) annulait la protection — corrige par style inline prioritaire.
- **Section-summary projection** : meme correction `breakInside: 'avoid'` inline (meme bug de cascade).
- **CTA "Prochaine etape"** : ajout `className="pba"` sur le wrapper externe du bloc gradient bleu. Seul le titre interne etait protege — les bullets et proof line pouvaient se retrouver sur une page differente.

### Corrections importantes (public-report-print.html)

- **Signal de pret Puppeteer** : ajout d'une garde `hasProjectionChart = top_actions.length > 0` avant le polling SVG. Evite 2.4s d'attente inutile quand 0 actions (pas de graphique dans le DOM).
- **Positionnement sectoriel** : regroupement des 3 children (gapText + jauge + source) dans un div unique — devient `firstChild` dans `section-start (.pba)`. La jauge ne peut plus etre separee du titre.
- **Footer anti-veuve** : `breakBefore: 'avoid'` sur le footer pour empecher qu'il se retrouve seul en tete de page.
- **Grid hypotheses/limites** : `breakInside: 'avoid'` inline sur `.cols-2` pour maintenir les 2 colonnes sur la meme page.
- **Section wrapper** : `overflow: 'hidden'` -> `overflow: 'visible'` pour eviter le clipping Chromium/Puppeteer aux bords de page. La barre gradient du titre conserve son `borderRadius` via une propriete directe.

### Ameliorations (public-report-print.html)

- **CO2 equivalence km** : ajout de la 3eme equivalence (km voiture evites / an, facteur 0,193 kg/km ADEME). Synchronisation avec `newDiagnosticGetCO2Equivalences` de index.html.
- **Typographie** : labels hero mini-KPIs `7.5px` -> `8.5px`, labels Decret Tertiaire `7.5px` -> `8.5px`. Seuil minimum lisible a l'impression (6pt = 8px CSS).

### Fichiers modifies

- `public-report-print.html`
- `CHANGELOG.md`

## [Audit post-refonte formulaire] - 2026-04-05

### Regressions corrigees dans engine.js

- **Lead scoring - hScore** : ajout des nouvelles valeurs de decisionHorizon (`6months`, `1year`, `later`) qui tombaient sur le fallback 8 au lieu de 24/16/8 attendus. Backward compat : anciennes valeurs (`3to6months`, `6to12months`, `over1year`) conservees.
- **Lead scoring - oScore** : ajout de `compliance` (= 9, alias de `comply_regulation`) et `valorization` (= 7, alias de `valorise_asset`) introduits par la refonte. Backward compat : anciennes valeurs conservees.
- **inputs_summary** : correction des references vers les anciens noms de champs (`primaryGoal` -> `projectObjective`, `projectHorizon` -> `decisionHorizon`, `decisionRole` -> `role` avec fallback backward-compat). Ces champs etaient `null` pour tous les nouveaux diagnostics depuis la refonte.
- **buildingAge fallback** : `'2006_2012'` remplace par `'post2012'` (la valeur n'existait plus dans les 4 nouvelles tranches).

### Corrections visuelles dans index.html

- **Stepper** : label etape 5 corrige de "Rapport" -> "Contact" (l'etape 5 est le formulaire de contact, le rapport est genere apres).
- **Toggle climatisation** : couleur active corrigee de vert (`#16A34A`) vers bleu (`#1D4ED8`) pour etre coherent avec tous les autres toggles du formulaire.
- **Boutons Step3** : fleches `←` / `→` supprimees sur les boutons Retour/Continuer pour harmoniser avec les etapes 1, 2, 4 et 5.

### Enrichissement payload Supabase (index.html)

- `newDiagnosticBuildDiagnosticLeadPayload` - correction des anciens noms de champs (`primaryGoal`, `projectHorizon`) vers les nouveaux avec fallback.
- `raw_payload` : ajout de `budget_range`, `works_done`, `decision_horizon`, `is_decision_maker`, `building_age`, `first_name`.

### Ajout mineur

- `DEFAULT_CEILING_HEIGHT` : ajout de `commerce_alim: 3.2` (activite presentante dans ACTIVITIES mais absente du mapping).
- Commentaire DEFAULT_FORM_DATA : `surface` documente comme deplacee en etape 1.

### Fichiers modifies

- `src/engine.js`
- `index.html`
- `CHANGELOG.md`

## [Formulaire 5 etapes] - 2026-04-05

### Refonte formulaire public (4 -> 5 etapes)
- Step1 (Batiment) : activite, adresse, surface, cover image - role retire, surface ajoutee
- Step2 (Equipements) : chauffage, ECS, buildingAge, toiture - surface/ceilingHeight retires, boilerAge conditionnel gaz+fioul, bloc accordeon pour roofInsulation/wallInsulation/VMC/GTB
- Step3 (Consommations) : elec + gaz - champs abonnement retires de l'UI
- Step4 (Projet) : NOUVEAU - travaux, role, objectif, horizon, budgetRange, decideur
- Step5 (Rapport) : NOUVEAU - prenom, email, telephone, societe, RGPD, opt-in
- CTA final : "Generer mon rapport gratuit"
- Stepper mis a jour : 5 etapes avec labels Batiment/Equipements/Consommations/Projet/Rapport

### Nouveau champ budgetRange
- Ajoute dans NEW_DIAGNOSTIC_DEFAULT_FORM_DATA
- Constante NEW_DIAGNOSTIC_BUDGET_RANGES (5 options)
- Transmis au lead scoring (25 pts max)

### buildingAge simplifie (6 -> 4 tranches)
- Synchronise avec engine.js : pre1975, 1975_2000, 2001_2012, post2012

### GA4 tracking mis a jour
- diagnostic_step5_completed ajoute (step_name: contact)
- Labels refactorises : building, equipment, energy, project, contact

### Fichiers modifies
- index.html, exemple-rapport.html (synchronises), ga4.js

## [SEO Phase 2] - 2026-04-03

### Donnees structurees
- Ajout JSON-LD WebSite sur index.html
- Ajout inLanguage: "fr" dans les 3 JSON-LD existants (WebApplication, Article, WebPage)
- Ajout BreadcrumbList JSON-LD sur methode.html et exemple-rapport.html

### Internationalisation
- Ajout hreflang fr + x-default sur les 7 pages publiques

### Maillage interne
- Footer statique enrichi (3 colonnes : DiagTertiaire, Outil, Legal)
- Liens vers pages privees retires de la section Ressources (saaspro, partenaire)
- Lien Espace Pro retire de la nav de methode.html et exemple-rapport.html

### PWA
- Revert site.webmanifest to minimal version (disable PWA install prompt)

### Corrige
- Restauration exemple-rapport.html complet (rapport simule 420 m2 Bordeaux) avec meta SEO conservees
- React passe en production sur exemple-rapport.html

## [SEO] - 2026-04-03

### Performance
- React passe de development a production build (index.html)
- Ajout resource hints : preconnect et dns-prefetch pour unpkg.com et cdn.tailwindcss.com
- Ajout preload pour react.production.min.js et react-dom.production.min.js

### Meta tags
- Ajout og:image et twitter:image sur les 7 pages publiques
- Ajout twitter:title et twitter:description sur methode.html et exemple-rapport.html

### Donnees structurees
- Ajout JSON-LD WebApplication sur index.html
- Ajout JSON-LD Article sur methode.html
- Ajout JSON-LD WebPage sur exemple-rapport.html

### Indexation
- sitemap.xml : suppression /diagnostic (doublon) et /espace-professionnel.html (prive), ajout lastmod
- robots.txt : blocage pages privees (saaspro, pro-alpha, diagnostic.html, public-report-print) et /api/
- vercel.json : ajout X-Robots-Tag noindex sur saaspro, pro-alpha et public-report-print
- diagnostic.html : ajout meta noindex

### Navigation statique
- Nav statique index.html : ajout methode.html, suppression liens vers pages noindex
- Enrichissement du contenu noscript

## [Gouvernance] - 2026-04-02

### Ajoute
- CLAUDE.md a la racine (lu automatiquement par Claude Code)
- .claude/commands/ : fix, feature, check, cleanup (commandes standardisees)
- Regles d'hygiene code : zero code mort, zero doublon, zero orphelin
- Tests moteur obligatoires (3 scenarios de reference)

### Supprime
- api/.claude/commands/ (remplace par les commandes racine)

## [Refactoring] - 2026-04-02

### Extrait
- src/engine.js : moteur de calcul public extrait de index.html (2 420 lignes, source unique)
- src/solar-icons.js : 118 icones SVG Solar extraites de index.html
- index.html reduit de ~11 000 a ~8 700 lignes
- espace-professionnel.html : icones SVG extraites, ENGINE_PRO reste inline (divergence acceptee)

### Modifie
- index.html charge engine.js et solar-icons.js via script tags
- espace-professionnel.html charge solar-icons.js via script tag
- Constantes partagees (BUILDING_AGES, BOILER_AGES, MAX_TOTAL_SAVINGS_PCT) deplacees dans engine.js

## [Nettoyage] - 2026-04-02

### Supprime
- tmp.js, tmp_pdf.js, Note, generate-favicons.mjs (fichiers temporaires)
- .vscode/tasks.json (config msbuild sans rapport)
- docs/RAPPORT-MULTI-AGENTS-EXPERTS.md, docs/WORKFLOW.md (docs obsoletes)
- supabase/migrations/20260315_seed_examples.sql (doublon)
- Doublons .claude dans api/

### Remplace
- diagnostic.html : remplace par redirection vers / (moteur desynchronise)
- methode.html : remplace par page legere dediee (sans moteur)
- exemple-rapport.html : remplace par page legere dediee (sans moteur)

### Ajoute
- AI-CONTEXT.md : documentation pour toutes les IA intervenantes
- .env.example : liste des variables d'environnement
- CHANGELOG.md : suivi des modifications

### Corrige
- Elimination du risque de divergence moteur (suppression des copies)
