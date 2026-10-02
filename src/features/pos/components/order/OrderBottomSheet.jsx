import { useEffect } from "react";
import { X } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nContext";

// POS order drawer (touch-first redesign, 3rd pass) -- anchored near the floating cart button in
// the bottom-right, not a centered admin-style dialog. On a narrow viewport (where a ~460px-wide
// anchored panel wouldn't fit comfortably) it falls back to a full-width bottom sheet instead, per
// the explicit "cover the entire screen only if the viewport is too small" requirement.
//
// The overlay is a light scrim (not a hard 50% dim) and only exists for click-outside-to-close
// detection -- the product grid must stay visually understandable behind the drawer.
//
// Closed-state fix (3rd pass): the base layout uses `inset-x-0` (left:0 AND right:0), and the `sm:`
// anchored layout only overrode `right` -- leaving `left:0` in effect at every breakpoint, which
// (depending on how the UA resolves the resulting over-constrained left+right+width) could leave the
// panel positioned somewhere other than flush against its own `bottom`/`right`. Fixed by explicitly
// clearing `left` at `sm:` (`sm:left-auto`) instead of relying on `right` to silently win.
//
// It was also only translating closed by its OWN height (`translate-y-full` = translateY(100%)),
// which is only "fully off-screen" for a panel whose resting `bottom` is 0. Once anchored with
// `bottom: var(--sheet-bottom)` (≈ the action-bar's reserved height above true bottom) at `sm:`, that
// same 100% shift leaves a sliver up to `--sheet-bottom` tall visible at the top of the "closed" box
// -- the drawer peeking above the viewport's bottom edge instead of disappearing. The fix needs the
// closed shift to be `calc(100% + var(--sheet-bottom))` at `sm:` (0 extra at the base, flush-bottom,
// layout) -- note the REQUIRED spaces around `+` inside calc(): `calc(100%+var(...))` (no spaces) is
// invalid CSS, so the browser drops that whole `transform` declaration and applies NO transform at
// all when closed, which is the actual bug that shipped (the drawer sat fully at its open/anchored
// position even while "closed"). Tailwind arbitrary values need a literal space written as `_`, so
// the real class is `translate-y-[calc(100%_+_var(--sheet-closed-shift,0px))]` below.
export function OrderBottomSheet({ open, onClose, children }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[90] bg-black/15 transition-opacity duration-200 motion-reduce:transition-none ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("pos.cart.sheetTitle")}
        className={`fixed inset-x-0 bottom-0 z-[95] flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl border border-pos-border bg-pos-card shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none
          sm:inset-x-auto sm:left-auto sm:bottom-[var(--sheet-bottom)] sm:right-[var(--sheet-right)] sm:w-[460px] sm:max-h-[72vh] sm:rounded-2xl sm:[--sheet-closed-shift:var(--sheet-bottom)]
          ${open ? "translate-y-0" : "translate-y-[calc(100%_+_var(--sheet-closed-shift,0px))]"}`}
        style={{
          // --app-sidebar-w (AppLayout.jsx): keeps this drawer from anchoring underneath/over the
          // app's own nav sidebar, same as FloatingOrderButton/PosStatusBar -- 0 unless the sidebar
          // is actually sitting on this same physical right edge.
          "--sheet-right": "calc(var(--app-sidebar-w, 0px) + 1.25rem + env(safe-area-inset-right))",
          "--sheet-bottom": "calc(var(--pos-bottom-chrome-h) + env(safe-area-inset-bottom) + 0.75rem)",
        }}
        // Keeps the (collapsed) sheet out of the tab/focus order and off-screen readers while
        // closed, without unmounting it -- unmounting would drop OrderSidebar's own local state
        // (e.g. its scroll position) every time the cashier closes the cart.
        inert={!open}
      >
        <div className="flex shrink-0 items-center justify-center border-b border-pos-border px-4 py-2 sm:hidden">
          <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-pos-border" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("pos.cart.close")}
          className="absolute end-3 top-2 grid h-9 w-9 place-items-center rounded-pos text-pos-muted transition hover:bg-pos-tint hover:text-pos-text"
        >
          <X size={18} />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none">{children}</div>
      </div>
    </>
  );
}
