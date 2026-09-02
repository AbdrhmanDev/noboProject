import type { ReactNode } from "react";

// Hand-written type declarations for I18nContext.jsx — this codebase's
// I18nContext (and I18nProvider/useI18n) has never had a .tsx consumer
// before this feature. Without this sidecar .d.ts, TypeScript infers the
// exported `useI18n` return type from `createContext(null)` in the plain JS
// source, which resolves to `never` after the internal null-check narrows
// it — breaking every `t(...)` call in any .tsx file that adopts it. This
// file is type-only (declarations, no runtime code) and does not change
// behavior; Vite/esbuild still transpiles and serves I18nContext.jsx as-is.
export type I18nLanguage = {
  code: string;
  label: string;
  native: string;
  dir: "rtl" | "ltr";
};

export type I18nTranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export type I18nContextValue = {
  lang: string;
  setLang: (code: string) => void;
  t: I18nTranslateFn;
  dir: "rtl" | "ltr";
  LANGUAGES: I18nLanguage[];
};

export function I18nProvider(props: { children?: ReactNode }): JSX.Element;
export function useI18n(): I18nContextValue;
