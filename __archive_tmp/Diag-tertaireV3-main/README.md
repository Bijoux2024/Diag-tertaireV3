# DiagTertiaire - Espace Pro (MVP Showcase)

Ce dossier correspond au MVP de démonstration **DiagTertiaire Pro**. Il s'agit d'une interface front-end statique, visant à démontrer le fonctionnement métier d'un éventuel SaaS B2B basé sur DiagTertiaire.

## 🚀 Comment lancer le projet

Le projet est "Serverless" et "Buildless" (aucune dépendance NPM ni build requis grâce aux CDN React, Babel, et Tailwind). 

Cependant, comme le site utilise des imports modules et du routing entre fichiers locaux HTML, il nécessite un **serveur web local** pour fonctionner sans erreur de sécurité CORS.

1. **Option 1 : Utiliser npx serve (recommandé)**
   Ouvrez un terminal dans le dossier du projet :
   ```bash
   npx serve .
   ```
   Rendez-vous ensuite sur `http://localhost:3000`.

2. **Option 2 : Extension VS Code**
   Si vous utilisez VS Code, installez l'extension **Live Server** et lancez-la sur `index.html`.

## 🧪 Tableau de test QA

### 1. Accès & Authentification
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| **Vérification refusée** | Saisir `mauvais.code` | Message "Accès démo : utilisez test.demo" après 800ms de chargement | ⬜ |
| **Accès autorisé** | Saisir `test.demo` | Redirection immédiate vers le Dashboard Pro (sauvegarde en `localStorage`) | ⬜ |
| **Déconnexion** | Clic sur "Déconnexion" (Sidebar) | Efface `proAuth` du `localStorage` et renvoie sur le Login | ⬜ |

### 2. Navigation & Liens
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| **Lien Navbar Public** | Sur `index.html`, cliquer "Espace Pro" dans le header | Ouverture de `pro.html` | ⬜ |
| **CTA B2B Public** | Sur `index.html`, cliquer "Découvrir DiagTertiaire Pro" en bas | Ouverture de `pro.html` | ⬜ |
| **Retour au public** | Sur `pro.html`, cliquer "Retour au site public" | Ouverture de `index.html` | ⬜ |

### 3. Fonctionnalités Pro : Dashboard & Dossiers
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| **Nombre de dossiers** | Vérifier le compteur en bas de tableau | Correspond à 25 dossiers | ⬜ |
| **Filtre de recherche** | Taper "Cabinet" dans la barre | Le tableau se met à jour instantanément | ⬜ |
| **Export bloqué** | Survoler / cliquer l'icône export | Bouton désactivé (opacity: 0.5) + Tooltip "Disponible prochainement" | ⬜ |
| **Ouverture dossier** | Clic sur "Ouvrir" d'un dossier (ex: Mairie) | Ouverture du `ProReport` du dossier concerné avec les KPIs A/B/C/D/E corrects | ⬜ |

### 4. Fonctionnalités Pro : Nouveau Diagnostic
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| **Création brouillon** | Remplir étape 1, changer d'onglet, revenir | Les données sont persistées (`proDiagDraft` dans `localStorage`) | ⬜ |
| **Génération du rapport**| Terminer les 5 étapes et générer | Chargement simulant l'analyse (1.8s) puis redirection sur un rapport "Nouveau" (ID: P-NEW-X) | ⬜ |

### 5. Composants transversaux
| Test | Action | Résultat attendu | Statut |
|------|--------|------------------|--------|
| **Modal Démo (B2B)** | Clic sur un bouton "Formule / Être recontacté" | Modal propre, 2 étapes (formulaire -> Message de succès + vidéo grisée) | ⬜ |
| **Chatbot / FAQ** | Clic sur la bulle en bas à droite | Panneau de question fréquentes s'ouvre, questions cliquables avec accordéon | ⬜ |
| **Couleur interface** | Dans Paramètres, changer couleur principale | La couleur est conservée (`proAccent` en cache) | ⬜ |
| **Responsif Mobile** | Réduire largeur navigateur < 768px | La sidebar se cache, menu hamburger apparaît dans la TopBar | ⬜ |

---
**Déploiement cible :** Vercel, Netlify, ou GitHub Pages (les routes sont des fichiers HTML directs : `index.html` ou `pro.html`).
