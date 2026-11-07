import assert from "node:assert/strict";
import test from "node:test";
import { demoLetterDraft, letterKinds, renderLetter, validateLetterDraft } from "../lib/letters.ts";

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
