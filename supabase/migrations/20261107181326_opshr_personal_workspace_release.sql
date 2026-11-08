begin;
create or replace function opshr.resolve_central_actor(session_id uuid, client_id text)
returns table(identity_user_id text, organization_id text, role text)
language sql stable security definer set search_path = ''
as $fn$
  with live_session as (
    select s.user_id, s.app_id, c.product_slug
    from public.myops_app_sessions s
    join public.myops_login_sessions l on l.id=s.login_session_id and l.user_id=s.user_id
    join public.myops_app_clients c on c.app_id=s.app_id and c.enabled
    where s.id=session_id and s.app_id=client_id and c.product_slug in ('opshr','opsfinance','opsflow','opsp')
      and s.product_slug=c.product_slug
      and s.revoked_at is null and l.revoked_at is null
      and s.last_activity_at>now()-interval '15 minutes' and s.last_activity_at<=now()
      and l.last_activity_at>now()-interval '15 minutes' and l.last_activity_at<=now()
      and s.created_at>now()-interval '12 hours' and s.created_at<=now()
      and l.created_at>now()-interval '12 hours' and l.created_at<=now()
      and exists(select 1 from public.myops_products p where p.slug=c.product_slug and p.launch_status='live')
  ), scopes as (
    select s.user_id, r.organization_id, r.role, false as personal, s.product_slug
    from live_session s
    join opshr.opshr_identity_roles r on r.identity_user_id=s.user_id::text and r.active
    join public.myops_memberships m on m.user_id=s.user_id and m.organization_id::text=r.organization_id and m.status='active'
    join public.myops_app_grants g on g.user_id=s.user_id and g.organization_id=m.organization_id and g.product_slug=s.product_slug
    where r.role in ('hr_admin','hr_manager')
    union all
    select s.user_id, 'personal:'||s.user_id::text, 'hr_admin', true, s.product_slug
    from live_session s join public.myops_profiles p on p.user_id=s.user_id and p.account_type in ('personal','business')
    where not exists(select 1 from opshr.opshr_identity_roles r where r.identity_user_id=s.user_id::text and r.active and r.organization_id not like 'personal:%')
  )
  select s.user_id::text,s.organization_id,s.role from scopes s
  where exists(
    select 1 from public.myops_subscriptions sub where sub.status='active'
      and (sub.current_period_end is null or sub.current_period_end>now())
      and (sub.product_slug=s.product_slug or sub.is_complete_bundle)
      and (sub.personal_user_id=s.user_id or (not s.personal and sub.personal_user_id is null and sub.organization_id::text=s.organization_id))
  ) or exists(
    select 1 from public.myops_lifetime_entitlements e where e.user_id=s.user_id and e.status='active' and e.scope='all_apps'
  ) or (s.personal and exists(
    -- Explicit local HR assignment for the already approved platform admin.
    -- Central broker still checks its current admin entitlement on every HTTP request.
    select 1 from opshr.opshr_identity_roles r where r.identity_user_id=s.user_id::text and r.organization_id=s.organization_id and r.active and r.role='hr_admin'
  ));
$fn$;
revoke all on function opshr.resolve_central_actor(uuid,text) from public,anon,authenticated,service_role;
grant execute on function opshr.resolve_central_actor(uuid,text) to opshr_app;
commit;
