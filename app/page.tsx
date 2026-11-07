"use client";

import Link from "next/link";
import { useLocale } from "./locale-provider";

const shortcuts = [
  { title: "employees", description: "employeeShortcut", href: "/employees", icon: "👥" },
  { title: "attendance", description: "attendanceShortcut", href: "/attendance", icon: "🕒" },
  { title: "leave", description: "leaveShortcut", href: "/leave", icon: "📅" },
  { title: "payroll", description: "payrollShortcut", href: "/payroll", icon: "💳" },
  { title: "documents", description: "documentShortcut", href: "/documents", icon: "📁" },
  { title: "reports", description: "reportShortcut", href: "/reports", icon: "📋" },
  { title: "staff", description: "staffShortcut", href: "/staff", icon: "🪪" },
  { title: "hrLetters", description: "letterShortcut", href: "/letters", icon: "✉️" },
] as const;

export default function Home() {
  const { t } = useLocale();
  return (
    <div className="opshr-dashboard">
      <div className="opshr-dashboard-heading">
        <div>
          <p className="opshr-dashboard-kicker">MYOPS / {t("hrManagement")}</p>
          <h1>{t("dashboard")}</h1>
          <p>{t("dashboardDescription")}</p>
        </div>
        <span className="opshr-preview-tag">{t("liveUat")}</span>
      </div>
      <div className="opshr-dashboard-summary" aria-label={t("moduleStatus")}>
        <div><span>{t("employeeManagement")}</span><strong>{t("availableForUat")}</strong></div>
        <div><span>{t("attendanceAndLeave")}</span><strong>{t("inDevelopment")}</strong></div>
        <div><span>{t("payroll")}</span><strong>{t("inDevelopment")}</strong></div>
      </div>
      <section aria-labelledby="quick-access-title">
        <div className="opshr-section-heading"><h2 id="quick-access-title">{t("quickAccess")}</h2></div>
        <div className="opshr-shortcut-grid">
          {shortcuts.map((item) => (
            <Link key={item.href} className="opshr-shortcut" href={item.href}>
              <span className="opshr-shortcut-icon" aria-hidden="true">{item.icon}</span>
              <strong>{t(item.title)}</strong>
              <small>{t(item.description)}</small>
              <span className="opshr-shortcut-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
