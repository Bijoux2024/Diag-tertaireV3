# Workflow (Stable vs Dev)

Objectif: garder une version stable publiee et travailler en parallele, testable en local, puis publier uniquement quand c'est valide.

## Regles simples

- `main` (ou `master`) = version stable (production).
- Tout travail se fait dans une branche: `dev/<sujet>` ou `feature/<sujet>`.
- On teste en local, puis on pousse la branche.
- La production se fait uniquement apres merge vers `main`.

## Local (aucun impact prod)

Servir le dossier courant:

```powershell
./scripts/serve-local.ps1
```

Ou directement:

```powershell
npx serve .
```

## Vercel (preview vs prod)

Preview (recommande pour tester sans toucher au site public):

```powershell
./scripts/vercel-preview.ps1
```

Production (demande confirmation explicite):

```powershell
./scripts/vercel-prod.ps1
```

## Espace de travail "scratch"

Utiliser `scratch/` pour:

- copies temporaires
- essais rapides
- exports PDF
- notes

`scratch/` est ignore par git (ne sera pas commite).

