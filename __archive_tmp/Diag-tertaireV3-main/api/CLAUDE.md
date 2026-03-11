# CLAUDE.md — DiagTertiaire V3

## Mission
Tu travailles sur DiagTertiaire V3, un outil de pré-diagnostic énergétique tertiaire.
Objectif produit : formulaire gratuit 4 étapes → rapport indicatif → qualification de leads
revendus à des partenaires (agents immobiliers, bureaux d'études, installateurs RGE).
Espace Pro en marque blanche pour professionnels (agents immo, CCI, experts comptables).

## Règles absolues — ne jamais enfreindre
- Projet BUILDLESS — zéro npm, zéro webpack, zéro vite, zéro bundler
- Ne jamais toucher aux namespaces `NEW_DIAGNOSTIC_*`
- Ne jamais renommer les clés localStorage :
  `proAuth`, `proCases`, `proDiagDraft`, `proAccent`,
  `newDiagnosticLatestSubmission`, `newDiagnosticLatestReport`
- Ne jamais modifier `index.html.bak` et `index.html.final` (archives)
- Calcul moteur côté client uniquement — pas de migration serveur sans décision explicite
- Supabase : clé anon (`sb_publishable_*`) dans le frontend uniquement,
  clé secrète (`sb_secret_*`) uniquement dans `/api/*`
- Tester sur Vercel preview avant tout merge sur main

## Architecture des fichiers
Voir `.claude/context/architecture.md`

## Backlog actif
Voir `.claude/context/backlog.md`

## Méthode de travail
1. Lire CLAUDE.md + les fichiers contexte au démarrage
2. Lire les fichiers concernés dans le repo avant toute modification
3. Identifier la cause racine avant de proposer un correctif
4. Modifier uniquement les fichiers strictement nécessaires
5. Ne jamais refactorer largement sans demande explicite
6. Vérifier sur la preview Vercel avant de considérer une tâche terminée
7. Retourner : fichiers modifiés + résumé court + points de vigilance

## Workflow Git
- `main` = production
- `feat/nom-court` = nouvelle fonctionnalité
- `fix/nom-court` = correction ciblée
- PR systématique vers main
- Validation visuelle sur preview Vercel avant merge
- Commits courts et orientés résultat (ex: "fix: données fantômes rapport public")

## Frontend
- Stack : HTML + CSS + JS vanilla + Babel CDN + Tailwind CDN
- Préserver la cohérence visuelle entre index.html et index.saaspro.html
- Toujours vérifier mobile ET desktop
- Ne jamais casser une page existante pour corriger un détail local
- Design system : Geist + Instrument Serif, palette bleue (#2563EB accent)

## Interdictions
- Pas de réécriture complète sans justification explicite
- Pas d'ajout de dépendances npm
- Pas de duplication de composants ou logique existante
- Pas de collage de fichiers entiers en sortie si un diff suffit
- Ne jamais mettre de clés API en dur dans le code frontend