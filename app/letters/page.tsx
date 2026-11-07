"use client";

import Link from "next/link";
import { useState } from "react";
import { demoLetterDraft, letterKinds, renderLetter, validateLetterDraft, type LetterDraft } from "../../lib/letters";
import { useLocale } from "../locale-provider";

const labels = {
  offer: "offerLetter",
  disciplinary: "disciplinaryLetter",
  show_cause: "showCauseLetter",
  employment_confirmation: "employmentConfirmationLetter",
} as const;
const letterLanguages = [
  { value: "en", label: "english" },
  { value: "ms", label: "malay" },
  { value: "zh-CN", label: "chinese" },
  { value: "ta", label: "tamil" },
] as const;
export default function LetterPreviewPage() {
  const [draft, setDraft] = useState<LetterDraft>(demoLetterDraft);
  const { t } = useLocale();
  const update = <K extends keyof LetterDraft>(key: K, value: LetterDraft[K]) => setDraft((prev) => ({ ...prev, [key]: value }));
  const validation = validateLetterDraft(draft);
  const error = validation
    ? t(validation === "Jenis atau bahasa surat tidak sah" ? "letterTypeLanguageInvalid" : validation === "Lengkapkan semua maklumat surat" ? "letterComplete" : "invalidDate")
    : null;
  return (
    <>
      <Link href="/">{t("moduleBack")}</Link>
      <div className="page-heading"><div><div className="eyebrow">{t("lettersKicker")}</div><h1>{t("generateHrLetter")}</h1><p>{t("letterPreviewDescription")}</p></div></div>
      <section className="directory">
        <div className="form-grid">
          <label>{t("letterType")}<select value={draft.kind} onChange={(e) => update("kind", e.target.value as LetterDraft["kind"])}>{letterKinds.map((kind) => <option key={kind} value={kind}>{t(labels[kind])}</option>)}</select></label>
          <label>{t("letterLanguage")}<select value={draft.language} onChange={(e) => update("language", e.target.value as LetterDraft["language"])}>{letterLanguages.map(({ value, label }) => <option key={value} value={value}>{t(label)}</option>)}</select></label>
          <label>{t("reference")}<input value={draft.reference} onChange={(e) => update("reference", e.target.value)} /></label>
          <label>{t("date")}<input type="date" value={draft.date} onChange={(e) => update("date", e.target.value)} /></label>
          <label>{t("companyName")}<input value={draft.companyName} onChange={(e) => update("companyName", e.target.value)} /></label>
          <label>{t("employeeName")}<input value={draft.employeeName} onChange={(e) => update("employeeName", e.target.value)} /></label>
          <label>{t("position")}<input value={draft.position} onChange={(e) => update("position", e.target.value)} /></label>
          <label>{t("letterDetails")}<textarea value={draft.details} onChange={(e) => update("details", e.target.value)} /></label>
        </div>
      </section>
      <section className="directory" aria-label={t("letterPreview")}>
        <h2>{t("letterPreview")}</h2>
        {error ? <p role="alert">{error}</p> : <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "inherit" }}>{renderLetter(draft)}</pre>}
      </section>
      <p className="message">{t("letterDemoWarning")}</p>
      <p className="message">{t("letterLocalizationNote")}</p>
    </>
  );
}
