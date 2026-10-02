import { useEffect, useState } from "react";
import { CalendarDays, Clock3, Power, UserRound } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nContext";

// Thin info strip pinned to the very bottom of the order screen: live time,
// today's date and the signed-in cashier's name. Display only -- reads the cashier name POSPage
// already resolves (currentCashierName) and the browser clock; nothing here touches order state.
// Height is --pos-status-bar-h (pos-theme.css). Also hosts the close-shift button (moved here from
// the top toolbar): `onCloseShift` opens POSPage's existing "closeShift" dialog, and is only passed
// while a shift is open.
export function PosStatusBar({ cashierName, onCloseShift }) {
  const { lang, t } = useI18n();
  const now = useNow();
  const locale = lang === "ar" ? "ar-EG" : lang;

  const time = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      // Stops short of the app nav sidebar (--app-sidebar-w, set by AppLayout).
      style={{ right: "var(--app-sidebar-w, 0px)", paddingBottom: "env(safe-area-inset-bottom)" }}
      className="pos-fs-secondary fixed bottom-0 left-0 z-[85] border-t border-pos-border bg-pos-bg text-pos-muted"
    >
      <div className="mx-auto flex h-[var(--pos-status-bar-h)] w-full max-w-[2200px] items-center gap-5 px-3">
        <span className="flex items-center gap-1.5">
          <Clock3 size={15} />
          <span className="pos-num font-bold text-pos-text">{time}</span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <CalendarDays size={15} />
          <span className="truncate">{date}</span>
        </span>
        <div className="ms-auto flex min-w-0 items-center gap-3">
          {cashierName && (
            <span className="flex min-w-0 items-center gap-1.5">
              <UserRound size={15} />
              <span className="truncate">
                {t("pos.statusBar.cashier")}: <span className="font-bold text-pos-text">{cashierName}</span>
              </span>
            </span>
          )}
          {onCloseShift && (
            <button
              type="button"
              onClick={onCloseShift}
              className="flex h-7 shrink-0 items-center gap-1.5 rounded-pos border border-pos-danger/40 bg-pos-card px-2.5 font-bold text-pos-danger-text transition hover:bg-pos-danger/10"
            >
              <Power size={14} />
              {t("pos.statusBar.closeShift")}
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
