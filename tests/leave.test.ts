import assert from "node:assert/strict";
import test from "node:test";
import { demoLeaveRequests, validateLeaveRequest } from "../lib/leave.ts";

test("synthetic leave records have valid dates and statuses", () => {
  for (const record of demoLeaveRequests) {
    assert.equal(validateLeaveRequest(record), null);
  }
});

test("rejects end date earlier than start date", () => {
  const record = { ...demoLeaveRequests[0], endDate: "2026-11-01" };
  assert.match(validateLeaveRequest(record) ?? "", /End date/);
});

test("rejects invalid calendar dates", () => {
  const record = { ...demoLeaveRequests[0], startDate: "2026-02-30" };
  assert.match(validateLeaveRequest(record) ?? "", /Invalid date/);
});

test("requires a reason", () => {
  const record = { ...demoLeaveRequests[0], reason: " " };
  assert.match(validateLeaveRequest(record) ?? "", /required/);
});
