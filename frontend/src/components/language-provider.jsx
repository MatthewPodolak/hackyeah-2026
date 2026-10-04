"use client";

import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, normalizeLocale, setCurrentLocale, t, tp } from "@/lib/i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ initialLocale, children }) {
  const [locale, setLocaleState] = useState(() => normalizeLocale(initialLocale));
  const router = useRouter();
  setCurrentLocale(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next) => {
    const value = normalizeLocale(next);
    document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
    setCurrentLocale(value);
    setLocaleState(value);
    router.refresh();
  }, [router]);

  const value = useMemo(() => ({ locale, setLocale, t, tp }), [locale, setLocale]);

  return (
    <LanguageContext.Provider value={value}>
      <Fragment key={locale}>{children}</Fragment>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
