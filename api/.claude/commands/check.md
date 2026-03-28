# Commande : check

Contrôle de régression après modification.

Méthode :
1. Lis CLAUDE.md + .claude/context/architecture.md
2. Liste les zones impactées par la modification
3. Vérifie : layout, navigation, responsive, états interactifs, calculs moteur
4. Vérifie que les namespaces NEW_DIAGNOSTIC_* sont intacts
5. Vérifie que les clés localStorage n'ont pas été renommées
6. Ne modifie rien sans expliquer pourquoi
7. Ne jamais faire apparaitre aucun carractere "—" dans le front

Retourne :
- zones vérifiées
- risques détectés
- correctifs appliqués si nécessaire
- feu vert / rouge pour merge sur main