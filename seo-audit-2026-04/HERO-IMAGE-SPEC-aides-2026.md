# Spec hero image - article aides renovation energetique tertiaire 2026 TPE/PME

> Document genere 2026-04-28 dans le cadre de la finalisation Phase 5
> (Tache D). Cible : article blog `aides-renovation-energetique-tertiaire-2026-tpe-pme.md`
> en `draft: true` faute d'image hero.

## 1. Fichier final attendu

| Parametre | Valeur |
|---|---|
| Repo | `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\public\` |
| Filename | `aides-renovation-energetique-tertiaire-2026-tpe-pme.webp` (slug exact = nom article) |
| Format | WebP qualite ~85, profil sRGB |
| Dimensions | **1200 x 675 px** (ratio 16:9, charte blog SKILL.seo.md S12.1) |
| Poids cible | 15-25 KB (cible blog), max 30 KB |
| Emplacement strict | `public/<slug>.webp` (PAS `public/blog/` - bug double-chemin proxy V3, voir convention etablie commit `dc6dbe0` Codex) |

**Note divergence playbook** : le brief Tache D mentionnait "1200 x 630 px (ratio OG 1.91:1)" qui est la convention OG generique. **La charte blog DiagTertiaire impose 1200 x 675 px** (ratio 16:9), validee en production le 2026-04-09 score 9.6/10 (5 experts). Suivre la charte blog.

## 2. Frontmatter article a flipper apres deposit

Localisation : `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\content\blog\aides-renovation-energetique-tertiaire-2026-tpe-pme.md`

**Avant (etat actuel, draft)** :

```yaml
draft: true
image: '/blog/aides-renovation-energetique-tertiaire-2026-tpe-pme.webp'
```

**Apres deposit de l'image (action Yannis)** :

```yaml
draft: false
image: '/blog/aides-renovation-energetique-tertiaire-2026-tpe-pme.webp'
```

Le path `/blog/<slug>.webp` reste inchange (la rewrite V3 strip le segment `/blog/` quand il proxy vers blog.vercel.app, donc le fichier est servi a la racine du domaine blog mais reference avec prefix `/blog/` cote V3).

## 3. Charte visuelle FIXE (cf. SKILL.seo.md S12.2)

Le hero est genere via **Puppeteer Node.js** (viewport 1200x675, `deviceScaleFactor: 1`, attente fonts 1 500ms apres `setContent`). Pas d'illustration AI externe (Midjourney, DALL-E, Imagen) - on suit la charte visuelle uniforme du blog.

```
Fond :             #0B1E2D
Accent gauche :    bande 7px verticale - bleu #2563EB (TYPE 1)
Chiffre principal: DM Sans 800, 152px, blanc #FFFFFF, letter-spacing: -2px
Interligne -> ligne 2 : 22px minimum (point focal secondaire critique)
Ligne 2 :          DM Sans 600, 30px, rgba(255,255,255,0.80)
Ligne 3 :          DM Sans 400, 22px, rgba(255,255,255,0.50)
Badge DT :         pill bleu #2563EB, "DT" blanc 800 13px
Domaine :          "diag-tertiaire.fr" blanc 38%, 14px
Separateur footer : border-top 1px rgba(255,255,255,0.09)

