import { useEffect, useState } from "react";
import { Keyboard, LogOut, Moon, Sun, CalendarDays, Clock } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { useShortcutContext } from "../features/shortcuts/useShortcuts";

export default function Header({ onLogout }) {
  const { t, lang, dir } = useI18n();
  const { openHelp } = useShortcutContext();
  const [isDark, setIsDark] = useState(() => typeof window !== "undefined" ? localStorage.getItem("nobo-theme") !== "light" : true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("nobo-theme", theme);
  }, [isDark]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Latin digits in every language so the clock matches the rest of the UI.
  const locale = lang === "ar" ? "ar-u-nu-latn" : lang;
  const parts = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).formatToParts(now);
  const part = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const time = { hm: `${part("hour")}:${part("minute")}`, ss: part("second"), period: part("dayPeriod") };
  const formattedDate = now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div
        className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-3 shadow-sm sm:w-auto ${
          isDark
            ? "border-blue-400/25 bg-gradient-to-br from-slate-900/90 to-slate-950/80 text-white shadow-slate-950/30"
            : "border-slate-300/60 bg-gradient-to-br from-white to-slate-100 text-slate-900 shadow-slate-300/30"
        }`}
      >
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-500/10 text-blue-600"}`}>
          <Clock size={24} />
        </div>
        <div className="min-w-0" dir="ltr">
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="text-3xl font-black tabular-nums tracking-tight">{time.hm}</span>
            <span className={`text-base font-bold tabular-nums ${isDark ? "text-blue-300" : "text-blue-600"}`}>{time.ss}</span>
            <span className={`text-xs font-bold uppercase ${isDark ? "text-slate-400" : "text-slate-500"}`}>{time.period}</span>
          </div>
          <div className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`} dir={dir}>
            <CalendarDays size={13} className="shrink-0" />
            {formattedDate}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => setIsDark((prev) => !prev)} className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-blue-400/50 hover:bg-blue-500/10">
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button
          type="button"
          onClick={onLogout}
          aria-label={t("header.logout")}
          title={t("header.logout")}
          className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={18} />
        </button>
        <button
          type="button"
          onClick={openHelp}
          aria-label={t("header.shortcuts")}
          title={t("header.shortcuts")}
          className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-blue-400/50 hover:bg-blue-500/10"
        >
          <Keyboard size={18} />
        </button>
      </div>
    </div>
  );
}
