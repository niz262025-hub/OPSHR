-- Run only after database/migrations/202611070001_employee_master.sql.
-- Narrow private lookup: does not grant the app SELECT on central identity tables.
begin;
create function opshr.resolve_central_actor(session_id uuid, client_id text)
returns table(identity_user_id text, organization_id text, role text)
language sql stable security definer set search_path = ''
as $fn$
  select s.user_id::text, r.organization_id, r.role
  from public.myops_app_sessions s
  join public.myops_login_sessions l on l.id = s.login_session_id and l.user_id = s.user_id
  join public.myops_app_clients c on c.app_id = s.app_id and c.product_slug = 'opshr' and c.enabled
  join opshr.opshr_identity_roles r on r.identity_user_id = s.user_id::text and r.active
  join public.myops_memberships m on m.user_id = s.user_id and m.organization_id::text = r.organization_id and m.status = 'active'
  join public.myops_app_grants g on g.user_id = s.user_id and g.organization_id = m.organization_id and g.product_slug = 'opshr'
  where s.id = session_id and s.app_id = client_id and s.product_slug = 'opshr'
    and s.revoked_at is null and l.revoked_at is null
    and s.last_activity_at > now() - interval '15 minutes' and s.last_activity_at <= now()
    and l.last_activity_at > now() - interval '15 minutes' and l.last_activity_at <= now()
    and s.created_at > now() - interval '12 hours' and s.created_at <= now()
    and l.created_at > now() - interval '12 hours' and l.created_at <= now()
    and exists (select 1 from public.myops_products p where p.slug='opshr' and p.launch_status='live')
    and (
      exists (
        select 1 from public.myops_subscriptions sub
        where sub.status='active' and (sub.current_period_end is null or sub.current_period_end > now())
          and (sub.product_slug='opshr' or sub.is_complete_bundle)
          and ((sub.personal_user_id is null and sub.organization_id=m.organization_id)
            or sub.personal_user_id=s.user_id)
      )
      or exists (
        select 1 from public.myops_lifetime_entitlements e
        where e.user_id=s.user_id and e.status='active' and e.scope='all_apps'
      )
    )
    and r.role in ('hr_admin', 'hr_manager');
$fn$;
revoke all on function opshr.resolve_central_actor(uuid,text) from public,anon,authenticated,service_role;
grant execute on function opshr.resolve_central_actor(uuid,text) to opshr_app;

-- A forged identity/org GUC is insufficient: a live central session and matching
-- authoritative membership must also exist at each SQL statement.
create or replace function opshr.opshr_current_hr_member(target_organization text)
returns boolean language sql stable security definer set search_path = ''
as $fn$
  select current_setting('opshr.app_grant_active', true) = 'true'
    and nullif(current_setting('opshr.organization_id', true), '') = target_organization
    and exists (
      select 1 from opshr.resolve_central_actor(
        nullif(current_setting('opshr.central_session_id', true), '')::uuid,
        nullif(current_setting('opshr.central_app_id', true), '')
      ) a
      where a.organization_id = target_organization
        and a.identity_user_id = nullif(current_setting('opshr.identity_user_id', true), '')
    );
$fn$;
revoke all on function opshr.opshr_current_hr_member(text) from public,anon,authenticated,service_role;
grant execute on function opshr.opshr_current_hr_member(text) to opshr_app;

-- Central per-login logout revokes the linked app sessions through the existing
-- MYOPS function. No arbitrary user id is accepted from OpsHR.
create function opshr.end_central_login(session_id uuid, client_id text)
returns boolean language plpgsql security definer set search_path = ''
as $fn$
declare target record;
begin
  select s.login_session_id, s.user_id into target
  from public.myops_app_sessions s
  join public.myops_app_clients c on c.app_id=s.app_id and c.product_slug='opshr'
  where s.id=session_id and s.app_id=client_id and s.product_slug='opshr';
  if not found then return false; end if;
  return public.myops_login_end(target.login_session_id,target.user_id,'logout');
end;
$fn$;
revoke all on function opshr.end_central_login(uuid,text) from public,anon,authenticated,service_role;
grant execute on function opshr.end_central_login(uuid,text) to opshr_app;
commit;
