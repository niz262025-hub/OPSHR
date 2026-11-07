import assert from "node:assert/strict";
import test from "node:test";
import { demoDocuments, validateDocumentMetadata } from "../lib/hr-documents.ts";
import { summarizeHR } from "../lib/hr-reports.ts";
import { sampleEmployees } from "../lib/employees.ts";
import { demoLeaveRequests } from "../lib/leave.ts";
import { demoPayroll } from "../lib/payroll.ts";

test("synthetic document metadata is valid", () => {
  for (const record of demoDocuments) assert.equal(validateDocumentMetadata(record), null);
});
test("rejects invalid document date", () => {
  assert.match(validateDocumentMetadata({ ...demoDocuments[0], createdOn: "2026-02-30" }) ?? "", /Invalid/);
});
test("summarizes synthetic HR records", () => {
  assert.deepEqual(summarizeHR(sampleEmployees, demoLeaveRequests, demoPayroll), {
    totalEmployees: 3, activeEmployees: 1, pendingLeave: 1, payrollNetCents: 786000,
  });
});
