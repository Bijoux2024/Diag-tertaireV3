# Action Plan SEO/GEO diag-tertiaire.fr - Index priorisé exécutif

**Score global actuel** : 60/100
**Score cible (toutes phases appliquées)** : 85+/100
**Documents associés** : `AUDIT-REPORT.md` (rapport décisionnel), `AGENT-EXECUTION-PLAN.md` (tâches atomiques exécutables)

---

## Tableau priorisé global

### Critical (à fixer immédiatement, bloquant)

| ID | Titre | Effort | Catégorie | Impact attendu |
|---|---|---|---|---|
| TASK-001 | Étendre robots.txt avec tokens IA explicites | 15 min | technical/geo | Visibilité AI Overviews + ChatGPT Search + Perplexity |
| TASK-002 | Refondre llms.txt (densité factuelle + 11 articles + cleanUrls) | 30 min | geo | Premier fichier lu par LLM, score 22→85/100 |
| TASK-003 | Corriger author Person + sameAs LinkedIn dans BlogPost.astro | 20 min | schema/content | Débloquer rich result Article + signal E-E-A-T Person |
| TASK-004 | Supprimer aggregateRating non vérifiable | 5 min | schema | Évite pénalty Google QRG fake reviews |
| TASK-005 | Corriger cta-pulse infinite (WCAG 2.3.3) | 5 min | visual/a11y | Conformité accessibilité |
| TASK-019 | Créer page pilier /decret-tertiaire (2 500+ mots) | 8 h | content/sxo | Capter keyword 10k+ req/mois (impact SXO maximum) |

**Effort cumulé Critical : ~9,5 h**

---

### High (impact fort, à fixer dans la semaine)

| ID | Titre | Effort | Catégorie | Impact attendu |
|---|---|---|---|---|
| TASK-006 | Ajouter GovernmentService schema (OPERAT/ADEME) | 10 min | schema/geo | Autorité réglementaire + Bing Copilot |
| TASK-007 | Enrichir FAQPage 10 Q&A 130-160 mots | 60 min | schema/geo/content | Citations LLM (AI Overviews + ChatGPT) |
| TASK-009 | Ajouter datePublished + author Article methode | 10 min | schema | Article rich result éligible |
| TASK-010 | @id partagés + sameAs + SearchAction | 15 min | schema | Knowledge Graph entity fusion |
| TASK-014 | Defer chaîne CDN (Tailwind/React/Recharts/Babel) | 30 min | performance | LCP -0,5 à -1,5s, INP partiellement amélioré |
| TASK-015 | React production build sur espace-pro | 5 min | performance | Bundle ~3x plus léger |
| TASK-016 | HSTS preload (DEMANDER YANNIS - vercel.json) | 10 min | security | Inscription HSTS Preload List |
| TASK-018 | Implémenter IndexNow (DEMANDER YANNIS - api/) | 2 h | technical | Notification temps réel Bing/Yandex |
| TASK-020 | Article guide Déclaration OPERAT step-by-step | 4 h | content/sxo/geo | Capter keyword "déclaration operat" sans concurrence SaaS |
| TASK-021 | Étoffer methode.html (1 200+ mots) | 3 h | content | Thin content corrigé, gain SXO |
| TASK-022 | Enrichir 5 articles blog non conformes Gemini | 4 h | content | Densité factuelle ≥ 3+2 sur 11/11 articles |
| TASK-024 | Bloc "Décret Tertiaire vous concerne" landing | 2 h | sxo | Match intent réglementaire on-page |

**Effort cumulé High : ~16,3 h**

---

### Medium (optimisation, à fixer dans le mois)

| ID | Titre | Effort | Catégorie |
|---|---|---|---|
| TASK-008 | HowTo schema sur methode.html | 10 min | schema |
| TASK-011 | BreadcrumbList sur index.html | 5 min | schema |
| TASK-012 | Corriger logo Organization /blog/ parasité | 2 min | schema |
| TASK-013 | Séparer datePublished/dateModified blog | 15 min | schema |
| TASK-017 | Self-host fonts exemple-rapport | 30 min | performance |
| TASK-023 | Maillage interne articles → pages root | 2 h | content/sxo |
| TASK-025 | Bloc Property Manager dans landing | 1 h | sxo |
| TASK-026 | Couleur CTA cohérente (amber → bleu) | 30 min | brand/visual |
| TASK-027 | Hamburger menu mobile sur /methode | 1 h | mobile UX |
| TASK-029 | SSR/noscript fallback exemple-rapport | 2 h | seo/visual |

**Effort cumulé Medium : ~7,5 h**

---

### Low (backlog, nice-to-have)

| ID | Titre | Effort | Catégorie |
|---|---|---|---|
| TASK-028 | Nettoyer changefreq/priority + lastmod réels sitemap | 30 min | technical |
| TASK-030 | font-size mobile 15→16px | 5 min | a11y |
| TASK-LOW | Corrections mineures (will-change, path bic, noscript, contactPoint, preconnect) | 30 min | divers |

**Effort cumulé Low : ~1 h**

---

## Effort total et phasing

| Priorité | Effort | Cumul |
|---|---|---|
| Critical | 9,5 h | 9,5 h |
| High | 16,3 h | 25,8 h |
| Medium | 7,5 h | 33,3 h |
| Low | 1 h | 34,3 h |

