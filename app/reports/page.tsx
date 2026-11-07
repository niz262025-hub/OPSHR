import Link from "next/link";
import { sampleEmployees } from "../../lib/employees";
import { demoLeaveRequests } from "../../lib/leave";
import { demoPayroll, formatDemoMoney } from "../../lib/payroll";
import { summarizeHR } from "../../lib/hr-reports";

export default function ReportsPage() {
  const summary = summarizeHR(sampleEmployees, demoLeaveRequests, demoPayroll);
  return (
    <>
      <Link href="/">← Modul OpsHR</Link>
      <div className="page-heading"><div><div className="eyebrow">LAPORAN HR</div><h1>Ringkasan HR</h1><p>Statistik contoh, bukan laporan rasmi.</p></div></div>
      <div className="stats">
        <article><span>Jumlah pekerja</span><strong>{summary.totalEmployees}</strong></article>
        <article><span>Pekerja aktif</span><strong>{summary.activeEmployees}</strong></article>
        <article><span>Cuti menunggu kelulusan</span><strong>{summary.pendingLeave}</strong></article>
        <article><span>Jumlah gaji bersih demo</span><strong>{formatDemoMoney(summary.payrollNetCents)}</strong></article>
      </div>
      <p className="message">Tiada data sebenar, eksport laporan atau integrasi MYOPS.</p>
    </>
  );
}
