import Link from "next/link";

const shortcuts = [
  { title: "Pekerja", description: "Profil, jabatan dan jawatan", href: "/employees", icon: "👥" },
  { title: "Kehadiran", description: "Rekod dan ringkasan kehadiran", href: "/attendance", icon: "🕒" },
  { title: "Cuti", description: "Permohonan dan kelulusan", href: "/leave", icon: "📅" },
  { title: "Payroll", description: "Gaji, elaun dan payslip", href: "/payroll", icon: "💳" },
  { title: "Dokumen HR", description: "Dokumen dan rekod pekerja", href: "/documents", icon: "📁" },
  { title: "Laporan", description: "Laporan operasi HR", href: "/reports", icon: "📋" },
  { title: "Portal Pekerja", description: "Employee self-service", href: "/staff", icon: "🪪" },
  { title: "Surat HR", description: "Jana surat dan templat", href: "/letters", icon: "✉️" },
];

export default function Home() {
  return (
    <div className="opshr-dashboard">
      <div className="opshr-dashboard-heading">
        <div>
          <p className="opshr-dashboard-kicker">MYOPS / HUMAN RESOURCES</p>
          <h1>Dashboard</h1>
          <p>Ringkasan dan akses pantas pengurusan HR.</p>
        </div>
        <span className="opshr-preview-tag">Preview · Data demo</span>
      </div>
      <div className="opshr-dashboard-summary" aria-label="Status modul">
        <div><span>Employee Management</span><strong>Demo</strong></div>
        <div><span>Attendance & Leave</span><strong>Demo</strong></div>
        <div><span>Payroll</span><strong>Demo</strong></div>
      </div>
      <section aria-labelledby="quick-access-title">
        <div className="opshr-section-heading"><h2 id="quick-access-title">Quick Access</h2></div>
        <div className="opshr-shortcut-grid">
          {shortcuts.map((item) => (
            <Link key={item.href} className="opshr-shortcut" href={item.href}>
              <span className="opshr-shortcut-icon" aria-hidden="true">{item.icon}</span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
              <span className="opshr-shortcut-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
