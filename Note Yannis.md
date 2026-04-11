# Commandes — DiagTertiaire

---

## Tester en local (avant de publier)

```bash
npx serve . --listen 3000
```

Ouvre ensuite http://localhost:3000 dans le navigateur.
Pour arrêter : **Ctrl+C** dans le terminal.

---

## Publier sur diag-tertiaire.fr

Le site est connecté à GitHub. Un simple `git push` suffit —
Vercel détecte le push et redéploie automatiquement en ~1-2 min.

```bash
# 1. Voir ce qui a changé
git status

# 2. Ajouter les fichiers modifiés
git add nom-du-fichier.html
# ou tout ajouter :
git add .

# 3. Enregistrer avec un message
git commit -m "description de la modification"

# 4. Publier → le site se met à jour sur diag-tertiaire.fr
git push origin main
```

---

## Autres commandes utiles

```bash
# Récupérer les dernières modifs depuis GitHub (si quelqu'un d'autre a modifié)
git pull

# Voir l'historique des commits
git log --oneline

# Annuler toutes les modifications non enregistrées (⚠️ irréversible)
git restore .
```

Pour publier :


git status
git add fichier1 fichier2   # ou git add .
git commit -m "description"
git push origin main