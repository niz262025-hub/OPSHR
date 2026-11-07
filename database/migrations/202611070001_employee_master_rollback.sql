begin;

revoke all on table opshr.opshr_employees from opshr_app;
revoke execute on function opshr.opshr_current_hr_member(text)
  from opshr_app;

commit;
