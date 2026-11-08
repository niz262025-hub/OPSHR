import assert from "node:assert/strict";
import test from "node:test";
import { processHrApproval } from "../lib/hr-approval-service.ts";
import type { HrApprovalRepository } from "../lib/hr-approval-service.ts";
const id="11111111-1111-4111-8111-111111111111";
function fixture(overrides: Partial<{
  actor: Awaited<ReturnType<HrApprovalRepository["verifyActor"]>>;
  tenant: string; state: "pending"|"approved"|"suspended"; updated: boolean;
}> = {}) {
  const writes: unknown[]=[];
  const repository: HrApprovalRepository = {
    async verifyActor(){return overrides.actor === undefined ? {
      identityUserId:"hr-1",organizationId:"company-a",sessionActive:true,
      hrMembershipActive:true,role:"hr_admin" as const
    } : overrides.actor;},
    async findStaffAccessById(recordId){return {
      id:recordId,organizationId:overrides.tenant??"company-a",
      employeeId:"employee-a",identityUserId:"employee-identity-a",status:overrides.state??"pending",
    };},
    async updateStatusWithAudit(input){writes.push(input);return overrides.updated??true;},
  };
  return {repository,writes};
}
test("approval persists only a status patch with atomic audit request",async()=>{
 const f=fixture();const result=await processHrApproval(f.repository,{recordId:id,action:"approve"},()=>"2026-11-05T00:00:00Z");
 assert.deepEqual(result,{ok:true,status:"approved"});
 assert.equal(f.writes.length,1);
 assert.deepEqual((f.writes[0] as {patch:object}).patch,{
  access_status:"approved",approved_by:"hr-1",approved_at:"2026-11-05T00:00:00Z"});
 assert.equal((f.writes[0] as {eventType:string}).eventType,"staff_access.approved");
});
test("pending account rejection keeps the record pending and records a rejection event",async()=>{
 const f=fixture();const result=await processHrApproval(f.repository,{recordId:id,action:"reject"},()=>"2026-11-05T00:00:00Z");
 assert.deepEqual(result,{ok:true,status:"pending"});
 assert.equal(f.writes.length,1);
 assert.deepEqual((f.writes[0] as {patch:object}).patch,{
  access_status:"pending",approved_by:"hr-1",approved_at:"2026-11-05T00:00:00Z"});
 assert.equal((f.writes[0] as {eventType:string}).eventType,"staff_access.rejected");
});
test("cross tenant cannot write",async()=>{
 const f=fixture({tenant:"company-b"});assert.equal((await processHrApproval(f.repository,{recordId:id,action:"approve"})).ok,false);assert.equal(f.writes.length,0);
});
test("inactive HR cannot write",async()=>{
 const f=fixture({actor:null});assert.deepEqual(await processHrApproval(f.repository,{recordId:id,action:"approve"}),{ok:false,error:"forbidden"});assert.equal(f.writes.length,0);
});
test("invalid ID rejected before lookup",async()=>{
 const f=fixture();assert.deepEqual(await processHrApproval(f.repository,{recordId:"../other",action:"approve"}),{ok:false,error:"invalid_request"});assert.equal(f.writes.length,0);
});
test("concurrent status conflict is reported",async()=>{
 const f=fixture({updated:false});assert.deepEqual(await processHrApproval(f.repository,{recordId:id,action:"approve"}),{ok:false,error:"conflict"});
});
test("suspension transition and audit type",async()=>{
 const f=fixture({state:"approved"});assert.deepEqual(await processHrApproval(f.repository,{recordId:id,action:"suspend"}),{ok:true,status:"suspended"});
 assert.equal((f.writes[0] as {eventType:string}).eventType,"staff_access.suspended");
});
