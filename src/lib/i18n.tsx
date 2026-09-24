import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fr } from "./translations";

export type Lang = "en" | "fr";
const STORAGE_KEY = "bhc.lang";

/** Saved choice → device language (fr* → French) → English. */
function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "fr") return saved;
  } catch { /* private mode */ }
  try {
    const nav = (navigator.language || navigator.languages?.[0] || "en").toLowerCase();
    return nav.startsWith("fr") ? "fr" : "en";
  } catch {
    return "en";
  }
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate an English source string; falls back to the source when untranslated. */
  t: (s: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    try { document.documentElement.lang = lang; } catch { /* noop */ }
  }, [lang]);

  const value = useMemo<I18nValue>(() => {
    const setLang = (l: Lang) => {
      setLangState(l);
      try { localStorage.setItem(STORAGE_KEY, l); } catch { /* noop */ }
    };
    const t = (s: string) => (lang === "fr" ? fr[s] ?? s : s);
    return { lang, setLang, t };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}

/** Convenience hook for components that only need the translate function. */
export function useT(): (s: string) => string {
  return useI18n().t;
}
