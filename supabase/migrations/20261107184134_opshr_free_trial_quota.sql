begin;
create function opshr.active_trial(subject uuid, target_organization text)
returns boolean language sql stable security definer set search_path=''
as $fn$
  select exists(select 1 from public.myops_trials t
    where t.user_id=subject and t.status='active' and t.policy_version=1
      and t.started_at<=now() and t.expires_at>now()
      and t.expires_at=t.started_at+interval '168 hours'
      and ((t.organization_id is null and target_organization='personal:'||subject::text)
        or (t.organization_id::text=target_organization
          and exists(select 1 from public.myops_organizations o where o.id=t.organization_id and o.owner_user_id=subject)
          and exists(select 1 from public.myops_memberships m where m.organization_id=t.organization_id and m.user_id=subject and m.role='admin' and m.status='active')
          and (select count(*) from public.myops_memberships m where m.organization_id=t.organization_id and m.status='active')=1)));
$fn$;
revoke all on function opshr.active_trial(uuid,text) from public,anon,authenticated,service_role,opshr_app;

create table opshr.trial_employee_creations(
  trial_id uuid not null references public.myops_trials(id),
  employee_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(trial_id,employee_id)
);
alter table opshr.trial_employee_creations enable row level security;
revoke all on opshr.trial_employee_creations from public,anon,authenticated,service_role,opshr_app;

create function opshr.enforce_employee_trial_limit() returns trigger
language plpgsql security definer set search_path=''
as $fn$
declare subject uuid; trial uuid;
begin
  subject:=nullif(current_setting('opshr.identity_user_id',true),'')::uuid;
  if subject is null or not opshr.active_trial(subject,new.organization_id) then return new; end if;
  if not exists(select 1 from opshr.resolve_central_actor(
    nullif(current_setting('opshr.central_session_id',true),'')::uuid,
    nullif(current_setting('opshr.central_app_id',true),'')
  ) a where a.identity_user_id=subject::text and a.organization_id=new.organization_id) then
    raise exception 'Active MYOPS authorization required' using errcode='42501';
  end if;
  if exists(select 1 from public.myops_lifetime_entitlements e where e.user_id=subject and e.status='active' and e.scope='all_apps')
    or exists(select 1 from opshr.opshr_identity_roles r where r.identity_user_id=subject::text and r.organization_id=new.organization_id and r.role='hr_admin' and r.active)
    or exists(select 1 from public.myops_subscriptions s where s.status='active' and (s.current_period_end is null or s.current_period_end>now()) and (s.product_slug in ('opshr','opsfinance','opsflow','opsp') or s.is_complete_bundle) and (s.personal_user_id=subject or (s.personal_user_id is null and s.organization_id::text=new.organization_id)))
  then return new; end if;
  select id into trial from public.myops_trials where user_id=subject for update;
  if (select count(*) from opshr.trial_employee_creations where trial_id=trial)>=30
    or (select count(*) from opshr.opshr_employees where organization_id=new.organization_id)>=30 then
    raise exception 'OpsHR trial employee limit reached' using errcode='P0001';
  end if;
  insert into opshr.trial_employee_creations(trial_id,employee_id) values(trial,new.id);
  return new;
end;
$fn$;
revoke all on function opshr.enforce_employee_trial_limit() from public,anon,authenticated,service_role,opshr_app;
create trigger opshr_employee_trial_limit before insert on opshr.opshr_employees
for each row execute function opshr.enforce_employee_trial_limit();
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
      and s.product_slug = c.product_slug
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
    union all
    select s.user_id, t.organization_id::text, 'hr_admin', false, s.product_slug
    from live_session s join public.myops_trials t on t.user_id=s.user_id
    where t.organization_id is not null and opshr.active_trial(s.user_id,t.organization_id::text)
  )
  select distinct s.user_id::text,s.organization_id,s.role from scopes s
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
  )) or opshr.active_trial(s.user_id,s.organization_id);
$fn$;
revoke all on function opshr.resolve_central_actor(uuid,text) from public,anon,authenticated,service_role;
grant execute on function opshr.resolve_central_actor(uuid,text) to opshr_app;

commit;
