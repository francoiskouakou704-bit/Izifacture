-- ═══════════════════════════════════════════════════════════════════════════
-- izi-facture — schéma initial
-- Montants en unités mineures (bigint). Statut « overdue » dérivé, jamais stocké.
-- Toutes les écritures sur les factures passent par des fonctions (RPC) qui
-- vérifient l'appartenance à l'organisation et les règles métier ; les tables
-- de factures ne sont qu'en lecture directe pour les utilisateurs.
-- Les erreurs métier sont levées avec un message « errors.* » (clé de traduction).
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── Utilitaires ────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ─── Profils ────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- full_name : inscription par e-mail ; name / avatar_url : connexion Google
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(new.email, '@', 1)
    ),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Comptes créés avant cette migration : profil rattrapé.
insert into public.profiles (id, full_name, avatar_url)
select id,
  coalesce(nullif(trim(raw_user_meta_data->>'full_name'), ''), nullif(trim(raw_user_meta_data->>'name'), ''), split_part(email, '@', 1)),
  nullif(raw_user_meta_data->>'avatar_url', '')
from auth.users
on conflict (id) do nothing;

-- ─── Organisations ──────────────────────────────────────────────────────────
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text,
  phone text,
  address text,
  city text,
  country text,
  tax_id text,
  logo_url text,
  default_currency text not null default 'XOF'
    check (default_currency in ('XOF','XAF','NGN','GHS','KES','MAD','GNF','CDF','EUR','USD')),
  default_tax_rate numeric(5,2) not null default 18 check (default_tax_rate between 0 and 100),
  invoice_prefix text not null default 'INV' check (invoice_prefix ~ '^[A-Za-z0-9-]{1,10}$'),
  next_invoice_number integer not null default 1 check (next_invoice_number > 0),
  payment_terms_days integer not null default 30 check (payment_terms_days between 0 and 365),
  payment_instructions text,
  footer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user_idx on public.organization_members(user_id);

-- Organisation courante de l'utilisateur (V1 : une seule par utilisateur).
create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.organization_members
  where user_id = auth.uid()
  order by created_at
  limit 1
$$;

create or replace function public.is_org_member(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org and user_id = auth.uid()
  )
$$;

-- ─── Clients ────────────────────────────────────────────────────────────────
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  email text,
  phone text,
  address text,
  city text,
  country text,
  tax_id text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_org_idx on public.clients(organization_id);
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

-- ─── Factures ───────────────────────────────────────────────────────────────
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  number text,
  status text not null default 'draft' check (status in ('draft','sent','paid','cancelled')),
  issue_date date not null,
  due_date date not null,
  currency text not null check (currency in ('XOF','XAF','NGN','GHS','KES','MAD','GNF','CDF','EUR','USD')),
  discount_type text check (discount_type in ('percent','fixed')),
  discount_value bigint not null default 0 check (discount_value >= 0),
  subtotal bigint not null default 0 check (subtotal >= 0),
  tax_total bigint not null default 0 check (tax_total >= 0),
  discount_total bigint not null default 0 check (discount_total >= 0),
  total bigint not null default 0 check (total >= 0),
  amount_paid bigint not null default 0 check (amount_paid >= 0),
  notes text,
  terms text,
  public_token uuid not null default gen_random_uuid() unique,
  sent_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  client_snapshot jsonb,
  company_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_number_unique unique (organization_id, number),
  constraint invoices_due_after_issue check (due_date >= issue_date),
  constraint invoices_paid_le_total check (amount_paid <= total),
  constraint invoices_number_when_sent check (status = 'draft' or number is not null)
);
create index invoices_org_idx on public.invoices(organization_id, issue_date desc);
create index invoices_client_idx on public.invoices(client_id);
create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  position integer not null,
  description text not null check (char_length(description) between 1 and 500),
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price bigint not null check (unit_price >= 0),
  tax_rate numeric(5,2) not null default 0 check (tax_rate between 0 and 100),
  line_total bigint not null check (line_total >= 0),
  tax_amount bigint not null default 0 check (tax_amount >= 0)
);
create index invoice_items_invoice_idx on public.invoice_items(invoice_id, position);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount bigint not null check (amount > 0),
  paid_on date not null,
  method text not null check (method in ('bank','mobile_money','cash','card','other')),
  reference text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index payments_invoice_idx on public.payments(invoice_id);

