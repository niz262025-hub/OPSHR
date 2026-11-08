import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "pg";
import { readOpshrSqlConfig } from "../lib/opshr-sql-config.ts";
const url="postgresql://opshr_stage_app.ojamkplflqafedmxbdxb:secret@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require";
test("accepts approved staging pooler with strict TLS",()=>{
 const result=readOpshrSqlConfig({OPSHR_STAGING_DATABASE_URL:url,OPSHR_STAGING_ONLY:"true",NODE_ENV:"production",VERCEL_ENV:"preview"});
 assert.equal(result.ssl.rejectUnauthorized,true);assert.equal(result.max,3);
});
test("rejects missing database URL",()=>{
 assert.throws(()=>readOpshrSqlConfig({OPSHR_STAGING_ONLY:"true"}),/Missing/);
});
test("rejects production Vercel environment",()=>{
 assert.throws(()=>readOpshrSqlConfig({OPSHR_STAGING_DATABASE_URL:url,VERCEL_ENV:"production",OPSHR_STAGING_ONLY:"true"}),/disabled/);
});
test("rejects unrelated database host",()=>{
 assert.throws(()=>readOpshrSqlConfig({OPSHR_STAGING_DATABASE_URL:url.replace("pooler.supabase.com","evil.example"),OPSHR_STAGING_ONLY:"true"}),/not approved/);
});
test("rejects unrelated project",()=>{
 assert.throws(()=>readOpshrSqlConfig({OPSHR_STAGING_DATABASE_URL:url.replace("ojamkplflqafedmxbdxb","wrongproject"),OPSHR_STAGING_ONLY:"true"}),/not approved/);
});
test("rejects disabled TLS",()=>{
 assert.throws(()=>readOpshrSqlConfig({OPSHR_STAGING_DATABASE_URL:url.replace("sslmode=require","sslmode=disable"),OPSHR_STAGING_ONLY:"true"}),/TLS/);
});


// Construct the real driver without connecting: URL SSL parsing must not undo verification.
test("pg keeps certificate verification when URL originally contained sslmode=require",()=>{
 const config=readOpshrSqlConfig({OPSHR_STAGING_DATABASE_URL:url,OPSHR_STAGING_ONLY:"true"});
 assert.equal(new URL(config.connectionString).search, "");
 const client=new Client(config);
 assert.equal((client.ssl as unknown as {rejectUnauthorized: boolean}).rejectUnauthorized,true);
});
test("rejects privileged postgres pooler role",()=>{
 assert.throws(()=>readOpshrSqlConfig({OPSHR_STAGING_DATABASE_URL:url.replace("opshr_stage_app.","postgres."),OPSHR_STAGING_ONLY:"true"}),/not approved/);
});
test("rejects TLS override and arbitrary connection options",()=>{
 for(const option of ["sslmode=no-verify","sslmode=verify-ca","ssl=false","options=-c%20role=postgres","sslcert=/tmp/cert"]){
  assert.throws(()=>readOpshrSqlConfig({OPSHR_STAGING_DATABASE_URL:url.split("?")[0]+"?"+option,OPSHR_STAGING_ONLY:"true"}),/Unapproved/);
 }
});
test("rejects other databases, ports and URL fragments",()=>{
 for(const candidate of [url.replace("/postgres?","/other?"),url.replace(":6543/",":9999/"),url+"#fragment"]){
  assert.throws(()=>readOpshrSqlConfig({OPSHR_STAGING_DATABASE_URL:candidate,OPSHR_STAGING_ONLY:"true"}));
 }
});
