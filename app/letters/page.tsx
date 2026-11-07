"use client";

import Link from "next/link";
import { useState } from "react";
import { demoLetterDraft, letterKinds, renderLetter, validateLetterDraft, type LetterDraft } from "../../lib/letters";

const labels = {
  offer: "Surat tawaran pekerjaan",
  disciplinary: "Surat tindakan tatatertib",
  show_cause: "Surat tunjuk sebab",
  employment_confirmation: "Surat pengesahan majikan",
};
export default function LetterPreviewPage() {
  const [draft, setDraft] = useState<LetterDraft>(demoLetterDraft);
  const update = <K extends keyof LetterDraft>(key: K, value: LetterDraft[K]) => setDraft((prev) => ({ ...prev, [key]: value }));
  const error = validateLetterDraft(draft);
  return (
    <>
      <Link href="/">← Modul OpsHR</Link>
      <div className="page-heading"><div><div className="eyebrow">HR LETTER GENERATOR · DEMO</div><h1>Jana surat HR</h1><p>Draf surat contoh untuk semakan HR. Tiada surat boleh dihantar secara automatik.</p></div></div>
      <section className="directory">
        <div className="form-grid">
          <label>Jenis surat<select value={draft.kind} onChange={(e) => update("kind", e.target.value as LetterDraft["kind"])}>{letterKinds.map((kind) => <option key={kind} value={kind}>{labels[kind]}</option>)}</select></label>
          <label>Bahasa<select value={draft.language} onChange={(e) => update("language", e.target.value as LetterDraft["language"])}><option value="ms">Bahasa Melayu</option><option value="en">English</option></select></label>
          <label>Rujukan<input value={draft.reference} onChange={(e) => update("reference", e.target.value)} /></label>
          <label>Tarikh<input type="date" value={draft.date} onChange={(e) => update("date", e.target.value)} /></label>
          <label>Nama syarikat<input value={draft.companyName} onChange={(e) => update("companyName", e.target.value)} /></label>
          <label>Nama pekerja<input value={draft.employeeName} onChange={(e) => update("employeeName", e.target.value)} /></label>
          <label>Jawatan<input value={draft.position} onChange={(e) => update("position", e.target.value)} /></label>
          <label>Maklumat surat<textarea value={draft.details} onChange={(e) => update("details", e.target.value)} /></label>
        </div>
      </section>
      <section className="directory" aria-label="Pratonton surat">
        <h2>Pratonton draf</h2>
        {error ? <p role="alert">{error}</p> : <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit" }}>{renderLetter(draft)}</pre>}
      </section>
      <p className="message">Hanya data rekaan. Belum ada simpanan, PDF, tandatangan atau kelulusan. HR mesti mengesahkan fakta dan undang-undang pekerjaan sebelum mengeluarkan surat.</p>
    </>
  );
}
