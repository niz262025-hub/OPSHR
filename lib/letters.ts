import { formatDate, locales } from "./i18n.ts";
import type { Locale } from "./i18n.ts";

export const letterKinds = ["offer", "disciplinary", "show_cause", "employment_confirmation"] as const;
export type LetterKind = (typeof letterKinds)[number];
export type LetterLanguage = Locale;
export type LetterDraft = {
  kind: LetterKind; language: LetterLanguage; reference: string; date: string;
  companyName: string; employeeName: string; position: string; details: string;
};
const titles: Record<LetterLanguage, Record<LetterKind, string>> = {
  ms: { offer: "SURAT TAWARAN PEKERJAAN", disciplinary: "SURAT TINDAKAN TATATERTIB", show_cause: "SURAT TUNJUK SEBAB", employment_confirmation: "SURAT PENGESAHAN MAJIKAN" },
  en: { offer: "OFFER OF EMPLOYMENT", disciplinary: "DISCIPLINARY ACTION LETTER", show_cause: "SHOW CAUSE LETTER", employment_confirmation: "EMPLOYMENT CONFIRMATION LETTER" },
  "zh-CN": { offer: "录用通知书", disciplinary: "纪律处分通知书", show_cause: "说明理由通知书", employment_confirmation: "在职证明" },
  ta: { offer: "வேலைவாய்ப்பு சலுகைக் கடிதம்", disciplinary: "ஒழுங்கு நடவடிக்கைக் கடிதம்", show_cause: "விளக்கம் கோரும் கடிதம்", employment_confirmation: "பணியாளர் உறுதிப்படுத்தல் கடிதம்" },
};
export const demoLetterDraft: LetterDraft = {
  kind: "employment_confirmation", language: "ms", reference: "DEMO/HR/001",
  date: "2026-11-05", companyName: "Syarikat Contoh Sdn. Bhd.",
  employeeName: "Pekerja Contoh A", position: "Penyelia",
  details: "Dokumen contoh sahaja. Butiran pekerjaan perlu disahkan oleh HR.",
};
export function validateLetterDraft(draft: LetterDraft): string | null {
  if (!letterKinds.includes(draft.kind) || !locales.includes(draft.language)) return "Jenis atau bahasa surat tidak sah";
  if ([draft.reference, draft.companyName, draft.employeeName, draft.position, draft.details].some((v) => !v.trim())) return "Lengkapkan semua maklumat surat";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return "Tarikh tidak sah";
  const parsed = new Date(draft.date + "T00:00:00Z");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== draft.date) return "Tarikh tidak sah";
  return null;
}
export function renderLetter(draft: LetterDraft): string {
  const error = validateLetterDraft(draft);
  if (error) throw new Error(error);
  const text = {
    en: {
      name: "Name", position: "Position",
      intro: {
        employment_confirmation: "This letter is to confirm employment details, subject to verification by HR.",
        offer: "This offer is a draft subject to HR-reviewed employment terms.",
        show_cause: "Please provide an explanation regarding the following matter. This draft does not determine any disciplinary outcome.",
        disciplinary: "This disciplinary letter requires fact review, fair process and HR approval before issuance.",
      },
      warning: "DRAFT — NOT APPROVED / NOT AN OFFICIAL LETTER",
    },
    ms: {
      name: "Nama", position: "Jawatan",
      intro: {
        employment_confirmation: "Dengan ini disahkan bahawa individu berikut mempunyai rekod pekerjaan yang perlu disahkan oleh pihak HR.",
        offer: "Surat tawaran ini ialah draf dan tertakluk kepada terma pekerjaan yang disemak HR.",
        show_cause: "Sila berikan penjelasan berhubung perkara berikut. Tiada keputusan tatatertib dibuat melalui draf ini.",
        disciplinary: "Surat tindakan tatatertib ini memerlukan semakan fakta, proses yang adil dan kelulusan HR sebelum dikeluarkan.",
      },
      warning: "DRAF — BELUM DILULUSKAN / BUKAN SURAT RASMI",
    },
    "zh-CN": {
      name: "姓名", position: "职位",
      intro: {
        employment_confirmation: "兹确认以下人员的雇佣信息，但须由人力资源部门核实。",
        offer: "本录用通知草稿须遵守经人力资源部门审核的雇佣条款。",
        show_cause: "请就以下事项作出说明。本草稿不构成任何纪律处分决定。",
        disciplinary: "本纪律处分信函须经事实核查、公正程序及人力资源部门批准后方可发出。",
      },
      warning: "草稿 — 未经批准 / 非正式函件",
    },
    ta: {
      name: "பெயர்", position: "பதவி",
      intro: {
        employment_confirmation: "கீழே குறிப்பிடப்பட்டுள்ள நபரின் வேலைவிவரங்கள் HR சரிபார்ப்புக்கு உட்பட்டவை என்பதை உறுதிப்படுத்துகிறோம்.",
        offer: "இந்த வேலைவாய்ப்பு சலுகை வரைவு; HR மதிப்பாய்வு செய்த வேலைவாய்ப்பு விதிமுறைகளுக்கு உட்பட்டது.",
        show_cause: "பின்வரும் விஷயம் குறித்து விளக்கம் அளிக்கவும். இந்த வரைவு எந்த ஒழுங்கு நடவடிக்கை முடிவையும் தீர்மானிக்காது.",
        disciplinary: "இந்த ஒழுங்கு நடவடிக்கைக் கடிதத்தை வழங்குவதற்கு முன் உண்மைச் சரிபார்ப்பு, நியாயமான நடைமுறை மற்றும் HR ஒப்புதல் தேவை.",
      },
      warning: "வரைவு — ஒப்புதல் பெறப்படவில்லை / அதிகாரப்பூர்வக் கடிதம் அல்ல",
    },
  } satisfies Record<LetterLanguage, {
    name: string;
    position: string;
    intro: Record<LetterKind, string>;
    warning: string;
  }>;
  const localizedText = text[draft.language];
  return [
    draft.companyName, draft.reference, formatDate(draft.language, draft.date), "",
    titles[draft.language][draft.kind], "",
    localizedText.name + ": " + draft.employeeName,
    localizedText.position + ": " + draft.position, "",
    localizedText.intro[draft.kind], "", draft.details, "",
    localizedText.warning,
  ].join("\n");
}
