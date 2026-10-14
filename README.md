# izi-facture

SaaS de facturation pour entrepreneurs africains — Next.js 14 (App Router), Tailwind CSS, Supabase (à venir), déploiement Vercel.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:3000
```

En phase 2, les données sont **locales et en mémoire** (jeu de démo réaliste, réinitialisé à chaque redémarrage du serveur).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Tests unitaires (Vitest) : calculs, argent, statuts, flux de données |
| `npm run test:e2e` | Build + tests navigateur (Playwright) des parcours critiques |

## Architecture

- `lib/money.ts`, `lib/invoice-math.ts` — montants en **entiers (unités mineures)**, calculs purs partagés client/serveur. Le serveur recalcule toujours les totaux.
- `lib/status.ts` — statut « en retard » **dérivé** de l'échéance (jamais stocké).
- `lib/data/` — contrat `DataSource` unique ; implémentation `mock/` (phase 2), `supabase/` (phase 3) sans toucher aux pages.
- `lib/services/` — règles métier ; `actions/` — Server Actions validées par zod (`lib/validations/`).
- `components/invoices/invoice-document.tsx` — rendu de la facture (aperçu live, détail, lien public `/i/[token]`, impression).

## Base de données (Supabase)

1. Copier `.env.example` en `.env.local` et renseigner l’URL du projet et la clé *publishable*.
2. Appliquer, dans l’ordre, les fichiers de `supabase/migrations/` (SQL Editor de Supabase,
   ou `supabase db push` avec la CLI liée au projet). Déjà appliqués sur le projet « Izi facture ».
3. Dans Supabase › Authentication › URL Configuration : *Site URL* = l’URL du site,
   et ajouter `<site>/auth/callback` aux *Redirect URLs*.

Sécurité : chaque table a la RLS activée ; un utilisateur ne voit que les données de son entreprise.
Les écritures sur les factures (création, émission, paiements, annulation) passent par des fonctions
SQL transactionnelles qui appliquent les règles métier (numérotation sans trou, montants, statuts).
Sans variables Supabase — ou avec `DATA_SOURCE=mock` — l’app tourne sur des données locales de démo
(c’est le mode utilisé par les tests E2E).

Test sur la vraie base (`npm run test:live`) : parcours complet + isolation entre deux comptes.
Nécessite deux comptes de test sans entreprise et un serveur lancé :
`LIVE_BASE_URL=http://localhost:3000 LIVE_EMAIL_A=… LIVE_EMAIL_B=… LIVE_PASSWORD=… npm run test:live`

## Langues

Français et anglais, sans préfixe d'URL (`next-intl`) : la langue vient du cookie `NEXT_LOCALE`
(sélecteur dans la barre latérale, Paramètres › Compte, pages publiques), sinon de la langue du navigateur.

- Textes : `messages/fr.json` (référence) et `messages/en.json`
- Ajouter une langue : l'ajouter dans `i18n/config.ts` + créer `messages/<code>.json`
- Les erreurs (zod, Server Actions) sont des **clés** (`validation.*`, `errors.*`) traduites à l'affichage
- `tests/unit/i18n.test.ts` vérifie que toutes les langues ont les mêmes clés et variables

## Feuille de route

1. ✅ UI depuis les captures
2. ✅ Interactivité avec données locales
3. ⏳ Base Supabase + tests RLS
4. ⏳ Authentification + middleware
5. ⏳ Landing page
6. ⏳ Passe de bout en bout & déploiement Vercel
