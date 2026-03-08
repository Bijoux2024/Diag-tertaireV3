# Backlog actif — DiagTertiaire V3

## Légende
- 🔴 P0 — bloquant démo/lancement
- 🟠 P1 — important crédibilité
- 🟡 P2 — conversion et qualification lead

---

## 🔴 P0 — Corrections bugs moteur

### T01 — Fix billSub précédence opérateur
Fichiers : index.html ligne ~621 + index.saaspro.html
```js
// AVANT
const billSub = parseFloat(data.elecSubscriptionYearly) || 0 + parseFloat(data.gasSubscriptionYearly) || 0;
// APRÈS
const billSub = (parseFloat(data.elecSubscriptionYearly) || 0) + (parseFloat(data.gasSubscriptionYearly) || 0);
```

### T02 — Unifier benchmarks ENGINE_PRO
Fichiers : index.html + index.saaspro.html
Remplacer toutes les médianes ENGINE_PRO par les valeurs du tableau
dans architecture.md. Scoring A-E en ratio vs médiane activité :
- A : ratio < 0.6
- B : 0.6 ≤ ratio < 0.9
- C : 0.9 ≤ ratio < 1.2
- D : 1.2 ≤ ratio < 1.7
- E : ratio ≥ 1.7

### T03 — Fix avgPrice = 0 quand kWh seuls saisis
Fichier : index.html
Si formData.elecEuro vide → utiliser prix défaut 0.196 €/kWh.
Si formData.gasEuro vide → utiliser prix défaut 0.105 €/kWh.
Ne jamais retourner avgPrice = 0.

### T05 — Fix graphique ROI : CAPEX à l'année 0
Fichier : index.html
```js
// AVANT
let cumulativeAction = 0;
// APRÈS
let cumulativeAction = ACTION_COST; // CAPEX intégré année 0
```

### T06 — Fix économies 10 ans × 11 → × 10
Fichier : index.html ligne ~4750
Boucle year 0→10 = 11 itérations. L'année 0 ne doit pas compter
d'économies. Résultat attendu : totalSavings10y = annualSavings × 10.

---

## 🔴 P0 — Bloquants démo

### N01 — Données fantômes dans le rapport public
Fichier : index.html
Le rapport affiche "uyktdtu - 600 m²" et "uyktdtu • 00000".
Lire proprement newDiagnosticLatestReport depuis localStorage.
Fallbacks : "Bâtiment diagnostiqué" si nom vide, "—" si ville vide.

### N03 — Wizard Pro génère toujours "Boutique Rivoli" hardcodé
Fichier : index.saaspro.html
Les données saisies dans le wizard ne sont pas passées au moteur.
proDiagDraft doit être lu par le moteur à la génération.
Le rapport doit afficher le nom prospect (étape 1), activité (étape 2),
consommations (étape 3).

### N04 — Mentions légales absentes (violation LCEN)
Fichiers : index.html + index.saaspro.html
Ajouter dans chaque footer :
- Lien "Mentions légales" → modal avec éditeur + hébergeur Vercel
- Lien "Politique de confidentialité" → modal avec finalité collecte,
  durée 18 mois, catégories partenaires, droits utilisateur
- Lien "Effacer mes données" → vide les clés localStorage personnelles

### T07 — Texte "email envoyé" → "disponible en téléchargement"
Fichier : index.html
Remplacer toutes les occurrences de "envoyé par email" / "reçu par email"
par "disponible en téléchargement".

---

## 🟠 P1 — Crédibilité et UX

### T09 — Activité Santé active avec conditions
Fichiers : index.html + index.saaspro.html
- Retirer le statut "disabled" sur la tile Santé
- Ventilation fixée à 22% pour cette activité (au lieu de 10%)
- Ajouter disclaimer dans le rapport :
  "Ce diagnostic s'applique aux cabinets < 500 m². Obligations
  réglementaires de ventilation non couvertes par ce pré-diagnostic."

### N02 — Note confidentialité Wizard Pro contradictoire
Fichier : index.saaspro.html étape 5
Remplacer : "traitées en local... non transmises à des tiers"
Par : "traitées de manière sécurisée pour produire cette estimation
indicative. Ne remplace pas un audit réglementaire complet."

### N06 — Supprimer upsell du rapport Pro
Fichier : index.saaspro.html
Supprimer la section "Et après ce MVP ? / Essentiel / Équipe / Réseau"
du rapport détaillé. La déplacer dans une page dédiée accessible
depuis la sidebar Pro uniquement.

### N07 — "Exemple de rapport" → cas mock convaincant
Fichier : index.html
Au clic sur "Exemple de rapport" dans la navbar, injecter dans
newDiagnosticLatestReport ce mock et afficher l'écran rapport :
```js
const MOCK_REPORT_BOUTIQUE_RIVOLI = {
  nomBatiment: 'Boutique Rivoli Sélection',
  activite: 'commerce_non_alim',
  surface: 160,
  ville: 'Paris 75001',
  anneeConstruction: '1975-2000',
  energiePrincipale: 'electricite',
  elecKwh: 51200,
  elecEuro: 11500,
  scoreLettre: 'D',
  scoreRatio: 1.40,
  intensiteCalculee: 320,
  medianeRef: 320,
  economiesTotalesAnnuelles: 3200,
  economiesTotales10ans: 32000,
  scoreConfiance: 'Moyen',
};
```

