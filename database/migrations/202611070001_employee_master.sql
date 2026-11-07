begin;

create table if not exists opshr_stage.opshr_identity_roles (
  identity_user_id text not null check (btrim(identity_user_id) <> ''),
  organization_id text not null check (btrim(organization_id) <> ''),
  role text not null check (role in ('hr_admin', 'hr_manager')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (identity_user_id, organization_id)
);

create table if not exists opshr_stage.opshr_employees (
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
  on opshr_stage.opshr_employees (organization_id, lower(employee_code));
create unique index if not exists opshr_employees_org_email_unique
  on opshr_stage.opshr_employees (organization_id, lower(work_email));
create index if not exists opshr_employees_org_status_idx
  on opshr_stage.opshr_employees (organization_id, employment_status);

alter table opshr_stage.opshr_identity_roles enable row level security;
alter table opshr_stage.opshr_employees enable row level security;
alter table opshr_stage.opshr_employees force row level security;

create or replace function opshr_stage.opshr_current_hr_member(target_organization text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, opshr_stage
as $function$
  select current_setting('opshr.app_grant_active', true) = 'true'
    and nullif(current_setting('opshr.organization_id', true), '') = target_organization
    and exists (
      select 1
      from opshr_stage.opshr_identity_roles as membership
      where membership.identity_user_id =
        nullif(current_setting('opshr.identity_user_id', true), '')
        and membership.organization_id = target_organization
        and membership.active
        and membership.role in ('hr_admin', 'hr_manager')
    );
$function$;

revoke all on function opshr_stage.opshr_current_hr_member(text)
  from public, anon, authenticated, service_role;
grant execute on function opshr_stage.opshr_current_hr_member(text)
  to opshr_stage_app;

drop policy if exists opshr_employees_hr_tenant_access
  on opshr_stage.opshr_employees;
create policy opshr_employees_hr_tenant_access
  on opshr_stage.opshr_employees
  for all
  to opshr_stage_app
  using (opshr_stage.opshr_current_hr_member(organization_id))
  with check (opshr_stage.opshr_current_hr_member(organization_id));

revoke all on table opshr_stage.opshr_identity_roles
  from public, anon, authenticated, service_role, opshr_stage_app;
revoke all on table opshr_stage.opshr_employees
  from public, anon, authenticated, service_role;
revoke create on schema opshr_stage
  from public, anon, authenticated, service_role, opshr_stage_app;
grant usage on schema opshr_stage to opshr_stage_app;
grant select, insert, update, delete on table opshr_stage.opshr_employees
  to opshr_stage_app;

commit;
