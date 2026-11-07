import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "OpsHR | MYOPS",
  description: "OpsHR — pengurusan sumber manusia dalam ekosistem MYOPS.",
  robots: { index: false, follow: false },
};

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/employees", label: "Pekerja" },
  { href: "/attendance", label: "Kehadiran" },
  { href: "/leave", label: "Cuti" },
  { href: "/payroll", label: "Payroll" },
  { href: "/documents", label: "Dokumen" },
  { href: "/reports", label: "Laporan" },
  { href: "/staff", label: "Portal Pekerja" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ms">
      <body>
        <header className="opshr-header">
          <div className="opshr-header-inner">
            <Link className="brand" href="/" aria-label="OpsHR homepage">MYOPS <span>/ OpsHR</span></Link>
            <a className="opshr-back-link" href="https://www.myops.com.my/">Kembali ke MYOPS ↗</a>
          </div>
        </header>
        <div className="opshr-shell">
          <nav className="opshr-nav" aria-label="Navigasi OpsHR">
            {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
          <main>
            <aside role="note">
              <strong>Preview pembangunan</strong> — Data contoh sahaja. Jangan masukkan data pekerja sebenar.
              MYOPS central login dan sambungan database masih belum disahkan untuk kegunaan sebenar.
            </aside>
            {children}
          </main>
        </div>
        <footer>OpsHR · Sebahagian daripada ekosistem MYOPS</footer>
      </body>
    </html>
  );
}
