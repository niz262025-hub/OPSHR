import Link from "next/link";

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
        <article>
          <span className="eyebrow">02 · DEMO</span>
          <h2>Kehadiran</h2>
          <p>Ringkasan kehadiran menggunakan rekod contoh.</p>
          <Link href="/attendance">Buka demo →</Link>
        </article>
        <article>
          <span className="eyebrow">03 · DEMO</span>
          <h2>Cuti</h2>
          <p>Permohonan dan status kelulusan menggunakan data contoh.</p>
          <Link href="/leave">Buka demo →</Link>
        </article>
        <article>
          <span className="eyebrow">04 · DEMO</span>
          <h2>Gaji</h2>
          <p>Ringkasan payroll menggunakan angka contoh.</p>
          <Link href="/payroll">Buka demo →</Link>
        </article>
        <article>
          <span className="eyebrow">05 · DEMO</span>
          <h2>Dokumen HR</h2>
          <p>Senarai metadata dokumen contoh.</p>
          <Link href="/documents">Buka demo →</Link>
        </article>
        <article>
          <span className="eyebrow">06 · DEMO</span>
          <h2>Laporan</h2>
          <p>Ringkasan pekerja, cuti dan gaji contoh.</p>
          <Link href="/reports">Buka demo →</Link>
        </article>
      </div>
    </>
  );
}
