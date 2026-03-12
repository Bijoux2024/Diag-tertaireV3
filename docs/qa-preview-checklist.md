# QA Preview Checklist - Vercel + vrai Supabase

## Contexte de recette

- URL preview :
- Date :
- Testeur :
- Commit / branche :
- Projet Supabase :
- Compte principal :
- Compte secondaire :

## Regles de saisie

- `Resultat observe` : noter le resultat reel, meme partiel
- `Statut` : renseigner `OK` ou `KO`
- `Note` : garder une phrase courte avec l'anomalie, l'impact et si elle est bloquante

---

## 1. Acces landing public

Objectif : verifier que la surface publique reste accessible sans auth.

Etapes :
1. Ouvrir l'URL preview sans session preexistante.
2. Verifier le chargement complet de `index.html`.
3. Naviguer sur les sections principales.

Resultat attendu : la landing publique s'affiche sans erreur console bloquante ni redirection inattendue.

Resultat observe :

Statut : OK / KO

Note :

## 2. Lead public standard

Objectif : verifier le tunnel public nominal sans consentement partenaire.

Etapes :
1. Aller jusqu'au formulaire public.
2. Remplir un cas standard.
3. Cocher uniquement le consentement minimum requis.
4. Soumettre et ouvrir le rapport.

Resultat attendu : le lead est accepte, le rapport s'affiche, aucun blocage UI si un appel non critique echoue.

Resultat observe :

Statut : OK / KO

Note :

## 3. Lead partenaire avec consentement

Objectif : verifier la variante avec consentement partenaire.

Etapes :
1. Rejouer le tunnel public.
2. Activer le consentement partenaire.
3. Soumettre.

Resultat attendu : le lead est enregistre avec le bon consentement, sans casser l'affichage du rapport.

Resultat observe :

Statut : OK / KO

Note :

## 4. Lead B2B pro

Objectif : verifier le formulaire d'interet B2B / pro.

Etapes :
1. Depuis la surface pro non connectee, ouvrir le formulaire de contact / demo.
2. Remplir les champs attendus.
3. Soumettre ou declencher l'action equivalente.

Resultat attendu : le flux B2B reste exploitable, sans erreur visible ni blocage sur la preview.

Resultat observe :

Statut : OK / KO

Note :

## 5. Magic link / connexion

Objectif : verifier l'auth Supabase minimale.

Etapes :
1. Ouvrir `index.saaspro.html`.
2. Demander un magic link avec le compte principal.
3. Ouvrir le lien de connexion.

Resultat attendu : la session s'ouvre sur l'espace pro canonique, sans retour a un modele `proAuth`.

Resultat observe :

Statut : OK / KO

Note :

## 6. Restauration session / refresh

Objectif : verifier la persistance de session.

Etapes :
1. Une fois connecte, rafraichir `index.saaspro.html`.
2. Fermer puis rouvrir l'onglet si necessaire.

Resultat attendu : la session est restauree et le workspace revient sans perte visible.

Resultat observe :

Statut : OK / KO

Note :

## 7. Creation dossier

Objectif : verifier la creation d'un dossier pro.

Etapes :
1. Creer un nouveau diagnostic dans l'espace pro.
2. Aller jusqu'a la generation du dossier.
3. Revenir a la liste des dossiers.

Resultat attendu : le dossier apparait dans la liste active avec les bonnes infos de base.

Resultat observe :

Statut : OK / KO

Note :

## 8. Creation rapport

Objectif : verifier la creation du rapport lie au dossier.

Etapes :
1. Ouvrir le dossier cree.
2. Acceder au rapport detaille.
3. Verifier que les donnees du wizard sont reprises.

Resultat attendu : un rapport actif est disponible pour le dossier, sans valeur hardcodee parasite.

Resultat observe :

Statut : OK / KO

Note :

## 9. Persistance workspace apres refresh

Objectif : verifier que le workspace provient bien de Supabase.

Etapes :
1. Avec au moins un dossier cree, rafraichir la page.
2. Verifier la liste des dossiers, le rapport et l'etat de navigation utile.

