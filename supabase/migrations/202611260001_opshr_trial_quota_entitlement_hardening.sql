begin;
create or replace function opshr.enforce_employee_trial_limit() returns trigger
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
    or exists(select 1 from public.myops_subscriptions s where s.status='active' and (s.current_period_end is null or s.current_period_end>now()) and (s.product_slug='opshr' or s.is_complete_bundle) and (s.personal_user_id=subject or (s.personal_user_id is null and s.organization_id::text=new.organization_id)))
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
commit;
