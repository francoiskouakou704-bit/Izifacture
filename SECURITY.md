# Sécurité

## Signaler une vulnérabilité

Merci de **ne pas ouvrir d’issue publique** pour une faille de sécurité.
Utilisez l’onglet **Security › Report a vulnerability** de ce dépôt (signalement privé GitHub).
Nous répondons sous 72 heures.

## Principes appliqués

- Aucun secret dans le dépôt : les clés vivent dans `.env.local` (ignoré) ou dans les variables
  d’environnement de l’hébergeur. Seule la clé *publishable* Supabase est utilisée côté application.
- Isolation des données par Row Level Security sur toutes les tables (`supabase/migrations/`).
- Écritures sur les factures uniquement via des fonctions SQL transactionnelles qui vérifient
  l’appartenance à l’entreprise et les règles métier.
- Validation de toutes les entrées côté serveur (zod) ; les montants sont recalculés par le serveur.
