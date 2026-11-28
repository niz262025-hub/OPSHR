"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LocaleSelector, useLocale } from "./locale-provider";

const navigation = [
  { href: "/", key: "home" },
  { href: "/employees", key: "employees" },
  { href: "/attendance", key: "attendance" },
  { href: "/leave", key: "leave" },
  { href: "/payroll", key: "payroll" },
  { href: "/documents", key: "documents" },
  { href: "/reports", key: "reports" },
  { href: "/staff", key: "staff" },
] as const;

export default function AppShell({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  return (
    <>
      <header className="opshr-header">
        <div className="opshr-header-inner">
          <Link className="brand" href="/" aria-label={t("homeAccessible")}>MYOPS <span>/ OpsHR</span></Link>
          <div className="opshr-header-actions">
            <LocaleSelector id="desktop-language" />
            <a className="opshr-back-link" href="/api/myops-return">{t("backToMyops")}</a>
          </div>
        </div>
      </header>
      <div className="opshr-shell">
        <details className="opshr-mobile-menu">
          <summary>{t("mobileMenu")}</summary>
          <LocaleSelector id="mobile-language" />
          <nav aria-label={t("mobileNavigation")}>
            {navigation.map((item) => <Link key={item.href} href={item.href}>{t(item.key)}</Link>)}
          </nav>
        </details>
        <nav className="opshr-nav" aria-label={t("navigation")}>
          {navigation.map((item) => <Link key={item.href} href={item.href}>{t(item.key)}</Link>)}
        </nav>
        <main>
          <aside role="note">
            <strong>{t("uatNoticeTitle")}</strong> — {t("uatNotice")}
          </aside>
          {children}
        </main>
      </div>
      <footer>{t("footer")}</footer>
    </>
  );
}
