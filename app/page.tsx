import Link from "next/link";

const modules = [
  { number: "01", title: "Pekerja", description: "Direktori, jabatan dan status pekerjaan.", href: "/employees" },
  { number: "02", title: "Kehadiran", description: "Ringkasan kehadiran menggunakan rekod contoh.", href: "/attendance" },
  { number: "03", title: "Cuti", description: "Permohonan dan status kelulusan menggunakan data contoh.", href: "/leave" },
  { number: "04", title: "Gaji", description: "Ringkasan payroll menggunakan angka contoh.", href: "/payroll" },
  { number: "05", title: "Dokumen HR", description: "Senarai metadata dokumen contoh.", href: "/documents" },
  { number: "06", title: "Laporan", description: "Ringkasan pekerja, cuti dan gaji contoh.", href: "/reports" },
  { number: "07", title: "Portal Pekerja", description: "Pratonton ESS menggunakan identiti sintetik.", href: "/staff" },
];

export default function Home() {
  return (
    <>
      <div className="eyebrow">SUMBER MANUSIA</div>
      <section className="hero">
        <h1>Urus pasukan anda,<br />dalam satu tempat.</h1>
        <p>Ruang kerja HR dalam ekosistem MYOPS. Semua modul masih demo dan belum menyimpan data sebenar.</p>
        <Link className="button" href="/employees">Semak demo pekerja →</Link>
      </section>
      <h2>Modul OpsHR</h2>
      <div className="grid">
        {modules.map((module) => (
          <article key={module.number}>
            <span className="eyebrow">{module.number} · DEMO</span>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
            <Link href={module.href}>Buka demo →</Link>
          </article>
        ))}
      </div>
    </>
  );
}
