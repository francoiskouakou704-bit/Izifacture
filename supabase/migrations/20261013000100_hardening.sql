-- ═══════════════════════════════════════════════════════════════════════════
-- Durcissement (recommandations de l'analyse de sécurité Supabase)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Fonctions internes de sécurité hors du schéma exposé par l'API REST.
--    Les politiques RLS les référencent par identifiant : elles continuent de fonctionner.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.current_org_id() set schema private;
alter function public.is_org_member(uuid) set schema private;
alter function public.require_org() set schema private;

-- Les fonctions métier appellent désormais les versions privées.
create or replace function public.create_organization(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'errors.unexpected'; end if;
  if private.current_org_id() is not null then
    return private.current_org_id();
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

create or replace function public.save_invoice(p_id uuid, p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := private.require_org();
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

create or replace function public.send_invoice(p_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_org uuid := private.require_org();
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
  v_org uuid := private.require_org();
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
  v_org uuid := private.require_org();
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

-- 2. search_path figé pour la fonction de trigger.
alter function public.set_updated_at() set search_path = '';

-- 3. RLS : auth.uid() évalué une seule fois par requête (et non par ligne).
drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.organization_members m
      where m.user_id = profiles.id and private.is_org_member(m.organization_id)
    )
  );
drop policy profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy members_select on public.organization_members;
create policy members_select on public.organization_members for select to authenticated
  using (user_id = (select auth.uid()) or private.is_org_member(organization_id));

-- 4. Index des clés étrangères restantes.
create index if not exists invoice_events_actor_idx on public.invoice_events(actor_id);
create index if not exists payments_created_by_idx on public.payments(created_by);

-- Droits : inchangés pour les RPC métier ; rien pour anon hors lien public.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.create_organization(jsonb), public.save_invoice(uuid, jsonb),
  public.send_invoice(uuid), public.cancel_invoice(uuid), public.add_payment(uuid, bigint, date, text, text)
  to authenticated;
grant execute on function public.get_public_invoice(uuid), public.record_invoice_view(uuid) to anon, authenticated;
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
