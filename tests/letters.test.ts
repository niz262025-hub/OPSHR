import assert from "node:assert/strict";
import test from "node:test";
import { demoLetterDraft, letterKinds, renderLetter, validateLetterDraft } from "../lib/letters.ts";
import { formatDate, locales } from "../lib/i18n.ts";

test("all four letter types can render a clearly marked draft", () => {
  for (const kind of letterKinds) {
    const letter = renderLetter({ ...demoLetterDraft, kind });
    assert.match(letter, /DRAF/);
    assert.match(letter, /Pekerja Contoh A/);
  }
});
test("rejects missing employee name", () => {
  assert.match(validateLetterDraft({ ...demoLetterDraft, employeeName: " " }) ?? "", /Lengkapkan/);
});
test("rejects impossible date", () => {
  assert.match(validateLetterDraft({ ...demoLetterDraft, date: "2026-02-30" }) ?? "", /Tarikh/);
});
test("English drafts retain an unapproved warning", () => {
  assert.match(renderLetter({ ...demoLetterDraft, language: "en" }), /NOT APPROVED/);
});
test("generated drafts support all four locales and preserve entered values", () => {
  for (const language of locales) {
    const output = renderLetter({ ...demoLetterDraft, language });
    assert.ok(output.includes(formatDate(language, demoLetterDraft.date)));
    assert.ok(output.includes(demoLetterDraft.companyName));
    assert.ok(output.includes(demoLetterDraft.employeeName));
    assert.ok(output.includes(demoLetterDraft.details));
  }
});
