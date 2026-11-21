import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { generateKeyPairSync } from 'node:crypto';

test('OpsHR registry expansion preserves existing client checks and validates new Ed25519 keys', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create table public.myops_app_clients(app_id text primary key,
      public_key_current text not null,
      constraint myops_app_clients_app_id_check check(app_id in ('opsfinance','opsflow','opsp')),
      constraint myops_app_clients_public_key_current_check check(public_key_current='existing-key'));
      insert into public.myops_app_clients values ('opsfinance','existing-key');`);
    await db.exec(await readFile(new URL('../supabase/migrations/20261107180021_register_opshr_client.sql', import.meta.url), 'utf8'));
    const { publicKey } = generateKeyPairSync('ed25519');
    const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    await db.query("insert into public.myops_app_clients values('opshr',$1)", [pem]);
    await assert.rejects(db.query("insert into public.myops_app_clients values('opsflow',$1)", [pem]));
    await assert.rejects(db.query("update public.myops_app_clients set public_key_current='invalid' where app_id='opshr'"));
    assert.equal((await db.query("select public_key_current from public.myops_app_clients where app_id='opsfinance'")).rows[0].public_key_current,'existing-key');
  } finally { await db.close(); }
});

test('real PostgreSQL policies deny missing/revoked sessions, forged tenants and public roles', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create role opshr_app login;
      create table public.myops_app_clients(app_id text primary key, product_slug text, enabled boolean);
      create table public.myops_login_sessions(id uuid primary key, user_id uuid, created_at timestamptz default now(), last_activity_at timestamptz default now(), revoked_at timestamptz);
      create table public.myops_app_sessions(id uuid primary key, user_id uuid, app_id text, product_slug text, login_session_id uuid, created_at timestamptz default now(), last_activity_at timestamptz default now(), revoked_at timestamptz);
      create table public.myops_memberships(user_id uuid, organization_id uuid, status text, role text default 'admin');
      create table public.myops_organizations(id uuid,owner_user_id uuid);
      create table public.myops_trials(id uuid primary key default gen_random_uuid(),user_id uuid,organization_id uuid,started_at timestamptz,expires_at timestamptz,status text,policy_version integer);
      create table public.myops_app_grants(user_id uuid, organization_id uuid, product_slug text);
      create table public.myops_products(slug text,launch_status text);
      create table public.myops_subscriptions(personal_user_id uuid,organization_id uuid,product_slug text,is_complete_bundle boolean,status text,current_period_end timestamptz);
      create table public.myops_lifetime_entitlements(user_id uuid,status text,scope text);
      create table public.myops_profiles(user_id uuid,account_type text);
      create function public.myops_login_end(p_id uuid,p_user_id uuid,p_reason text) returns boolean language plpgsql as $$
      begin update public.myops_login_sessions set revoked_at=now() where id=p_id and user_id=p_user_id; return found; end; $$;
    `);
    await db.exec(await readFile(new URL('../database/migrations/202611070001_employee_master.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/20261107174454_central_session_bridge.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/20261107181326_opshr_personal_workspace_release.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/20261107184134_opshr_free_trial_quota.sql', import.meta.url), 'utf8'));
    const user = '00000000-0000-4000-8000-000000000001';
    const org = '00000000-0000-4000-8000-000000000002';
    const otherOrg = '00000000-0000-4000-8000-000000000003';
    const login = '00000000-0000-4000-8000-000000000004';
    const sid = '00000000-0000-4000-8000-000000000005';
    await db.query(`insert into public.myops_app_clients values ('opshr','opshr',true)`);
    await db.query("insert into public.myops_products values ('opshr','live')");
    await db.query("insert into public.myops_subscriptions values(null,$1,'opshr',false,'active',now()+interval '1 month')", [org]);
    await db.query('insert into public.myops_login_sessions(id,user_id) values ($1,$2)', [login,user]);
    await db.query("insert into public.myops_app_sessions(id,user_id,app_id,product_slug,login_session_id) values ($1,$2,'opshr','opshr',$3)", [sid,user,login]);
    await db.query("insert into public.myops_memberships(user_id,organization_id,status) values ($1,$2,'active')", [user,org]);
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
    // A previously authorized manager loses both read and write access when disabled.
    await db.query('update opshr.opshr_identity_roles set active=false where identity_user_id=$1 and organization_id=$2', [user,org]);
    await db.exec('set role opshr_app');
    assert.equal((await db.query('select * from opshr.opshr_employees')).rows.length,0);
    await assert.rejects(insert(org));
    await db.exec('reset role');
    await db.query('update opshr.opshr_identity_roles set active=true where identity_user_id=$1 and organization_id=$2', [user,org]);
    await db.query("update public.myops_subscriptions set current_period_end=now()-interval '1 minute'");
    await db.query("insert into public.myops_subscriptions values(null,$1,'opshr',false,'active',now()+interval '1 month')", [otherOrg]);
    await db.exec('set role opshr_app');
    assert.equal((await db.query('select * from opshr.opshr_employees')).rows.length,0);
    await db.exec('reset role');
    await db.query("update public.myops_subscriptions set current_period_end=now()+interval '1 month'");
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
    const personalUser='00000000-0000-4000-8000-000000000011';
    const personalLogin='00000000-0000-4000-8000-000000000014';
    const personalSid='00000000-0000-4000-8000-000000000015';
    await db.query("insert into public.myops_profiles values($1,'personal')",[personalUser]);
    await db.query('insert into public.myops_login_sessions(id,user_id) values($1,$2)',[personalLogin,personalUser]);
    await db.query("insert into public.myops_app_sessions(id,user_id,app_id,product_slug,login_session_id) values($1,$2,'opshr','opshr',$3)",[personalSid,personalUser,personalLogin]);
    await db.query("insert into public.myops_subscriptions values($1,null,'opshr',false,'active',now()+interval '1 month')",[personalUser]);
    await db.exec('set role opshr_app');
    const personalActor=(await db.query('select * from opshr.resolve_central_actor($1,$2)',[personalSid,'opshr'])).rows;
    assert.equal(personalActor.length,1);
    assert.equal(personalActor[0].organization_id,'personal:'+personalUser);
    await db.query("select set_config('opshr.identity_user_id',$1,false),set_config('opshr.organization_id',$2,false),set_config('opshr.central_session_id',$3,false)",[personalUser,'personal:'+personalUser,personalSid]);
    await insert('personal:'+personalUser);
    assert.equal((await db.query('select * from opshr.opshr_employees')).rows.length,1);
    await db.exec('reset role');
    await db.query("update public.myops_subscriptions set status='expired' where personal_user_id=$1",[personalUser]);
    await db.exec('set role opshr_app');
    assert.equal((await db.query('select * from opshr.opshr_employees')).rows.length,0);
    await db.exec('reset role');
    await db.query("insert into public.myops_trials(user_id,started_at,expires_at,status,policy_version) values($1,now(),now()+interval '168 hours','active',1)",[personalUser]);
    await db.exec('set role opshr_app');
    assert.equal((await db.query('select * from opshr.resolve_central_actor($1,$2)',[personalSid,'opshr'])).rows.length,1);
    for(let i=1;i<=29;i++) await db.query("insert into opshr.opshr_employees(organization_id,employee_code,full_name,work_email,department,position_title,start_date,employment_status) values($1,$2,'Trial Synthetic',$3,'Operasi','Tester','2026-11-07','active')",['personal:'+personalUser,'TRIAL-'+i,`trial-${i}@example.test`]);
    assert.equal((await db.query('select * from opshr.opshr_employees')).rows.length,30);
    await assert.rejects(db.query("insert into opshr.opshr_employees(organization_id,employee_code,full_name,work_email,department,position_title,start_date,employment_status) values($1,'OVER-LIMIT','Trial Synthetic','over@example.test','Operasi','Tester','2026-11-07','active')",['personal:'+personalUser]),/trial employee limit reached/);
    await db.exec('reset role');
    assert.equal((await db.query('select count(*)::int as n from opshr.trial_employee_creations')).rows[0].n,29);
    await db.query("update public.myops_trials set status='expired' where user_id=$1",[personalUser]);
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
