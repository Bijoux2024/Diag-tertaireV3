# Commandes Essentielles pour Développeur

Voici une liste des principales commandes à copier-coller dans ton terminal pour gérer ton projet, ouvrir ton code, et le publier sur GitHub.

## 📂 1. Ouvrir le projet et lancer en local

### Ouvrir le code avec Visual Studio Code
Si tu te trouves déjà dans le dossier de ton projet, tape cette commande pour ouvrir le projet directement dans VS Code :
```bash
code .
```

### Lancer le serveur local (si applicable)
Si ton projet utilise NPM (présence d'un fichier `package.json`) :
```bash
# Pour installer les dépendances (à faire la première fois)
npm install

# Pour lancer le serveur de développement
npm run dev
# ou
npm start
```

---

## 🚀 2. Publier / Sauvegarder le code sur GitHub (Git)

C'est la séquence classique à utiliser à chaque fois que tu veux sauvegarder et envoyer ton travail sur la plateforme GitHub.

**1. Voir les fichiers modifiés (vérification) :**
**2. Ajouter TOUTES les modifications :**
**3. Créer une sauvegarde (commit) avec un message explicatif :**
**4. Envoyer (Push) le code pour le publier sur GitHub :**
git status
git add .
git commit -m "update"
git push

Vercel :
npm run deploy:preview : (deploy de verification)
npm run deploy:prod : (deploy en production)
npx vercel --prod : (alternative directe)
---

## 🔄 3. Récupérer les dernières mises à jour (Pull)

Si quelqu'un d'autre (ou une IA) a modifié le code sur GitHub et que tu dois le récupérer en local avant de travailler :

```bash
git pull
```

---

## 🛠️ 4. Autres commandes très utiles

### Gestion des branches (pour travailler sans casser le code principal)
Créer une nouvelle branche et se placer dessus :
```bash
git checkout -b nom_de_la_nouvelle_branche
```

Revenir sur la branche principale (main) :
```bash
git checkout main
```

### Historique et Annulation
Voir l'historique des sauvegardes (commits) :
```bash
git log
```

Annuler toutes les modifications locales non sauvegardées (⚠️ **Attention**, cela supprime tes changements récents non commités) :
```bash
git restore .
```
