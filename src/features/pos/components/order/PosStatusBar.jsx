import { useEffect, useState } from "react";
import { CalendarDays, Clock3, Keyboard, LogOut, Moon, Power, Sun, UserRound } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nContext";
import { useShortcutContext } from "../../../shortcuts/useShortcuts";

// Thin info strip pinned to the very bottom of the order screen: live time,
// today's date and the signed-in cashier's name. Display only -- reads the cashier name POSPage
// already resolves (currentCashierName) and the browser clock; nothing here touches order state.
// Height is --pos-status-bar-h (pos-theme.css). Also hosts the close-shift button (moved here from
// the top toolbar): `onCloseShift` opens POSPage's existing "closeShift" dialog, and is only passed
// while a shift is open.
//
// Also hosts the theme toggle / shortcuts / logout controls (`onLogout`): AppLayout used to render
// those as a SEPARATE normal-flow row (Header `bare`) meant to merge into "the footer's own status
// line" on this route, but that row and this fixed bar both ended up claiming the same strip at the
// bottom of the screen -- this bar (fixed, higher z-index) simply covered the other one, hiding
// logout/theme entirely. Rendering them for real inside this one actual bar is the fix.
export function PosStatusBar({ cashierName, onCloseShift, onLogout }) {
  const { lang, t } = useI18n();
  const { openHelp } = useShortcutContext();
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("nobo-theme") !== "light" : true,
  );

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("nobo-theme", theme);
  }, [isDark]);
  const now = useNow();
  const locale = lang === "ar" ? "ar-EG" : lang;

  const time = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const shortDate = now.toLocaleDateString(locale, { day: "numeric", month: "short" });

  return (
    <div
      // Stops short of the app nav sidebar (--app-sidebar-w, set by AppLayout).
      style={{ right: "var(--app-sidebar-w, 0px)", paddingBottom: "env(safe-area-inset-bottom)" }}
      className="pos-fs-secondary fixed bottom-0 left-0 z-[85] border-t border-pos-border bg-pos-bg text-pos-muted"
    >
      {/* Responsive: always one line. On phones the date shortens (day + month), the "Cashier:"
          label and the close-shift text drop out, leaving the name and an icon button. */}
      <div className="mx-auto flex h-[var(--pos-status-bar-h)] w-full max-w-[2200px] items-center gap-3 px-3 sm:gap-5">
        <span className="flex shrink-0 items-center gap-1.5">
          <Clock3 size={15} />
          <span className="pos-num font-bold text-pos-text">{time}</span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <CalendarDays size={15} className="shrink-0" />
          <span className="truncate sm:hidden">{shortDate}</span>
          <span className="hidden truncate sm:inline">{date}</span>
        </span>
        <div className="ms-auto flex min-w-0 items-center gap-2 sm:gap-3">
          {cashierName && (
            <span className="flex min-w-0 items-center gap-1.5">
              <UserRound size={15} className="shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">{t("pos.statusBar.cashier")}: </span>
                <span className="font-bold text-pos-text">{cashierName}</span>
              </span>
            </span>
          )}
          {onCloseShift && (
            <button
              type="button"
              onClick={onCloseShift}
              aria-label={t("pos.statusBar.closeShift")}
              title={t("pos.statusBar.closeShift")}
              className="flex h-7 shrink-0 items-center gap-1.5 rounded-pos border border-pos-danger/40 bg-pos-card px-2 font-bold text-pos-danger-text transition hover:bg-pos-danger/10 sm:px-2.5"
            >
              <Power size={14} />
              <span className="hidden sm:inline">{t("pos.statusBar.closeShift")}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            aria-label={isDark ? t("header.lightMode") : t("header.darkMode")}
            title={isDark ? t("header.lightMode") : t("header.darkMode")}
            className="flex shrink-0 items-center transition hover:text-pos-text"
          >
            {isDark ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button
            type="button"
            onClick={openHelp}
            aria-label={t("header.shortcuts")}
            title={t("header.shortcuts")}
            className="flex shrink-0 items-center transition hover:text-pos-text"
          >
            <Keyboard size={15} />
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              aria-label={t("header.logout")}
              title={t("header.logout")}
              className="flex shrink-0 items-center transition hover:text-pos-danger-text"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Re-renders on each minute boundary (the strip only shows hours:minutes).
function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let intervalId;
    const timeoutId = setTimeout(() => {
      setNow(new Date());
      intervalId = setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  return now;
}
