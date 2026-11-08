export const letterKinds = ["offer", "disciplinary", "show_cause", "employment_confirmation"] as const;
export type LetterKind = (typeof letterKinds)[number];
export type LetterLanguage = "ms" | "en";
export type LetterDraft = {
  kind: LetterKind; language: LetterLanguage; reference: string; date: string;
  companyName: string; employeeName: string; position: string; details: string;
};
const titles: Record<LetterLanguage, Record<LetterKind, string>> = {
  ms: { offer: "SURAT TAWARAN PEKERJAAN", disciplinary: "SURAT TINDAKAN TATATERTIB", show_cause: "SURAT TUNJUK SEBAB", employment_confirmation: "SURAT PENGESAHAN MAJIKAN" },
  en: { offer: "OFFER OF EMPLOYMENT", disciplinary: "DISCIPLINARY ACTION LETTER", show_cause: "SHOW CAUSE LETTER", employment_confirmation: "EMPLOYMENT CONFIRMATION LETTER" },
};
export const demoLetterDraft: LetterDraft = {
  kind: "employment_confirmation", language: "ms", reference: "DEMO/HR/001",
  date: "2026-11-05", companyName: "Syarikat Contoh Sdn. Bhd.",
  employeeName: "Pekerja Contoh A", position: "Penyelia",
  details: "Dokumen contoh sahaja. Butiran pekerjaan perlu disahkan oleh HR.",
};
export function validateLetterDraft(draft: LetterDraft): string | null {
  if (!letterKinds.includes(draft.kind) || !["ms", "en"].includes(draft.language)) return "Jenis atau bahasa surat tidak sah";
  if ([draft.reference, draft.companyName, draft.employeeName, draft.position, draft.details].some((v) => !v.trim())) return "Lengkapkan semua maklumat surat";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return "Tarikh tidak sah";
  const parsed = new Date(draft.date + "T00:00:00Z");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== draft.date) return "Tarikh tidak sah";
  return null;
}
export function renderLetter(draft: LetterDraft): string {
  const error = validateLetterDraft(draft);
  if (error) throw new Error(error);
  const malay = draft.language === "ms";
  const intro = draft.kind === "employment_confirmation"
    ? (malay ? "Dengan ini disahkan bahawa individu berikut mempunyai rekod pekerjaan yang perlu disahkan oleh pihak HR." : "This letter is to confirm employment details, subject to verification by HR.")
    : draft.kind === "offer"
    ? (malay ? "Surat tawaran ini ialah draf dan tertakluk kepada terma pekerjaan yang disemak HR." : "This offer is a draft subject to HR-reviewed employment terms.")
    : draft.kind === "show_cause"
    ? (malay ? "Sila berikan penjelasan berhubung perkara berikut. Tiada keputusan tatatertib dibuat melalui draf ini." : "Please provide an explanation regarding the following matter. This draft does not determine any disciplinary outcome.")
    : (malay ? "Surat tindakan tatatertib ini memerlukan semakan fakta, proses yang adil dan kelulusan HR sebelum dikeluarkan." : "This disciplinary letter requires fact review, fair process and HR approval before issuance.");
  return [
    draft.companyName, draft.reference, draft.date, "",
    titles[draft.language][draft.kind], "",
    (malay ? "Nama" : "Name") + ": " + draft.employeeName,
    (malay ? "Jawatan" : "Position") + ": " + draft.position, "",
    intro, "", draft.details, "",
    malay ? "DRAF — BELUM DILULUSKAN / BUKAN SURAT RASMI" : "DRAFT — NOT APPROVED / NOT AN OFFICIAL LETTER",
  ].join("\n");
}
