import assert from "node:assert/strict";
import test from "node:test";
import { readOpshrSqlConfig } from "../lib/opshr-sql-config.ts";
const url="postgresql://opshr.ojamkplflqafedmxbdxb:secret@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require";
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
