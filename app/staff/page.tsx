"use client";

import Link from "next/link";
import { sampleEmployees } from "../../lib/employees";
import { demoAccounts, demoStaffRequests, ownRequests } from "../../lib/ess";
import { translateEmployeeValue } from "../../lib/i18n";
import { useLocale } from "../locale-provider";

export default function StaffPreviewPage() {
  const { t, locale } = useLocale();
  // Public synthetic UI preview only. This must NOT become a production authorization mechanism.
  const account = demoAccounts[0];
  const employee = sampleEmployees.find((row) => row.id === account.employeeId);
  const requests = ownRequests(account, "demo-tenant", demoStaffRequests);
  return (
    <>
      <Link href="/">{t("moduleBack")}</Link>
      <div className="page-heading"><div>
        <div className="eyebrow">{t("employeePortalKicker")}</div>
        <h1>{t("employeePortal")}</h1>
        <p>{t("syntheticIdentityPreview")}</p>
      </div></div>
      <section className="directory" aria-label={t("myProfile")}>
        <h2>{t("myProfile")}</h2>
        <p>{employee?.name ?? t("demoEmployee")} · {employee?.position ?? t("demoPosition")}</p>
        <p>{t("demoAccessStatus")}: {translateEmployeeValue(locale, account.status)}</p>
      </section>
      <section className="directory" aria-label={t("myServices")}>
        <h2>{t("myServices")}</h2>
        <ul>
          <li>{t("requestLeaveUnavailable")}</li>
          <li>{t("ownPayslipUnavailable")}</li>
          <li>{t("ownAttendanceUnavailable")}</li>
          <li>{t("hrRequestUnavailable")}</li>
        </ul>
      </section>
      <section className="directory" aria-label={t("sampleRequests")}>
        <h2>{t("sampleRequests")}</h2>
        <ul>{requests.map((request) => <li key={request.id}>{request.detail} — {translateEmployeeValue(locale, request.status)}</li>)}</ul>
      </section>
      <p className="message">{t("demoWarning")}</p>
    </>
  );
}
