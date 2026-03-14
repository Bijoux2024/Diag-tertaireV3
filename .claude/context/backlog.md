# Backlog DiagTertiaire Pro

## Etat valide a retenir

- route pro canonique : `index.saaspro.html`
- auth Supabase email + mot de passe en place, magic link secondaire conserve
- workspace pro persiste dans Supabase
- storage prive en place
- PDF officiel serveur en place (Vercel + Chromium + Supabase)
- fallback PDF local conserve en secours
- suppression securisee dossier / rapport / PDF livree via migration SQL + route serveur

## Priorite immediate

1. Executer la recette preview avec `docs/qa-preview-checklist.md`
2. Verifier les cas de purge partielle (`pending_cleanup`) apres suppression
3. Verifier qu'aucune regression n'apparait sur les leads publics, l'auth, le branding et `#report=`

## Apres validation preview

- nettoyer le legacy neutralise encore mort
- ajouter si necessaire un outillage de reprise pour les fichiers `pending_cleanup`
- ouvrir ensuite seulement les sujets secondaires UX / backlog public

## A ne plus traiter comme sujets ouverts

- `proAuth` comme modele reel
- PDFShift
- fusion `pro.html -> index.saaspro.html`
- suppression critique pilotee uniquement par le front