### N08 — En-tête rapport public sans identité bâtiment
Fichier : index.html
Ajouter hero band en haut du rapport :
nom bâtiment, activité lisible, surface m², ville, date diagnostic.
S'inspirer du header sombre du rapport Pro.

### N09 — Label "Mixed" incompréhensible
Fichier : index.html section positionnement sectoriel
Remplacer par le nom d'activité lisible :
```js
const ACTIVITY_LABELS = {
  bureau: 'Bureaux et services',
  commerce_non_alim: 'Commerce non-alimentaire',
  commerce_alim: 'Commerce alimentaire',
  hotel: 'Hôtellerie',
  restauration: 'Restauration',
  enseignement: 'Enseignement',
  entrepot_chauffe: 'Entrepôt chauffé',
  entrepot_non_chauffe: 'Entrepôt non chauffé',
  sante: 'Cabinet de santé',
};
```

### N10 — Prix énergie sans date
Fichier : index.html section hypothèses rapport
Remplacer par : "prix de référence professionnels au T3 2024
(élec 0.196 €/kWh TTC, gaz 0.105 €/kWh TTC — source CRE)"

### Score badge — renommer "Indice DiagTertiaire"
Fichiers : index.html + index.saaspro.html
Remplacer "Classe estimée" et toute référence "OPERAT" par
"Indice DiagTertiaire" avec mention :
"Indicateur indicatif — non opposable, hors cadre OPERAT"

---

## 🟠 P1 — Formulaire et tunnel

### Nouveau tunnel 4 étapes
Fichier : index.html
Intégrer le design de tunnel-form.html dans index.html.
Voir détail complet dans le prompt Claude Code principal.

Points clés :
- Étape 1 : 9 tiles activité dont Santé active,
  sous-question Commerce alim/non-alim
- Étape 2 : selector 5 énergies (Élec/Gaz/Réseau/Fioul/Bois),
  toggle "sans factures", score confiance temps réel
- Étape 3 : 4 questions qualitatives en tiles icônes
- Étape 4 : profil 4 tiles + champs contact + RGPD 2 éléments

### RGPD — Double consentement étape 4
Fichier : index.html
1. Petite checkbox obligatoire : "J'accepte la politique de
   confidentialité pour générer mon diagnostic."
2. Grand bouton CTA optionnel : "Oui, je souhaite être contacté par
   un professionnel partenaire (agent immobilier, bureau d'études
   énergie, installateur RGE)"
La valeur optInPartner (true/false) est stockée dans le lead Supabase.

---

## 🟡 P2 — Qualification lead

### N11 — Champs manquants étape 4
Fichier : index.html
Ajouter : prénom (obligatoire), société (optionnel),
objectif (3 tiles : conformité / charges / valorisation),
horizon décision (select : immédiat / 6 mois / 1 an+ / réflexion)
Migration SQL requise :
```sql
ALTER TABLE leads ADD COLUMN prenom TEXT;
ALTER TABLE leads ADD COLUMN societe TEXT;
ALTER TABLE leads ADD COLUMN objectif TEXT;
ALTER TABLE leads ADD COLUMN horizon_decision TEXT;
```

### N12 — Téléphone : hint incitatif
Fichier : index.html champ téléphone étape 4
Ajouter sous le champ :
"✓ Pour être rappelé gratuitement par un installateur RGE près de chez vous"

### Supabase — collecte leads
Fichier : index.html
Credentials :
- URL : https://wwyguahxlfokqbdmeylt.supabase.co
- Clé anon : sb_publishable_NUFaO1qroQFMfFfMXqUmNA_cvAODvvm
Transmission silencieuse au submit (échec = rapport toujours affiché).

---

## 🟠 P1 — Espace Pro

### T04 — Connexion index.html ↔ index.saaspro.html
"Espace Pro" dans index.html → pointe vers index.saaspro.html
Retour depuis index.saaspro.html → pointe vers index.html

### T12 — 20 dossiers mock au login démo
Fichier : index.saaspro.html
Au login demo@cabinet-conseil.fr, si proCases vide →
initialiser avec les 20 cas mock existants dans le code.

### N05 — Formulaire démo non fonctionnel
Fichier : index.saaspro.html bouton "Demander une démonstration"
Remplacer par mailto: en attendant backend :
mailto:contact@diagtertiaire.fr?subject=Demande démonstration

### N13 — Fusion pro.html → index.saaspro.html
Identifier les 82 lignes propres à pro.html (landing + plans tarifaires).
Les intégrer dans index.saaspro.html comme section #landing
visible quand utilisateur non connecté.
Supprimer pro.html du repo après fusion.
Vérifier tous les liens qui pointaient vers pro.html.

---

## 🟡 P2 — Marque blanche

### Config marque blanche
Fichier : index.saaspro.html section Configuration
Intégrer marque-blanche-config.html :
- Upload logo → preview live dans mockup rapport
- Sélecteur couleur (16 swatches + hex) → --proAccent temps réel
- Nom marque, URL redirection leads, email réception
Clause CGU partenaire : DiagTertiaire = sous-traitant technique,
partenaire = responsable de traitement (art. 28 RGPD).

---

## ✅ Fait / En cours
- Supabase projet créé + table leads créée
- Variables Vercel configurées (SUPABASE_URL, SUPABASE_SERVICE_KEY)
- CLAUDE.md créé
- .claude/context/architecture.md créé
- .claude/context/backlog.md créé (ce fichier)