import { X } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { useShortcutContext } from "../useShortcuts";
import { formatBindingParts } from "../keyUtils";

function ShortcutRow({ t, shortcut }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
      <span className="text-sm text-slate-200">{t(shortcut.labelKey)}</span>
      <span className="inline-flex shrink-0 items-center gap-1">
        {formatBindingParts(shortcut.binding).map((part, index) => (
          <kbd
            key={index}
            className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
          >
            {part}
          </kbd>
        ))}
      </span>
    </div>
  );
}

export function ShortcutHelpDialog() {
  const { t } = useI18n();
  const { isHelpOpen, closeHelp, shortcuts } = useShortcutContext();

  if (!isHelpOpen) return null;

  const visible = shortcuts.filter((shortcut) => shortcut.hasAccess);
  const navigationShortcuts = visible.filter((shortcut) => shortcut.category === "navigation");
  const posShortcuts = visible.filter((shortcut) => shortcut.category === "pos");
  const globalShortcuts = visible.filter((shortcut) => shortcut.category === "global");

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#030713]/75 p-4 backdrop-blur-sm"
      onClick={closeHelp}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("shortcuts.title")}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#10182a] p-5 shadow-2xl"
      >
        <div className="mb-1 flex shrink-0 items-center justify-between">
          <h2 className="font-bold text-white">{t("shortcuts.title")}</h2>
          <button
            type="button"
            onClick={closeHelp}
            aria-label={t("shortcuts.close")}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-[11px] text-slate-500">{t("shortcuts.subtitle")}</p>

        <div className="min-h-0 space-y-5 overflow-y-auto pr-1 scrollbar-none">
          {visible.length === 0 && (
            <p className="rounded-xl bg-white/[0.03] px-3 py-4 text-center text-xs text-slate-500">
              {t("shortcuts.empty")}
            </p>
          )}

          {navigationShortcuts.length > 0 && (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t("shortcuts.navigation")}
              </h3>
              <div className="space-y-1">
                {navigationShortcuts.map((shortcut) => (
                  <ShortcutRow key={shortcut.id} t={t} shortcut={shortcut} />
                ))}
              </div>
            </div>
          )}

          {posShortcuts.length > 0 && (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t("shortcuts.pos.section")}
              </h3>
              <div className="space-y-1">
                {posShortcuts.map((shortcut) => (
                  <ShortcutRow key={shortcut.id} t={t} shortcut={shortcut} />
                ))}
              </div>
            </div>
          )}

          {globalShortcuts.length > 0 && (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t("shortcuts.global")}
              </h3>
              <div className="space-y-1">
                {globalShortcuts.map((shortcut) => (
                  <ShortcutRow key={shortcut.id} t={t} shortcut={shortcut} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
