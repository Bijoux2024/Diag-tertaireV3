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

### TASK-019 - Creer page pilier /decret-tertiaire (2 500+ mots)

**Priorite** : Critical (impact SXO maximum)
**Effort** : 8 h (redaction + integration + schema)
**Categorie** : content / sxo / geo
**Pre-lecture** :
- `c:\Users\yanni\Downloads\Diag-tertaireV3\methode.html` (pattern de page editoriale courte)
- `c:\Users\yanni\Downloads\Diag-tertaireV3\index.html` (head pattern, fonts, CSS)
- `c:\Users\yanni\Downloads\Diag-tertaireV3\sitemap-pages.xml`

**Action** : Write nouveau fichier `c:\Users\yanni\Downloads\Diag-tertaireV3\decret-tertiaire.html`

**Plan editorial** (a executer avec un sous-agent specialise content si possible) :

- **H1** : "Decret Tertiaire 2030 / 2040 / 2050 : obligations, sanctions, declaration OPERAT"
- **TL;DR** (160 mots, debut de page) : surface concernee 1 000 m2, objectifs -40 / -50 / -60 pourcent, plateforme OPERAT, sanctions, lien vers le pre-diagnostic comme premier jalon
- **H2** : "Quels batiments sont concernes par le Decret Tertiaire ?"
  - Surface, type d'activite, regime locataire/proprietaire (responsabilite OPERAT)
  - Tableau HTML : seuils + exemples concrets (bureau 1500 m2, hotel 1200 m2, etc.)
- **H2** : "Quels sont les objectifs chiffres et les echeances ?"
  - Tableau echeances 2030 / 2040 / 2050 avec pourcentages
  - Methodes de calcul (valeur absolue Cabs vs valeur relative Crelat)
- **H2** : "Comment declarer sur OPERAT ?" (lien interne vers TASK-020 article guide)
  - Etapes synthetiques avec lien externe vers operat.ademe.fr
- **H2** : "Quelles sanctions en cas de non-conformite ?"
  - Mise en demeure, name and shame, amendes 1 500 EUR PME / 7 500 EUR ETI/GE
  - Reference Legifrance (article L.111-10-3 CCH)
- **H2** : "Quels sont les modulations possibles ? (Cm, Cmj)"
  - Cas patrimonial, contraintes techniques, cout disproportionne
- **H2** : "Comment commencer : pre-diagnostic gratuit DiagTertiaire"
  - CTA contextuel positionnant le pre-diag comme premier jalon avant audit/OPERAT

**Sources obligatoires inline** (au moins 5) : Legifrance, ADEME, ecologie.gouv.fr, OPERAT.ademe.fr, OID

**JSON-LD a inclure** :
- `Article` ou `WebPage` avec datePublished/dateModified
- `FAQPage` (5 questions sur le Decret Tertiaire)
- `BreadcrumbList`

**Ajouter URL au sitemap** : completer `sitemap-pages.xml` avec une entree :
```xml
<url>
  <loc>https://diag-tertiaire.fr/decret-tertiaire</loc>
  <lastmod>2026-04-27</lastmod>
</url>
```

**Validation** :
- Lighthouse SEO 100/100
- https://validator.schema.org/ valide
- Densite factuelle : >= 5 chiffres + 5 sources officielles
- Mot-cle "decret tertiaire" en H1 + slug + meta description

**Commit** : `feat(content): cree page pilier /decret-tertiaire (SXO + GEO)`

---

### TASK-020 - Creer article guide "Declaration OPERAT step-by-step"

**Priorite** : High
**Effort** : 4 h
**Categorie** : content / sxo / geo
**Pre-lecture** :
- `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\content\blog\` (pattern frontmatter, longueur)
- `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\layouts\BlogPost.astro`

**Action** : Write nouveau fichier `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\content\blog\declaration-operat-guide-complet.md`

**Plan** :
- Frontmatter : `title`, `description`, `date`, `author: "Yannis Cherchali"`, `imageAlt`, `faq` (array de Q&A pour le schema FAQPage genere)
- 1 800+ mots
- Structure step-by-step avec captures d'ecran (screenshots OPERAT a fournir par Yannis ou recreer)
- Schema HowTo (genere par BlogPost.astro si supporte, sinon ajouter inline)
- Densite factuelle : 5+ chiffres, 3+ sources officielles (operat.ademe.fr, legifrance, ADEME)
- CTA contextuel vers le pre-diagnostic (positionnement : "preparer la collecte de donnees OPERAT")

**Validation** :
- Build local Astro reussi, article visible en `/blog/declaration-operat-guide-complet/`
- HTML genere contient le schema HowTo + FAQPage
- Lighthouse SEO 100/100

**Commit** : `feat(content): article guide complet declaration OPERAT step-by-step`

---

### TASK-021 - Etoffer methode.html (1 200+ mots)

**Priorite** : High
**Effort** : 3 h
**Categorie** : content
**Pre-lecture** : `c:\Users\yanni\Downloads\Diag-tertaireV3\methode.html` (~180 mots actuellement)

**Action** : Edit pour enrichir le contenu existant

**Sections a developper** :
- Sources de donnees (CABS ADEME, OID, Base Carbone) avec liens directs
- Benchmarks chiffres par typologie (bureaux, restaurants, hotels, commerces) avec sources
- Limites de precision (+/- 20 pourcent, conditions)
- Lien explicite vers le Decret Tertiaire (TASK-019) et OPERAT
- Difference pre-diag vs DPE vs audit reglementaire (tableau comparatif HTML)
- Methodologie de cumul des gains (sequentielle non-additive, reference engine.js sans copie)

**Garder** :
- Layout et CSS existants
- HowTo schema (TASK-008)
- Article TechArticle schema (TASK-009)

**Corriger H1** : "Une estimation utile pour decider" -> "Methodologie du pre-diagnostic energetique tertiaire" (gain keyword + accent ajoute)

**Validation** :
- Lighthouse SEO 100
- Densite factuelle : >= 3 chiffres + 2 sources officielles

**Commit** : `feat(content): etoffe methode.html avec benchmarks chiffres et sources officielles`

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
**Pre-lecture** : 11 articles + page pillar `/decret-tertiaire` (TASK-019)

**Action** : pour chaque article, ajouter 2-3 liens internes contextuels :
- Vers la page pilier `/decret-tertiaire` (apparait quand "Decret Tertiaire" est mentionne)
- Vers `/methode` (apparait quand methodologie est mentionnee)
- Vers `/exemple-rapport` (apparait quand "rapport PDF" ou exemple est mentionne)
- Vers le futur article OPERAT (TASK-020) (quand OPERAT est mentionne)

Exemple de transformation :
- Avant : "Le Decret Tertiaire impose des reductions de 40 pourcent."
- Apres : "Le [Decret Tertiaire](https://diag-tertiaire.fr/decret-tertiaire) impose des reductions de 40 pourcent."

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
