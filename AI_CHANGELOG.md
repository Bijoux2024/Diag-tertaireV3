# AI Changelog

Historique des modifications effectuees par des agents IA sur ce depot.

## 2026-04-06 — Claude Code

- Ajout du rewrite `/blog/*` dans vercel.json pour proxier le blog depuis diag-tertiaire-blog.vercel.app
- Ajout de regles supplementaires pour les chemins avec slash final (`/blog/` et `/blog/:path+/`), necessaires car Vercel traite les trailing slashes comme des repertoires avant d'appliquer les rewrites sur les sites statiques
