import assert from "node:assert/strict";
import test from "node:test";
import { canAccessOwnRecord, demoAccounts, demoStaffRequests, ownRequests } from "../lib/ess.ts";

test("approved demo account can view its own record", () => {
  assert.equal(canAccessOwnRecord(demoAccounts[0], "demo-tenant", "demo-1"), true);
});
test("pending account is denied", () => {
  assert.equal(canAccessOwnRecord(demoAccounts[1], "demo-tenant", "demo-2"), false);
});
test("another employee or tenant is denied", () => {
  assert.equal(canAccessOwnRecord(demoAccounts[0], "demo-tenant", "demo-2"), false);
  assert.equal(canAccessOwnRecord(demoAccounts[0], "other-tenant", "demo-1"), false);
});
test("suspended account is denied", () => {
  assert.equal(canAccessOwnRecord({ ...demoAccounts[0], status: "suspended" }, "demo-tenant", "demo-1"), false);
});
test("request filter only returns approved account's own records", () => {
  assert.equal(ownRequests(demoAccounts[0], "demo-tenant", demoStaffRequests).length, 1);
  assert.equal(ownRequests(demoAccounts[1], "demo-tenant", demoStaffRequests).length, 0);
});
test("cross-employee request filtering stays isolated even when ids are tampered with", () => {
  const account = demoAccounts[0];
  const filtered = ownRequests(account, "demo-tenant", [
    { id: "r-1", employeeId: "demo-1", kind: "letter", detail: "Own letter", status: "approved" },
    { id: "r-2", employeeId: "demo-2", kind: "letter", detail: "Other tenant letter", status: "approved" },
    { id: "r-3", employeeId: "demo-1", kind: "leave", detail: "Own leave", status: "pending" },
  ]);
  assert.deepEqual(filtered.map((request) => request.id), ["r-1", "r-3"]);
  assert.equal(canAccessOwnRecord(account, "demo-tenant", "demo-2"), false);
  assert.equal(canAccessOwnRecord({ ...account, tenantId: "other-tenant" }, "demo-tenant", "demo-1"), false);
});
