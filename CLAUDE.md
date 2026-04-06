# CLAUDE.md - DiagTertiaire V3

> Ce fichier est lu automatiquement par Claude Code. Respecte TOUTES les regles ci-dessous.

## Lecture obligatoire avant toute action

1. Ce fichier (CLAUDE.md)
2. AI-CONTEXT.md (contexte projet complet)
3. .claude/context/architecture.md (architecture technique)

## Regles absolues

### Architecture
- **Buildless** : pas de bundler, pas de build step, pas d'import/export ES modules
- **Moteur de calcul** : source unique dans `src/engine.js`. JAMAIS de copie inline
- **Icones** : source unique dans `src/solar-icons.js`. JAMAIS de copie inline
- **Variables globales** : toutes les constantes et fonctions restent en scope global (window)

### Code
- **Pas de tiret long** (cadratin) dans le code ou le texte genere
- **Pas de division par zero**, pas de NaN, pas de undefined non gere
- **Cumul des gains sequentiel**, non additif
- **localStorage = fallback legacy**, Supabase = source de verite Pro

### Hygiene du code (CRITIQUE)

Avant CHAQUE commit, verifier ces 5 points :

1. **Zero code mort** : aucune fonction, variable ou bloc commente qui n'est plus appele. Si du code est remplace, le supprimer, pas le commenter.

2. **Zero doublon** : aucune fonction ou constante declaree dans deux fichiers differents (sauf exception documentee). Si un doute, grep dans tout le repo.

3. **Zero fichier orphelin** : aucun fichier qui n'est reference nulle part. Si un fichier est cree, il doit etre charge par un <script>, un import, ou reference dans la doc.

4. **Zero TODO non documente** : si un TODO est laisse dans le code, il doit etre ajoute dans .claude/context/backlog.md avec la raison et la priorite.

5. **Documentation synchronisee** : si une modification change la structure, les fichiers de doc doivent etre mis a jour dans le meme commit (AI-CONTEXT.md, CHANGELOG.md, architecture.md).

### Tests obligatoires

Toute modification du moteur (`src/engine.js`) doit etre testee avec ces 3 scenarios minimum :

```javascript
// Bureau 500m2 tout elec
newDiagnosticBuildReportData({ activity: 'offices', surface: '500', elecUsed: true, elecKwh: '100000', gasUsed: false, mainHeating: 'electric', hasCooling: true, ecsSameSystem: true, worksDone: [], buildingAge: 'post2012' });

// Restaurant 200m2 gaz+elec
newDiagnosticBuildReportData({ activity: 'restaurant', surface: '200', elecUsed: true, elecKwh: '40000', gasUsed: true, gasKwh: '30000', mainHeating: 'gas', hasCooling: true, ecsSameSystem: false, ecsSystem: 'electric_boiler', worksDone: [], buildingAge: '1975_2000' });

// Commerce alimentaire 1000m2
newDiagnosticBuildReportData({ activity: 'commerce_alim', surface: '1000', elecUsed: true, elecKwh: '200000', gasUsed: true, gasKwh: '50000', mainHeating: 'gas', hasCooling: true, ecsSameSystem: true, worksDone: [], buildingAge: 'pre1975' });
```

Chaque test doit retourner : intensity > 0, actions.length >= 3, aucun NaN, breakdown total = 100%.

### Conventions de commit

- `feat: description` pour une nouvelle fonctionnalite
- `fix: description` pour une correction de bug
- `refactor: description` pour du refactoring sans changement fonctionnel
- `chore: description` pour la maintenance (docs, config, nettoyage)
- `style: description` pour du CSS/UI pur

### Fichiers a ne jamais modifier sans validation explicite

- `src/engine.js` (moteur de calcul)
- `api/*.js` (endpoints serverless)
- `supabase/migrations/*.sql` (schema BDD)
- `vercel.json` (configuration deploiement)

### Fichiers a ne jamais casser

- Le mode `#report=` (partage de rapport sans auth)
- Le flux de diagnostic complet (formulaire -> rapport -> PDF)
- L'authentification Pro (Supabase)

## Structure du projet

```
/
├── index.html              # Landing + SPA diagnostic (8 700 lignes)
├── espace-professionnel.html # Espace Pro (moteur ENGINE_PRO independant)
├── public-report-print.html # Template PDF serveur
├── src/
│   ├── engine.js           # Moteur de calcul - SOURCE UNIQUE (2 420 lignes)
│   └── solar-icons.js      # Icones SVG - SOURCE UNIQUE (118 icones)
├── api/                    # Endpoints serverless Vercel
│   ├── _lib/               # Utilitaires partages (PDF renderer, Supabase, guard)
│   └── *.js                # Endpoints individuels
├── supabase/migrations/    # Schema BDD
├── docs/                   # Documentation technique
├── .claude/context/        # Contexte pour Claude Code
├── AI-CONTEXT.md           # Contexte complet pour toutes les IA
├── CLAUDE.md               # CE FICHIER - regles pour Claude Code
└── CHANGELOG.md            # Historique des modifications
```

## Workflow standard pour toute modification

1. Lire CLAUDE.md + AI-CONTEXT.md
2. Identifier les fichiers concernes
3. Verifier qu'aucune regle absolue n'est violee
4. Effectuer la modification
5. Verifier les 5 points d'hygiene (code mort, doublons, orphelins, TODO, docs)
6. Tester si le moteur est impacte (3 scenarios)
7. Mettre a jour CHANGELOG.md si le changement est significatif
8. Committer avec un message conventionnel
9. Verifier sur preview Vercel