create table public.invoice_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  type text not null check (type in ('created','updated','sent','viewed','payment','cancelled')),
  actor_id uuid references public.profiles(id) on delete set null,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index invoice_events_invoice_idx on public.invoice_events(invoice_id, created_at desc);

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.invoice_events enable row level security;

-- Profils : chacun le sien, plus ceux des membres de son organisation (historique).
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.organization_members m
      where m.user_id = profiles.id and public.is_org_member(m.organization_id)
    )
  );
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Organisations : lecture et modification par les membres ; création via RPC.
create policy organizations_select on public.organizations for select to authenticated
  using (public.is_org_member(id));
create policy organizations_update on public.organizations for update to authenticated
  using (public.is_org_member(id)) with check (public.is_org_member(id));

create policy members_select on public.organization_members for select to authenticated
  using (user_id = auth.uid() or public.is_org_member(organization_id));

-- Clients : CRUD complet pour les membres.
create policy clients_select on public.clients for select to authenticated
  using (public.is_org_member(organization_id));
create policy clients_insert on public.clients for insert to authenticated
  with check (public.is_org_member(organization_id));
create policy clients_update on public.clients for update to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

-- Factures : lecture directe ; écriture par RPC ; suppression des seuls brouillons.
create policy invoices_select on public.invoices for select to authenticated
  using (public.is_org_member(organization_id));
create policy invoices_delete_draft on public.invoices for delete to authenticated
  using (public.is_org_member(organization_id) and status = 'draft');

create policy items_select on public.invoice_items for select to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and public.is_org_member(i.organization_id)));
create policy payments_select on public.payments for select to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and public.is_org_member(i.organization_id)));
create policy events_select on public.invoice_events for select to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and public.is_org_member(i.organization_id)));

