# Changelog - DiagTertiaire V3

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
- index.saaspro.html : icones SVG extraites, ENGINE_PRO reste inline (divergence acceptee)

### Modifie
- index.html charge engine.js et solar-icons.js via script tags
- index.saaspro.html charge solar-icons.js via script tag
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
