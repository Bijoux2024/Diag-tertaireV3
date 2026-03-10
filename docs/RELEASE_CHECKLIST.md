# Release Checklist (Prod)

Avant publication:

1. Verifier que seuls les fichiers attendus ont change.
2. Tester en local (`./scripts/serve-local.ps1`) sur:
   - mobile (largeur < 400px)
   - desktop
3. Si PDF: exporter un PDF et verifier:
   - titres lisibles
   - pas de chevauchement
   - pas de contenus manquants
4. Deploy preview (`./scripts/vercel-preview.ps1`) et valider le rendu en conditions reelles.
5. Merge vers `main` seulement apres validation.
6. Deploy prod (`./scripts/vercel-prod.ps1`) et verifier l'URL publique.

