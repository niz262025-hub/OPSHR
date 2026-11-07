import Link from "next/link";
const modules = ["Dokumen", "Laporan"];
export default function Home() {
  return (
    <>
      <div className="eyebrow">SUMBER MANUSIA</div>
      <section className="hero">
        <h1>
          Urus pasukan anda,
          <br />
          dalam satu tempat.
        </h1>
        <p>Ruang kerja HR dalam ekosistem MYOPS.</p>
        <Link className="button" href="/employees">
          Semak demo pekerja →
        </Link>
      </section>
      <h2>Modul OpsHR</h2>
      <div className="grid">
        <article>
          <span className="eyebrow">01 · DEMO</span>
          <h2>Pekerja</h2>
          <p>Direktori, jabatan dan status pekerjaan.</p>
          <Link href="/employees">Buka demo →</Link>
        </article>
        <article>\n          <span className="eyebrow">02 · DEMO</span>\n          <h2>Kehadiran</h2>\n          <p>Ringkasan kehadiran menggunakan rekod contoh.</p>\n          <Link href="/attendance">Buka demo →</Link>\n        </article>\n        <article>\n          <span className="eyebrow">03 · DEMO</span>\n          <h2>Cuti</h2>\n          <p>Permohonan dan status kelulusan menggunakan data contoh.</p>\n          <Link href="/leave">Buka demo →</Link>\n        </article>\n        <article>\n          <span className="eyebrow">04 · DEMO</span>\n          <h2>Gaji</h2>\n          <p>Ringkasan payroll menggunakan angka contoh.</p>\n          <Link href="/payroll">Buka demo →</Link>\n        </article>\n        {modules.map((name, i) => (
          <article key={name}>
            <span className="eyebrow">0{i + 5}</span>
            <h2>{name}</h2>
            <p>Dalam perancangan</p>
          </article>
        ))}
      </div>
    </>
  );
}
