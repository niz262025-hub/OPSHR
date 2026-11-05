import assert from "node:assert/strict";
import test from "node:test";
import { createPostgresSessionAuthority } from "../lib/postgres-session-adapter.ts";
import type { SqlQueryClient } from "../lib/postgres-session-adapter.ts";
const sid="abcdefghijklmnopqrstuvwxyz123456";
test("session adapter uses parameterized query and maps session",async()=>{
 const calls: {sql:string;values:readonly unknown[]}[]=[];
 const client:SqlQueryClient={async query<T extends object>(sql: string,values: readonly (string|number|null)[]){
  calls.push({sql,values});
  return {rows:[{session_id:sid,identity_user_id:"hr-a",organization_id:"org-a",revoked_at:null,
    expires_at:new Date(Date.now()+600000).toISOString(),last_activity_at:new Date().toISOString()}] as unknown as T[]};
 }};
 const session=await createPostgresSessionAuthority(client).findSession(sid);
 assert.equal(session?.identityUserId,"hr-a");
 assert.deepEqual(calls[0].values,[sid]);
 assert.match(calls[0].sql,/session_id=\$1/);
});
test("malformed session ID rejected without DB query",async()=>{
 let called=false;
 const client:SqlQueryClient={async query<T extends object>(){called=true;return {rows:[]};}};
 assert.equal(await createPostgresSessionAuthority(client).findSession("../unsafe"),null);
 assert.equal(called,false);
});
test("revoked session remains marked revoked",async()=>{
 const client:SqlQueryClient={async query<T extends object>(){return {rows:[{
 session_id:sid,identity_user_id:"hr-a",organization_id:"org-a",
 revoked_at:new Date().toISOString(),expires_at:new Date(Date.now()+600000).toISOString(),
 last_activity_at:new Date().toISOString()}] as unknown as T[]};}};
 assert.equal((await createPostgresSessionAuthority(client).findSession(sid))?.revoked,true);
});
test("membership lookup is scoped to actor and organization",async()=>{
 const calls:readonly (string|number|null)[][]=[];
 const client:SqlQueryClient={async query<T extends object>(sql: string,values: readonly (string|number|null)[]){
  (calls as (string|number|null)[][]).push([...values]);
  return {rows:[{role:"hr_manager",active:true}] as unknown as T[]};
 }};
 assert.equal((await createPostgresSessionAuthority(client).findHrMembership("hr-a","org-a"))?.role,"hr_manager");
 assert.deepEqual(calls[0],["hr-a","org-a"]);
});
test("unrecognized HR role denied",async()=>{
 const client:SqlQueryClient={async query<T extends object>(){return {rows:[{role:"employee",active:true}] as unknown as T[]};}};
 assert.equal(await createPostgresSessionAuthority(client).findHrMembership("hr-a","org-a"),null);
});

