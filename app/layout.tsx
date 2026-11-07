import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
export const metadata = {
  title: "OpsHR | MYOPS",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ms">
      <body>
        <header>
          <Link className="brand" href="/">
            MYOPS <span>/ OpsHR</span>
          </Link>
          <a href="https://www.myops.com.my/">Kembali ke MYOPS ↗</a>
        </header>
        <main>
          <aside>
            <strong>Demo pembangunan</strong> — Data contoh sahaja. Perubahan
            hilang selepas muat semula. SSO dan pangkalan data belum
            disambungkan. Jangan masukkan data pekerja sebenar.
          </aside>
          {children}
        </main>
        <footer>OpsHR · Sebahagian daripada MYOPS</footer>
      </body>
    </html>
  );
}
