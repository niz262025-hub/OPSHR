import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { LocaleProvider } from "./locale-provider";
import AppShell from "./app-shell";
import { getLocale, translate } from "../lib/i18n";
import "./globals.css";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("myops_locale")?.value);
  return {
    title: "OpsHR | MYOPS",
    description: translate(locale, "metadataDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("myops_locale")?.value);
  return (
    <html lang={locale}>
      <body>
        <LocaleProvider initialLocale={locale}>
          <AppShell>{children}</AppShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
