# Changelog - DiagTertiaire V3

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
