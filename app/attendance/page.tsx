"use client";

import Link from "next/link";
import { sampleEmployees } from "../../lib/employees";
import { translateEmployeeValue } from "../../lib/i18n";
import { useLocale } from "../locale-provider";

const demoAttendance = [
  { employeeId: "demo-1", date: "2026-11-05", status: "Hadir" },
  { employeeId: "demo-2", date: "2026-11-05", status: "Cuti" },
  { employeeId: "demo-3", date: "2026-11-05", status: "Tidak aktif" },
];

export default function AttendancePage() {
  const { t, date, locale } = useLocale();
  return (
    <>
      <Link href="/">{t("moduleBack")}</Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("attendanceKicker")}</div>
          <h1>{t("attendanceSummary")}</h1>
          <p>{t("syntheticDesignData")}</p>
        </div>
      </div>
      <section className="directory" aria-label={t("attendanceDemo")}>
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">{t("employee")}</th><th scope="col">{t("date")}</th><th scope="col">{t("status")}</th></tr></thead>
            <tbody>
              {demoAttendance.map((record) => {
                const employee = sampleEmployees.find((row) => row.id === record.employeeId);
                return (
                  <tr key={record.employeeId}>
                    <td>{employee?.name ?? "Rekod demo"}</td>
                    <td>{date(record.date)}</td>
                    <td>{translateEmployeeValue(locale, record.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="message">{t("demoOnlyNoStorage")}</p>
    </>
  );
}
