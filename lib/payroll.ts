export type PayrollLine = {
  employeeId: string;
  basicPayCents: number;
  allowanceCents: number;
  deductionCents: number;
};

export const demoPayroll: PayrollLine[] = [
  { employeeId: "demo-1", basicPayCents: 350000, allowanceCents: 25000, deductionCents: 12000 },
  { employeeId: "demo-2", basicPayCents: 420000, allowanceCents: 18000, deductionCents: 15000 },
];

export function calculatePayroll(line: PayrollLine) {
  const amounts = [line.basicPayCents, line.allowanceCents, line.deductionCents];
  if (amounts.some((value) => !Number.isSafeInteger(value) || value < 0)) {
    throw new Error("Payroll amounts must be non-negative safe integers in cents");
  }
  const grossCents = line.basicPayCents + line.allowanceCents;
  if (!Number.isSafeInteger(grossCents) || line.deductionCents > grossCents) {
    throw new Error("Invalid payroll totals");
  }
  const netCents = grossCents - line.deductionCents;
  return { grossCents, netCents };
}

export function formatDemoMoney(cents: number) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency", currency: "MYR",
  }).format(cents / 100);
}
