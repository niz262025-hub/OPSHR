import assert from "node:assert/strict";
import test from "node:test";
import { approvalPatch, authorizeStaffAccessChange } from "../lib/hr-approval.ts";
import type { VerifiedActor, StaffAccessRecord } from "../lib/hr-approval.ts";

const actor: VerifiedActor = {
  identityUserId: "hr-1", organizationId: "company-a", sessionActive: true,
  role: "hr_manager", hrMembershipActive: true,
};
const target: StaffAccessRecord = {
  id: "staff-access-1", organizationId: "company-a",
  employeeId: "employee-a", identityUserId: "staff-a", status: "pending",
};
test("approved HR in same tenant may approve pending staff", () => {
  const d = authorizeStaffAccessChange(actor, target, "approve");
  assert.equal(d.allowed, true);
  assert.deepEqual(approvalPatch(d, actor, "2026-11-05T00:00:00Z"), {
    access_status: "approved", approved_by: "hr-1", approved_at: "2026-11-05T00:00:00Z",
  });
});
test("cross-tenant HR cannot approve", () => {
  assert.equal(authorizeStaffAccessChange({...actor, organizationId:"company-b"},target,"approve").reason,"cross_tenant");
});
test("employee cannot act as HR", () => {
  assert.equal(authorizeStaffAccessChange({...actor,role:"employee"},target,"approve").allowed,false);
});
test("inactive HR membership is denied", () => {
  assert.equal(authorizeStaffAccessChange({...actor,hrMembershipActive:false},target,"approve").allowed,false);
});
test("expired session is denied", () => {
  assert.equal(authorizeStaffAccessChange({...actor,sessionActive:false},target,"approve").allowed,false);
});
test("HR cannot approve their own staff identity", () => {
  assert.equal(authorizeStaffAccessChange({...actor,identityUserId:"staff-a"},target,"approve").reason,"self_approval");
});
test("invalid transitions are denied", () => {
  assert.equal(authorizeStaffAccessChange(actor,{...target,status:"approved"},"approve").allowed,false);
  assert.equal(authorizeStaffAccessChange(actor,target,"suspend").allowed,false);
});
test("suspend and reinstate require matching states", () => {
  assert.equal(authorizeStaffAccessChange(actor,{...target,status:"approved"},"suspend").nextStatus,"suspended");
  assert.equal(authorizeStaffAccessChange(actor,{...target,status:"suspended"},"reinstate").nextStatus,"approved");
});
test("approval patch cannot contain mutable identity fields", () => {
  const d=authorizeStaffAccessChange(actor,target,"approve");
  const patch=approvalPatch(d,actor,"2026-11-05T00:00:00Z");
  assert.deepEqual(Object.keys(patch).sort(),["access_status","approved_at","approved_by"]);
});
test("rejected decision cannot generate a database patch", () => {
  const d=authorizeStaffAccessChange({...actor,sessionActive:false},target,"approve");
  assert.throws(()=>approvalPatch(d,actor,"2026-11-05T00:00:00Z"),/denied/);
});
