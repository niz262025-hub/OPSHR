import type { Employee } from "./employees.ts";
import type { LeaveRequest } from "./leave.ts";
import type { PayrollLine } from "./payroll.ts";
import { calculatePayroll } from "./payroll.ts";

export function summarizeHR(employees: readonly Employee[], leaves: readonly LeaveRequest[], payroll: readonly PayrollLine[]) {
  const activeEmployees = employees.filter((row) => row.status === "Aktif").length;
  const pendingLeave = leaves.filter((row) => row.status === "Pending").length;
  const payrollNetCents = payroll.reduce((total, row) => {
    const next = total + calculatePayroll(row).netCents;
    if (!Number.isSafeInteger(next)) throw new Error("Payroll summary overflow");
    return next;
  }, 0);
  return { totalEmployees: employees.length, activeEmployees, pendingLeave, payrollNetCents };
}