-- ─── RPC : organisation ─────────────────────────────────────────────────────
create or replace function public.create_organization(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'errors.unexpected'; end if;
  if public.current_org_id() is not null then
    return public.current_org_id();
  end if;
  insert into public.organizations (name, email, country, default_currency)
  values (
    trim(p->>'name'),
    nullif(trim(p->>'email'), ''),
    nullif(trim(p->>'country'), ''),
    coalesce(nullif(p->>'defaultCurrency', ''), 'XOF')
  )
  returning id into v_id;
  insert into public.organization_members (organization_id, user_id, role) values (v_id, auth.uid(), 'owner');
  return v_id;
end $$;

-- ─── RPC : factures ─────────────────────────────────────────────────────────
-- Garde commune : renvoie l'organisation courante ou lève une erreur.
create or replace function public.require_org()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v_org uuid := public.current_org_id();
begin
  if v_org is null then raise exception 'errors.noOrganization'; end if;
  return v_org;
end $$;

-- Crée (p_id null) ou remplace un brouillon et ses lignes, en une transaction.
-- Les totaux sont calculés par le serveur applicatif (lib/invoice-math.ts).
create or replace function public.save_invoice(p_id uuid, p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := public.require_org();
  v_id uuid;
  v_status text;
  v_client uuid := (p->>'clientId')::uuid;
begin
  if not exists (select 1 from public.clients where id = v_client and organization_id = v_org) then
    raise exception 'errors.clientNotFound';
  end if;
  if jsonb_array_length(coalesce(p->'items', '[]'::jsonb)) = 0 then
    raise exception 'validation.itemsMin';
  end if;

  if p_id is null then
    insert into public.invoices (
      organization_id, client_id, issue_date, due_date, currency, discount_type, discount_value,
      subtotal, tax_total, discount_total, total, notes, terms
    ) values (
      v_org, v_client, (p->>'issueDate')::date, (p->>'dueDate')::date, p->>'currency',
      nullif(p->>'discountType', ''), coalesce((p->>'discountValue')::bigint, 0),
      (p->>'subtotal')::bigint, (p->>'taxTotal')::bigint, (p->>'discountTotal')::bigint, (p->>'total')::bigint,
      nullif(p->>'notes', ''), nullif(p->>'terms', '')
    ) returning id into v_id;
    insert into public.invoice_events (invoice_id, type, actor_id) values (v_id, 'created', auth.uid());
  else
    select status into v_status from public.invoices where id = p_id and organization_id = v_org for update;
    if not found then raise exception 'errors.invoiceNotFound'; end if;
    if v_status <> 'draft' then raise exception 'errors.onlyDraftEditable'; end if;
    update public.invoices set
      client_id = v_client,
      issue_date = (p->>'issueDate')::date,
      due_date = (p->>'dueDate')::date,
      currency = p->>'currency',
      discount_type = nullif(p->>'discountType', ''),
      discount_value = coalesce((p->>'discountValue')::bigint, 0),
      subtotal = (p->>'subtotal')::bigint,
      tax_total = (p->>'taxTotal')::bigint,
      discount_total = (p->>'discountTotal')::bigint,
      total = (p->>'total')::bigint,
      notes = nullif(p->>'notes', ''),
      terms = nullif(p->>'terms', '')
    where id = p_id;
    delete from public.invoice_items where invoice_id = p_id;
    v_id := p_id;
    insert into public.invoice_events (invoice_id, type, actor_id) values (v_id, 'updated', auth.uid());
  end if;

  insert into public.invoice_items (invoice_id, position, description, quantity, unit_price, tax_rate, line_total, tax_amount)
  select v_id, (ord - 1)::int, it->>'description', (it->>'quantity')::numeric, (it->>'unitPrice')::bigint,
         (it->>'taxRate')::numeric, (it->>'lineTotal')::bigint, (it->>'taxAmount')::bigint
  from jsonb_array_elements(p->'items') with ordinality as t(it, ord);

  return v_id;
end $$;

-- Émet la facture : numéro séquentiel sans trou (verrou sur l'organisation), coordonnées figées.
create or replace function public.send_invoice(p_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := public.require_org();
  v_inv public.invoices;
  v_seq integer;
  v_prefix text;
  v_number text;
begin
  select * into v_inv from public.invoices where id = p_id and organization_id = v_org for update;
  if not found then raise exception 'errors.invoiceNotFound'; end if;
  if v_inv.status <> 'draft' then raise exception 'errors.alreadySent'; end if;
  if v_inv.total <= 0 then raise exception 'errors.totalMustBePositive'; end if;

  update public.organizations set next_invoice_number = next_invoice_number + 1
  where id = v_org
  returning next_invoice_number - 1, invoice_prefix into v_seq, v_prefix;

  v_number := v_prefix || '-' || to_char(v_inv.issue_date, 'YYYY') || '-' || lpad(v_seq::text, 4, '0');

  update public.invoices i set
    number = v_number,
    status = 'sent',
    sent_at = now(),
    client_snapshot = (
      select jsonb_strip_nulls(jsonb_build_object(
        'name', c.name, 'email', c.email, 'phone', c.phone, 'address', c.address,
        'city', c.city, 'country', c.country, 'taxId', c.tax_id))
      from public.clients c where c.id = v_inv.client_id
    ),
    company_snapshot = (
      select jsonb_strip_nulls(jsonb_build_object(
        'name', o.name, 'email', o.email, 'phone', o.phone, 'address', o.address,
        'city', o.city, 'country', o.country, 'taxId', o.tax_id, 'logoUrl', o.logo_url))
      from public.organizations o where o.id = v_org
    )
  where i.id = p_id;

  insert into public.invoice_events (invoice_id, type, actor_id, payload)
  values (p_id, 'sent', auth.uid(), jsonb_build_object('number', v_number));
  return v_number;
end $$;

create or replace function public.cancel_invoice(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := public.require_org();
  v_inv public.invoices;
begin
  select * into v_inv from public.invoices where id = p_id and organization_id = v_org for update;
  if not found then raise exception 'errors.invoiceNotFound'; end if;
  if v_inv.status <> 'sent' then raise exception 'errors.onlySentCancellable'; end if;
  if v_inv.amount_paid > 0 then raise exception 'errors.cannotCancelPartiallyPaid'; end if;
  update public.invoices set status = 'cancelled', cancelled_at = now() where id = p_id;
  insert into public.invoice_events (invoice_id, type, actor_id) values (p_id, 'cancelled', auth.uid());
end $$;

create or replace function public.add_payment(
  p_invoice uuid, p_amount bigint, p_paid_on date, p_method text, p_reference text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := public.require_org();
  v_inv public.invoices;
  v_id uuid;
begin
  select * into v_inv from public.invoices where id = p_invoice and organization_id = v_org for update;
  if not found then raise exception 'errors.invoiceNotFound'; end if;
  if v_inv.status <> 'sent' then raise exception 'errors.notAwaitingPayment'; end if;
  if p_amount is null or p_amount <= 0 or v_inv.amount_paid + p_amount > v_inv.total then
    raise exception 'errors.paymentExceedsBalance';
  end if;

  insert into public.payments (invoice_id, amount, paid_on, method, reference, created_by)
  values (p_invoice, p_amount, p_paid_on, p_method, nullif(trim(p_reference), ''), auth.uid())
  returning id into v_id;

  update public.invoices set
    amount_paid = amount_paid + p_amount,
    status = case when amount_paid + p_amount >= total then 'paid' else status end,
    paid_at = case when amount_paid + p_amount >= total then now() else paid_at end
  where id = p_invoice;

  insert into public.invoice_events (invoice_id, type, actor_id, payload)
  values (p_invoice, 'payment', auth.uid(), jsonb_build_object('amount', p_amount, 'method', p_method));
  return v_id;
end $$;

-- ─── RPC publiques (lien de facture envoyé au client final) ─────────────────
create or replace function public.get_public_invoice(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'invoice', to_jsonb(i) - 'organization_id',
    'items', coalesce((
      select jsonb_agg(to_jsonb(it) order by it.position) from public.invoice_items it where it.invoice_id = i.id
    ), '[]'::jsonb),
    'organization', to_jsonb(o) - 'next_invoice_number'
  )
  from public.invoices i
  join public.organizations o on o.id = i.organization_id
  where i.public_token = p_token and i.status <> 'draft'
$$;

-- Trace la consultation (au plus une fois par heure, pour ne pas inonder l'historique).
create or replace function public.record_invoice_view(p_token uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from public.invoices where public_token = p_token and status <> 'draft';
  if v_id is null then return; end if;
  if exists (
    select 1 from public.invoice_events
    where invoice_id = v_id and type = 'viewed' and created_at > now() - interval '1 hour'
  ) then return; end if;
  insert into public.invoice_events (invoice_id, type) values (v_id, 'viewed');
end $$;

-- ─── Droits d'exécution ─────────────────────────────────────────────────────
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.current_org_id(), public.is_org_member(uuid), public.require_org(),
  public.create_organization(jsonb), public.save_invoice(uuid, jsonb), public.send_invoice(uuid),
  public.cancel_invoice(uuid), public.add_payment(uuid, bigint, date, text, text)
  to authenticated;
grant execute on function public.get_public_invoice(uuid), public.record_invoice_view(uuid)
  to anon, authenticated;

-- ─── Stockage des logos ─────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do nothing;

-- Chemin attendu : logos/<organization_id>/<fichier>
create policy logos_select on storage.objects for select to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = public.current_org_id()::text);
create policy logos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = public.current_org_id()::text);
create policy logos_update on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = public.current_org_id()::text);
create policy logos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = public.current_org_id()::text);
