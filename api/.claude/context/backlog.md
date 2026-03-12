# Backlog API - DiagTertiaire V3

## Etat actuel

- `/api/public-config` expose seulement les cles publiques Supabase
- `/api/pro-report-pdf` genere et persiste le PDF officiel sans PDFShift
- `/api/pro-delete-case` orchestre la suppression metier et la purge Storage

## Verification prioritaire

1. Tester la preview Vercel avec les vraies variables Supabase
2. Verifier suppression complete et suppression partielle (`pending_cleanup`)
3. Verifier qu'un rapport supprime ne peut plus regenerer ni ouvrir un PDF officiel
4. Verifier que `#report=` reste intact car hors auth et hors API pro

## A ne pas faire

- remettre une suppression critique cote front
- exposer la service key au navigateur
- reintroduire PDFShift
- repartir d'une hypothese `proAuth` ou `localStorage` comme modele reel
