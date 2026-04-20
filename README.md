# DiagTertiaire V3

Pre-diagnostic energetique tertiaire oriente decision. Estimez la performance energetique d'un batiment tertiaire, identifiez les leviers d'economies et generez un rapport PDF.

## Structure du projet

```
index.html                  # Site public + diagnostic + rapport (~11 000 lignes)
espace-professionnel.html          # Espace professionnel (auth, workspace, branding)
diagnostic.html             # Redirection vers / (ancien doublon elimine)
methode.html                # Page methodologie (legere, sans moteur)
exemple-rapport.html        # Page exemple de rapport (legere, sans moteur)
public-report-print.html    # Template PDF serveur (Puppeteer)
partenaire.html             # Page partenaire
/api/                       # Endpoints serverless Vercel (Node.js)
/supabase/migrations/       # Schema BDD (executer dans l'ordre chronologique)
ga4.js                      # Analytics GA4
cookie-consent.js           # Bandeau consentement cookies
vercel.json                 # Config Vercel (headers, rewrites)
```

## Stack

- Front : HTML statique + React 18 (CDN) + Tailwind (CDN) - buildless, pas de bundler
- Backend : Vercel Serverless Functions (Node.js)
- BDD : Supabase (PostgreSQL)
- PDF : Puppeteer + @sparticuz/chromium (cote serveur)
- Deploiement : Vercel (auto-deploy sur push main)

## Lancer en local

```bash
npm run dev
```

Le front est statique et ne necessite aucun build.

Pour tester aussi les endpoints `/api/`, utilisez :

```bash
npm run dev:vercel
```

## Deployer

```bash
npx vercel --prod
```

## Variables d'environnement

Voir `.env.example` pour la liste des variables requises.

## Documentation IA

Les contributeurs IA doivent lire `AI-CONTEXT.md` avant toute modification.

## Pre-requis Supabase

- Auth email + mot de passe active, magic link conserve
- Supabase Storage active, bucket prive `organization-assets`
- Appliquer les migrations dans l'ordre chronologique depuis `/supabase/migrations/`

Voir `AI-CONTEXT.md` pour les details complets.
