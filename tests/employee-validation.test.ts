import assert from "node:assert/strict";
import test from "node:test";
import { validateEmployeeDraft, type EmployeeDraft } from "../lib/employee-validation.ts";

const valid: EmployeeDraft = {
  employeeCode: "EMP-001", fullName: "Demo Employee", email: "demo@example.test",
  department: "Operations", position: "Coordinator", status: "active",
};

test("accepts complete synthetic employee", () => {
  assert.deepEqual(validateEmployeeDraft(valid), []);
});

test("rejects blank required fields", () => {
  const result = validateEmployeeDraft({ ...valid, fullName: " " });
  assert.ok(result.some((error) => error.field === "fullName"));
});

test("rejects invalid email", () => {
  assert.ok(validateEmployeeDraft({ ...valid, email: "bad" }).some((e) => e.field === "email"));
});

test("rejects duplicate employee codes ignoring case and spaces", () => {
  assert.ok(validateEmployeeDraft(valid, [" emp-001 "]).some((e) => e.field === "employeeCode"));
});

test("rejects unexpected employee status", () => {
  const draft = { ...valid, status: "pending" } as unknown as EmployeeDraft;
  assert.ok(validateEmployeeDraft(draft).some((e) => e.field === "status"));
});
