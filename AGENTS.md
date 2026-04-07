# AGENTS.md - DiagTertiaire V3

> Toute IA intervenant sur ce repo doit lire ce fichier avant d'agir.
> Ce document complète CLAUDE.md (règles moteur/architecture) et AI-CONTEXT.md (contexte produit).

---

## Règle Git absolue - multi-postes

Avant tout travail sur ce repo, exécuter OBLIGATOIREMENT :

```sh
git pull origin main
```

Avant tout commit et push, exécuter :

```sh
git pull origin main
git status
```

Si des conflits apparaissent sur `vercel.json`, TOUJOURS conserver :
- La règle rewrite avec pattern `(.*)` et NON `:path*`
- Le header `X-Robots-Tag: index, follow` sur `/blog(.*)`
- Le header `Content-Type: application/xml` sur les `.xml`

Ces règles sont critiques pour le SEO et l'indexation Google.
Ne jamais les écraser sans validation explicite.

---

## Règles de lecture obligatoire

1. `CLAUDE.md` — règles moteur, architecture, hygième du code
2. `AI-CONTEXT.md` — contexte produit complet
3. `.claude/context/architecture.md` — architecture technique