Resultat attendu : les dossiers / rapports actifs restent presents apres refresh.

Resultat observe :

Statut : OK / KO

Note :

## 10. Branding / changement nom / accent

Objectif : verifier la persistance du branding texte et couleur.

Etapes :
1. Ouvrir `Configuration`.
2. Modifier le nom de marque.
3. Modifier l'accent.
4. Sauvegarder puis revenir au rapport.

Resultat attendu : le nom et la couleur sont reappliques dans l'UI et dans le rapport.

Resultat observe :

Statut : OK / KO

Note :

## 11. Upload logo

Objectif : verifier l'upload logo vers le Storage prive.

Etapes :
1. Depuis `Configuration`, importer un logo valide.
2. Attendre la fin de l'upload.
3. Revenir au rapport.

Resultat attendu : le logo s'affiche et aucune erreur de Storage / RLS n'apparait.

Resultat observe :

Statut : OK / KO

Note :

## 12. Restitution logo apres refresh

Objectif : verifier la lecture du logo apres rechargement.

Etapes :
1. Rafraichir `index.saaspro.html`.
2. Revenir dans `Configuration` puis sur un rapport.

Resultat attendu : le logo est restitue apres refresh via le Storage prive.

Resultat observe :

Statut : OK / KO

Note :

## 13. Generation PDF officiel

Objectif : verifier le flux serveur officiel.

Etapes :
1. Ouvrir un rapport pro actif.
2. Cliquer sur `Generer le PDF officiel`.
3. Attendre la fin du traitement.

Resultat attendu : le statut PDF passe a `pret` et un message de succes apparait.

Resultat observe :

Statut : OK / KO

Note :

## 14. Ouverture du PDF officiel

Objectif : verifier l'acces au PDF officiel sauvegarde.

Etapes :
1. Depuis le meme rapport, cliquer sur `Ouvrir le PDF officiel`.
2. Verifier l'ouverture dans un nouvel onglet.

Resultat attendu : le PDF serveur s'ouvre correctement et correspond au rapport courant.

Resultat observe :

Statut : OK / KO

Note :

## 15. Fallback PDF local de secours

Objectif : verifier que le fallback navigateur existe encore mais reste secondaire.

Etapes :
1. Depuis un rapport pro, cliquer sur `Export local (secours)`.
2. Verifier l'ouverture du dialogue d'impression / PDF local.

Resultat attendu : le fallback local fonctionne toujours, sans remplacer le flux officiel.

Resultat observe :

Statut : OK / KO

Note :

## 16. Suppression securisee dossier / rapport / PDF

Objectif : verifier la suppression metier immediate et la purge serveur.

Etapes :
1. Depuis la liste des dossiers, supprimer un dossier possedant un rapport et un PDF officiel.
2. Verifier le retrait immediat du dossier de l'UI.
3. Verifier que le rapport n'est plus accessible dans le perimetre actif apres refresh.
4. Si un message partiel apparait, noter le texte exact.

Resultat attendu : le dossier et le rapport sortent du perimetre actif immediatement. Le retour API est clair si des fichiers restent `pending_cleanup`.

Resultat observe :

Statut : OK / KO

Note :

## 17. Second compte isole du premier

Objectif : verifier l'isolation entre deux organisations.

Etapes :
1. Se connecter avec le compte principal et noter un dossier / rapport existant.
2. Se deconnecter puis se connecter avec le compte secondaire.
3. Verifier la liste des dossiers et les acces PDF.

Resultat attendu : le second compte ne voit ni dossiers, ni rapports, ni PDF du premier.

Resultat observe :

Statut : OK / KO

Note :

## 18. Shared report `#report=`

Objectif : verifier la non-regression du mode partage sans auth.

Etapes :
1. Depuis un rapport pro, generer / copier le lien partage si disponible.
2. Ouvrir le lien dans une fenetre privee sans session.
3. Verifier l'affichage du rapport partage.

Resultat attendu : le mode `#report=` reste lisible sans auth et n'est pas impacte par les evolutions auth / storage / suppression.

Resultat observe :

Statut : OK / KO

Note :
