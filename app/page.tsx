import Link from "next/link";

const modules = [
  { number: "01", title: "Employee Management", description: "Profil pekerja, jabatan dan jawatan.", href: "/employees" },
  { number: "02", title: "Attendance", description: "Rekod kehadiran dan ringkasan waktu bekerja.", href: "/attendance" },
  { number: "03", title: "Leave", description: "Permohonan cuti dan aliran kelulusan.", href: "/leave" },
  { number: "04", title: "Payroll", description: "Pratonton gaji, elaun, potongan dan payslip.", href: "/payroll" },
  { number: "05", title: "HR Documents", description: "Pengurusan metadata dokumen dan surat HR.", href: "/documents" },
  { number: "06", title: "Reports", description: "Ringkasan pekerja, kehadiran dan gaji.", href: "/reports" },
  { number: "07", title: "Employee Self-Service", description: "Portal pekerja untuk semakan dan permohonan.", href: "/staff" },
  { number: "08", title: "HR Letters", description: "Templat surat HR dengan pratonton.", href: "/letters" },
];

export default function Home() {
  return (
    <>
      <section className="hero opshr-hero">
        <div>
          <div className="eyebrow">MYOPS · HUMAN RESOURCES</div>
          <h1>Urus pasukan anda,<br />dalam satu tempat.</h1>
          <p>OpsHR menyatukan pekerja, kehadiran, cuti, gaji dan dokumen dalam satu pengalaman MYOPS.</p>
          <div className="opshr-hero-actions">
            <Link className="button" href="/employees">Teroka pengurusan pekerja →</Link>
            <Link className="opshr-secondary-link" href="/reports">Lihat laporan</Link>
          </div>
        </div>
        <div className="opshr-hero-graphic" aria-hidden="true">
          <div className="opshr-graphic-orb">HR</div>
          <div className="opshr-graphic-label">People · Time · Payroll</div>
        </div>
      </section>
      <section aria-labelledby="modules-heading">
        <div className="opshr-section-heading">
          <div><div className="eyebrow">PUSAT OPERASI HR</div><h2 id="modules-heading">Modul OpsHR</h2></div>
          <span className="opshr-preview-tag">Preview · Data Demo</span>
        </div>
        <div className="grid opshr-module-grid">
          {modules.map((module) => (
            <article key={module.number}>
              <span className="opshr-module-number">{module.number}</span>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <Link href={module.href}>Buka modul →</Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
