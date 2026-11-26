\set ON_ERROR_STOP on
-- Catalog and role assertions run against disposable local Supabase only.
do $assert$
declare n text; f text; priv text;
begin
  foreach n in array array['opshr_identity_roles','opshr_employees','trial_employee_creations'] loop
    if to_regclass('opshr.'||n) is null then raise exception 'missing table %',n; end if;
    if not (select relrowsecurity from pg_class where oid=to_regclass('opshr.'||n)) then raise exception 'RLS missing %',n; end if;
    foreach priv in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
      if has_table_privilege('anon','opshr.'||n,priv) or has_table_privilege('authenticated','opshr.'||n,priv) then raise exception 'browser privilege % %',n,priv; end if;
    end loop;
  end loop;
  if not (select relforcerowsecurity from pg_class where oid='opshr.opshr_employees'::regclass) then raise exception 'forced employee RLS missing'; end if;
  if not exists(select 1 from pg_policies where schemaname='opshr' and tablename='opshr_employees' and policyname='opshr_employees_hr_tenant_access' and roles @> array['opshr_app']::name[]) then raise exception 'employee tenant policy missing'; end if;
  foreach f in array array['opshr.resolve_central_actor(uuid,text)','opshr.opshr_current_hr_member(text)','opshr.end_central_login(uuid,text)'] loop
    if to_regprocedure(f) is null then raise exception 'missing RPC %',f; end if;
    if has_function_privilege('anon',f,'EXECUTE') or has_function_privilege('authenticated',f,'EXECUTE') or has_function_privilege('service_role',f,'EXECUTE') then raise exception 'excess broker privilege %',f; end if;
    if not has_function_privilege('opshr_app',f,'EXECUTE') then raise exception 'app execution missing %',f; end if;
  end loop;
  foreach priv in array array['SELECT','INSERT','UPDATE','DELETE'] loop
    if not has_table_privilege('opshr_app','opshr.opshr_employees',priv) then raise exception 'app employee privilege missing %',priv; end if;
    if has_table_privilege('opshr_app','opshr.opshr_identity_roles',priv) or has_table_privilege('opshr_app','opshr.trial_employee_creations',priv) then raise exception 'sensitive table privilege %',priv; end if;
  end loop;
  if not exists(select 1 from pg_trigger where tgrelid='opshr.opshr_employees'::regclass and tgname='opshr_employee_trial_limit' and not tgisinternal) then raise exception 'trial trigger missing'; end if;
  foreach n in array array['opshr_employees_org_code_unique','opshr_employees_org_email_unique','opshr_employees_org_status_idx'] loop
    if to_regclass('opshr.'||n) is null then raise exception 'missing index %',n; end if;
  end loop;
  if not exists(select 1 from pg_roles where rolname='opshr_app' and not rolsuper and not rolbypassrls and not rolcreatedb and not rolcreaterole) then raise exception 'unsafe application role'; end if;
end
$assert$;
-- Missing server session must not return any employee or permit inserts.
begin;
set local role opshr_app;
do $assert$
begin
  if exists(select 1 from opshr.opshr_employees) then raise exception 'unauthenticated read allowed'; end if;
  begin
    insert into opshr.opshr_employees (organization_id, employee_code, full_name, work_email, department, position_title, start_date, employment_status)
    values ('synthetic-org', 'T001', 'Synthetic', 'fixture@example.test', 'Fixture', 'Tester', current_date, 'active');
    raise exception 'unauthenticated insert allowed';
  exception when insufficient_privilege then null;
  end;
end
$assert$;
rollback;
