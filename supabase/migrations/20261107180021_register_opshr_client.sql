begin;
alter table public.myops_app_clients drop constraint myops_app_clients_app_id_check;
alter table public.myops_app_clients add constraint myops_app_clients_app_id_check check(app_id in ('opsfinance','opsflow','opsp','opshr'));
do $migration$
declare original text;
begin
  select pg_get_expr(conbin,conrelid) into original from pg_constraint where conrelid='public.myops_app_clients'::regclass and conname='myops_app_clients_public_key_current_check';
  if original is null then raise exception 'Existing broker public-key constraint missing'; end if;
  alter table public.myops_app_clients drop constraint myops_app_clients_public_key_current_check;
  execute format('alter table public.myops_app_clients add constraint myops_app_clients_public_key_current_check check ((%s) or (app_id=''opshr'' and public_key_current ~ %L))', original, '^-----BEGIN PUBLIC KEY-----[[:space:]]*MCowBQYDK2VwAyEA[A-Za-z0-9+/]{43}=[[:space:]]*-----END PUBLIC KEY-----[[:space:]]*$');
end;
$migration$;
commit;