**Total** : ~34 heures de travail effectif (hors pré-compilation JSX qui demanderait 1-2 j supplémentaires si on retire Babel Standalone).

---

## Roadmap par phase

### Phase 1 - Quick wins (1-2 jours, ~80 min effort)

Tâches : `TASK-001`, `TASK-002`, `TASK-003`, `TASK-004`, `TASK-005`

**Sortie** : score global +6 points (60→66), visibilité IA débloquée.

### Phase 2 - Schema/GEO (2-3 jours, ~3 h effort)

Tâches : `TASK-006` à `TASK-013`

**Sortie** : score Schema 54→78, score GEO 44→62. Page methode et blog enrichis sur le plan structurel.

### Phase 3 - Performance/Security (1 semaine, ~3 h effort + délai validation HSTS)

Tâches : `TASK-014` à `TASK-018`

**Sortie** : INP -50% sur pages React (sans pré-compilation JSX). Notification Bing/Yandex temps réel via IndexNow.

### Phase 4 - Content pillar (1-2 semaines, ~21 h effort)

Tâches : `TASK-019` à `TASK-023`

**Sortie** : capture intent réglementaire ("décret tertiaire", "déclaration operat"), 11 articles blog conformes Gemini, maillage sémantique en place.

### Phase 5 - SXO/Visual/Industriel (3-5 jours, ~7 h effort)

Tâches : `TASK-024` à `TASK-030` + `TASK-LOW`

**Sortie** : intent matching landing, Property Manager visible, mobile UX uniforme, sitemap propre.

---

## Tâches nécessitant validation explicite Yannis

Conformément à CLAUDE.md (fichiers verrouillés sans validation) :

| Tâche | Fichier verrouillé | Raison |
|---|---|---|
| TASK-016 | vercel.json | Ajout `; preload` à HSTS |
| TASK-018 | vercel.json + api/indexnow.js | Création endpoint serverless + variable env |

**Action requise** : avant exécution Phase 3, Yannis confirme l'ouverture de ces 2 fichiers à l'agent applicateur.

---

## Tâches à exclure ou déprioriser

| Tâche | Raison |
|---|---|
| Pré-compilation JSX (refonte Babel Standalone) | Effort 1-2 j, modification architecture buildless. À discuter avec Yannis : gain INP majeur mais risque casse mode `#report=` et flux diagnostic. Hors scope du playbook actuel, à traiter en projet dédié. |
| Drift baseline | Capture après application des correctifs (post Phase 5) pour mesurer les régressions futures, pas avant. |
| Google API setup (CrUX, GSC, GA4) | Hors scope (tier gratuit choisi). À considérer en Phase 6 si besoin de field data. |
| DataForSEO MCP | Hors scope (extension non installée). Utile pour suivi SERP live post-corrections. |

---

## Cross-référence rapport Gemini Pro 2026

| Recommandation Gemini | Adressé par |
|---|---|
| Robots IA optimisés (GPTBot/Google-Extended) | TASK-001 |
| IndexNow | TASK-018 |
| GovernmentService JSON-LD | TASK-006 |
| FAQPage zero-click | TASK-007 |
| Densité factuelle ≥ 3+2 | TASK-022 (5 articles à enrichir), TASK-019 (page pillar), TASK-021 (methode) |
| Maillage sémantique Décret/OPERAT/Secteurs | TASK-019, TASK-020, TASK-023 |
| llms.txt enrichi | TASK-002 |
| INP < 200ms | TASK-014 (palliatif) - solution complète = pré-compilation JSX (hors playbook) |

**Apports propres de cet audit (non couverts par Gemini)** :

- Détection page-type mismatch SXO (TASK-019, TASK-024)
- aggregateRating non vérifiable risque QRG (TASK-004)
- author typé Organization au lieu de Person (TASK-003)
- cta-pulse animation infinite WCAG (TASK-005)
- HSTS sans preload (TASK-016)
- llms.txt URLs non alignées cleanUrls (TASK-002)
- React development build en production (TASK-015)
- Property Manager persona invisible (TASK-025)

---

## Gains attendus par phase (estimations)

| Catégorie | Score actuel | Après Phase 1+2 | Après Phase 3 | Après toutes phases |
|---|---|---|---|---|
| Technical SEO | 62 | 70 | 80 | 88 |
| Content Quality | 61 | 65 | 65 | 85 |
| On-Page SEO | 70 | 75 | 75 | 88 |
| Schema | 54 | 80 | 80 | 88 |
| Performance | 59 | 60 | 72 | 78 |
| AI Search Readiness | 39 | 65 | 65 | 80 |
| Images | 60 | 60 | 60 | 75 |
| **Score global** | **60** | **70** | **74** | **85** |

Note : pour atteindre 90+, il faudrait pré-compiler le JSX (suppression Babel Standalone) et/ou capturer field data Google API pour ajuster Performance et CWV terrain.

---

## Première action recommandée

Commencer par **TASK-001** (robots.txt, 15 min, zéro risque) puis **TASK-002** (llms.txt, 30 min). Ces deux tâches débloquent immédiatement la visibilité IA sans toucher aux fichiers verrouillés ni aux pages produit. Feedback rapide via re-fetch live et validation chez les moteurs IA dans les 24-72h.
