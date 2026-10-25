import { createContext, useContext } from "react";

// The i18n context and its hook. The provider component lives in I18nProvider.jsx, so this module exports no
// component (keeps React Fast Refresh working: react-refresh/only-export-components).
export const I18nContext = createContext(null);

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
