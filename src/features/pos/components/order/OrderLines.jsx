import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";

export function OrderLines({
  draftLines,
  draftOrder,
  catalogCurrencyCode,
  canEditDraft,
  isLinePending,
  changeQty,
  removeDraftLine,
  selectedLineId,
  onSelectLine,
  onEditQuantity,
}) {
  // No min-height on the scroll container below, on purpose: `min-h-0` lets
  // this flex-1 child genuinely shrink to whatever's actually left after its
  // fixed-size siblings (header/summary/actions/CTA) within the sidebar's
  // own bounded max-height — so *this* list is what scrolls internally when
  // there isn't room, never the sidebar as a whole (which would carry the
  // totals/primary CTA out of view with it).
  // The old "arrow keys select / +- qty / Del remove" hint used to sit
  // permanently at the top of this list — nice for discoverability, but a
  // fixed per-render cost the list pays even after a cashier has long since
  // learned the shortcuts. Dropped in favor of giving that space to actual
  // order lines; the same shortcuts are still discoverable via ShortcutHint
  // badges elsewhere in the basket.
  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-none">
      {!draftLines.length && (
        <div className="grid h-full min-h-36 place-items-center rounded-xl border border-dashed border-line text-center">
          <div>
            <ShoppingCart className="mx-auto mb-2 text-subtle" size={26} />
            <p className="text-xs text-muted">السلة فارغة</p>
            <p className="mt-1 text-[10px] text-subtle">اختر المنتجات لإنشاء مسودة بيع حقيقية</p>
          </div>
        </div>
      )}
      {draftLines.map((item) => {
        const pending = isLinePending?.(item.salesOrderLineId);
        const selected = selectedLineId === item.salesOrderLineId;

        return (
          <div
            key={item.salesOrderLineId}
            onClick={() => onSelectLine?.(item.salesOrderLineId)}
            className={`cursor-pointer rounded-xl border bg-raised p-2.5 transition ${
              selected
                ? "border-accent ring-2 ring-accent/20"
                : "border-line hover:border-line-strong"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  <span className="truncate">{item.productName}</span>
                  {item.modifiers.length > 0 && (
                    <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold text-accent">
                      +{item.modifiers.length}
                    </span>
                  )}
                </div>
                {item.variantName && item.variantName !== "Standard" && (
                  <div className="mt-0.5 truncate text-[11px] text-subtle">{item.variantName}</div>
                )}
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeDraftLine(item.salesOrderLineId);
                }}
                disabled={!canEditDraft}
                aria-label="Remove line"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-danger-soft text-danger transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div
                className="flex h-10 shrink-0 items-center rounded-lg border border-line bg-surface"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => changeQty(item.salesOrderLineId, -1)}
                  disabled={!canEditDraft}
                  className="grid h-10 w-10 place-items-center text-muted hover:bg-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Minus size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onEditQuantity?.(item.salesOrderLineId, Number(item.quantity))}
                  disabled={!canEditDraft || !onEditQuantity}
                  aria-label="Edit quantity"
                  className={`min-w-9 px-1 text-center text-sm font-bold text-ink transition-opacity ${pending ? "opacity-60" : ""} ${onEditQuantity ? "hover:text-accent" : ""}`}
                >
                  {Number(item.quantity)}
                </button>
                <button
                  type="button"
                  onClick={() => changeQty(item.salesOrderLineId, 1)}
                  disabled={!canEditDraft}
                  className="grid h-10 w-10 place-items-center text-accent hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={15} />
                </button>
              </div>

              <span className="text-base font-extrabold text-ink">
                {formatMoney(
                  item.lineSubtotalAmount,
                  draftOrder?.currencyCode || catalogCurrencyCode,
                  draftOrder?.currencyMinorUnitDigits || 2,
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
