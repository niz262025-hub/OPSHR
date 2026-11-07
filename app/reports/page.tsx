"use client";

import Link from "next/link";
import { sampleEmployees } from "../../lib/employees";
import { demoLeaveRequests } from "../../lib/leave";
import { demoPayroll } from "../../lib/payroll";
import { summarizeHR } from "../../lib/hr-reports";
import { useLocale } from "../locale-provider";

export default function ReportsPage() {
  const summary = summarizeHR(sampleEmployees, demoLeaveRequests, demoPayroll);
  const { t, currency, number } = useLocale();
  return (
    <>
      <Link href="/">{t("moduleBack")}</Link>
      <div className="page-heading"><div><div className="eyebrow">{t("reportsKicker")}</div><h1>{t("hrSummary")}</h1><p>{t("sampleStatistics")}</p></div></div>
      <div className="stats">
        <article><span>{t("totalEmployees")}</span><strong>{number(summary.totalEmployees)}</strong></article>
        <article><span>{t("active")}</span><strong>{number(summary.activeEmployees)}</strong></article>
        <article><span>{t("pendingLeave")}</span><strong>{number(summary.pendingLeave)}</strong></article>
        <article><span>{t("demoNetPayroll")}</span><strong>{currency(summary.payrollNetCents / 100)}</strong></article>
      </div>
      <p className="message">{t("noRealDataReports")}</p>
    </>
  );
}
