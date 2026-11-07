begin;

revoke all on table opshr_stage.opshr_employees from opshr_stage_app;
revoke execute on function opshr_stage.opshr_current_hr_member(text)
  from opshr_stage_app;

commit;
