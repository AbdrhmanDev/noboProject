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
    <div className="min-h-[170px] flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-none">
      {!draftLines.length && (
        <div className="grid h-full min-h-36 place-items-center rounded-xl border border-dashed border-pos-border text-center">
          <div>
            <ShoppingCart className="mx-auto mb-2 text-pos-muted" size={26} />
            <p className="text-xs text-pos-muted">السلة فارغة</p>
            <p className="mt-1 text-[10px] text-pos-muted">اختر المنتجات لإنشاء مسودة بيع حقيقية</p>
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
            className={`cursor-pointer rounded-pos border p-3 transition ${
              selected
                ? "border-pos-primary bg-pos-tint"
                : "border-pos-border bg-pos-card hover:border-pos-primary"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="pos-fs-line flex items-center gap-1.5 text-pos-text">
                  <span className="truncate">{item.productName}</span>
                  {item.modifiers.length > 0 && (
                    <span className="shrink-0 rounded-full bg-pos-tint px-1.5 py-0.5 text-[9px] font-bold text-pos-primary-text">
                      +{item.modifiers.length}
                    </span>
                  )}
                </div>
                {item.variantName && item.variantName !== "Standard" && (
                  <div className="pos-fs-secondary mt-0.5 truncate">{item.variantName}</div>
                )}
                {item.unitPrice != null && (
                  <div className="pos-fs-secondary mt-0.5">
                    {Number(item.quantity)} ×{" "}
                    {formatMoney(
                      item.unitPrice,
                      draftOrder?.currencyCode || catalogCurrencyCode,
                      draftOrder?.currencyMinorUnitDigits || 2,
                    )}
                  </div>
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
                className="grid h-9 w-9 shrink-0 place-items-center rounded-pos bg-pos-danger/10 text-pos-danger transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div
                className="flex h-11 shrink-0 items-center rounded-pos border border-pos-border bg-pos-card"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => changeQty(item.salesOrderLineId, -1)}
                  disabled={!canEditDraft}
                  className="grid h-11 w-11 place-items-center text-pos-muted hover:bg-pos-tint hover:text-pos-text disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Minus size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onEditQuantity?.(item.salesOrderLineId, Number(item.quantity))}
                  disabled={!canEditDraft || !onEditQuantity}
                  aria-label="Edit quantity"
                  className={`pos-fs-line min-w-9 px-1 text-center font-bold text-pos-text transition-opacity ${pending ? "opacity-60" : ""} ${onEditQuantity ? "hover:text-pos-primary-text" : ""}`}
                >
                  {Number(item.quantity)}
                </button>
                <button
                  type="button"
                  onClick={() => changeQty(item.salesOrderLineId, 1)}
                  disabled={!canEditDraft}
                  className="grid h-11 w-11 place-items-center text-pos-primary-text hover:bg-pos-tint disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={15} />
                </button>
              </div>

              <span className="pos-fs-line font-bold text-pos-text">
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
