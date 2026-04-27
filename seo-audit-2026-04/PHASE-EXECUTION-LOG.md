# Phase Execution Log - Audit SEO/GEO 2026-04

> Journal d'execution chronologique des phases du playbook
> `AGENT-EXECUTION-PLAN.md`. Chaque entree liste : taches faites,
> commits associes, validations effectuees, anomalies detectees,
> blocages.

**Score initial** (audit du 2026-04-27) : 60 / 100
**Cible mission** : 85+ / 100

---

## Phase 1 - Quick wins (cloturee 2026-04-27)

**Statut** : 5 commits appliques + pushes en prod, validation curl confirmee.

### Commits

| Hash | Repo | Tache | Note |
|---|---|---|---|
| 2487712 | V3 | TASK-001 feat(seo): directives bots IA dans robots.txt | 8 search-time AI bots autorises, 3 training-only bloques |
| ac86321 | V3 | TASK-002 feat(geo): enrichit llms.txt | Densite factuelle + 11 articles + cleanUrls |
| 523ca7e | V3 | TASK-004 fix(seo): supprime aggregateRating non verifiable | Evite penalty Google QRG |
| 342cfc2 | V3 | TASK-005 fix(a11y): cta-pulse 3 iterations sur diagnostic | WCAG 2.3.3 |
| f905621 -> 14fa18a | blog | TASK-003 fix(seo): author Person + sameAs LinkedIn | Rebase 11 commits remote, hash decale |

### Validations Phase 1

- `curl https://diag-tertiaire.fr/llms.txt` : HTTP 200, 3340 B, 35 lignes, header DiagTertiaire + bloc reglementaire + 11 articles blog OK
- `curl https://diag-tertiaire.fr/robots.txt` : HTTP 200, 839 B, 47 lignes, 8 user-agents IA + 3 training-only OK
- `curl https://diag-tertiaire.fr/blog/reforme-dpe-2026-tertiaire/ | grep '"@type":"Person"'` : 1 occurrence, knowsAbout + sameAs LinkedIn presents

### Anomalies Phase 1

- **Desync repo blog** detectee au push : 11 commits remote inconnus en local. Resolu par `git pull --rebase` (clean, sans conflit). Hash f905621 decale en 14fa18a.
- `.agent/skills/ui-ux-pro-max/` reside untracked (anomalie session IA precedente). Ajoute a `.gitignore` au commit `chore(docs)` du 2026-04-27.

---

## Documents d'audit (commit chore + docs du 2026-04-27)

| Hash | Tache | Description |
|---|---|---|
| 3c6a1a3 | chore(docs) | Versionne 3 livrables d'audit + .gitignore |
| 1c80c73 | docs(seo) | Integre addendum GSC (TASK-031/032/033) |

---

## Phase 2 - Schema / GEO (cloturee 2026-04-27)

**Statut** : 8 commits appliques + pushes en prod (V3 + blog), validation schema.org confirmee.

### Commits

| Hash | Repo | Tache | Type |
|---|---|---|---|
| d68b275 | V3 | TASK-006 feat(seo): GovernmentService schema OPERAT/ADEME | Ajout |
| aa49478 | V3 | TASK-007 feat(geo): FAQPage 5 -> 10 Q&A | Modification |
| c7a5402 | V3 | TASK-008 feat(geo): HowTo schema sur methode (4 etapes) | Ajout |
| 438a36d | V3 | TASK-009 fix(seo): TechArticle datePublished + author Person | Modification |
| e45a9cc | V3 | TASK-010 feat(seo): @id partages + sameAs LinkedIn | Modification |
| 437e666 | V3 | TASK-011 feat(seo): BreadcrumbList sur index.html | Ajout |
| 18c322c -> 664ada6 | blog | TASK-012 fix(seo): logo URL fix (suppression /blog/ parasite) | Modification (rebase) |
| 6bcb48e -> dbb4ae6 | blog | TASK-013 feat(seo): datePublished/dateModified separes | Modification (rebase) |

### Validations Phase 2

#### Validation syntaxique JSON-LD (locale, python json.loads)

| Bloc | Statut |
|---|---|
| GovernmentService (TASK-006) | OK |
| FAQPage 10 Q&A (TASK-007) | OK |
| HowTo (TASK-008) | OK |
| TechArticle datePublished (TASK-009) | OK |
| ProfessionalService @id (TASK-010) | OK |
| WebSite @id (TASK-010) | OK |
| Organization @id + sameAs (TASK-010) | OK |
| BreadcrumbList (TASK-011) | OK |

#### Validation hygiene em-dash (U+2014) / en-dash (U+2013) sur diffs

| TASK | em-dash | en-dash |
|---|---|---|
| 006, 007, 008, 009, 010, 011, 012, 013 | 0 | 0 |

Tous les diffs Phase 2 sont vierges de tirets longs. Conformite CLAUDE.md.

#### Validation propagation prod (curl + grep)

- V3 / : `GovernmentService`, `HowTo`, `#organization`, `#service`, `#website` propages
- V3 /methode : `HowTo` (6 occurrences avec HowToStep + HowToTool), `TechArticle`, `datePublished`, `#author-yannis-cherchali`, `#organization` propages
- Blog /reforme-dpe-2026-tertiaire/ : `"@type":"Person"`, `knowsAbout`, `dateModified`, logo URL clean propages