SUPPRIME :         cercle decoratif haut droit (fait "Canva", inutile a 300px vignette)
SUPPRIME :         grammages gris #94A3B8 (invisibles a 300px)
```

## 4. Type retenu : TYPE 1 (chiffre EUR)

Selon la charte blog (SKILL.seo.md S12.3) :
- **TYPE 1** : article avec montant EUR, cout annuel, budget, ROI. Accent **bleu**.
- TYPE 2 : avant/apres avec evolution. Accent rouge.
- TYPE 3 : question + reponse-amorce. Accent bleu.

L'article aides est sur des montants EUR concrets (CEE 4 200 EUR, MaPrimeRenov 1 800 EUR, ROI 3,75 ans, regime de minimis 200 000 EUR sur 3 ans, capex 18 000 EUR du cas pratique commerce 400 m² Bordeaux). **TYPE 1 ideal**, accent bleu.

## 5. Format machine (champ Notion `Prompt Image`)

Selon SKILL.seo.md S12.4 le format machine est :

```
TYPE 1 : 1|[valeur EUR]|[ligne2]|[ligne3]
```

**Recommandation pour cet article** :

```
1|6 000 €|d'aides recuperables sur un projet TPE/PME de 18 000 €|Et vous, vous savez combien ?
```

Justification chiffres :
- **6 000 EUR** = somme exacte des aides du cas pratique commerce 400 m² Bordeaux : 4 200 EUR CEE + 1 800 EUR MaPrimeRenov Tertiaire (article H2 "Cas pratique chiffre")
- **18 000 EUR** = capex total du meme cas (LED + GTB + isolation toiture)
- **Ligne 3** : phrase obligatoire selon SKILL.seo.md S12.5 ("Et vous, vous savez combien ?" - ne pas remplacer)

**Variantes acceptables si Yannis prefere** :

```
1|33 %|du capex couvert par les aides 2026 TPE/PME|Et vous, vous savez combien ?
```

(Note : 33 % n'est pas un montant EUR strict, mais represente 6 000 / 18 000 = 33 % de prise en charge. A valider editorialement par Yannis si TYPE 1 accepte les pourcentages, sinon TYPE 3 question.)

```
1|200 000 €|de minimis sur 3 ans pour cumuler vos aides|Et vous, vous savez combien ?
```

(Variante focalisee sur le plafond regime de minimis. Moins evocateur que 6 000 EUR mais mathematiquement plus impactant.)

## 6. Generation - procedure existante

Le pipeline Puppeteer du blog est deja en place (cf. commits Codex
`fba5def fix(blog): regenere hero TYPE 1 conforme a SKILL.seo.md S12`
et `48e9654 fix(blog): regeneration batch des 15 images hero`).

**Action requise Yannis** :

1. Renseigner le champ `Prompt Image` Notion sur la fiche article au format machine ci-dessus
2. Declencher la generation Puppeteer du blog (workflow existant Notion -> Gemini -> GitHub commit -> Vercel deploy)
3. Verifier que le fichier produit `public/aides-renovation-energetique-tertiaire-2026-tpe-pme.webp` existe et fait 15-25 KB
4. Verifier en local : `npm run build` du blog reussit, image visible dans `dist/`
5. Flipper le frontmatter : `draft: false`, push, Vercel rebuild
6. Validation post-deploy :
   - `curl -I https://diag-tertiaire.fr/blog/aides-renovation-energetique-tertiaire-2026-tpe-pme.webp` -> HTTP 200 + Content-Type: image/webp
   - `curl -I https://diag-tertiaire.fr/blog/aides-renovation-energetique-tertiaire-2026-tpe-pme/` -> HTTP 200 + X-Robots-Tag: index, follow
   - JSON-LD BlogPosting `image` field aligne sur l'URL servie

## 7. Anti-pattern a eviter

Le brief Tache D suggerait initialement :
- "Generation externe : nanobanana-mcp / Banana API / Midjourney / Imagen / DALL-E / Stock photo + retouche"
- "Sujets a couvrir visuellement (suggestion) : Aides financieres (cheque, billets), Renovation energetique (isolation, panneaux), Petite entreprise (vitrine, restaurant, bureau)"

**Cette approche AI illustration ne correspond PAS au style etabli du blog DiagTertiaire**. Les 15 hero images existantes dans `public/` sont toutes du **format texte-typographique** (chiffre dominant + 2-3 lignes texte sur fond #0B1E2D), pas de l'illustration. Generer une illustration AI casserait l'uniformite visuelle de la cards listing blog (`/blog/`) ou les cards apparaissent en grille.

**Si Yannis choisit malgre tout l'illustration AI** : signaler explicitement le break editorial dans le commit message et verifier que toutes les images (15 anciennes + nouvelles) sont migrees au nouveau style en meme temps. Sinon mixage incoherent.

## 8. Validation finale post-publication

Une fois l'image generee, deposee, et l'article passe en `draft: false` :

- [ ] `https://diag-tertiaire.fr/blog/aides-renovation-energetique-tertiaire-2026-tpe-pme/` retourne 200
- [ ] HTML contient `"@type":"BlogPosting"` + `"@type":"Person"` author
- [ ] HTML contient `"image":"https://diag-tertiaire.fr/blog/aides-renovation-energetique-tertiaire-2026-tpe-pme.webp"`
- [ ] L'image hero rendu sur la page article + sur la card du listing `/blog/` est visible
- [ ] OG preview sur Facebook / LinkedIn (via Twitter Card Validator ou Facebook Debugger) montre l'image
- [ ] `/blog/sitemap-0.xml` contient l'URL de l'article (Astro auto-genere)
- [ ] IndexNow ping post-deploy via `/api/indexnow` (apres TASK-018 INDEXNOW_KEY env configure par Yannis)

## 9. Ressources de reference

- Charte visuelle complete : `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\.claude\skills\SKILL.seo.md` section 12
- Pipeline Puppeteer : workflow existant Codex (commits `fba5def` + `48e9654`)
- 15 hero references : `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\public\*.webp`
- Article concerne : `c:\Users\yanni\Documents\GitHub\diag-tertiaire-blog\src\content\blog\aides-renovation-energetique-tertiaire-2026-tpe-pme.md`
- Cas pratique chiffre source : article H2 "Cas pratique chiffre commerce 400 m² Bordeaux"
