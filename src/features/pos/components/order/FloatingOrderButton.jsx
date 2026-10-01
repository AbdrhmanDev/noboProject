import { ShoppingCart } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nContext";
import { formatMoney } from "../../../../shared/utils/formatters";

// Touch-first POS redesign (2nd pass): a circular, chatbot-style floating action button, fixed to
// the PHYSICAL bottom-right corner of the viewport (intentionally `right`/`bottom`, not the logical
// `end`/`start` this POS otherwise uses for RTL — the same convention chat-widget buttons use
// regardless of page direction, per the explicit "bottom-right" requirement). It sits above
// PosActionBar (which is itself `env(safe-area-inset-bottom)`-aware) and never grows to consume
// meaningful width -- "Open current order", not a panel.
export function FloatingOrderButton({ itemCount, total, currencyCode, minorUnitDigits, onClick }) {
  const { t } = useI18n();

  return (
    <div
      className="fixed z-[80] flex flex-col items-end gap-1.5"
      style={{
        // Reads the SAME --pos-action-bar-h token PosActionBar sizes itself with and the scrollable
        // content areas reserve as padding, plus a small gap, so this can never end up overlapping
        // the bar no matter how its own height is retuned.
        bottom: "calc(var(--pos-action-bar-h) + env(safe-area-inset-bottom) + 0.75rem)",
        // --app-sidebar-w (AppLayout.jsx): the app's own nav sidebar's current width -- 0 unless
        // it's actually sitting on this same physical right edge (see that file's own comment).
        // Without this, this button (deliberately anchored to the true viewport edge, not the POS
        // content area) rendered on top of the sidebar at every width/collapse state.
        right: "calc(var(--app-sidebar-w, 0px) + 1.25rem + env(safe-area-inset-right))",
      }}
    >
      {itemCount > 0 && (
        <span className="pos-num max-w-[180px] truncate rounded-full border border-pos-border bg-pos-card px-3 py-1 text-xs font-bold text-pos-text shadow-md">
          {formatMoney(total, currencyCode, minorUnitDigits)}
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        aria-label={t("pos.cart.floatingLabel", { count: itemCount })}
        className="relative grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full border border-pos-border bg-pos-primary-strong text-white shadow-2xl transition hover:bg-pos-primary-strong-hover active:scale-95"
      >
        <ShoppingCart size={28} />
        {itemCount > 0 && (
          <span className="pos-num absolute -top-1 end-0 grid h-6 min-w-6 place-items-center rounded-full border-2 border-pos-card bg-pos-danger-strong px-1 text-xs font-black text-white">
            {itemCount}
          </span>
        )}
      </button>
    </div>
  );
}
