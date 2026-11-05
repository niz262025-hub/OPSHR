-- REVIEW-ONLY OpsHR schema proposal. DO NOT APPLY TO PRODUCTION.
-- All tables have RLS enabled and NO access policies: deny by default.
-- Requires MYOPS identity mapping, tenant-scoped policies and security tests before use.
create extension if not exists pgcrypto;

create table if not exists public.opshr_employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  employee_code text not null,
  full_name text not null,
  work_email text,
  department text,
  position_title text,
  employment_status text not null default 'active'
    check (employment_status in ('active','probation','inactive')),
  start_date date,
  created_at timestamptz not null default now(),
  unique (organization_id, employee_code),
  unique (id, organization_id)
);
create unique index if not exists opshr_employees_org_email_unique
  on public.opshr_employees (organization_id, lower(work_email))
  where work_email is not null;

create table if not exists public.opshr_staff_access (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  employee_id uuid not null,
  identity_user_id uuid not null,
  access_status text not null default 'pending'
    check (access_status in ('pending','approved','suspended')),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, employee_id),
  unique (organization_id, identity_user_id),
  foreign key (employee_id, organization_id)
    references public.opshr_employees (id, organization_id)
);

create table if not exists public.opshr_leave_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  employee_id uuid not null,
  leave_type text not null check (leave_type in ('annual','medical','unpaid','other')),
  start_date date not null,
  end_date date not null,
  reason text,
  request_status text not null default 'pending'
    check (request_status in ('pending','approved','rejected','cancelled')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  foreign key (employee_id, organization_id)
    references public.opshr_employees (id, organization_id)
);

create table if not exists public.opshr_attendance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  employee_id uuid not null,
  attendance_date date not null,
  attendance_status text not null check (attendance_status in ('present','absent','leave','holiday')),
  check_in_at timestamptz,
  check_out_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, employee_id, attendance_date),
  check (check_out_at is null or (check_in_at is not null and check_out_at >= check_in_at)),
  foreign key (employee_id, organization_id)
    references public.opshr_employees (id, organization_id)
);

create table if not exists public.opshr_payroll_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  period_start date not null,
  period_end date not null,
  run_status text not null default 'draft'
    check (run_status in ('draft','approved','published','void')),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (period_end >= period_start),
  unique (id, organization_id)
);

create table if not exists public.opshr_payslips (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  payroll_run_id uuid not null,
  employee_id uuid not null,
  basic_pay_cents bigint not null check (basic_pay_cents >= 0),
  allowance_cents bigint not null default 0 check (allowance_cents >= 0),
  deduction_cents bigint not null default 0 check (deduction_cents >= 0),
  currency_code char(3) not null default 'MYR',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check (deduction_cents <= basic_pay_cents + allowance_cents),
  unique (organization_id, payroll_run_id, employee_id),
  foreign key (payroll_run_id, organization_id)
    references public.opshr_payroll_runs (id, organization_id),
  foreign key (employee_id, organization_id)
    references public.opshr_employees (id, organization_id)
);

create table if not exists public.opshr_hr_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  employee_id uuid not null,
  document_type text not null
    check (document_type in ('contract','policy','letter','payslip','other')),
  title text not null,
  private_storage_path text,
  released_to_employee_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (employee_id, organization_id)
    references public.opshr_employees (id, organization_id)
);

create table if not exists public.opshr_staff_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  employee_id uuid not null,
  request_type text not null check (request_type in ('letter','record')),
  request_details text not null,
  request_status text not null default 'pending'
    check (request_status in ('pending','approved','rejected','fulfilled')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (employee_id, organization_id)
    references public.opshr_employees (id, organization_id)
);

create table if not exists public.opshr_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  actor_identity_id uuid,
  employee_id uuid,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now(),
  foreign key (employee_id, organization_id)
    references public.opshr_employees (id, organization_id)
);

alter table public.opshr_employees enable row level security;
alter table public.opshr_staff_access enable row level security;
alter table public.opshr_leave_requests enable row level security;
alter table public.opshr_attendance enable row level security;
alter table public.opshr_payroll_runs enable row level security;
alter table public.opshr_payslips enable row level security;
alter table public.opshr_hr_documents enable row level security;
alter table public.opshr_staff_requests enable row level security;
alter table public.opshr_audit_events enable row level security;

-- No SELECT/INSERT/UPDATE/DELETE policies are intentionally defined.
-- Do not expose a service-role key to client apps.
-- Next: link organization_id to authoritative MYOPS organizations, implement
-- tenant + employee RLS, HR authorization, audit triggers and private storage.
