"use client";

import Link from "next/link";
import { sampleEmployees } from "../../lib/employees";
import { calculatePayroll, demoPayroll } from "../../lib/payroll";
import { useLocale } from "../locale-provider";

export default function PayrollPage() {
  const { t, currency } = useLocale();
  return (
    <>
      <Link href="/">{t("moduleBack")}</Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("payrollKicker")}</div>
          <h1>{t("payrollSummary")}</h1>
          <p>{t("payrollPreview")}</p>
        </div>
      </div>
      <section className="directory" aria-label={t("payrollDemo")}>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">{t("employee")}</th>
                <th scope="col">{t("basicPay")}</th>
                <th scope="col">{t("allowance")}</th>
                <th scope="col">{t("deduction")}</th>
                <th scope="col">{t("netPay")}</th>
              </tr>
            </thead>
            <tbody>
              {demoPayroll.map((line) => (
                <tr key={line.employeeId}>
                  <td>{sampleEmployees.find((employee) => employee.id === line.employeeId)?.name ?? "Demo"}</td>
                  <td>{currency(line.basicPayCents / 100)}</td>
                  <td>{currency(line.allowanceCents / 100)}</td>
                  <td>{currency(line.deductionCents / 100)}</td>
                  <td><strong>{currency(calculatePayroll(line).netCents / 100)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="message">{t("payrollDemoOnly")}</p>
    </>
  );
}
