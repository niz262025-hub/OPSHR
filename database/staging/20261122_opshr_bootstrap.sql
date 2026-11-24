-- Isolated MYOPS Central staging only. This is an atomic bootstrap.
BEGIN;
DO $guard$ BEGIN
 IF current_setting('myops.allow_opshr_staging',true) IS DISTINCT FROM 'wengxxiqwtosirealghx' THEN
  RAISE EXCEPTION 'Explicit isolated OpsHR staging guard required';
 END IF;
END $guard$;
CREATE ROLE opshr_app LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD NULL;


do $migration$
begin
  if to_regnamespace('opshr') is not null then
    raise exception 'Refusing to initialize OpsHR over an existing opshr schema';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_roles
    where rolname = 'opshr_app'
      and rolcanlogin
      and not rolsuper
      and not rolbypassrls
      and not rolcreatedb
      and not rolcreaterole
      and not rolreplication
      and not exists (
        select 1 from pg_catalog.pg_auth_members
        where member = pg_roles.oid
      )
  ) then
    raise exception 'Restricted non-privileged opshr_app role must exist before migration';
  end if;
end
$migration$;

create schema opshr;
revoke all on schema opshr from public, anon, authenticated, service_role;
grant usage on schema opshr to opshr_app;

create table opshr.opshr_identity_roles (
  identity_user_id text not null check (btrim(identity_user_id) <> ''),
  organization_id text not null check (btrim(organization_id) <> ''),
  role text not null check (role in ('hr_admin', 'hr_manager')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (identity_user_id, organization_id)
);

create table opshr.opshr_employees (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null check (btrim(organization_id) <> ''),
  employee_code text not null check (btrim(employee_code) <> ''),
  full_name text not null check (btrim(full_name) <> ''),
  work_email text not null check (btrim(work_email) <> ''),
  department text not null,
  position_title text not null check (btrim(position_title) <> ''),
  start_date date not null,
  employment_status text not null
    check (employment_status in ('active', 'probation', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists opshr_employees_org_code_unique
  on opshr.opshr_employees (organization_id, lower(employee_code));
create unique index if not exists opshr_employees_org_email_unique
  on opshr.opshr_employees (organization_id, lower(work_email));
create index if not exists opshr_employees_org_status_idx
  on opshr.opshr_employees (organization_id, employment_status);

alter table opshr.opshr_identity_roles enable row level security;
alter table opshr.opshr_employees enable row level security;
alter table opshr.opshr_employees force row level security;

create function opshr.opshr_current_hr_member(target_organization text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, opshr
as $function$
  select current_setting('opshr.app_grant_active', true) = 'true'
    and nullif(current_setting('opshr.organization_id', true), '') = target_organization
    and exists (
      select 1
      from opshr.opshr_identity_roles as membership
      where membership.identity_user_id =
        nullif(current_setting('opshr.identity_user_id', true), '')
        and membership.organization_id = target_organization
        and membership.active
        and membership.role in ('hr_admin', 'hr_manager')
    );
$function$;

revoke all on function opshr.opshr_current_hr_member(text)
  from public, anon, authenticated, service_role;
grant execute on function opshr.opshr_current_hr_member(text)
  to opshr_app;

drop policy if exists opshr_employees_hr_tenant_access
  on opshr.opshr_employees;
create policy opshr_employees_hr_tenant_access
  on opshr.opshr_employees
  for all
  to opshr_app
  using (opshr.opshr_current_hr_member(organization_id))
  with check (opshr.opshr_current_hr_member(organization_id));

revoke all on table opshr.opshr_identity_roles
  from public, anon, authenticated, service_role, opshr_app;
revoke all on table opshr.opshr_employees
  from public, anon, authenticated, service_role;
revoke create on schema opshr
  from public, anon, authenticated, service_role, opshr_app;
grant select, insert, update, delete on table opshr.opshr_employees
  to opshr_app;


-- Run only after database/migrations/202611070001_employee_master.sql.
-- Narrow private lookup: does not grant the app SELECT on central identity tables.
create function opshr.resolve_central_actor(session_id uuid, client_id text)
returns table(identity_user_id text, organization_id text, role text)
language sql stable security definer set search_path = ''
as $fn$
  with live_session as (
    select s.user_id, s.app_id, c.product_slug
    from public.myops_app_sessions s
    join public.myops_login_sessions l on l.id = s.login_session_id and l.user_id = s.user_id
    join public.myops_app_clients c on c.app_id = s.app_id and c.enabled
    where s.id = session_id and s.app_id = client_id and c.product_slug = 'opshr'
      and s.product_slug = c.product_slug
      and s.revoked_at is null and l.revoked_at is null
      and s.last_activity_at > now() - interval '15 minutes' and s.last_activity_at <= now()
      and l.last_activity_at > now() - interval '15 minutes' and l.last_activity_at <= now()
      and s.created_at > now() - interval '12 hours' and s.created_at <= now()
      and l.created_at > now() - interval '12 hours' and l.created_at <= now()
      and exists (select 1 from public.myops_products p where p.slug = c.product_slug and p.launch_status='live')
  )
  select s.user_id::text, r.organization_id, r.role
  from live_session s
  join opshr.opshr_identity_roles r on r.identity_user_id = s.user_id::text and r.active
  join public.myops_memberships m on m.user_id = s.user_id and m.organization_id::text = r.organization_id and m.status = 'active'
  join public.myops_app_grants g on g.user_id = s.user_id and g.organization_id = m.organization_id and g.product_slug = s.product_slug
  where (
      exists (
        select 1 from public.myops_subscriptions sub
        where sub.status='active' and (sub.current_period_end is null or sub.current_period_end > now())
          and (sub.product_slug = s.product_slug or sub.is_complete_bundle)
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


create or replace function opshr.resolve_central_actor(session_id uuid, client_id text)
returns table(identity_user_id text, organization_id text, role text)
language sql stable security definer set search_path = ''
as $fn$
  with live_session as (
    select s.user_id, s.app_id, c.product_slug
    from public.myops_app_sessions s
    join public.myops_login_sessions l on l.id=s.login_session_id and l.user_id=s.user_id
    join public.myops_app_clients c on c.app_id=s.app_id and c.enabled
    where s.id=session_id and s.app_id=client_id and c.product_slug = 'opshr'
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
    or exists(select 1 from public.myops_subscriptions s where s.status='active' and (s.current_period_end is null or s.current_period_end>now()) and (s.product_slug = 'opshr' or s.is_complete_bundle) and (s.personal_user_id=subject or (s.personal_user_id is null and s.organization_id::text=new.organization_id)))
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
    where s.id=session_id and s.app_id=client_id and c.product_slug = 'opshr'
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


COMMIT;
