import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('real PostgreSQL policies deny missing/revoked sessions, forged tenants and public roles', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create role opshr_app login;
      create table public.myops_app_clients(app_id text primary key, product_slug text, enabled boolean);
      create table public.myops_login_sessions(id uuid primary key, user_id uuid, created_at timestamptz default now(), last_activity_at timestamptz default now(), revoked_at timestamptz);
      create table public.myops_app_sessions(id uuid primary key, user_id uuid, app_id text, product_slug text, login_session_id uuid, created_at timestamptz default now(), last_activity_at timestamptz default now(), revoked_at timestamptz);
      create table public.myops_memberships(user_id uuid, organization_id uuid, status text);
      create table public.myops_app_grants(user_id uuid, organization_id uuid, product_slug text);
      create function public.myops_login_end(p_id uuid,p_user_id uuid,p_reason text) returns boolean language plpgsql as $$
      begin update public.myops_login_sessions set revoked_at=now() where id=p_id and user_id=p_user_id; return found; end; $$;
    `);
    await db.exec(await readFile(new URL('../database/migrations/202611070001_employee_master.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/20261107174454_central_session_bridge.sql', import.meta.url), 'utf8'));
    const user = '00000000-0000-4000-8000-000000000001';
    const org = '00000000-0000-4000-8000-000000000002';
    const otherOrg = '00000000-0000-4000-8000-000000000003';
    const login = '00000000-0000-4000-8000-000000000004';
    const sid = '00000000-0000-4000-8000-000000000005';
    await db.query(`insert into public.myops_app_clients values ('opshr','opshr',true)`);
    await db.query('insert into public.myops_login_sessions(id,user_id) values ($1,$2)', [login,user]);
    await db.query("insert into public.myops_app_sessions(id,user_id,app_id,product_slug,login_session_id) values ($1,$2,'opshr','opshr',$3)", [sid,user,login]);
    await db.query("insert into public.myops_memberships values ($1,$2,'active')", [user,org]);
    await db.query("insert into public.myops_app_grants values ($1,$2,'opshr')", [user,org]);
    await db.query("insert into opshr.opshr_identity_roles(identity_user_id,organization_id,role,active) values ($1,$2,'hr_admin',true)", [user,org]);
    await db.exec('set role opshr_app');
    assert.equal((await db.query('select * from opshr.resolve_central_actor($1,$2)', [sid,'opshr'])).rows.length,1);
    assert.equal((await db.query('select * from opshr.resolve_central_actor($1,$2)', [sid,'opsfinance'])).rows.length,0);
    await assert.rejects(db.query('select * from public.myops_login_sessions'));
    const setContext = async (targetOrg, session = sid) => {
      await db.query("select set_config('opshr.identity_user_id',$1,false), set_config('opshr.organization_id',$2,false), set_config('opshr.app_grant_active','true',false), set_config('opshr.central_session_id',$3,false), set_config('opshr.central_app_id','opshr',false)", [user,targetOrg,session]);
    };
    const insert = targetOrg => db.query("insert into opshr.opshr_employees(organization_id,employee_code,full_name,work_email,department,position_title,start_date,employment_status) values ($1,'T01','Synthetic','test@example.test','Operasi','Tester','2026-11-07','active') returning id", [targetOrg]);
    await setContext(org, '');
    await assert.rejects(insert(org));
    await setContext(org);
    const created = await insert(org);
    assert.equal(created.rows.length,1);
    assert.equal((await db.query('select * from opshr.opshr_employees')).rows.length,1);
    await setContext(otherOrg);
    assert.equal((await db.query('select * from opshr.opshr_employees')).rows.length,0);
    await assert.rejects(insert(otherOrg));
    await setContext(org);
    await assert.rejects(db.query('update opshr.opshr_employees set organization_id=$1', [otherOrg]));
    await db.exec('reset role');
    await db.query("update public.myops_app_sessions set last_activity_at=now()-interval '15 minutes'");
    await db.exec('set role opshr_app');
    assert.equal((await db.query('select * from opshr.opshr_employees')).rows.length,0);
    await db.exec('reset role');
    await db.query('update public.myops_app_sessions set last_activity_at=now()');
    await db.query('update public.myops_login_sessions set revoked_at=now()');
    await db.exec('set role opshr_app');
    assert.equal((await db.query('select * from opshr.opshr_employees')).rows.length,0);
    await db.exec('reset role');
    await db.query('update public.myops_login_sessions set revoked_at=null');
    await db.exec('set role opshr_app');
    assert.equal((await db.query('select opshr.end_central_login($1,$2) as ended', [sid,'opsfinance'])).rows[0].ended,false);
    assert.equal((await db.query('select opshr.end_central_login($1,$2) as ended', [sid,'opshr'])).rows[0].ended,true);
    assert.equal((await db.query('select * from opshr.opshr_employees')).rows.length,0);
    await db.exec('reset role');
    await db.query('update public.myops_login_sessions set revoked_at=null');
    await db.query('delete from public.myops_app_grants');
    await db.exec('set role opshr_app');
    assert.equal((await db.query('select * from opshr.opshr_employees')).rows.length,0);
    await db.exec('reset role');
    for (const role of ['anon','authenticated','service_role']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.query('select * from opshr.opshr_employees'));
      await assert.rejects(db.query('select * from opshr.resolve_central_actor($1,$2)', [sid,'opshr']));
      await db.exec('reset role');
    }
  } finally { await db.close(); }
});
