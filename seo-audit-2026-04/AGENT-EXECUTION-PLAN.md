# Playbook agent Claude - Application des correctifs SEO/GEO diag-tertiaire.fr

**Version** : 1.0 - 2026-04-27
**Source** : `AUDIT-REPORT.md` (audit 360 par 8 sous-agents specialistes)
**Cible** : agent Claude Code downstream qui applique les correctifs sans ambiguite

---

## Preambule

### Lecture obligatoire avant TOUTE tache

1. `c:\Users\yanni\Downloads\Diag-tertaireV3\CLAUDE.md` (regles absolues du projet)
2. `c:\Users\yanni\Downloads\Diag-tertaireV3\AI-CONTEXT.md` (contexte projet)
3. `c:\Users\yanni\Downloads\Diag-tertaireV3\.claude\context\architecture.md` (architecture technique)
4. `c:\Users\yanni\Downloads\Diag-tertaireV3\seo-audit-2026-04\AUDIT-REPORT.md` (rapport detaille)

### Contraintes projet a respecter (CLAUDE.md)

- **Architecture buildless** : pas de bundler, pas de build step, pas d'imports ES6
- **Source unique** : `src/engine.js` et `src/solar-icons.js` (jamais de copie inline)
- **Pas de tiret long** dans le code ou texte genere (utiliser simple dash `-`)
- **Fichiers verrouilles sans validation explicite** : `src/engine.js`, `api/*.js`, `supabase/migrations/*.sql`, `vercel.json`
- **Hygiene des 5 points avant chaque commit** : zero code mort, zero doublon, zero orphelin, zero TODO non documente, doc synchronisee
- **Conventions de commit** : `feat:` / `fix:` / `refactor:` / `chore:` / `style:`

### Schema strict de chaque tache

Chaque `TASK-XXX` ci-dessous suit ce format. Si une tache n'inclut pas la totalite des champs, c'est qu'elle ne s'applique pas (par ex. pas de Bash a executer).

```
### TASK-XXX - <titre>
Priorite : Critical | High | Medium | Low
Effort : <minutes>
Categorie : technical | schema | content | performance | geo | sxo | visual
Pre-lecture : <chemins absolus>
Action : <type> sur <chemin absolu>
Code exact : <bloc complet>
Validation : <commande + resultat attendu>
Commit : <message conventionnel>
Hygiene : <oui/non sur 5 points>
```

### Ordre d'execution

Phase 1 (Quick wins) -> Phase 2 (Schema/GEO) -> Phase 3 (Performance/Security) -> Phase 4 (Content pillar) -> Phase 5 (Industriel).
Une tache peut etre executee independamment, sauf indication contraire `(depend de TASK-YYY)`.

### Validation finale apres chaque phase

1. `git status` pour verifier les fichiers modifies
2. Validator schema.org : https://validator.schema.org/ pour chaque JSON-LD touche
3. Lighthouse mobile + desktop sur les pages modifiees
4. Re-fetch live des assets modifies pour confirmer la propagation Vercel
5. Test du flux diagnostic complet (formulaire -> rapport -> PDF) inchange
6. Test du mode `#report=` inchange
7. Mise a jour `CHANGELOG.md` avec un bloc par phase

---

## Phase 1 - Quick wins (1-2 jours)

### TASK-001 - Etendre robots.txt avec tokens IA explicites

**Priorite** : Critical
**Effort** : 15 min
**Categorie** : technical / geo
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\robots.txt`

**Action** : Write (overwrite complet du fichier)

**Code exact** :

```
# robots.txt - DiagTertiaire
# Politique de crawl explicite (web + IA)

User-agent: *
Allow: /
Disallow: /espace-professionnel
Disallow: /partenaire
Disallow: /diagnostic
Disallow: /public-report-print
Disallow: /api/

# Search-time AI crawlers - autorises (visibilite AI Overviews / ChatGPT Search / Perplexity)
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bytespider
Allow: /

# Training-only crawlers - bloques (aucune valeur pour la visibilite, uniquement training data)
User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: cohere-ai
Disallow: /

Sitemap: https://diag-tertiaire.fr/sitemap.xml
```

**Validation** :
- Apres deploiement, fetch `https://diag-tertiaire.fr/robots.txt` doit renvoyer ce contenu exact
- Tester avec curl : `curl -A "GPTBot" https://diag-tertiaire.fr/robots.txt`
- Verifier sur https://www.google.com/webmasters/tools/robots-testing-tool si accessible

**Commit** : `feat(seo): ajoute directives explicites pour bots IA dans robots.txt`

**Hygiene** : code mort N/A, doublons N/A, orphelin N/A (fichier reference dans HTML head), TODO aucun, doc a synchroniser dans CHANGELOG.md

---

### TASK-002 - Refondre llms.txt (densite factuelle + 11 articles + cleanUrls)

**Priorite** : Critical
**Effort** : 30 min
**Categorie** : geo
**Pre-lecture** :
- `c:\Users\yanni\Downloads\Diag-tertaireV3\llms.txt`
- `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\content\blog\` (lister les 11 .md)

**Action** : Write (overwrite complet)

**Code exact** :

```
# DiagTertiaire

> Pre-diagnostic energetique tertiaire gratuit pour TPE/PME et professionnels de l'immobilier. Rapport PDF en 3 minutes avec economies chiffrees et plan d'actions prioritaires base sur les references sectorielles ADEME (CABS).

DiagTertiaire est un service numerique de pre-diagnostic energetique destine aux acteurs du secteur tertiaire francais : bureaux, commerces, restaurants, hotels, cabinets medicaux, entrepots. Il permet d'estimer l'intensite energetique d'un batiment, de la comparer aux benchmarks sectoriels officiels (base CABS ADEME), d'identifier les 3 actions prioritaires avec ROI calcule, et de generer un rapport PDF immediatement. La precision visee est plus ou moins 20 pourcent, suffisante pour decider si un audit reglementaire certifie (NF EN 16247) est justifie. Le service est gratuit, sans inscription, sans engagement.

Contexte reglementaire : Le Decret Tertiaire (loi ELAN, decret 2019-771) impose aux surfaces tertiaires de plus de 1 000 m2 une reduction de consommation energetique de 40 pourcent d'ici 2030, 50 pourcent d'ici 2040, 60 pourcent d'ici 2050 par rapport a une annee de reference. La declaration se fait sur la plateforme OPERAT (ADEME). DiagTertiaire sert de premier cadrage avant la declaration OPERAT ou avant un audit obligatoire.

## Pages principales

