import assert from "node:assert/strict";
import test from "node:test";
import { calculatePayroll, demoPayroll } from "../lib/payroll.ts";

test("calculates gross and net in integer cents", () => {
  assert.deepEqual(calculatePayroll(demoPayroll[0]), { grossCents: 375000, netCents: 363000 });
});
test("rejects negative allowances", () => {
  assert.throws(() => calculatePayroll({ ...demoPayroll[0], allowanceCents: -1 }));
});
test("rejects deductions exceeding gross pay", () => {
  assert.throws(() => calculatePayroll({ ...demoPayroll[0], deductionCents: 999999 }));
});
test("rejects fractional cents", () => {
  assert.throws(() => calculatePayroll({ ...demoPayroll[0], basicPayCents: 10.5 }));
});
