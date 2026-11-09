-- ═══════════════════════════════════════════════════════════════════════════
-- Audit de sécurité (novembre 2026)
-- L'API REST de Supabase est appelable directement avec la clé publique : ces règles
-- s'appliquent même à un utilisateur connecté qui contourne l'application.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Logos : plus de SVG (un SVG peut contenir du JavaScript, exécuté si le fichier
--    public est ouvert directement). Les logos SVG déjà envoyés restent servis.
update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'logos';

-- 2. Organisations : colonnes modifiables par les membres.
--    Le compteur de numérotation (obligation de numérotation continue) n'est modifié que par
--    send_invoice (SECURITY DEFINER) ; id et dates restent gérés par la base.
revoke update on table public.organizations from anon, authenticated;
grant update (
  name, email, phone, address, city, country, tax_id, logo_url,
  default_currency, default_tax_rate, invoice_prefix, payment_terms_days,
  payment_instructions, footer_note
) on table public.organizations to authenticated;

-- 3. Logo : uniquement une image du stockage Supabase du projet (pas de pixel de pistage
--    ni d'adresse externe affichée sur les factures publiques).
--    NOT VALID : appliquée aux nouvelles écritures, sans bloquer sur d'éventuelles lignes existantes.
alter table public.organizations
  add constraint organizations_logo_url_storage
  check (logo_url is null or logo_url ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/logos/')
  not valid;

-- 4. Profils : seuls le nom et l'avatar sont modifiables, nom limité comme dans l'application.
revoke update on table public.profiles from anon, authenticated;
grant update (full_name, avatar_url) on table public.profiles to authenticated;
alter table public.profiles
  add constraint profiles_full_name_length check (char_length(full_name) <= 120) not valid;
