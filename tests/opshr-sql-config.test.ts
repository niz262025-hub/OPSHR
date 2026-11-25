import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "pg";
import { readOpshrSqlConfig } from "../lib/opshr-sql-config.ts";
const projectRef="abcdefghijklmnopqrst";
const url=`postgresql://opshr_app.${projectRef}:synthetic-test-password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`;
const stagingEnv={OPSHR_STAGING_DATABASE_URL:url,OPSHR_MYOPS_CENTRAL_PROJECT_REF:projectRef,OPSHR_STAGING_ONLY:"true"};
test("accepts approved staging pooler with strict TLS",()=>{
 const result=readOpshrSqlConfig({...stagingEnv,NODE_ENV:"production"});
 assert.equal(result.ssl.rejectUnauthorized,true);assert.equal(result.max,3);
});
test('baseline Preview accepts only its approved project and restricted role',()=>{
 const ref='wengxxiqwtosirealghx';
 const pool=`postgresql://opshr_baseline.${ref}:synthetic@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
 const direct=`postgresql://opshr_baseline:synthetic@db.${ref}.supabase.co:5432/postgres`;
 const preview={VERCEL_ENV:'preview',OPSHR_STAGING_ONLY:'true',OPSHR_MYOPS_CENTRAL_PROJECT_REF:ref,OPSHR_STAGING_DATABASE_URL:pool};
 assert.equal(readOpshrSqlConfig(preview).ssl.rejectUnauthorized,true);
 assert.equal(readOpshrSqlConfig({...preview,OPSHR_STAGING_DATABASE_URL:direct}).ssl.rejectUnauthorized,true);
 for(const candidate of [pool.replace('opshr_baseline.','postgres.'),pool.replace('opshr_baseline.','opshr_app.'),direct.replace('opshr_baseline:','postgres:')])
  assert.throws(()=>readOpshrSqlConfig({...preview,OPSHR_STAGING_DATABASE_URL:candidate}));
 assert.throws(()=>readOpshrSqlConfig({...preview,OPSHR_MYOPS_CENTRAL_PROJECT_REF:projectRef}),/Unapproved baseline staging project/);
 assert.throws(()=>readOpshrSqlConfig({...preview,OPSHR_STAGING_ONLY:'false'}),/disabled/);
 const production={VERCEL_ENV:'production',OPSHR_ENABLE_PRODUCTION_DATABASE:'true',OPSHR_MYOPS_CENTRAL_PROJECT_REF:ref,OPSHR_DATABASE_URL:pool};
 assert.throws(()=>readOpshrSqlConfig(production));
 assert.doesNotThrow(()=>readOpshrSqlConfig({...production,OPSHR_DATABASE_URL:pool.replace('opshr_baseline.','opshr_app.')}));
});
test("rejects missing database URL",()=>{
 assert.throws(()=>readOpshrSqlConfig({OPSHR_STAGING_ONLY:"true",OPSHR_MYOPS_CENTRAL_PROJECT_REF:projectRef}),/Missing/);
});
test("rejects production Vercel environment",()=>{
 assert.throws(()=>readOpshrSqlConfig({...stagingEnv,VERCEL_ENV:"production"}),/disabled/);
});
test("rejects non-production use without an explicit staging flag",()=>{
 assert.throws(()=>readOpshrSqlConfig({OPSHR_MYOPS_CENTRAL_PROJECT_REF:projectRef,OPSHR_STAGING_DATABASE_URL:url}),/disabled/);
 assert.throws(()=>readOpshrSqlConfig({OPSHR_STAGING_ONLY:"false",OPSHR_MYOPS_CENTRAL_PROJECT_REF:projectRef,OPSHR_STAGING_DATABASE_URL:url}),/disabled/);
});
test('production requires its own explicit gate and server-only URL',()=>{
 const production={OPSHR_MYOPS_CENTRAL_PROJECT_REF:projectRef,VERCEL_ENV:'production',OPSHR_ENABLE_PRODUCTION_DATABASE:'true',OPSHR_DATABASE_URL:url};
 assert.equal(readOpshrSqlConfig(production).ssl.rejectUnauthorized,true);
 assert.throws(()=>readOpshrSqlConfig({...production,OPSHR_DATABASE_URL:undefined,OPSHR_STAGING_DATABASE_URL:url}),/Missing/);
});
test("rejects unrelated database host",()=>{
 assert.throws(()=>readOpshrSqlConfig({...stagingEnv,OPSHR_STAGING_DATABASE_URL:url.replace("pooler.supabase.com","evil.example")}),/configured MYOPS Central project/);
});
test("rejects unrelated project",()=>{
 assert.throws(()=>readOpshrSqlConfig({...stagingEnv,OPSHR_MYOPS_CENTRAL_PROJECT_REF:"zyxwvutsrqponmlkjihg"}),/configured MYOPS Central project/);
});
test("rejects disabled TLS",()=>{
 assert.throws(()=>readOpshrSqlConfig({...stagingEnv,OPSHR_STAGING_DATABASE_URL:url.replace("sslmode=require","sslmode=disable")}),/TLS/);
});

// Construct the real driver without connecting: URL SSL parsing must not undo verification.
test("pg keeps certificate verification when URL originally contained sslmode=require",()=>{
 const config=readOpshrSqlConfig(stagingEnv);
 assert.equal(new URL(config.connectionString).search, "");
 const client=new Client(config);
 assert.equal((client.ssl as unknown as {rejectUnauthorized: boolean}).rejectUnauthorized,true);
});
test("rejects privileged postgres pooler role",()=>{
 assert.throws(()=>readOpshrSqlConfig({...stagingEnv,OPSHR_STAGING_DATABASE_URL:url.replace("opshr_app.","postgres.")}),/configured MYOPS Central project/);
});
test("rejects TLS override and arbitrary connection options",()=>{
 for(const option of ["sslmode=no-verify","sslmode=verify-ca","ssl=false","options=-c%20role=postgres","sslcert=/tmp/cert"]){
  assert.throws(()=>readOpshrSqlConfig({...stagingEnv,OPSHR_STAGING_DATABASE_URL:url.split("?")[0]+"?"+option}),/Unapproved/);
 }
});
test("rejects other databases, ports and URL fragments",()=>{
 for(const candidate of [url.replace("/postgres?","/other?"),url.replace(":6543/",":9999/"),url+"#fragment"]){
  assert.throws(()=>readOpshrSqlConfig({...stagingEnv,OPSHR_STAGING_DATABASE_URL:candidate}));
 }
});
test("requires a project reference and accepts direct connections only with the restricted role",()=>{
 assert.throws(()=>readOpshrSqlConfig({OPSHR_STAGING_ONLY:"true",OPSHR_STAGING_DATABASE_URL:url}),/OPSHR_MYOPS_CENTRAL_PROJECT_REF/);
 const direct = new URL(url);
 direct.hostname = `db.${projectRef}.supabase.co`;
 direct.port = "5432";
 direct.pathname = "/postgres";
 direct.search = "?sslmode=require";
 direct.username = "opshr_app";
 direct.password = "synthetic-test-password";
 assert.equal(readOpshrSqlConfig({...stagingEnv,OPSHR_STAGING_DATABASE_URL:direct.toString()}).ssl.rejectUnauthorized,true);
 direct.username = "postgres";
 assert.throws(()=>readOpshrSqlConfig({...stagingEnv,OPSHR_STAGING_DATABASE_URL:direct.toString()}),/Restricted OpsHR database role/);
});
