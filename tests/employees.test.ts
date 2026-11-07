import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filterEmployees,
  validateEmployee,
  sampleEmployees,
} from "../lib/employees.ts";
const valid = {
  ...sampleEmployees[0],
  code: "DEMO-004",
  email: "new@example.com",
};
test("search and department/status filters work together", () => {
  assert.equal(
    filterEmployees(sampleEmployees, "  contoh  ", "Operasi", "Aktif").length,
    1,
  );
  assert.equal(
    filterEmployees(sampleEmployees, "DEMO-001", "Kewangan", "").length,
    0,
  );
  assert.equal(filterEmployees(sampleEmployees, "nobody", "", "").length, 0);
});
test("duplicate codes and emails are case insensitive; editing self is allowed", () => {
  assert.ok(validateEmployee({ ...valid, code: "demo-001" }, sampleEmployees));
  assert.ok(
    validateEmployee(
      { ...valid, email: "CONTOH.A@example.com" },
      sampleEmployees,
    ),
  );
  assert.equal(
    validateEmployee(sampleEmployees[0], sampleEmployees, "demo-1"),
    null,
  );
});
test("invalid dates and missing or unsupported values are rejected", () => {
  for (const input of [
    { ...valid, startDate: "2026-02-30" },
    { ...valid, startDate: "bad" },
    { ...valid, name: " " },
    { ...valid, department: "Unknown" },
    { ...valid, email: "bad" },
    { ...valid, code: "<script>" },
  ])
    assert.ok(validateEmployee(input, sampleEmployees));
  assert.equal(validateEmployee(valid, sampleEmployees), null);
});
