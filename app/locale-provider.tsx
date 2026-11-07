"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getLocale,
  locales,
  translate,
} from "../lib/i18n";
import type { Locale, TranslationKey } from "../lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  number: (value: number) => string;
  currency: (value: number) => string;
  date: (value: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const localeCookie = "myops_locale";
const preferenceKey = "myops_locale";

function cookieOptions() {
  const sharedHost = location.hostname === "myops.com.my" || location.hostname.endsWith(".myops.com.my");
  return `Path=/; Max-Age=31536000; SameSite=Lax${sharedHost ? "; Domain=.myops.com.my" : ""}${location.protocol === "https:" ? "; Secure" : ""}`;
}

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setCurrentLocale] = useState(initialLocale);

  useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${localeCookie}=`))
      ?.split("=")[1];
    let localValue: string | null = null;
    try { localValue = localStorage.getItem(preferenceKey); } catch { /* Storage may be disabled. */ }
    const saved = getLocale(cookieValue || localValue);
    if (cookieValue || localValue) setCurrentLocale(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    try { localStorage.setItem(preferenceKey, locale); } catch { /* Cookie preference remains available. */ }
    document.cookie = `${localeCookie}=${locale}; ${cookieOptions()}`;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setCurrentLocale(getLocale(nextLocale));
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key, values) => translate(locale, key, values),
    number: (amount) => formatNumber(locale, amount),
    currency: (amount) => formatCurrency(locale, amount),
    date: (value) => formatDate(locale, value),
  }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used within LocaleProvider");
  return value;
}

export function LocaleSelector({ id }: { id: string }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <label className="locale-selector" htmlFor={id}>
      <span>{t("language")}</span>
      <select id={id} value={locale} onChange={(event) => setLocale(getLocale(event.target.value))}>
        {locales.map((value) => (
          <option key={value} value={value}>{t(value === "en" ? "english" : value === "ms" ? "malay" : value === "zh-CN" ? "chinese" : "tamil")}</option>
        ))}
      </select>
    </label>
  );
}
