"use client";

import Link from "next/link";
import { sampleEmployees } from "../../lib/employees";
import { demoLeaveRequests } from "../../lib/leave";
import { translateEmployeeValue } from "../../lib/i18n";
import { useLocale } from "../locale-provider";

export default function LeavePage() {
  const { t, date, locale } = useLocale();
  return (
    <>
      <Link href="/">{t("moduleBack")}</Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("leaveKicker")}</div>
          <h1>{t("leaveRequests")}</h1>
          <p>{t("leavePreview")}</p>
        </div>
      </div>
      <section className="directory" aria-label={t("leaveDemo")}>
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">{t("employee")}</th><th scope="col">{t("type")}</th><th scope="col">{t("date")}</th><th scope="col">{t("status")}</th></tr></thead>
            <tbody>
              {demoLeaveRequests.map((request) => (
                <tr key={request.id}>
                  <td>{sampleEmployees.find((employee) => employee.id === request.employeeId)?.name ?? "Demo"}</td>
                  <td>{translateEmployeeValue(locale, request.type)}</td>
                  <td>{date(request.startDate)} – {date(request.endDate)}</td>
                  <td>{translateEmployeeValue(locale, request.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="message">{t("demoReadOnly")}</p>
    </>
  );
}
