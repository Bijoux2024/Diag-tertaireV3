# Commande : feature

Implémente la fonctionnalité décrite.

Méthode :
1. Lis CLAUDE.md + .claude/context/architecture.md + .claude/context/backlog.md
2. Lis les fichiers concernés dans le repo
3. Propose l'approche la plus simple cohérente avec l'existant
4. Modifie uniquement les fichiers nécessaires
5. Respecte les règles absolues de CLAUDE.md (buildless, namespaces, localStorage)
6. Vérifie mobile + desktop
7. Pousse sur une branche feat/nom-court

Retourne :
- approche choisie + justification courte
- fichiers modifiés
- diff minimal
- points de vigilance
- checklist de validation sur preview Vercel