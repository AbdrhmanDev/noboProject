import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, LANGUAGES, interpolate } from "./translations";

const I18nContext = createContext(null);

const STORAGE_KEY = "nobo-lang";

function getSavedLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch {
    // ignore
  }
  return "ar";
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getSavedLang);

  const setLang = useCallback((code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
  }, []);

  // Update document direction/lang based on selected language
  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
  }, [lang]);

  const t = useCallback(
    (key, vars = {}) => {
      const dict = translations[lang] || translations.ar;
      const str = dict[key] !== undefined ? dict[key] : translations.ar[key] || key;
      return interpolate(str, vars);
    },
    [lang]
  );

  const dir = (LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]).dir;

  const value = { lang, setLang, t, dir, LANGUAGES };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