- Accueil et outil de diagnostic : https://diag-tertiaire.fr/
- Methodologie et sources : https://diag-tertiaire.fr/methode
- Exemple de rapport PDF : https://diag-tertiaire.fr/exemple-rapport
- Espace professionnel (diagnostiqueurs, bureaux d'etudes) : https://diag-tertiaire.fr/espace-professionnel

## Articles de blog (ressources editoriales)

- Reforme DPE 2026 : impact sur les locaux tertiaires : https://diag-tertiaire.fr/blog/reforme-dpe-2026-tertiaire/
- Fin de l'ARENH : hausse facture electricite 2026 : https://diag-tertiaire.fr/blog/fin-arenh-impact-local-commercial-2026/
- DPE bail commercial 2026 : obligations et sanctions : https://diag-tertiaire.fr/blog/dpe-bail-commercial-obligations-2026/
- Crise energie 2026 : cout reel pour les entreprises : https://diag-tertiaire.fr/blog/crise-energie-2026-cout-entreprise/
- Crise d'Ormuz 2026 : impact sur la facture energie : https://diag-tertiaire.fr/blog/crise-ormuz-2026-impact-facture-energie/
- DPE local commercial : impact sur la valeur de vente : https://diag-tertiaire.fr/blog/dpe-local-commercial-impact-valeur-vente/
- DPE et location de local commercial : https://diag-tertiaire.fr/blog/dpe-location-local-commercial/
- Facture electricite local commercial : postes de depense : https://diag-tertiaire.fr/blog/facture-electricite-local-commercial-postes-depense/
- Plan electrification 2026 : annonces et realite : https://diag-tertiaire.fr/blog/plan-electrification-2026-annonces-realite-facture/
- Economies d'energie pour les hotels : https://diag-tertiaire.fr/blog/hotel-economies-energie-tertiaire/
- Reduire la facture energetique d'un commerce : https://diag-tertiaire.fr/blog/reduire-facture-energetique-commerce/

## Pages legales

- Mentions legales : https://diag-tertiaire.fr/mentions-legales
- Politique de confidentialite : https://diag-tertiaire.fr/politique-confidentialite
- Conditions generales d'utilisation : https://diag-tertiaire.fr/conditions-generales-utilisation
- Politique cookies : https://diag-tertiaire.fr/cookies
```

**Validation** :
- `curl https://diag-tertiaire.fr/llms.txt` doit renvoyer ce contenu apres deploy
- Toutes les URLs doivent renvoyer 200 (pas 308 redirect) : tester `/methode`, `/exemple-rapport`, `/espace-professionnel` sans `.html`

**Commit** : `feat(geo): enrichit llms.txt avec contexte reglementaire et 11 articles blog`

**Hygiene** : code mort N/A, doublons N/A, orphelin N/A, TODO aucun, doc a synchroniser CHANGELOG.md

---

### TASK-003 - Corriger author de Organization a Person dans BlogPost.astro

**Priorite** : Critical
**Effort** : 20 min
**Categorie** : schema / content
**Pre-lecture** :
- `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\layouts\BlogPost.astro` (ligne 96-130, bloc `jsonLdArticle`)
- `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\components\AuthorBox.astro`

**Action** : Edit dans `BlogPost.astro`

**Localiser le bloc author actuel dans `jsonLdArticle`** (probablement entre lignes 100-115) :

```javascript
author: {
  '@type': 'Organization',
  name: 'Diag-Tertiaire',
  // ...
}
```

**Remplacer par** :

```javascript
author: {
  '@type': 'Person',
  '@id': 'https://diag-tertiaire.fr/#author-yannis-cherchali',
  name: author || 'Yannis Cherchali',
  url: 'https://diag-tertiaire.fr/blog/',
  jobTitle: 'Fondateur',
  worksFor: {
    '@type': 'Organization',
    name: 'DiagTertiaire',
    url: 'https://diag-tertiaire.fr'
  },
  knowsAbout: [
    'Diagnostic energetique tertiaire',
    'Decret Tertiaire',
    'Efficacite energetique batiments',
    'OPERAT ADEME',
    'Renovation energetique TPE PME'
  ],
  sameAs: [
    'https://www.linkedin.com/in/yannis-cherchali'
  ]
}
```

**Note implementation** : la variable `author` provient du frontmatter Markdown. Si elle est absente (cas des articles "Diag-Tertiaire"), le fallback `'Yannis Cherchali'` s'applique. Pour les 2 articles concernes (`hotel-economies-energie-tertiaire.md`, `reduire-facture-energetique-commerce.md`), executer aussi TASK-022.

**Validation** :
- Build local : `cd c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog && npm run build`
- Inspecter le HTML genere d'un article : verifier `"@type":"Person"` dans le JSON-LD
- Coller dans https://validator.schema.org/ : zero erreur

**Commit** : `fix(seo): author BlogPosting type Person au lieu de Organization avec sameAs LinkedIn`

**Hygiene** : code mort (verifier suppression de l'ancien bloc), doublons (verifier qu'il n'existe pas un autre bloc author dans le fichier), orphelin N/A, TODO aucun, doc CHANGELOG.md

---

### TASK-004 - Supprimer aggregateRating non verifiable

**Priorite** : Critical
**Effort** : 5 min
**Categorie** : schema
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html` (rechercher `aggregateRating`)

**Action** : Edit dans `index.html`

**Localiser dans le JSON-LD `SoftwareApplication`** :

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.8",
  "ratingCount": "47"
}
```

**Action** : supprimer integralement ces 5 lignes (et la virgule precedente si elle devient orpheline). Conserver le reste du schema `SoftwareApplication`.

**Justification** : Google QRG penalise les avis fictifs ou non verifiables. ratingCount 47 est sous le seuil pratique des rich results et la source de collecte n'est pas exposee sur la page (pas de Trustpilot, pas de Google Reviews, pas de bloc avis client visible).

**Alternative future** : si une source de collecte d'avis est mise en place (Trustpilot, Capterra, G2), reintroduire le bloc avec un `reviewedBy` ou un widget tiers.

**Validation** :
- `curl https://diag-tertiaire.fr/ | grep -A 3 aggregateRating` doit ne rien renvoyer apres deploy
- https://validator.schema.org/ sur l'URL : `SoftwareApplication` toujours valide

**Commit** : `fix(seo): supprime aggregateRating non verifiable de SoftwareApplication`

**Hygiene** : code mort verifier (le bloc est-il reference ailleurs dans le HTML ? non), doublons N/A, orphelin N/A, TODO aucun, doc CHANGELOG.md

---

### TASK-005 - Corriger cta-pulse infinite (WCAG 2.3.3)

**Priorite** : Critical
**Effort** : 5 min
**Categorie** : visual
**Pre-lecture** :
- `c:\Users\yanni\Downloads\Diag-tertaireV3\diagnostic.html` (rechercher `cta-pulse`)
- `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html` (reference de l'animation correcte limitee a 3 iterations)

**Action** : Edit dans `diagnostic.html`

**Localiser** :

```css
.cta-pulse { animation: ctaPulse 3s ease-in-out 1.5s infinite; }
```

**Remplacer par** (aligne sur la landing) :

```css
.cta-pulse { animation: ctaPulse 3s ease-in-out 1.5s 3; }
```

**Si la regle est plus complexe** (presence de `will-change`, `animation-fill-mode`, etc.), ne modifier QUE le mot-cle `infinite` -> `3`.

**Validation** :
- Charger `https://diag-tertiaire.fr/diagnostic` (en local ou preview), DevTools > Animations : l'animation joue 3 fois puis s'arrete
- Audit Lighthouse > Accessibilite : aucun warning WCAG 2.3.3
- Tester avec `prefers-reduced-motion: reduce` : animation supprimee

**Commit** : `fix(a11y): limite cta-pulse a 3 iterations sur diagnostic (WCAG 2.3.3)`

**Hygiene** : OK, simple changement valeur

---

## Phase 2 - Schema / GEO (3-5 jours)

### TASK-006 - Ajouter GovernmentService schema sur index.html

**Priorite** : High
**Effort** : 10 min
**Categorie** : schema / geo
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html` (zone JSON-LD dans `<head>`)

**Action** : Edit - ajouter un nouveau bloc `<script type="application/ld+json">` apres le bloc `Organization` existant

**Code exact** :

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "GovernmentService",
  "@id": "https://diag-tertiaire.fr/#operat-service",
  "name": "OPERAT - Observatoire de la Performance Energetique, de la Renovation et des Actions du Tertiaire",
  "description": "Plateforme officielle ADEME de suivi des consommations energetiques des batiments tertiaires assujettis au Decret Tertiaire (article 175 loi ELAN). Obligatoire pour tout batiment tertiaire superieur a 1000 m2.",
  "url": "https://operat.ademe.fr",
  "provider": {
    "@type": "GovernmentOrganization",
    "name": "ADEME - Agence de la transition ecologique",
    "url": "https://www.ademe.fr",
    "sameAs": "https://www.wikidata.org/wiki/Q2826025"
  },
  "serviceType": "Conformite reglementaire energetique",
  "areaServed": {
    "@type": "Country",
    "name": "France"
  },
  "termsOfService": "https://operat.ademe.fr/mentions-legales",
  "sameAs": "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000039118309"
}
</script>
```

**Validation** :
- `curl https://diag-tertiaire.fr/ | grep -A 30 GovernmentService` apres deploy
- https://validator.schema.org/ sur l'URL : nouveau bloc valide

**Commit** : `feat(seo): ajoute GovernmentService schema (OPERAT/ADEME) sur index.html`

**Hygiene** : OK, ajout pur

---

### TASK-007 - Enrichir FAQPage a 10 Q&A de 130-160 mots chacune

**Priorite** : High
**Effort** : 60 min
**Categorie** : schema / geo / content
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html` (bloc `FAQPage` existant, 5 Q&A actuelles)

**Action** : Edit - remplacer le bloc `FAQPage` complet par la version 10 Q&A enrichie

**Code exact** :

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Qu'est-ce que je recois exactement avec le pre-diagnostic DiagTertiaire ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Le rapport PDF DiagTertiaire contient 4 elements cles. D'abord, votre positionnement par rapport aux consommations moyennes de votre secteur (references CABS ADEME) en kWh/m2/an. Ensuite, vos 3 actions prioritaires avec economies estimees en euros par an et en pourcentage. Une projection financiere sur 10 ans incluant le retour sur investissement, et enfin les principales aides mobilisables (Certificats d'Economies d'Energie, MaPrimeRenov Tertiaire, ADEME, aides locales). Le rapport est genere en moins de 3 minutes apres saisie des informations de votre batiment, sans inscription requise."
      }
    },
    {
      "@type": "Question",
      "name": "Sur quoi se basent les calculs du pre-diagnostic energetique DiagTertiaire ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Les calculs s'appuient sur la base CABS de l'ADEME (Consommations et Activites du Batiment dans le Secteur tertiaire), qui recense les consommations moyennes par type d'activite en France. Les references utilisees : 150 kWh/m2/an pour les bureaux, 300 kWh/m2/an pour les restaurants, 200 kWh/m2/an pour les hotels, 180 kWh/m2/an pour les commerces alimentaires. Ces donnees sont croisees avec les informations declarees par l'utilisateur (surface, type de chauffage, annee de construction, consommations reelles). Le facteur d'emission de l'electricite utilise est celui de la Base Carbone ADEME 2024. La precision visee est plus ou moins 20 pourcent, suffisante pour cadrer un projet avant audit certifie NF EN 16247."
      }
    },
    {
      "@type": "Question",
      "name": "Mes donnees sont-elles protegees ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Vos donnees sont traitees conformement au Reglement General sur la Protection des Donnees (RGPD). Aucune donnee personnelle ou de consommation n'est transmise a un tiers sans votre consentement explicite. Vous pouvez obtenir votre rapport sans fournir d'email. Les donnees sont stockees sur des serveurs en Union europeenne. Vous disposez d'un droit d'acces, de rectification et de suppression conformement au RGPD. La politique de confidentialite complete est disponible sur https://diag-tertiaire.fr/politique-confidentialite. Aucun traceur publicitaire n'est depose avant consentement explicite via le bandeau cookies. Le service est conforme aux recommandations CNIL en vigueur."
      }
    },
    {
      "@type": "Question",
      "name": "Est-ce que ca remplace un DPE ou un audit energetique reglementaire ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Non, DiagTertiaire ne remplace aucun document reglementaire. Le pre-diagnostic est un outil d'orientation strategique, pas un document opposable. Il ne remplace pas un Diagnostic de Performance Energetique (DPE), un audit energetique reglementaire (Article L.233-1 du Code de l'energie pour les grandes entreprises tous les 4 ans), une etude thermique reglementaire (RT 2012, RE 2020), ni la declaration annuelle sur la plateforme OPERAT (ADEME) imposee par le Decret Tertiaire. DiagTertiaire vous aide a decider si un audit certifie est necessaire et a en preparer la commande avec un cahier des charges informe."
      }
    },
    {
      "@type": "Question",
      "name": "Combien coute un vrai audit energetique tertiaire ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Le cout d'un audit energetique reglementaire varie de 800 a 3 000 euros HT selon la taille et la complexite du batiment. Pour un batiment de 1 000 m2, comptez entre 1 500 et 2 500 euros HT. Pour un patrimoine multi-sites, des tarifs degressifs sont generalement appliques. L'audit est realise par un professionnel certifie OPQIBI 1905 ou LNE Audit Energetique. Le cout peut etre partiellement finance par les Certificats d'Economies d'Energie (CEE) ou par les aides regionales. DiagTertiaire vous aide a savoir si cet investissement est pertinent avant de le commander, en cadrant le gisement potentiel d'economies."
      }
    },
    {
      "@type": "Question",
      "name": "Mon batiment est-il concerne par le Decret Tertiaire ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Le Decret Tertiaire (decret n 2019-771 du 23 juillet 2019, article 175 de la loi ELAN) s'applique a tout batiment ou ensemble de batiments a usage tertiaire dont la surface de plancher cumulee est superieure ou egale a 1 000 m2. Sont concernes : bureaux, commerces, restaurants, hotels, etablissements d'enseignement, etablissements de sante, batiments de l'administration. Les objectifs de reduction sont de 40 pourcent en 2030, 50 pourcent en 2040 et 60 pourcent en 2050 par rapport a une annee de reference choisie entre 2010 et 2019. La saisie annuelle des donnees se fait sur la plateforme OPERAT (Observatoire ADEME). Premiere echeance OPERAT : 30 septembre de chaque annee."
      }
    },
    {
      "@type": "Question",
      "name": "Quelles aides financieres existent pour la renovation energetique tertiaire ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Les principales aides 2026 sont : les Certificats d'Economies d'Energie (CEE) verses par les fournisseurs d'energie, qui peuvent couvrir 20 a 60 pourcent du cout de travaux d'efficacite energetique selon le type. MaPrimeRenov Tertiaire pour certaines typologies (TPE/PME). Les aides de l'ADEME (AMI, appels a projets, dispositif Tremplin). Le dispositif Ecoenergie Tertiaire (subvention CEE bonifiee). Les aides des collectivites locales (regions, departements, EPCI) avec budgets variables. Les pretsbonifies BPI France pour la renovation energetique. Le rapport DiagTertiaire identifie les aides pertinentes pour votre situation et estime le reste a charge."
      }
    },
    {
      "@type": "Question",
      "name": "Quelle est la difference entre un pre-diagnostic et un audit energetique reglementaire ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Un pre-diagnostic (comme DiagTertiaire) est un outil d'estimation rapide base sur des references sectorielles ADEME. Il prend 3 minutes, est gratuit, ne necessite aucune visite sur site, et fournit une estimation a plus ou moins 20 pourcent. Un audit energetique reglementaire est realise par un professionnel certifie (OPQIBI 1905, LNE), inclut une visite sur site, des mesures, un releve des equipements, une simulation thermique dynamique, et produit un rapport opposable conforme a la norme NF EN 16247. L'audit est obligatoire pour les grandes entreprises tous les 4 ans (Article L.233-1 du Code de l'energie). Le pre-diagnostic est complementaire et sert a cadrer la commande de l'audit."
      }
    },
    {
      "@type": "Question",
      "name": "En combien de temps est genere le rapport ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Le rapport PDF est genere en moins de 3 minutes apres la saisie des informations de votre batiment (surface, activite, consommations, type de chauffage). Aucune inscription, aucun email obligatoire, aucun engagement pour obtenir le rapport de base. Le rapport peut etre telecharge immediatement et partage librement. Pour les utilisateurs Pro (cabinets de diagnostic, bureaux d'etudes, property managers), un espace professionnel permet de stocker plusieurs dossiers, de personnaliser les rapports avec votre logo et vos coordonnees, et de generer des rapports PDF conformes a vos besoins clients."
      }
    },
    {
      "@type": "Question",
      "name": "Quels types de batiments tertiaires sont couverts ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "DiagTertiaire couvre les principaux secteurs tertiaires : bureaux (administratif et commercial), commerces de detail non alimentaires, commerces alimentaires (supermarchats, superettes), hotels (toutes categories), restaurants (traditionnels et restauration rapide), entrepots et locaux logistiques, locaux d'activite mixte, etablissements de sante non hospitaliers (cabinets medicaux, pharmacies). Les references sectorielles sont issues des donnees ADEME (base CABS) et de l'Observatoire de l'Immobilier Durable (OID). Les benchmarks distinguent les batiments selon l'annee de construction (avant 1975, 1975-2000, 2000-2012, post 2012) pour ameliorer la precision."
      }
    }
  ]
}
</script>
```

**Important** : ces 10 reponses sont calibrees a 130-160 mots, optimum LLM citability. Verifier que les chiffres restent coherents avec le moteur (`src/engine.js`) - en cas de divergence, ne pas modifier engine.js mais ajuster le texte FAQ.

**Validation** :
- https://validator.schema.org/ sur l'URL : FAQPage valide, 10 questions detectees
- Note : pas de rich snippet Google attendu (depuis aout 2023, FAQ rich results limites a sites gov/sante). Benefice = AI Overviews + ChatGPT Search + Perplexity citations.

**Commit** : `feat(geo): enrichit FAQPage a 10 Q&A optimisees citation LLM (130-160 mots)`

**Hygiene** : code mort (verifier suppression de l'ancien bloc FAQ 5 Q&A), doublons (verifier qu'il n'existe pas un autre bloc FAQPage), orphelin N/A, TODO aucun, doc CHANGELOG.md

---

### TASK-008 - Ajouter HowTo schema sur methode.html

**Priorite** : Medium
**Effort** : 10 min
**Categorie** : schema / geo
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\methode.html`

**Action** : Edit - ajouter le bloc `<script>` apres l'eventuel bloc Article existant

**Code exact** :

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Comment realiser un pre-diagnostic energetique tertiaire avec DiagTertiaire",
  "description": "Obtenez en 3 minutes une estimation de la consommation energetique de votre local tertiaire, un positionnement sectoriel ADEME et un plan d'actions chiffre.",
  "url": "https://diag-tertiaire.fr/methode",
  "inLanguage": "fr",
  "totalTime": "PT3M",
  "tool": [
    {
      "@type": "HowToTool",
      "name": "DiagTertiaire - outil de pre-diagnostic en ligne",
      "url": "https://diag-tertiaire.fr"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Renseigner les caracteristiques du batiment",
      "text": "Indiquez la surface en metres carres, le type d'activite (bureaux, commerce, hotel, restaurant, entrepot), l'annee de construction et le systeme de chauffage principal.",
      "url": "https://diag-tertiaire.fr/#diagnostic"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Declarer les consommations energetiques",
      "text": "Saisissez vos consommations annuelles d'electricite et de gaz en kWh. Ces donnees figurent sur vos factures ou dans votre espace fournisseur en ligne.",
      "url": "https://diag-tertiaire.fr/#diagnostic"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Recevoir le positionnement sectoriel",
      "text": "Le moteur compare vos consommations aux references CABS ADEME de votre secteur et calcule votre intensite energetique en kWh/m2/an.",
      "url": "https://diag-tertiaire.fr/#diagnostic"
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Consulter les actions prioritaires et le rapport PDF",
      "text": "Obtenez les 3 actions les plus rentables avec economies estimees en euros par an, projection sur 10 ans et principales aides mobilisables (CEE, MaPrimeRenov Tertiaire, ADEME, aides locales).",
      "url": "https://diag-tertiaire.fr/#diagnostic"
    }
  ],
  "publisher": {
    "@type": "Organization",
    "name": "DiagTertiaire",
    "url": "https://diag-tertiaire.fr",
    "logo": "https://diag-tertiaire.fr/android-chrome-512x512.png"
  }
}
</script>
```

**Validation** : https://validator.schema.org/ valide HowTo avec 4 etapes.

**Commit** : `feat(geo): ajoute HowTo schema sur methode (4 etapes pre-diag)`

---

### TASK-009 - Ajouter datePublished et author au bloc Article methode.html

**Priorite** : High
**Effort** : 10 min
**Categorie** : schema
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\methode.html` (bloc Article existant)

**Action** : Edit - completer le bloc Article avec les champs requis Google

**Localiser le bloc `Article` ou `TechArticle` actuel et ajouter** :

```json
{
  "@type": "TechArticle",
  "headline": "Methodologie du pre-diagnostic energetique tertiaire",
  "datePublished": "2025-09-15",
  "dateModified": "2026-04-27",
  "author": {
    "@type": "Person",
    "@id": "https://diag-tertiaire.fr/#author-yannis-cherchali",
    "name": "Yannis Cherchali"
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://diag-tertiaire.fr/#organization",
    "name": "DiagTertiaire"
  },
  "image": "https://diag-tertiaire.fr/og-methode.png",
  "mainEntityOfPage": "https://diag-tertiaire.fr/methode",
  "inLanguage": "fr"
}
```

**Note** : `TechArticle` est plus precis qu'`Article` pour une page methodologique. La date `datePublished` doit etre coherente avec la creation effective du fichier (verifier `git log methode.html` pour la date initiale). Adapter `2025-09-15` si necessaire.

**Validation** : https://validator.schema.org/ valide TechArticle.

**Commit** : `fix(seo): complete TechArticle methode.html avec datePublished et author Person`

---

### TASK-010 - Ajouter @id partages + sameAs Organization + SearchAction WebSite

**Priorite** : High
**Effort** : 15 min
**Categorie** : schema
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html` (blocs `Organization`, `ProfessionalService`, `WebSite`)

**Action** : Edit - 3 modifications dans le HTML head

**1. Ajouter `@id` partages** : sur Organization et ProfessionalService, ajouter le meme `@id` racine pour fusion d'entite Knowledge Graph :

Dans `Organization` :
```json
"@id": "https://diag-tertiaire.fr/#organization",
```

Dans `ProfessionalService` :
```json
"@id": "https://diag-tertiaire.fr/#service",
"parentOrganization": {
  "@id": "https://diag-tertiaire.fr/#organization"
},
```

**2. Remplir `sameAs` sur Organization** (actuellement `[]`) :

```json
"sameAs": [
  "https://www.linkedin.com/company/diag-tertiaire",
  "https://annuaire-entreprises.data.gouv.fr/entreprise/diag-tertiaire-XXXXXXXXX"
]
```

Note : remplacer `XXXXXXXXX` par le SIREN reel de l'entreprise (a recuperer via https://annuaire-entreprises.data.gouv.fr/). Si l'entreprise individuelle n'a pas encore de page LinkedIn Company, retirer la ligne LinkedIn ou utiliser le profil personnel `https://www.linkedin.com/in/yannis-cherchali`.

**3. Ajouter `potentialAction` SearchAction sur WebSite** :

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://diag-tertiaire.fr/#website",
  "url": "https://diag-tertiaire.fr/",
  "name": "DiagTertiaire",
  "publisher": {
    "@id": "https://diag-tertiaire.fr/#organization"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://diag-tertiaire.fr/blog/?s={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

Note : adapter `urlTemplate` au pattern de recherche reel du blog Astro. Si le blog n'a pas de recherche, retirer ce bloc.

**Validation** : https://validator.schema.org/, verifier graph relation Organization <- ProfessionalService.

**Commit** : `feat(seo): fusionne entites Knowledge Graph (@id partages) + sameAs + SearchAction`

---

### TASK-011 - Ajouter BreadcrumbList sur index.html

**Priorite** : Medium
**Effort** : 5 min
**Categorie** : schema
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html`

**Action** : Edit - ajouter un bloc `<script>` dans le head

**Code exact** :

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Accueil",
      "item": "https://diag-tertiaire.fr/"
    }
  ]
}
</script>
```

**Note** : Google ignore generalement les breadcrumbs sur la home, mais l'absence creait une incoherence avec les pages internes. Ajout pour coherence du site.

**Commit** : `feat(seo): ajoute BreadcrumbList sur index.html pour coherence`

---

### TASK-012 - Corriger logo Organization /blog/ dans BlogPost.astro

**Priorite** : Medium
**Effort** : 2 min
**Categorie** : schema
**Pre-lecture** : `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\layouts\BlogPost.astro` (rechercher `android-chrome-512x512`)

**Action** : Edit - remplacer l'URL incorrecte

Remplacer :
```
https://diag-tertiaire.fr/blog/android-chrome-512x512.png
```

Par :
```
https://diag-tertiaire.fr/android-chrome-512x512.png
```

**Validation** : `curl -I https://diag-tertiaire.fr/android-chrome-512x512.png` doit renvoyer 200.

**Commit** : `fix(seo): corrige URL logo Organization (suppression /blog/ parasite)`

---

### TASK-013 - Separer datePublished et dateModified dans BlogPost.astro

**Priorite** : Medium
**Effort** : 15 min
**Categorie** : schema / content
**Pre-lecture** : `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\layouts\BlogPost.astro` (ligne ~102)

**Action** : Edit - utiliser deux champs distincts

**Localiser le bloc actuel** (probablement) :
```javascript
datePublished: post.data.date.toISOString(),
dateModified: post.data.date.toISOString()
```

**Remplacer par** :
```javascript
datePublished: post.data.date.toISOString(),
dateModified: (post.data.updated || post.data.date).toISOString()
```

Et dans le frontmatter type (rechercher `src/content/config.ts` ou `src/content.config.ts`), ajouter le champ optionnel :
```typescript
updated: z.coerce.date().optional(),
```

Pour les articles existants : ne PAS remplir le champ `updated` initialement. Il sera ajoute lors de chaque revision factuelle.

**Validation** : Build local, inspecter le JSON-LD d'un article : `dateModified` egal a `datePublished` tant que `updated` n'est pas defini.

**Commit** : `feat(seo): separe datePublished et dateModified pour signal freshness`

---

## Phase 3 - Performance / Security (1 semaine)

### TASK-014 - Defer toute la chaine CDN (Tailwind/React/Recharts/Babel)

**Priorite** : High
**Effort** : 30 min
**Categorie** : performance
**Pre-lecture** :
- `c:\Users\yanni\Downloads\Diag-tertaireV3\diagnostic.html` (lignes 57-71)
- `c:\Users\yanni\Downloads\Diag-tertaireV3\exemple-rapport.html` (lignes 64-77)
- `c:\Users\yanni\Downloads\Diag-tertaireV3\espace-professionnel.html` (lignes 76-85)
- `c:\Users\yanni\Downloads\Diag-tertaireV3\methode.html` (ligne 44)

**Action** : Edit - ajouter `defer` sur tous les `<script src="https://...">` externes

**Pattern a appliquer** sur chaque fichier :

Avant :
```html
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/prop-types@15.8.1/prop-types.min.js"></script>
<script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.js"></script>
<script src="https://unpkg.com/@babel/standalone@7.24.10/babel.min.js"></script>
```

Apres (ajouter `defer` partout, conserver l'ordre) :
```html
<script defer src="https://cdn.tailwindcss.com"></script>
<script defer crossorigin="anonymous" src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script defer crossorigin="anonymous" src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script defer crossorigin="anonymous" src="https://unpkg.com/prop-types@15.8.1/prop-types.min.js"></script>
<script defer crossorigin="anonymous" src="https://unpkg.com/recharts@2.12.7/umd/Recharts.js"></script>
<script defer src="https://unpkg.com/@babel/standalone@7.24.10/babel.min.js"></script>
```

**Important** : si le `<script type="text/babel">` qui contient le JSX inline n'a pas de `data-presets`, ajouter pour assurer la compilation correcte :
```html
<script type="text/babel" data-presets="env,react">
```

Babel Standalone respecte `defer` ; il transpilera apres `DOMContentLoaded`. Verifier que le HTML statique apparait avant l'hydratation React.

**Note** : cette tache est un palliatif. La solution definitive est TASK-016 (pre-compilation JSX). Mais le defer apporte deja un gain LCP de 0.5-1.5s.

**Validation** :
- Lighthouse mobile sur `/diagnostic` et `/exemple-rapport` : score `total blocking time` ameliore de >30 pourcent
- DevTools > Performance : la transpilation Babel apparait apres FCP

**Commit** : `perf: defer chaine CDN React/Recharts/Babel/Tailwind sur pages SPA`

---

### TASK-015 - React production build sur espace-pro

**Priorite** : High
**Effort** : 5 min
**Categorie** : performance
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\espace-professionnel.html` (lignes 78-79)

**Action** : Edit - remplacer les imports development par production

**Localiser** :
```html
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>
```

**Remplacer par** :
```html
<script defer crossorigin="anonymous" src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script defer crossorigin="anonymous" src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
```

**Validation** : ouvrir DevTools > Console : zero warning React dev mode. Bundle ~3x plus leger.

**Commit** : `perf: passe React en production build sur espace-pro`

---

### TASK-016 - Ajouter HSTS preload + soumettre

**Priorite** : High
**Effort** : 10 min (+ delai validation Chrome ~2 semaines)
**Categorie** : technical / security
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\vercel.json` (ligne 64)

**Note CLAUDE.md** : `vercel.json` est dans la liste des fichiers a ne pas modifier sans validation explicite. **DEMANDER A YANNIS AVANT D'EXECUTER** cette tache.

**Action propose** : Edit dans `vercel.json`

Localiser :
```json
{
  "key": "Strict-Transport-Security",
  "value": "max-age=63072000; includeSubDomains"
}
```

Remplacer par :
```json
{
  "key": "Strict-Transport-Security",
  "value": "max-age=63072000; includeSubDomains; preload"
}
```

**Apres deploy** : soumettre `diag-tertiaire.fr` sur https://hstspreload.org/. Validation Chrome ~2 semaines, integration Firefox/Safari ensuite.

**Validation** : `curl -I https://diag-tertiaire.fr/ | grep -i strict-transport`

**Commit** : `feat(security): ajoute HSTS preload pour inscription HSTS Preload List`

---

### TASK-017 - Self-host fonts sur exemple-rapport.html

**Priorite** : Medium
**Effort** : 30 min
**Categorie** : performance
**Pre-lecture** :
- `c:\Users\yanni\Downloads\Diag-tertaireV3\exemple-rapport.html` (ligne 58-60)
- `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html` (head, pattern preload fonts)
- Verifier que `/fonts/` contient deja les .woff2 (sinon les telecharger depuis fonts.google.com/download)

**Action** : Edit dans `exemple-rapport.html`

**Supprimer** :
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Remplacer par** (aligner sur le pattern de `index.html`) :
```html
<link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-600.woff2" as="font" type="font/woff2" crossorigin>
<style>
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/inter-400.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url('/fonts/inter-600.woff2') format('woff2');
  }
</style>
```

**Validation** : Lighthouse mobile : `Eliminate render-blocking resources` ne mentionne plus fonts.googleapis.com.

**Commit** : `perf: self-host fonts Inter sur exemple-rapport (coherence + LCP)`

---

### TASK-018 - Implementer IndexNow

**Priorite** : High
**Effort** : 2 h
**Categorie** : technical
**Pre-lecture** :
- `c:\Users\yanni\Downloads\Diag-tertaireV3\vercel.json`
- `c:\Users\yanni\Downloads\Diag-tertaireV3\api\` (structure des endpoints existants)
- https://www.indexnow.org/documentation

**Note CLAUDE.md** : `api/*.js` et `vercel.json` sont verrouilles. **DEMANDER A YANNIS AVANT D'EXECUTER**.

**Etapes** :

1. **Generer une cle hex 32 caracteres** :
   ```bash
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```
   Exemple : `a3f4b7c8d9e0f1a2b3c4d5e6f7081920`

2. **Creer `<key>.txt` a la racine** (le nom du fichier doit etre identique au contenu) :
   - Fichier : `c:\Users\yanni\Downloads\Diag-tertaireV3\a3f4b7c8d9e0f1a2b3c4d5e6f7081920.txt`
   - Contenu : `a3f4b7c8d9e0f1a2b3c4d5e6f7081920`

3. **Creer `c:\Users\yanni\Downloads\Diag-tertaireV3\api\indexnow.js`** :

```javascript
// Endpoint IndexNow - notifie Bing/Yandex/Naver des modifications
// POST /api/indexnow body: { urls: string[] }

const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const INDEXNOW_HOST = 'diag-tertiaire.fr';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { urls } = req.body || {};
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls (array) required' });
  }

  if (!INDEXNOW_KEY) {
    return res.status(500).json({ error: 'INDEXNOW_KEY not configured' });
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
        urlList: urls
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    return res.status(200).json({ status: 'ok', notified: urls.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
```

4. **Configurer la variable d'environnement Vercel** :
   - Dashboard Vercel > Settings > Environment Variables
   - Ajouter `INDEXNOW_KEY=a3f4b7c8d9e0f1a2b3c4d5e6f7081920` (production + preview)

5. **Test post-deploy** :
   ```bash
   curl -X POST https://diag-tertiaire.fr/api/indexnow \
     -H "Content-Type: application/json" \
     -d '{"urls":["https://diag-tertiaire.fr/","https://diag-tertiaire.fr/methode"]}'
   ```
   Reponse attendue : `{"status":"ok","notified":2}`

6. **Integration au workflow blog** : ajouter un step Astro post-build qui ping `/api/indexnow` avec les nouvelles URLs publishees (cf. `astro.config.mjs`).

**Validation** :
- `https://diag-tertiaire.fr/<key>.txt` retourne la cle
- POST `/api/indexnow` retourne 200
- Bing Webmaster Tools : verifier reception de la notification (delai 24-48h)

**Commit** : `feat(seo): implemente IndexNow endpoint et notification cle Bing/Yandex`

---

## Phase 4 - Content pillar (1-2 semaines)

### Positionnement produit (lecture obligatoire avant Phase 4)

**Cible primaire** : TPE/PME tertiaires **<1000 m²** (commerces, restaurants, hotels independants, bureaux PME, cabinets medicaux).

**Cible secondaire** : Property Managers multi-sites avec dossiers <1000 m² majoritaires.

**Out of scope** : >=1000 m² assujettis au Decret Tertiaire (besoin d'audits NF EN 16247 certifies a 8 000-30 000 EUR, pas d'un pre-diag a +/- 20 %).

**Cas d'usage secondaire tolere** : visiteur >=1000 m² qui utilise DiagTertiaire en cadrage prealable a son audit certifie. Overflow naturel, pas une cible commerciale.

**Conformite editoriale Phase 4** :
- Disclaimer transparent recurrent dans chaque article : "DiagTertiaire est un pre-diagnostic a +/- 20 % de precision, pas un audit certifie. Pour les obligations reglementaires (Decret Tertiaire >=1000 m², audits L.233-1), faire appel a un bureau d'etudes certifie OPQIBI 1905 ou LNE."
- Cas pratique chiffre dans CHAQUE article (surface, conso kWh/an, economies EUR/an, ROI). Format "exemple type" ou "simulation indicative" - pas de pseudo-cas client (pas de donnees proprietaires fournies).
- Glossary box en bas de chaque article (4-5 termes cles) : CABS ADEME, CEE, ARENH, kWhEP, OPERAT. Format Q&A autonome pour citation Perplexity / ChatGPT.
- Cible mots-cles sur la longue traine de conversion : "economies energie tertiaire TPE", "audit energetique commerce", "facture energie entreprise 2026", "reduire charges energie petite entreprise". Pas de focus "decret tertiaire" (vanity).

**Reformulation TASK-019, TASK-020, TASK-021, TASK-023** : voir versions ci-dessous (post-correction du 2026-04-27, voir AUDIT-REPORT.md section 4.1 pour la justification).

**TASK-022 enrichir 5 articles** : INCHANGE (les 5 articles cibles sont deja alignes <1000 m²).

---

### TASK-019 - Creer page pilier /economies-energie-tertiaire-tpe-pme (2 500+ mots)

**Priorite** : Critical (impact SXO maximum sur cible commerciale reelle)
**Effort** : 8 h (redaction + integration + schema)
**Categorie** : content / sxo / geo
**Pre-lecture** :
- `c:\Users\yanni\Downloads\Diag-tertaireV3\methode.html` (pattern de page editoriale)
- `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html` (head pattern, fonts, CSS)
- `c:\Users\yanni\Downloads\Diag-tertaireV3\sitemap-pages.xml`
- AUDIT-REPORT.md section 4.1 (justification du repositionnement)

**Action** : Write nouveau fichier `c:\Users\yanni\Downloads\Diag-tertaireV3\economies-energie-tertiaire-tpe-pme.html`

**Plan editorial** :

- **H1** : "Reduire la facture energie d'un local tertiaire de moins de 1 000 m² : leviers, aides, retour sur investissement"
- **TL;DR** (160 mots, encadre bleu en debut de page) : segment cible, drivers economiques 2026 (CRE, fin ARENH, hausses CEE), gisement typique 15-30 % de baisse facture, aides mobilisables, CTA pre-diagnostic. Mention explicite "Si vous gerez moins de 1 000 m² de surface tertiaire, le Decret Tertiaire ne s'applique pas a vous".
- **H2 : Etes-vous concerne ?** (2 paragraphes max - DISQUALIFICATION RAPIDE du Decret Tertiaire)
  - "Le Decret Tertiaire (loi ELAN, decret 2019-771) impose une reduction de consommation aux batiments tertiaires de **plus de 1 000 m²** uniquement. Si vous gerez moins de 1 000 m², ce decret ne vous concerne pas."
  - "En revanche, en 2026, voici les vrais drivers economiques qui pesent sur votre facture energetique : [bullet list courte vers H2 suivant]"
- **H2 : Les vrais drivers economiques en 2026 pour les TPE/PME tertiaires**
  - Fin ARENH 31 dec 2025 : impact +30 a 50 EUR/MWh sur le prix de l'electricite professionnelle
  - TURPE 6 (CRE deliberation 2025) : evolution composante acheminement
  - Hausses CEE 5e periode (2025-2030) : objectifs releves
  - DPE bail commercial >= 6 ans (article L.134-3-1 CCH) : obligation existante depuis 2022, ignoree par 70% des bailleurs (chiffre INSEE/ADEME)
  - Sources : CRE.fr, ADEME, Legifrance
- **H2 : Les 5 leviers majeurs sous 1 000 m²** (avec ROI typique chiffre)
  - LED + commande presence : ROI 1-2 ans, gain 30-50 % poste eclairage
  - Isolation parois opaques + menuiseries : ROI 5-8 ans selon batiment
  - PAC air-eau (substitution chaudiere gaz/fioul) : ROI 4-7 ans
  - GTB (gestion technique batiment) : ROI 3-5 ans, gain 10-15 % chauffage/clim
  - Sensibilisation occupants + planning programmateurs : gain 5-10 % zero capex
  - Tableau recap : levier / surface min recommandee / capex typique / gain annuel / ROI
- **H2 : Aides 2026 accessibles aux TPE/PME tertiaires** (lien interne TASK-020)
  - CEE Tertiaire 5e periode (BAT-EN-XXX standardises)
  - MaPrimeRenov' Tertiaire (TPE/PME, plafonds, conditions)
  - BPI prets verts
  - ADEME Tremplin (selon AMI sectoriels)
  - Aides regionales (5 regions principales)
  - Cumul des aides : regles, plafonds
  - Lien interne vers TASK-020 pour le detail complet
- **H2 : DPE bail commercial : l'obligation qui vous concerne deja**
  - Decret 2022-1272 du 29 sept 2022 : DPE obligatoire pour toute mise en location ou vente d'un local commercial >= 50 m²
  - Sanctions : amende administrative jusqu'a 3 000 EUR (personne physique) / 15 000 EUR (personne morale)
  - Reference Legifrance article L.134-3-1 CCH
  - Liens vers articles blog DiagTertiaire deja ecrits sur DPE bail commercial
- **H2 : Quand un audit reglementaire devient pertinent**
  - Article L.233-1 Code de l'energie : grandes entreprises tertiaires (>= 250 ETP ou >= 50 M EUR CA) tous les 4 ans
  - Audit volontaire NF EN 16247 : si vous voulez un document opposable (cession, certification ISO 50001, candidature appels d'offres)
  - Bureaux d'etudes certifies OPQIBI 1905 ou LNE Audit Energetique
  - Reference neutre, pas un upsell : DiagTertiaire couvre le besoin pour 80 % des TPE/PME
- **H2 : Comment commencer avec DiagTertiaire**
  - 3 minutes, gratuit, sans inscription
  - Base CABS ADEME (la meme que celle d'OPERAT)
  - Precision +/- 20 %, suffisant pour decider d'un investissement
  - CTA pre-diagnostic
- **Glossary box bas de page** (5 termes) : CABS ADEME, CEE, ARENH, kWhEP, DPE bail commercial. Format Q&A autonome.

**Sources obligatoires inline** (>=5) :
- Legifrance article L.111-10-3 CCH (Decret Tertiaire pour disqualification)
- Legifrance article L.134-3-1 CCH (DPE bail commercial)
- Legifrance article L.233-1 Code energie (audit grande entreprise)
- ADEME page CABS / Tremplin
- CRE.fr deliberations TURPE 6 + fin ARENH
- ecologie.gouv.fr communiques 2026

**Cas pratique chiffre obligatoire** : exemple type "commerce de detail 400 m² Bordeaux, conso 90 kWh/m²/an gaz + 60 kWh/m²/an elec, simulation gain LED + GTB + isolation = 18 % de baisse facture, ROI cumule 3,5 ans".

**Disclaimer transparent** : "DiagTertiaire est un pre-diagnostic a +/- 20 % de precision, pas un audit certifie. Pour les obligations reglementaires (Decret Tertiaire >=1000 m², audits L.233-1), faire appel a un bureau d'etudes certifie OPQIBI 1905 ou LNE."

**JSON-LD a inclure** :
- `Article` (TechArticle plus precis) avec datePublished, dateModified, author Person `@id` partage `https://diag-tertiaire.fr/#author-yannis-cherchali`, publisher Organization `@id` `https://diag-tertiaire.fr/#organization`
- `FAQPage` (5 Q&A specifiques TPE/PME : eligibilite, ROI typique, aides, DPE bail, audit obligatoire)
- `BreadcrumbList` (Accueil > Economies energie tertiaire TPE/PME)

**Ajouter URL au sitemap-pages.xml** :
```xml
<url>
  <loc>https://diag-tertiaire.fr/economies-energie-tertiaire-tpe-pme</loc>
  <lastmod>2026-XX-XX</lastmod>
</url>
```

**Validation** :
- Lighthouse SEO 100/100
- https://validator.schema.org/ : 0 erreur
- Densite factuelle : >= 8 chiffres + 5 sources officielles inline
- Mots-cles principaux en H1 + slug + meta description : "economies energie tertiaire", "TPE PME", "facture energie"

**Commit** : `feat(content): cree page pilier /economies-energie-tertiaire-tpe-pme (SXO TPE/PME)`

---

### TASK-020 - Creer article guide "Aides renovation energetique tertiaire 2026 TPE/PME"

**Priorite** : High
**Effort** : 4 h
**Categorie** : content / sxo / geo
**Pre-lecture** :
- `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\content\blog\` (pattern frontmatter, longueur)
- `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\layouts\BlogPost.astro`
- AUDIT-REPORT.md section 4.1 (justification cible TPE/PME)

**Action** : Write nouveau fichier `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\content\blog\aides-renovation-energetique-tertiaire-2026-tpe-pme.md`

**Plan editorial** :
- Frontmatter : `title`, `description` (155 chars max), `date`, `author: "Yannis Cherchali"`, `image: "/blog/aides-renovation-energetique-tertiaire-2026-tpe-pme.webp"` (image hero a creer cote blog dans `public/<slug>.webp` racine), `imageAlt`, `tags: [aides 2026, CEE, MaPrimeRenov, BPI, ADEME, TPE PME]`, `faq` (array 5 Q&A pour FAQPage genere)
- 1 800+ mots
- **Position de fond** : focus exclusif sur les aides applicables au segment <1000 m² TPE/PME. Toute aide listee doit avoir un seuil d'eligibilite couvrant TPE/PME.

**Structure H2** :
- Intro (150 mots) : pourquoi se poser la question des aides en 2026 (drivers economiques + plafond aide cumulee)
- **H2 : CEE Tertiaire 5e periode (2025-2030)**
  - Operations standardisees BAT-EN-XXX accessibles aux TPE/PME
  - Bonifications "coups de pouce" (CDP)
  - Comment valoriser : plateforme obliges (EDF, Engie, Total, etc.) ou delegataire
  - Exemple chiffre : commerce 400 m² installation LED + GTB = 4 000-7 000 EUR de prime CEE
- **H2 : MaPrimeRenov' Tertiaire**
  - Conditions d'eligibilite TPE/PME : critere effectif (< 250 ETP), critere CA (< 50 M EUR), critere total bilan
  - Plafonds par operation et par batiment
  - Operations couvertes (isolation, chauffage, ECS, ventilation, audit energetique)
  - Cumul possible avec CEE
- **H2 : BPI France prets verts (Pret Vert ADEME)**
  - Montants : 50 000 EUR - 1 M EUR
  - Duree 3-10 ans, taux bonifie
  - Eligibilite TPE/PME : tres ouvert, juste critere de solvabilite
  - Cumul avec CEE et MaPrimeRenov possible
- **H2 : ADEME Tremplin et AMI sectoriels**
  - Tremplin pour les TPE/PME (subvention forfaitaire jusqu'a 200 000 EUR pour les economies d'energie)
  - AMI sectoriels (CHR / commerce / sante) selon calendrier ADEME
- **H2 : Aides regionales (focus 5 regions)**
  - Ile-de-France : aides Region IDF, fonds Climat
  - Auvergne-Rhone-Alpes : Eco Energie Tertiaire AURA
  - Hauts-de-France : aides energie pour TPE
  - Occitanie : Eco-Energie Tertiaire Occitanie
  - PACA : aides energie + transition ecologique
  - Renvoi vers AMI regionaux pour les autres regions
- **H2 : Cumul des aides - les regles a connaitre**
  - Plafond global aide publique (regime de minimis : 200 000 EUR sur 3 ans glissants)
  - Cumul CEE + MaPrimeRenov : OUI sous conditions
  - Cumul aide regionale + nationale : verifier doublons
  - Tableau de synthese cumul autorise / interdit
- **H2 : Cas pratique chiffre - commerce 400 m² Bordeaux**
  - Surface, conso annuelle, scenario travaux (LED + GTB + isolation toiture)
  - Capex total HT : 18 000 EUR
  - CEE estime : 4 200 EUR
  - MaPrimeRenov estimee : 1 800 EUR
  - Reste a charge : 12 000 EUR
  - Economies annuelles : 3 200 EUR/an
  - ROI net (apres aides) : 3,75 ans
  - Mention "Exemple type, pas un cas client reel"
- **H2 : Comment cadrer les aides avec DiagTertiaire**
  - Le pre-diagnostic identifie les actions prioritaires + estime les aides mobilisables
  - Le rapport PDF sert de base au cahier des charges du bureau d'etudes
  - CTA pre-diagnostic
- **Glossary box bas de page** : CEE, BAT-EN-XXX, regime de minimis, MaPrimeRenov Tertiaire, AMI ADEME

**Sources obligatoires inline** (>=4) :
- ADEME page CEE 5e periode
- ADEME page MaPrimeRenov Tertiaire
- bpifrance.fr page Pret Vert
- ecologie.gouv.fr communiques aides 2026
- Legifrance regime de minimis (reglement UE 1407/2013)

**Densite factuelle cible** : >= 10 chiffres + 4 sources officielles.

**Disclaimer transparent** : "Les montants et conditions des aides 2026 sont indicatifs au [date publication]. Verifier les conditions actualisees aupres de l'organisme avant tout engagement."

**Schema** : BlogPosting (auto via BlogPost.astro), FAQPage (auto si frontmatter `faq` rempli).

**Validation** :
- Build local Astro reussi, article visible en `/blog/aides-renovation-energetique-tertiaire-2026-tpe-pme/`
- HTML genere contient les 2 schemas
- Lighthouse SEO 100/100
- Image hero `public/aides-renovation-energetique-tertiaire-2026-tpe-pme.webp` (racine, pas /blog/ - cf. convention agent blog) deposee a la racine du repo blog AVANT publication
- Validateur em-dash `python scripts/validate_article.py <slug>.md` retourne 0

**Commit** : `feat(content): article aides renovation energetique tertiaire 2026 TPE/PME`

---

### TASK-021 - Etoffer methode.html (1 200+ mots) avec positionnement <1000 m²

**Priorite** : High
**Effort** : 3 h
**Categorie** : content
**Pre-lecture** :
- `c:\Users\yanni\Downloads\Diag-tertaireV3\methode.html` (~180 mots actuellement)
- AUDIT-REPORT.md section 4.1 (positionnement cible)

**Action** : Edit pour enrichir le contenu existant en positionnant explicitement DiagTertiaire sur le segment <1000 m² + cas d'usage secondaire >=1000 m² (cadrage prealable audit certifie).

**Corriger H1** : "Une estimation utile pour decider" -> "Methodologie du pre-diagnostic energetique tertiaire" (gain keyword + accent ajoute)

**H2 nouveau (a inserer en debut, juste apres l'intro) - "Pour qui DiagTertiaire est-il concu ?"** :
- "Principalement pour les batiments tertiaires de moins de 1 000 m² : commerces, restaurants, hotels independants, bureaux PME, cabinets medicaux."
- "Utilisable egalement en cadrage prealable par les batiments >= 1 000 m² assujettis au Decret Tertiaire, en complement (et non en remplacement) d'un audit reglementaire NF EN 16247."
- "DiagTertiaire ne remplace pas un audit certifie, un DPE ou une etude thermique reglementaire. C'est un outil d'estimation rapide pour decider d'un investissement ou cadrer un cahier des charges."

**Sections a developper / enrichir** :
- **H2 : Sources de donnees** (CABS ADEME, OID Observatoire Immobilier Durable, Base Carbone ADEME 2024) avec liens directs et reference chronologique des MAJ
- **H2 : Benchmarks chiffres par typologie** :
  - Tableau HTML : bureaux 150 kWh/m²/an, restaurants 300 kWh/m²/an, hotels 200 kWh/m²/an, commerces alim 180 kWh/m²/an, commerces non-alim 130 kWh/m²/an, entrepots 80 kWh/m²/an, sante 250 kWh/m²/an, enseignement 110 kWh/m²/an
  - Sources par typologie (CABS sectoriel + OID)
- **H2 : Limites de precision et fiabilite**
  - Precision +/- 20 % attendue
  - Conditions ou la precision se degrade : batiments mixtes activites multiples, zones climatiques extremes, batiments tres anciens (avant 1948), patrimoine atypique
  - Cas ou le pre-diag ne se substitue PAS a un audit
- **H2 : Difference pre-diagnostic / DPE / audit reglementaire** :
  - Tableau comparatif HTML : type document / duree / cout / opposabilite / certification professionnelle / domaine d'application
  - Pre-diagnostic DiagTertiaire : 3 min / gratuit / non opposable / + ou - 20 %
  - DPE bail commercial : 1 jour / 200-400 EUR / opposable (annexe au bail) / certifie OPQIBI 1330
  - Audit reglementaire NF EN 16247 : 1-3 mois / 800-3000 EUR / opposable / certifie OPQIBI 1905 ou LNE
  - Reference NF EN 16247 + Article L.233-1 Code energie + Decret 2022-1272 (DPE bail commercial)
- **H2 : Methodologie de cumul des gains**
  - Cumul sequentiel (non additif), reflete l'effet d'amortissement
  - Reference fichier source `src/engine.js` (lien GitHub si public, sinon mention "moteur de calcul source unique")
  - Plafond technique MAX_TOTAL_SAVINGS_PCT (cap ADEME)
- **H2 : Quand passer a un audit certifie** (reference neutre, pas un upsell)
  - Article L.233-1 Code energie : grandes entreprises (>= 250 ETP ou >= 50 M EUR CA) tous les 4 ans
  - Audit volontaire NF EN 16247 utile : cession, certification ISO 50001, candidature appels d'offres, montage projet > 50 000 EUR HT
  - Bureaux d'etudes certifies OPQIBI 1905 / LNE Audit Energetique
  - **Position editoriale claire** : "DiagTertiaire est suffisant pour 80 % des TPE/PME tertiaires. Si vous remplissez un des criteres ci-dessus, faites appel a un bureau d'etudes certifie."
  - PAS d'upsell vers un partenaire commercial. Reference neutre uniquement.

**Garder** :
- Layout et CSS existants
- HowTo schema (TASK-008)
- TechArticle schema (TASK-009) - mais mettre a jour `dateModified` apres edition

**Validation** :
- Lighthouse SEO 100
- Densite factuelle : >= 5 chiffres + 3 sources officielles
- Mention explicite "moins de 1 000 m²" en H2 dedie
- Pas d'upsell commercial

**Commit** : `feat(content): etoffe methode avec positionnement <1000 m² + benchmarks + sources`

---

### TASK-022 - Enrichir 5 articles blog non conformes Gemini

**Priorite** : High
**Effort** : 4 h cumulees (~45 min/article)
**Categorie** : content
**Pre-lecture** :
- `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\content\blog\facture-electricite-local-commercial-postes-depense.md`
- `...\hotel-economies-energie-tertiaire.md`
- `...\plan-electrification-2026-annonces-realite-facture.md`
- `...\reduire-facture-energetique-commerce.md`
- (+1 article PARTIEL : `crise-ormuz-2026-impact-facture-energie.md`)

**Action** : Edit chaque article pour atteindre seuil Gemini (>= 3 chiffres + 2 sources officielles avec lien)

Pour chaque article :
1. Identifier les chiffres existants. Confirmer ou corriger en croisant CRE / ADEME / INSEE.
2. Ajouter au minimum 2 liens sortants vers source officielle ([CRE](https://www.cre.fr), [ADEME](https://www.ademe.fr), [Legifrance](https://www.legifrance.gouv.fr), [INSEE](https://www.insee.fr)).
3. Pour `hotel-economies-energie-tertiaire.md` et `reduire-facture-energetique-commerce.md` : ajouter `author: "Yannis Cherchali"` dans le frontmatter (corrige aussi C3 du content audit).
4. Ajouter un encadre `> Chiffre cle : <stat> (source : <institution>, <date>)` pour la citation LLM-friendly.

**Validation** : pour chaque article, recompter chiffres + sources. Confirmer >= 3 + 2.

**Commit (un par article ou un commit groupe)** : `fix(content): enrichit X article avec chiffres et sources officielles (seuil Gemini)`

---

### TASK-023 - Maillage interne articles blog -> pages root

**Priorite** : Medium
**Effort** : 2 h
**Categorie** : content / sxo
**Pre-lecture** : 11 articles + page pillar `/economies-energie-tertiaire-tpe-pme` (TASK-019)

**Action** : pour chaque article, ajouter 2-3 liens internes contextuels :
- Vers la page pilier `/economies-energie-tertiaire-tpe-pme` (apparait quand "economies energie", "TPE/PME", "facture energie tertiaire" ou contexte equivalent est mentionne)
- Vers `/methode` (apparait quand methodologie est mentionnee)
- Vers `/exemple-rapport` (apparait quand "rapport PDF" ou exemple est mentionne)
- Vers le futur article aides 2026 (TASK-020) (quand "aides", "CEE", "MaPrimeRenov" ou "BPI" est mentionne)

Exemple de transformation :
- Avant : "Reduire la facture energie d'un commerce passe par plusieurs leviers (LED, isolation, GTB)."
- Apres : "Reduire la [facture energie d'un commerce](https://diag-tertiaire.fr/economies-energie-tertiaire-tpe-pme) passe par plusieurs leviers (LED, isolation, GTB)."

**Validation** : verifier que chaque article a >= 2 liens internes contextuels (pas un simple CTA bouton).

**Commit** : `feat(content): renforce maillage interne articles blog vers pages pillar`

---

## Phase 5 - SXO / Visual / Industriel

### TASK-024 - Bloc "Decret Tertiaire vous concerne" dans landing

**Priorite** : High
**Effort** : 2 h
**Categorie** : sxo
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html`

**Action** : Edit - inserer une nouvelle section apres "Comment ca marche" et avant la FAQ

**Maquette HTML** (a integrer dans le style Tailwind de la landing) :

```html
<section class="py-16 bg-blue-50">
  <div class="max-w-4xl mx-auto px-6">
    <h2 class="text-3xl font-bold mb-6">Le Decret Tertiaire vous concerne ?</h2>
    <p class="text-lg mb-6">Si votre batiment ou ensemble de batiments tertiaires depasse <strong>1 000 m2 de surface de plancher</strong>, vous etes assujetti au Decret Tertiaire (loi ELAN, 2019). Vous devez declarer chaque annee vos consommations sur la plateforme <a href="https://operat.ademe.fr" rel="noopener">OPERAT</a> et atteindre les objectifs suivants :</p>

    <table class="w-full mb-6 border">
      <thead class="bg-blue-100">
        <tr>
          <th class="p-3 text-left">Echeance</th>
          <th class="p-3 text-left">Reduction de consommation requise</th>
        </tr>
      </thead>
      <tbody>
        <tr><td class="p-3 border-t">2030</td><td class="p-3 border-t">-40 pourcent par rapport a une annee de reference (2010-2019)</td></tr>
        <tr><td class="p-3 border-t">2040</td><td class="p-3 border-t">-50 pourcent</td></tr>
        <tr><td class="p-3 border-t">2050</td><td class="p-3 border-t">-60 pourcent</td></tr>
      </tbody>
    </table>

    <p class="mb-6"><strong>Sanctions</strong> : amende administrative jusqu'a 1 500 EUR (PME) ou 7 500 EUR (grandes entreprises) en cas de non-declaration ou non-respect (article L.111-10-3 CCH).</p>

    <p class="mb-6">DiagTertiaire vous aide a faire le premier pas : un pre-diagnostic gratuit en 3 minutes pour evaluer votre ecart aux objectifs et planifier vos travaux.</p>

    <div class="flex gap-4">
      <a href="/decret-tertiaire" class="btn-secondary">En savoir plus sur le Decret</a>
      <a href="#diagnostic" class="btn-primary">Lancer mon pre-diagnostic</a>
    </div>
  </div>
</section>
```

**Validation** :
- Ajout visible above-fold mobile, contenu indexable cote crawler
- Mot-cle "Decret Tertiaire" present dans la page (gain SXO immediat)

**Commit** : `feat(sxo): ajoute section Decret Tertiaire dans landing avec tableau echeances`

---

### TASK-025 - Bloc Property Manager visible dans landing

**Priorite** : Medium
**Effort** : 1 h
**Categorie** : sxo
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html`

**Action** : Edit - ajouter une bande "Multi-sites" en bas de section produit, avant la FAQ

**Maquette** :

```html
<section class="py-12 bg-slate-900 text-white">
  <div class="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
    <div class="flex-1">
      <h2 class="text-2xl font-bold mb-3">Vous gerez plusieurs sites tertiaires ?</h2>
      <p class="mb-4">L'espace professionnel DiagTertiaire centralise vos diagnostics, exporte vos donnees au format OPERAT, et personnalise les rapports a votre marque.</p>
      <ul class="list-disc pl-6 mb-6 text-slate-200">
        <li>Tableau de bord consolide multi-sites</li>
        <li>Rapport PDF personnalise (logo, couleurs)</li>
        <li>Export OPERAT-ready</li>
        <li>Gestion par dossier client</li>
      </ul>
      <a href="/espace-professionnel" class="btn-primary">Decouvrir l'espace Pro</a>
    </div>
    <div class="flex-1">
      <!-- Optionnel : screenshot dashboard Pro ou icone -->
    </div>
  </div>
</section>
```

**Validation** : section visible mobile + desktop, lien vers `/espace-professionnel` fonctionnel.

**Commit** : `feat(sxo): ajoute bloc Multi-sites dans landing pour persona Property Manager`

---

### TASK-026 - Couleur CTA coherente (amber -> bleu)

**Priorite** : Medium
**Effort** : 30 min
**Categorie** : visual / brand
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html` (CTA hero, classes Tailwind ou inline style)

**Action** : Edit - aligner le CTA hero sur le bleu du reste du site

Localiser :
```html
<button class="... bg-gradient-to-r from-[#D97706] to-[#B45309] ...">Obtenir mon comparatif gratuit</button>
```

Remplacer par :
```html
<button class="... bg-gradient-to-r from-[#1D4ED8] to-[#1E40AF] ...">Lancer mon pre-diagnostic</button>
```

**Note** : choisir entre 2 strategies : (a) tout en bleu pour coherence, (b) tout en amber pour distinction. Recommandation : option (a) bleu, plus business B2B et coherente avec /methode et /exemple-rapport.

**Validation** : screenshot before/after, valider avec Yannis avant commit.

**Commit** : `style: aligne CTA hero landing sur la couleur primaire bleu`

---

### TASK-027 - Hamburger menu mobile sur methode.html

**Priorite** : Medium
**Effort** : 1 h
**Categorie** : visual / mobile UX
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\methode.html` (nav actuelle), `index.html` (pattern hamburger existant)

**Action** : Edit - dupliquer le composant nav de la landing avec hamburger mobile

**Implementation** : copier le bloc `<nav>...</nav>` complet de `index.html` (incluant le `<button class="hamburger">`) vers `methode.html`. Garder le menu desktop existant sous `md:flex`.

**Validation** : DevTools mobile 375px : menu hamburger fonctionnel, liens vers /, /exemple-rapport, etc. accessibles.

**Commit** : `fix(mobile): ajoute hamburger menu mobile sur /methode pour parite avec landing`

---

### TASK-028 - Nettoyer changefreq/priority + lastmod reels sitemap

**Priorite** : Low
**Effort** : 30 min
**Categorie** : technical
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\sitemap-pages.xml`

**Action** : Edit - 2 modifications

**1. Supprimer toutes les balises `<changefreq>` et `<priority>`** (Google les ignore).

**2. Mettre les `<lastmod>` reels** depuis git :
```bash
git log -1 --format=%ai -- index.html
git log -1 --format=%ai -- methode.html
# etc.
```

Format ISO 8601 : `2026-04-20T15:30:00+02:00`.

**Validation** : `curl https://diag-tertiaire.fr/sitemap-pages.xml` apres deploy montre lastmod differents pour chaque URL.

**Commit** : `chore(seo): nettoie sitemap-pages.xml (lastmod reels, retire changefreq/priority ignores)`

---

### TASK-029 - SSR / noscript fallback exemple-rapport

**Priorite** : Medium
**Effort** : 2 h
**Categorie** : visual / seo
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\exemple-rapport.html`

**Action** : Edit - ajouter contenu HTML statique minimal pour crawler et user sans JS

**Avant** (probable) :
```html
<div id="root"></div>
```

**Apres** :
```html
<div id="root">
  <!-- Fallback SSR-equivalent pour crawler et utilisateur sans JS -->
  <h1>Exemple de rapport DiagTertiaire</h1>
  <p>Decouvrez le format du rapport PDF que vous obtenez avec DiagTertiaire : positionnement par rapport aux references CABS ADEME, 3 actions prioritaires chiffrees, projection sur 10 ans, principales aides mobilisables.</p>
  <a href="/" class="btn-primary">Lancer mon pre-diagnostic</a>
  <noscript>
    <p style="background:#fef3c7;padding:1rem;">Cet apercu interactif necessite JavaScript. Vous pouvez tout de meme telecharger un exemple PDF statique : <a href="/exemple-rapport.pdf">Telecharger</a>.</p>
  </noscript>
</div>
```

**Bonus** : generer un PDF statique `exemple-rapport.pdf` deposable a la racine pour le fallback noscript.

**Validation** :
- `curl https://diag-tertiaire.fr/exemple-rapport | grep -A 3 "<h1"` : H1 present dans le HTML brut
- DevTools : disable JS, recharger : H1 + CTA visibles

**Commit** : `feat(seo): ajoute fallback HTML statique sur exemple-rapport pour crawler et noscript`

---

### TASK-030 - font-size mobile 15 -> 16px

**Priorite** : Low
**Effort** : 5 min
**Categorie** : visual / mobile UX
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html`, `diagnostic.html` (rechercher `@media (max-width: 768px)` + `body { font-size:`)

**Action** : Edit - remplacer `15px` par `16px`

```css
@media (max-width: 768px) {
  body { font-size: 16px; }
}
```

**Commit** : `fix(a11y): font-size mobile 16px (lisibilite WCAG)`

---

## Tasks groupees Low (a executer en un commit)

### TASK-LOW - Corrections mineures

**Effort** : 30 min cumulees

1. **Supprimer `will-change: transform` persistant sur `.cta-pulse`** : utiliser uniquement pendant l'animation (ajouter / retirer en JS) ou supprimer tout court.
2. **Verifier path `/public/bic-montpellier.svg`** dans diagnostic.html footer : si 404 en prod, remplacer par `/bic-montpellier.svg`.
3. **Ajouter `<noscript>` fallback** dans diagnostic.html (similaire TASK-029).
4. **ContactPoint Organization** : ajouter `email: "contact@diag-tertiaire.fr"` ou `url: "https://diag-tertiaire.fr/contact"` (creer la page si necessaire).
5. **Ajouter `<link rel="preconnect" href="https://unpkg.com" crossorigin>`** dans `<head>` de diagnostic.html et exemple-rapport.html pour reduire le RTT CDN.

**Commit** : `chore(seo): corrections mineures (will-change, path bic, noscript, contactPoint, preconnect)`

---

## Addendum GSC (post-Phase 1)

Trois taches structurelles identifiees apres le deploiement de la Phase 1, suite a un signal "Page avec redirection - validation echouee" remonte par Google Search Console. Voir `AUDIT-REPORT.md` section 5 pour le contexte complet.

### TASK-031 - Forcer politique trailing-slash unique

**Priorite** : High
**Effort** : 10 min
**Categorie** : technical / seo
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\vercel.json`

**Note CLAUDE.md** : `vercel.json` est dans la liste des fichiers a ne pas modifier sans validation explicite. **DEMANDER A YANNIS AVANT D'EXECUTER** cette tache. Presenter le diff exact propose et attendre l'accord.

**Constat** : `https://diag-tertiaire.fr/methode/` ET `https://diag-tertiaire.fr/methode` retournent toutes deux 200 sans redirection vers une canonique unique. Duplicate content sur tous les chemins propres.

**Action propose** : Edit dans `vercel.json` - ajouter `"trailingSlash": false` au top-level (a cote de `"cleanUrls": true`).

**Diff attendu** :
```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  ...
}
```

**Validation post-deploy** :
- `curl -I https://diag-tertiaire.fr/methode/` doit renvoyer `308 -> /methode`
- `curl -I https://diag-tertiaire.fr/methode` doit renvoyer `200`
- Egalement valider sur `/`, `/exemple-rapport`, `/espace-professionnel`, `/blog/<slug>`

**Commit** : `feat(seo): force politique trailing-slash unique (no-slash) pour eviter duplicate content`

**Hygiene** : OK, ajout d'une cle dans vercel.json. CHANGELOG.md a synchroniser. Pas de code mort, pas de doublon.

---

### TASK-032 - Gerer www -> apex en redirect 301 (configuration externe)

**Priorite** : Medium
**Effort** : 15 min (manipulation Vercel Dashboard)
**Categorie** : technical
**Pre-lecture** : DNS CNAME courant et configuration domaine Vercel.

**Constat** : `https://www.diag-tertiaire.fr/` ne resout pas (timeout). Si ce sous-domaine est soumis a GSC ou cite par un backlink mal forme, il declenchera "Erreur de serveur".

**Action manuelle Yannis** (non applicable par l'agent Claude) :

1. Vercel Dashboard > Project `diag-tertaireV3` > Settings > Domains
2. Add domain `www.diag-tertiaire.fr` (ou selectionner s'il est deja la)
3. Configurer en "Redirect to" -> selectionner `diag-tertiaire.fr` (HTTP 301 permanent)
4. Verifier DNS chez le registrar : CNAME `www -> cname.vercel-dns.com` (ou ALIAS apex selon registrar)
5. Attendre propagation (jusqu'a 24h max, generalement < 5 min Vercel)

**Validation** : `curl -ILs https://www.diag-tertiaire.fr/` doit renvoyer `301 -> https://diag-tertiaire.fr/`. Tester aussi sur `https://www.diag-tertiaire.fr/methode`.

**Commit** : N/A (configuration externe Vercel, pas de fichier projet impacte). Documenter le changement dans `CHANGELOG.md` apres validation deployment, sous une entree `chore(infra)`.

---

### TASK-033 - Audit GSC backlog "Page avec redirection" (manuel + documentation)

**Priorite** : Medium
**Effort** : 30 min (manipulation Google Search Console + redaction)
**Categorie** : seo / monitoring
**Pre-lecture** : etat courant Search Console > Indexation > Pages > "Page avec redirection".

**Constat** : les redirections HTTP -> HTTPS et `.html` -> clean URL sont CORRECTES. Les URLs en "validation echouee" doivent etre laissees en l'etat. Cliquer "Valider la correction" en boucle est contre-productif et peut etre interprete comme du spam de l'API GSC.

**Action manuelle Yannis** (non applicable par l'agent Claude) :

1. Ouvrir Google Search Console > Indexation > Pages > filtre "Page avec redirection - validation echouee"
2. Pour chaque URL listee, identifier la canonique cible (apres le 308) :
   - `http://...` -> `https://...`
   - `https://...page.html` -> `https://.../page` (cleanUrls)
   - `https://.../page/` -> `https://.../page` (apres TASK-031)
3. Tester chaque canonique via "Inspecter l'URL en direct" sur la canonique :
   - Si la canonique est `Indexee` : ne PAS relancer de validation, le statut est attendu et conforme
   - Si la canonique n'est PAS indexee : "Demander une indexation" sur la canonique uniquement (pas sur l'URL en redirection)
4. Documenter dans un nouveau fichier `c:\Users\yanni\Downloads\Diag-tertaireV3\seo-audit-2026-04\GSC-REDIRECT-AUDIT.md` :
   - Liste des URLs vues en "Page avec redirection"
   - Canonique cible deduite
   - Statut indexation de la canonique (Indexee / Decouverte / Exclue)
   - Action realisee (rien / demande indexation)
   - Date du check

**Validation** : presence du fichier `GSC-REDIRECT-AUDIT.md` dans `seo-audit-2026-04/` apres l'audit. Aucune action GSC retentee sur les URLs en redirection.

**Commit** : `docs(seo): documente l'audit GSC redirect backlog`

**Hygiene** : N/A (creation de doc), CHANGELOG.md a synchroniser.

---

## Validation finale globale

Apres execution de toutes les phases :

### 1. Tests automatiques

```bash
# Validation schema sur toutes les pages modifiees
curl https://diag-tertiaire.fr/ | python C:\Users\yanni\.claude\skills\seo-audit\scripts\parse_html.py
curl https://diag-tertiaire.fr/methode | python C:\Users\yanni\.claude\skills\seo-audit\scripts\parse_html.py
curl https://diag-tertiaire.fr/decret-tertiaire | python C:\Users\yanni\.claude\skills\seo-audit\scripts\parse_html.py

# CWV apres optimisations
python C:\Users\yanni\.claude\skills\seo-audit\scripts\pagespeed_check.py https://diag-tertiaire.fr/diagnostic
python C:\Users\yanni\.claude\skills\seo-audit\scripts\pagespeed_check.py https://diag-tertiaire.fr/exemple-rapport

# Robots IA accessibility
for ua in GPTBot OAI-SearchBot ClaudeBot PerplexityBot Google-Extended; do
  echo "=== $ua ==="
  curl -A "$ua" https://diag-tertiaire.fr/robots.txt
done

# IndexNow
curl -X POST https://diag-tertiaire.fr/api/indexnow \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://diag-tertiaire.fr/decret-tertiaire"]}'
```

### 2. Tests metier

- **Mode `#report=`** : ouvrir `https://diag-tertiaire.fr/diagnostic#report=<token>` (avec un token valide), verifier rendu identique pre/post modifications
- **Flux diagnostic complet** : remplir le formulaire bureau 500 m2 elec, generer rapport, telecharger PDF, comparer avec snapshot pre-modifications
- **3 scenarios moteur de CLAUDE.md** : `newDiagnosticBuildReportData(...)` sur bureau, restaurant, commerce - intensity > 0, actions.length >= 3, breakdown 100 pourcent

### 3. Tests visuels

- Lighthouse mobile + desktop sur les 6 pages root + page pilier + 3 articles blog
- Capture screenshots before/after dans `seo-audit-2026-04/screenshots-after/`
- Comparer scores Lighthouse before/after

### 4. Validation manuelle

- Submit `diag-tertiaire.fr` sur https://hstspreload.org/ (apres TASK-016)
- Soumettre sitemap sur Bing Webmaster Tools
- Submit page pilier `/decret-tertiaire` a la Google Search Console
- Verifier reception IndexNow notification dans Bing WMT (delai 24-48h)

### 5. Documentation

Apres chaque phase, mettre a jour :
- `c:\Users\yanni\Downloads\Diag-tertaireV3\CHANGELOG.md` : entree par phase listant les TASK-XXX appliquees
- `c:\Users\yanni\Downloads\Diag-tertaireV3\.claude\context\architecture.md` : si la structure du projet change (nouvelle page pillar, nouveau endpoint api/indexnow)
- `c:\Users\yanni\Downloads\Diag-tertaireV3\.claude\context\backlog.md` : retirer les tasks completees

### 6. Capturer une drift baseline

```bash
python C:\Users\yanni\.claude\skills\seo-audit\scripts\drift_baseline.py https://diag-tertiaire.fr
```

Permet de detecter automatiquement les regressions SEO lors des deploys futurs.

---

## Notes importantes pour l'agent executant

1. **Ne jamais modifier `src/engine.js`** sans validation explicite de Yannis (verrouille par CLAUDE.md).
2. **Demander a Yannis avant** de toucher `vercel.json`, `api/*.js`, `supabase/migrations/*.sql`.
3. **Toujours commiter par tache** ou par groupe coherent, jamais une seule grande modification massive.
4. **Tester chaque modification** avant le commit : preview Vercel, Lighthouse, validator schema.org.
5. **Mettre a jour CHANGELOG.md** dans le meme commit que la modification (regle CLAUDE.md hygiene #5).
6. **Pas de tiret long** dans les fichiers ecrits (regle CLAUDE.md). Utiliser `-` simple ou rephraser.
7. **Si une tache est bloquee** (manque d'info, ambiguite), creer une entree dans `.claude/context/backlog.md` avec raison et priorite.
