import assert from "node:assert/strict";
import test from "node:test";
import { signOpshrSession, verifyOpshrServerSession } from "../lib/opshr-session.ts";
import type { SessionAuthority } from "../lib/opshr-session.ts";
const now=1_800_000_000;
const secret="staging-only-example-secret-longer-than-32-characters";
const claims={sid:"session-a",sub:"hr-a",org:"org-a",iat:now-60,exp:now+600};
function authority(options:Partial<{revoked:boolean;lastActivityAt:number;org:string;active:boolean;role:"hr_admin"|"hr_manager"}>={}):SessionAuthority{
 return {
  async findSession(){return {sessionId:"session-a",identityUserId:"hr-a",organizationId:options.org??"org-a",revoked:options.revoked??false,lastActivityAt:options.lastActivityAt??now-60};},
  async findHrMembership(){return {role:options.role??"hr_admin",active:options.active??true};},
 };
}
const verify=(token:string,auth=authority())=>verifyOpshrServerSession(token,secret,auth,now);
test("valid signed active HR session",async()=>{
 const actor=await verify(signOpshrSession(claims,secret));
 assert.equal(actor?.role,"hr_admin");assert.equal(actor?.organizationId,"org-a");
});
test("tampered signature denied",async()=>{
 const token=signOpshrSession(claims,secret);assert.equal(await verify(token.slice(0,-1)+(token.at(-1)==="A"?"B":"A")),null);
});
test("expired session denied",async()=>{
 assert.equal(await verify(signOpshrSession({...claims,exp:now-1},secret)),null);
});
test("revoked server session denied",async()=>{
 assert.equal(await verify(signOpshrSession(claims,secret),authority({revoked:true})),null);
});
test("idle 15 minutes denied",async()=>{
 assert.equal(await verify(signOpshrSession(claims,secret),authority({lastActivityAt:now-900})),null);
});
test("mismatched organization denied",async()=>{
 assert.equal(await verify(signOpshrSession(claims,secret),authority({org:"org-b"})),null);
});
test("inactive HR membership denied",async()=>{
 assert.equal(await verify(signOpshrSession(claims,secret),authority({active:false})),null);
});
test("short secret denied",async()=>{
 assert.equal(await verifyOpshrServerSession(signOpshrSession(claims,secret),"weak",authority(),now),null);
});
test("future-issued session denied",async()=>{
 assert.equal(await verify(signOpshrSession({...claims,iat:now+60,exp:now+600},secret)),null);
});
