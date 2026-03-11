# Commande : fix

Corrige le problème décrit.

Méthode :
1. Lis CLAUDE.md + .claude/context/architecture.md
2. Lis les fichiers concernés dans le repo
3. Identifie la cause racine
4. Modifie uniquement les fichiers nécessaires
5. Respecte les règles absolues de CLAUDE.md (buildless, namespaces, localStorage)
6. Vérifie mobile + desktop si modification UI
7. Pousse sur une branche fix/nom-court

Retourne :
- cause racine en une ligne
- fichiers modifiés
- diff minimal
- points de vigilance
- checklist de validation sur preview Vercel