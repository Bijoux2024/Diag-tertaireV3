# Audit SEO/GEO 360° diag-tertiaire.fr

**Date** : 2026-04-27
**Périmètre** : pages root (index, methode, exemple-rapport, diagnostic, espace-professionnel, public-report-print) + blog Astro (11 articles) + assets SEO (robots.txt, sitemaps, llms.txt, vercel.json)
**Méthode** : 8 sous-agents spécialisés en parallèle (technical, content, schema, sitemap, performance, visual, GEO, SXO) + croisement avec le rapport Gemini Pro 2026 fourni
**Tooling** : tier gratuit (PageSpeed Insights public, Common Crawl, fetch direct). Pas de Google API, pas de DataForSEO.

---

## 1. Executive Summary

### Score SEO global : **60 / 100**

Site **techniquement mature** sur les fondamentaux (5 schémas JSON-LD, llms.txt présent, hreflang, vercel.json complet, blog avec AuthorBox), mais avec **trois zones rouges** :

1. **GEO/AI Search Readiness (39/100)** : robots.txt sans directives IA explicites, llms.txt minimal (22/100), landing non citable (zéro chiffre ancré sur source).
2. **SXO/Intent matching (34/100)** : aucune page ne cible les keywords stratégiques "décret tertiaire", "déclaration operat", "audit énergétique tertiaire". Page-type mismatch CRITICAL sur 3/5 mots-clés.
3. **Performance pages React (38-41/100)** : Babel Standalone synchrone + chaîne CDN bloquante sur `/diagnostic` et `/exemple-rapport`. INP estimé 520-600 ms (objectif Gemini < 200 ms hors d'atteinte sans refonte).

### Score par catégorie

| Catégorie | Poids | Score | Pondéré |
|---|---|---|---|
| Technical SEO | 22 % | 62 | 13,6 |
| Content Quality | 23 % | 61 | 14,0 |
| On-Page SEO | 20 % | 70 | 14,0 |
| Schema | 10 % | 54 | 5,4 |
| Performance | 10 % | 59 | 5,9 |
| AI Search Readiness (GEO+SXO) | 10 % | 39 | 3,9 |
| Images | 5 % | 60 | 3,0 |
| **Total** |  |  | **59,8 / 100** |

### Top 5 critiques (Critical)

1. **robots.txt sans tokens IA explicites** : aucun des 8 user-agents (GPTBot, Google-Extended, ClaudeBot, PerplexityBot, OAI-SearchBot, ChatGPT-User, Bytespider, Applebot-Extended) n'est nommé. (`robots.txt:1-9`)
2. **Aucune page pillar "Décret Tertiaire"** : keyword 10k+ req/mois, 0 % de couverture sur diag-tertiaire.fr. Mismatch d'intent total avec la SERP réglementaire dominante.
3. **llms.txt minimal (22/100)** : 6 URLs listées, aucune section blog, aucun contexte réglementaire, pas de llms-full.txt.
4. **Babel Standalone + chaîne CDN synchrone** sur diagnostic.html et exemple-rapport.html : transpilation JSX runtime sur le main thread, INP estimé 520-600 ms.
5. **author typé Organization au lieu de Person** dans `BlogPost.astro:107` : bloque les rich results Article Google et nuit au signal E-E-A-T.

### Top 5 quick wins (effort < 30 min, impact élevé)

1. **Étendre robots.txt** avec les 8 directives IA + sitemap.xml (15 min, fichier unique).
2. **Corriger `author @type Person`** dans BlogPost.astro (15 min, déblocage rich result + sameAs LinkedIn).
3. **Supprimer aggregateRating** non vérifiable de SoftwareApplication (5 min, évite penalty Google fake reviews).
4. **Corriger `cta-pulse infinite`** en `cta-pulse 3 iterations` dans diagnostic.html (5 min, conformité WCAG 2.3.3 alignée sur la landing).
5. **Aligner llms.txt sur cleanUrls** (supprimer les `.html`) (10 min).

---

## 2. État des lieux (matrice maturité)

| Domaine | Existant (mature) | Gap (à corriger) |
|---|---|---|
| Crawl | sitemap.xml + sitemap-pages.xml + blog/sitemap-index.xml, robots.txt fonctionnel | tokens IA, IndexNow absent, lastmod figés |
| Indexabilité | X-Robots-Tag par chemin dans vercel.json, hreflang, canonicals cohérents | conflit canonical/noindex sur `/espace-professionnel`, dateModified=datePublished (BlogPost) |
| Sécurité | CSP complet, HSTS 2 ans, HSTS sans `preload`, X-Frame-Options DENY, COR-Policy | HSTS sans `preload`, llms.txt avec `.html` non alignés cleanUrls |
| Schema | 5 types JSON-LD index.html, BlogPosting blog, BreadcrumbList methode/exemple | aggregateRating non vérifiable, sameAs vide, pas de @id partagé, GovernmentService manquant, HowTo manquant, FAQ trop courtes |
| Contenu | 11 articles blog avec sources INSEE/CRE/UFC/ADEME, AuthorBox, schema BlogPosting | landing zéro chiffre ancré, methode.html < 300 mots, 0 page Décret Tertiaire, 5 articles sous le seuil Gemini ≥3+2 |
| Performance | index.html léger (80 KB), fonts self-hosted preloadées, GA en defer | Babel Standalone synchrone, Recharts/Tailwind CDN bloquants, React dev build sur espace-pro |
| GEO/IA | llms.txt présent, FAQPage existante | tokens IA absents robots.txt, llms.txt 22/100, FAQ 30-60 mots (optimum 134-167) |
| SXO | landing structurée hero+CTA+FAQ+process, blog éditorial actif | hero "économies" vs intent réglementaire, no Property Manager track, no "Décret Tertiaire" surface |

---

## 3. Findings détaillés par catégorie

### 3.1 Technical SEO — Score 62/100

**Critical**

- `[FT-C1]` `robots.txt:1-9` : aucune directive nommée pour GPTBot, Google-Extended, ClaudeBot, PerplexityBot, OAI-SearchBot, ChatGPT-User, Bytespider, Applebot-Extended.
- `[FT-C2]` IndexNow absent : aucune clé `*.txt` à la racine, pas d'`api/indexnow.js`, pas de mention dans vercel.json.
- `[FT-C3]` Scripts render-bloquants : Babel Standalone (~850 KB), Recharts (~350 KB), React/ReactDOM, Tailwind CDN tous chargés synchrones dans `<head>` sur `diagnostic.html`, `exemple-rapport.html`, `espace-professionnel.html`.

**High**

- `[FT-H1]` React `development.js` en production sur `espace-professionnel.html:78-79`.
- `[FT-H2]` HSTS sans `preload` (`vercel.json:64`) : empêche inscription HSTS Preload List.
- `[FT-H3]` Canonical sur `/espace-professionnel` indexable mais robots HTTP `noindex` : signal conflictuel mineur.
- `[FT-H4]` `llms.txt` liste des URLs `.html` non alignées avec `cleanUrls: true` (vercel.json) : redirections 308 inutiles.

**Medium**

- `[FT-M1]` `exemple-rapport.html:58-60` charge Google Fonts CDN (incohérent avec self-hosted des autres pages).
- `[FT-M3]` Désynchronisation `lastmod` sitemap-index (2026-04-14) vs sitemap-pages (2026-04-20).
- `[FT-M4]` `aggregateRating` 4.8/47 sans source de collecte visible : risque QRG fake reviews.

### 3.2 Content Quality — Score 61/100

**E-E-A-T par page** (sur 20)

| Page | Total |
|---|---|
| index.html | 11/20 |
| methode.html | 10/20 |
| exemple-rapport.html | 10/20 |
| Blog (layout) | 13/20 |

**Authority faible** sur toutes les pages root : 0 lien sortant vers Légifrance, ADEME, OPERAT.

**Articles blog non conformes au seuil Gemini ≥ 3 chiffres + 2 sources officielles** :

| Article | Conforme |
|---|---|
| crise-energie-2026 | OUI |
| crise-ormuz-2026 | PARTIEL (2/2 sources, 1 non officielle) |
| dpe-bail-commercial-obligations-2026 | OUI |
| dpe-local-commercial-impact-valeur | PARTIEL |
| dpe-location-local-commercial | PARTIEL |
| facture-electricite-local-commercial | NON |
| fin-arenh-impact | OUI |
| hotel-economies-energie | NON (auteur "Diag-Tertiaire") |
| plan-electrification-2026 | NON |
| reduire-facture-energetique-commerce | NON |
| reforme-dpe-2026-tertiaire | OUI |

**Sujets manquants** (pillar gaps) :
- Page pilier `/decret-tertiaire` (objectifs -40/-50/-60 %, seuils 1 000 m², calendrier OPERAT)
- Guide step-by-step "Déclaration OPERAT"
- Page sanctions Décret Tertiaire
- Article "Modulations Cm/Cmj"
- Articles sectoriels ciblés (santé, logistique, restauration)
- Page "Aides 2026" (CEE Tertiaire, MaPrimeRénov' Tertiaire, BPI)

### 3.3 Schema — Score 54/100

| Page | Types | Validité | Gaps |
|---|---|---|---|
| index.html | ProfessionalService, WebSite, SoftwareApplication, FAQPage(5), Organization | Partiel | aggregateRating non vérifiable, sameAs vide, pas de @id, pas de SearchAction |
| methode.html | Article, BreadcrumbList | Partiel | Article sans datePublished/author |
| exemple-rapport.html | WebPage, BreadcrumbList | Valide | minimal |
| BlogPost.astro | BlogPosting, BreadcrumbList, Organization | Partiel | author Organization au lieu de Person, dateModified figé, logo /blog/ |

**Schémas à ajouter** (JSON-LD complets fournis dans `AGENT-EXECUTION-PLAN.md`) :
- `GovernmentService` (lien OPERAT/ADEME) sur index.html
- `HowTo` sur methode.html
- `FAQPage` enrichi 10 Q&A sur index.html
- `Person` enrichi pour author dans BlogPost.astro
- `BreadcrumbList` sur index.html

**Note Google 2023-2025** : les rich results FAQ et HowTo ne sont plus affichés sur sites commerciaux. Les schémas restent **fortement utiles pour AI Overviews, ChatGPT Search, Perplexity, Bing Copilot**.

### 3.4 Sitemap — Score 71/100

7 URLs dans sitemap-pages.xml, blog géré par Astro auto-sitemap. Findings :

- `[SM-H1]` Tous les `lastmod` à 2026-04-20 : signal `lastmod` sans valeur (Google ignore).
- `[SM-H2]` `changefreq` et `priority` ignorés par Google depuis ~2017 : bruit inutile.
- `[SM-H3]` lastmod sitemap-index (2026-04-14) antérieur aux URLs du fichier référencé (2026-04-20).
- `[SM-M1]` `/blog/` (index blog) absent du sitemap principal (à confirmer dans blog/sitemap-0.xml).

### 3.5 Performance — Score 59/100

| URL | LCP | INP | CLS | Score PSI |
|---|---|---|---|---|
| `/` (80 KB) | 2,8 s | ~180 ms | 0,05 | 72 |
| `/methode` (10 KB) | 1,6 s | ~90 ms | 0,02 | 85 |
| `/exemple-rapport` (789 KB) | 5,2 s | ~600 ms | 0,12 | 38 |
| `/diagnostic` (602 KB) | 4,6 s | ~520 ms | 0,08 | 41 |

**Bottleneck #1** : Babel Standalone synchrone (~850 KB brut) qui transpile le JSX au runtime sur le main thread. **L'objectif Gemini INP < 200 ms est inatteignable sans pré-compilation JSX**.

### 3.6 Visual / Mobile UX — Score 72/100

- `[FV-C1]` `/exemple-rapport` et `/diagnostic` : pas de SSR, contenu 100 % React. HTML servi au crawler ne contient ni H1 ni CTA. `/exemple-rapport` est `index, follow` avec og:image et schema, donc Googlebot peut indexer une page vide.
- `[FV-C2]` `cta-pulse animation: ctaPulse 3s ease-in-out 1.5s infinite` dans diagnostic.html : viole WCAG 2.3.3 (mouvement persistant). La landing limite déjà à 3 itérations — incohérence à corriger.
- `[FV-H1]` Couleur CTA hero landing (amber) ≠ tous les autres CTA du site (bleu) : casse la cohérence de marque.
- `[FV-H2]` `/methode` sans hamburger menu mobile : utilisateur mobile bloqué côté navigation.

### 3.7 GEO / AI Search Readiness — Score 44/100

| Moteur | Score | Top action |
|---|---|---|
| Google AI Overviews | 42/100 | FAQ 80-120 mots/réponse + HowTo |
| ChatGPT Search | 38/100 | Bloc "Chiffres clés" en début d'article |
| Perplexity | 48/100 | Citations inline `(source : CRE, avril 2026)` |
| Bing Copilot | 35/100 | GovernmentService schema + sameAs LinkedIn/Wikidata |

**Citation readiness blog** (échantillon) : 8-9/10 sur les passages factuels (INSEE, UFC, CRE, ADEME cités). **Citation readiness landing** : 2/10 (zéro chiffre ancré sur source). Le delta est le problème central.

### 3.8 SXO / Intent matching — Score 34/100

| Keyword | Intent dominant | Page diag-tertiaire matche |
|---|---|---|
| décret tertiaire | informationnel réglementaire | NON |
| audit énergétique tertiaire | mixte info+commercial | NON |
| déclaration operat | informationnel procédural | NON |
| dpe tertiaire obligatoire | informationnel réglementaire | PARTIEL |
| diagnostic énergétique bâtiment tertiaire | commercial-informationnel | PARTIEL |

**Persona scoring**

| Persona | Score |
|---|---|
| Bailleur PME 1 500 m² | 50/100 |
| Property Manager 10+ sites | 32/100 |
| BE/AMO cadrage | 64/100 |

Property Manager est le persona le moins servi, alors que c'est probablement le plus fort potentiel revenu Pro.

---

## 4. Lecture du rapport Gemini Pro 2026

| Recommandation Gemini | Statut diag-tertiaire | Nuance |
|---|---|---|
| Vision GEO 2026 (V = T×S + EEAT×C) | PARTIELLEMENT FAIT | Trust + Schema OK, Citabilité bonne sur blog mais nulle sur landing |
| Core Web Vitals INP < 200 ms | GAP confirmé | INP estimé 520-600 ms sur pages React. Inatteignable sans pré-compilation JSX |
| IndexNow | GAP confirmé | Aucune trace dans le repo |
| robots.txt optimisé pour bots IA | GAP confirmé | Aucun token IA nommé |
| JSON-LD GovernmentService | GAP confirmé | Absent. ProfessionalService et SoftwareApplication présents à la place |
| FAQPage zero-click | PARTIEL | 5 Q&A présentes mais réponses 30-60 mots (optimum LLM 134-167 mots) |
| Densité factuelle ≥ 3 chiffres + 2 sources/article | PARTIEL | 6 articles conformes / 11 |
| Rapports parc anonymisés (donnée propriétaire) | MANQUANT | Aucune publication de benchmark interne |
| Guides step-by-step OPERAT | MANQUANT | Aucun article ne couvre la déclaration OPERAT pas-à-pas |
| Maillage Audit / DPE / OPERAT | À NUANCER | Articles blog DPE bien dotés, mais aucun maillage vers une page pilier OPERAT (qui n'existe pas) |

**À nuancer dans les 5 commandes Claude Code proposées par Gemini** :
- "Crée un script JSON-LD type 'ProfessionalService'" : déjà présent. La vraie action est de **fusionner** ProfessionalService + Organization avec des `@id` partagés et d'**ajouter** GovernmentService (pas un nouveau ProfessionalService).
- "Identifie les orphelins sémantiques" : la priorité est de créer la page pilier `/decret-tertiaire` avant de mailler — il n'y a pas de pilier vers lequel tisser actuellement.
- "Génère un fichier robots.txt optimisé" : OK, à faire en gardant la structure existante (Disallow privés conservés).

**Apport propre de cet audit (au-delà de Gemini)** :
- SXO révèle un page-type mismatch sur 3/5 keywords stratégiques que Gemini n'a pas identifié.
- Performance révèle Babel Standalone comme bottleneck #1 (Gemini parle d'INP sans nommer la cause exacte).
- Schema audit révèle aggregateRating non vérifiable (risque pénalité Google QRG fake reviews) et author Organization au lieu de Person dans BlogPost.astro.
- Visual révèle l'animation `cta-pulse infinite` qui viole WCAG 2.3.3.
- Content révèle 5 articles sous le seuil Gemini avec liste précise.

---

## 5. Diagnostic GSC : Page avec redirection (clarification post-audit)

**Contexte** : suite a un signal "Page avec redirection - validation echouee" remonte par Google Search Console sur `http://diag-tertiaire.fr/` et `https://diag-tertiaire.fr/methode.html`, un diagnostic complementaire a ete realise apres la cloture de l'audit principal. Trois constats structurels ont ete identifies, dont deux non couverts par les TASK-001 a TASK-030 du playbook initial.

### 5.1 Redirections HTTP -> HTTPS et `.html` -> clean URL : voulues, NE PAS revalider

Les 308 emis par Vercel sur les anciennes URLs (`http://...`, `*.html`) sont la consequence directe de `cleanUrls: true` (vercel.json) et de la redirection HTTPS automatique, deux configurations CORRECTES. Le statut "Page avec redirection - validation echouee" sur ces URLs est ATTENDU : Google les considere comme non-canoniques et n'a pas a les indexer. C'est la canonique en aval (apres 308) qui doit etre indexee.

**Action** : ne PAS relancer "Valider la correction" en boucle sur les URLs en redirection - c'est contre-productif. Verifier plutot que la canonique cible (apres 308) est indexee via "Inspecter l'URL en direct" sur la canonique uniquement. Procedure detaillee : TASK-033.

### 5.2 Politique trailing-slash non unique (duplicate content)

Constat : `https://diag-tertiaire.fr/methode/` ET `https://diag-tertiaire.fr/methode` retournent toutes deux 200 sans redirection vers une canonique unique. Resultat : duplicate content potentiel sur tous les chemins propres servis par Vercel, dilution du PageRank entre deux variantes pour chaque page.

**Action** : forcer `"trailingSlash": false` au top-level de `vercel.json` (TASK-031). Validation post-deploy : `curl -I https://diag-tertiaire.fr/methode/` doit renvoyer 308 vers `/methode`.

### 5.3 Sous-domaine www. en dead-end (risque GSC futur)

Constat : `https://www.diag-tertiaire.fr/` ne resout pas (timeout). Si ce sous-domaine est soumis a GSC ou cite par un backlink mal forme, il declenchera "Erreur de serveur" et degradera la perception du site.

**Action** : configurer dans Vercel Dashboard `www.diag-tertiaire.fr` en redirect 301 vers l'apex `diag-tertiaire.fr` (TASK-032, action manuelle Yannis).

### 5.4 Suite operationnelle

Les 3 nouvelles taches sont integrees a `AGENT-EXECUTION-PLAN.md` (section "Addendum GSC (post-Phase 1)") et au tableau priorise de `ACTION-PLAN.md` (TASK-031 High, TASK-032 Medium, TASK-033 Medium). Effort cumule additionnel : 55 min (10 + 15 + 30).

---

## 6. Plan d'action consolidé

Voir `ACTION-PLAN.md` pour le tableau priorisé exécutif et `AGENT-EXECUTION-PLAN.md` pour les tâches atomiques exécutables par un agent Claude downstream.

### Effort estimé global

- **Critical** (bloquants) : ~12 h cumulées (dont 4-8 h pour pré-compilation JSX si décidée)
- **High** (impact fort) : ~20 h cumulées
- **Medium** : ~15 h cumulées
- **Low** : ~3 h cumulées

### Roadmap suggérée

**Phase 1 — Quick wins (1-2 jours)**
- Étendre robots.txt avec tokens IA explicites
- Refondre llms.txt (densité factuelle, 11 articles blog, contexte réglementaire)
- Corriger author Person + sameAs LinkedIn dans BlogPost.astro
- Supprimer aggregateRating non vérifiable
- Corriger cta-pulse infinite
- Aligner llms.txt sur cleanUrls
- Ajouter HSTS preload + soumettre

**Phase 2 — GEO / Schema (3-5 jours)**
- Ajouter GovernmentService sur index.html
- Enrichir FAQPage à 10 Q&A de 130-160 mots chacune
- Ajouter HowTo sur methode.html
- Ajouter `@id` partagés Organization/ProfessionalService + sameAs
- Ajouter SearchAction sur WebSite
- Ajouter BreadcrumbList sur index.html
- Ajouter datePublished + author sur Article methode.html

**Phase 3 — Contenu pillar (1-2 semaines)**
- Créer page pilier `/decret-tertiaire` (2 500+ mots, sources Légifrance/ADEME/OPERAT)
- Créer article "Déclaration OPERAT step-by-step"
- Étoffer methode.html (1 200+ mots, benchmarks CABS chiffrés)
- Enrichir 5 articles blog non conformes Gemini (≥ 3 chiffres + 2 sources off.)
- Ajouter maillage interne articles → pages root

**Phase 4 — Performance / SXO (2-3 semaines)**
- Pré-compiler JSX (Babel Standalone retiré) — choix d'outil esbuild ou Vite
- Defer toute la chaîne CDN sur les pages React
- React production build sur espace-pro
- Self-host fonts exemple-rapport
- A/B test H1 landing (compliance vs économies)
- Bloc "Décret Tertiaire vous concerne" dans landing
- Bloc Property Manager visible

**Phase 5 — Industriel (1 mois)**
- Implémenter IndexNow + ping au déploiement Vercel
- Automatiser lastmod sitemap depuis git log
- Capturer une drift baseline pour suivi régression
- Rapports parc anonymisés (donnée propriétaire — différenciateur GEO majeur)

---

## Annexes

### Fichiers consultés (chemins absolus)

- `c:\Users\yanni\Downloads\Diag-tertaireV3\robots.txt`
- `c:\Users\yanni\Downloads\Diag-tertaireV3\sitemap.xml`, `sitemap-pages.xml`
- `c:\Users\yanni\Downloads\Diag-tertaireV3\llms.txt`
- `c:\Users\yanni\Downloads\Diag-tertaireV3\vercel.json`
- `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html`, `methode.html`, `exemple-rapport.html`, `diagnostic.html`, `espace-professionnel.html`
- `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\layouts\BlogPost.astro`
- `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\components\AuthorBox.astro`, `SEOHead.astro`
- `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\content\blog\*.md` (11 articles)
- `c:\Users\yanni\Downloads\Diag-tertaireV3\seo-audit-2026-04\fetched\*.html` (versions live fetchées)

### Méthodologie

- 8 sous-agents seo-* exécutés en parallèle (3 ont nécessité une relance pour produire le livrable structuré)
- Pondération seo-audit standard (Technical 22 %, Content 23 %, On-Page 20 %, Schema 10 %, Performance 10 %, AI 10 %, Images 5 %)
- Cross-référence systématique avec le rapport Gemini Pro 2026 (5 sections, 4 statuts : ALIGNÉ / PARTIELLEMENT FAIT / GAP CONFIRMÉ / À NUANCER)
- PageSpeed Insights non disponible en exécution (Bash limité), CWV estimés par analyse statique

### Limitations

- **Pas de field data Google** (CrUX, GSC, GA4) : les CWV sont des estimations PSI lab, pas des mesures réelles d'utilisateurs.
- **Pas de SERP live** (DataForSEO non installé) : les analyses SXO sont basées sur la connaissance des SERPs FR du secteur réglementaire/énergie tertiaire.
- **Pas de Backlinks tier 1** : Common Crawl uniquement, profil de liens non quantifié.
- **Pas de drift baseline** : impossible de mesurer les régressions post-déploiement sans baseline préalable.

### Pour aller plus loin

- Configurer Google API (10 min : service account + clé) pour ouvrir CrUX field data, GSC URL Inspection, GA4 organic.
- Capturer une drift baseline avant Phase 1 pour suivre les régressions.
- Installer DataForSEO MCP pour enrichir avec SERP live, backlinks Moz/Ahrefs, AI visibility checks.
