import assert from "node:assert/strict";
import test from "node:test";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getLocale,
  locales,
  missingTranslationKeys,
  translate,
  translateEmployeeMessage,
} from "../lib/i18n.ts";

test("all supported locales have a complete UI dictionary", () => {
  for (const locale of locales) assert.deepEqual(missingTranslationKeys(locale), []);
});

test("unsupported locale values safely fall back to English", () => {
  assert.equal(getLocale("fr"), "en");
  assert.equal(getLocale(undefined), "en");
  assert.equal(translate(getLocale("fr"), "dashboard"), "Dashboard");
});

test("locale formatting preserves MYR and formats dates and numbers", () => {
  assert.match(formatCurrency("en", 1234.5), /MYR/);
  assert.notEqual(formatNumber("zh-CN", 1234), "1234");
  assert.notEqual(formatDate("ta", "2026-11-07"), "2026-11-07");
});

test("message interpolation replaces named values", () => {
  assert.equal(
    translate("en", "employeesResults", { visible: 2, total: 5 }),
    "2 of 5 employees",
  );
});

test("employee endpoint errors are translated without translating input data", () => {
  assert.equal(translateEmployeeMessage("zh-CN", "Akses OpsHR tidak tersedia."), "OpsHR 访问不可用。");
  assert.equal(translateEmployeeMessage("en", "custom user-provided text"), "custom user-provided text");
});
