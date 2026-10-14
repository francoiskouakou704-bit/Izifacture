-- Correctif : require_org() (déplacée dans « private ») appelait encore public.current_org_id().
create or replace function private.require_org()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v_org uuid := private.current_org_id();
begin
  if v_org is null then raise exception 'errors.noOrganization'; end if;
  return v_org;
end $$;

revoke execute on function private.require_org() from public, anon;
grant execute on function private.require_org() to authenticated;