#### Validation schema.org (validator.schema.org API, post-deploy)

URL testees (2026-04-27) :
- `https://diag-tertiaire.fr/`
- `https://diag-tertiaire.fr/methode`
- `https://diag-tertiaire.fr/exemple-rapport`
- `https://diag-tertiaire.fr/blog/reforme-dpe-2026-tertiaire/`

| URL | Types detectes | Erreurs | Warnings |
|---|---|---|---|
| / | 6 (SoftwareApplication, BreadcrumbList, GovernmentService, WebSite, ProfessionalService, FAQPage) | 2 | 0 |
| /methode | 3 (HowTo, BreadcrumbList, TechArticle) | 0 | 0 |
| /exemple-rapport | 2 (WebPage, BreadcrumbList) | 0 | 0 |
| /blog/<article> | 5 (Organization, BreadcrumbList, Article, BlogPosting, FAQPage) | 0 | 0 |

**Total : 2 erreurs sur 16 entites validees, 0 warning.**

#### Detail des 2 erreurs sur /

Localisation : bloc `ProfessionalService` (`@id` `https://diag-tertiaire.fr/#service`) :

1. `serviceType` = "Diagnostic energetique" : `[UNKNOWN_FIELD]`
2. `inLanguage` = "fr" : `[UNKNOWN_FIELD]`

**Origine** : ces 2 champs sont **legacy** (pre-existant aux commits Phase 2). Le commit TASK-010 e45a9cc a ajoute uniquement `@id` et `parentOrganization`, sans toucher a `serviceType` ni `inLanguage`. Verification via `git show e45a9cc -- index.html`.

**Analyse** :
- `serviceType` : valide sur `Service` selon Schema.org. `ProfessionalService` herite de `Service` donc devrait l'accepter. Le validateur est strict (interpretation : il n'inherit pas dans son ruleset).
- `inLanguage` : valide sur `CreativeWork`, pas sur `Service`. Une vraie erreur structurelle.

**Decision** : pas de fix dans Phase 2 (hors scope TASK-010). A traiter en TASK-LOW ou commit dedie `style: nettoie ProfessionalService legacy fields (inLanguage, serviceType)`. Documente en backlog.

### Choix d'implementation Phase 2 a tracer

1. **TASK-007 FAQPage 79-109 mots vs cible 130-160** : longueurs sous-optimales pour citation LLM. Texte playbook respecte a la lettre. **Backlog Phase 4** : enrichir a 130-160 mots/Q.
2. **TASK-007 divergence DOM/JSON-LD** : DOM 5 questions visibles, JSON-LD 10 questions. Trade-off GEO assume. Aligner DOM = Phase 4 si decide.
3. **TASK-010 SearchAction non ajoute** : blog Astro = 2 routes statiques sans recherche. Eviter de tromper les LLM.
4. **TASK-010 sameAs annuaire-entreprises** : SIREN non fourni. **Backlog Low** : a ajouter quand SIREN connu.
5. **TASK-009 datePublished methode = 2026-04-02** : date reelle de creation (verifiee `git log --diff-filter=A`), pas la date arbitraire 2025-09-15 du playbook.

### Anomalies Phase 2

- **Desync blog au push** : 2 commits remote (`916a881` article + `9908dc1` image hero) committes par Codex/Bijoux2024 sur une base 14fa18a (avant TASK-012/013). Resolu par `git pull --rebase` (clean, sans conflit malgre la zone de modification se chevauchant). Hashes blog decales : 18c322c -> 664ada6, 6bcb48e -> dbb4ae6. Article + image intacts (SHA + tailles verifies).
- **Em-dash legacy** : `index.html:459` aria-label nav-logo. Pre-existant. **Backlog**.
- **2 erreurs schema.org sur /** : legacy ProfessionalService. **Backlog**.

### Scoring projete Phase 2

| Categorie | Avant | Cible Phase 1+2 (ACTION-PLAN) | Atteint estime |
|---|---|---|---|
| Schema | 54 | 80 | ~80 (16/16 valides hors 2 legacy) |
| GEO | 39 | 65 | ~65 (FAQPage etendu + HowTo + Person + autorite GovernmentService) |
| Score global | 60 | 70 | ~70 |

---

## Phase 3 - Performance / Security (en cours)

**Statut** : non demarree.

A venir : TASK-014 (defer CDN), TASK-015 (React prod), TASK-017 (self-host fonts), avec checkpoint Yannis avant TASK-016 (HSTS preload, vercel.json verrouille) et TASK-018 (IndexNow, api/* + vercel.json verrouilles).

---

## Phase 4 - Content pillar (planifiee)

A venir : TASK-019 (decret-tertiaire pillar), TASK-020 (article OPERAT), TASK-021 (etoffer methode), TASK-022 (enrichir 5 articles + FAQPage 130-160 mots), TASK-023 (maillage interne).

---

## Phase 5 - SXO / Visual / Industriel (planifiee)

A venir : TASK-024 a TASK-030, TASK-LOW (corrections mineures groupees + em-dash purge + ProfessionalService legacy fields).

---

## Addendum GSC (planifie)

A venir : TASK-031 (vercel.json trailingSlash, verrouille), TASK-032 (Vercel Dashboard www -> apex, manuel), TASK-033 (audit GSC + GSC-REDIRECT-AUDIT.md, manuel).
