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
-- Synthetic users and organizations exist only inside this rolled-back test.
begin;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-000000000001','hr-a@example.test'),
 ('00000000-0000-4000-8000-000000000002','hr-b@example.test');
update public.myops_products set launch_status='live' where slug='opshr';
insert into public.myops_app_clients(app_id,product_slug,public_key_current,enabled)
values ('opshr','opshr','-----BEGIN PUBLIC KEY-----MCowBQYDK2VwAyEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=-----END PUBLIC KEY-----',true);
insert into public.myops_organizations(id,name,owner_user_id) values
 ('10000000-0000-4000-8000-000000000001','Synthetic A','00000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-000000000002','Synthetic B','00000000-0000-4000-8000-000000000002');
insert into public.myops_memberships(organization_id,user_id,role,status) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','admin','active'),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','admin','active');
insert into public.myops_app_grants(organization_id,user_id,product_slug) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','opshr'),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','opshr');
insert into public.myops_subscriptions(organization_id,product_slug,status,current_period_end) values
 ('10000000-0000-4000-8000-000000000001','opshr','active',now()+interval '1 day'),
 ('10000000-0000-4000-8000-000000000002','opshr','active',now()+interval '1 day');
insert into public.myops_login_sessions(id,user_id) values
 ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001'),
 ('20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002');
insert into public.myops_app_sessions(id,user_id,app_id,product_slug,login_session_id) values
 ('30000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','opshr','opshr','20000000-0000-4000-8000-000000000001'),
 ('30000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','opshr','opshr','20000000-0000-4000-8000-000000000002');
insert into opshr.opshr_identity_roles(identity_user_id,organization_id,role,active) values
 ('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','hr_admin',true),
 ('00000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','hr_admin',true);
set local role opshr_app;
do $test$
declare i integer; own_org text; other_org text; actor text; sid text; affected integer;
begin
  for i in 1..2 loop
    own_org := '10000000-0000-4000-8000-00000000000'||i;
    actor := '00000000-0000-4000-8000-00000000000'||i;
    sid := '30000000-0000-4000-8000-00000000000'||i;
    perform set_config('opshr.identity_user_id',actor,true),set_config('opshr.organization_id',own_org,true),set_config('opshr.app_grant_active','true',true),set_config('opshr.central_session_id',sid,true),set_config('opshr.central_app_id','opshr',true);
    insert into opshr.opshr_employees(organization_id,employee_code,full_name,work_email,department,position_title,start_date,employment_status)
      values(own_org,'T001','Synthetic','fixture@example.test','Fixture','Tester',current_date,'active');
  end loop;
  for i in 1..2 loop
    own_org := '10000000-0000-4000-8000-00000000000'||i;
    other_org := '10000000-0000-4000-8000-00000000000'||(3-i);
    actor := '00000000-0000-4000-8000-00000000000'||i;
    sid := '30000000-0000-4000-8000-00000000000'||i;
    perform set_config('opshr.identity_user_id',actor,true),set_config('opshr.organization_id',own_org,true),set_config('opshr.app_grant_active','true',true),set_config('opshr.central_session_id',sid,true),set_config('opshr.central_app_id','opshr',true);
    if (select count(*) from opshr.opshr_employees where organization_id=own_org)<>1 then raise exception 'authorized read failed %',i; end if;
    if exists(select 1 from opshr.opshr_employees where organization_id=other_org) then raise exception 'cross-tenant read %',i; end if;
    update opshr.opshr_employees set full_name='Forbidden' where organization_id=other_org;
    get diagnostics affected=row_count; if affected<>0 then raise exception 'cross-tenant update %',i; end if;
    delete from opshr.opshr_employees where organization_id=other_org;
    get diagnostics affected=row_count; if affected<>0 then raise exception 'cross-tenant delete %',i; end if;
    begin
      insert into opshr.opshr_employees(organization_id,employee_code,full_name,work_email,department,position_title,start_date,employment_status)
        values(other_org,'T002','Forbidden','forbidden@example.test','Fixture','Tester',current_date,'active');
      raise exception 'cross-tenant insert allowed %',i;
    exception when insufficient_privilege then null;
    end;
  end loop;
end
$test$;
reset role;
update public.myops_login_sessions set revoked_at=now() where id='20000000-0000-4000-8000-000000000001';
set local role opshr_app;
do $test$
begin
  perform set_config('opshr.identity_user_id','00000000-0000-4000-8000-000000000001',true),set_config('opshr.organization_id','10000000-0000-4000-8000-000000000001',true),set_config('opshr.app_grant_active','true',true),set_config('opshr.central_session_id','30000000-0000-4000-8000-000000000001',true),set_config('opshr.central_app_id','opshr',true);
  if exists(select 1 from opshr.opshr_employees) then raise exception 'revoked session permitted'; end if;
end
$test$;
rollback;
