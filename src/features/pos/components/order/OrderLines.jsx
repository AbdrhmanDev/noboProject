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
  // Payment step (and any other purely-informational use): no stepper, no trash, no row click —
  // the cashier is reviewing what's already locked in, not editing it. Collapsing each line to one
  // glanceable row (qty · name · total) instead of the editable two-line card also means more of
  // the order is visible at once without scrolling, which matters most exactly here.
  readOnly = false,
}) {
  // This list is the one thing in the basket that scrolls: the sidebar has a definite height and
  // everything around this (header, totals, actions, CTA) is fixed-size, so `flex-1` gives the
  // list whatever is left and `overflow-y-auto` scrolls it. `min-h-[170px]` keeps at least a
  // couple of lines visible even on a short screen.
  //
  // Two compact lines per item (name+modifiers, then stepper+total) instead of the old tall card
  // (avatar box, separate qty/total row, generous padding) — a single row was tried first, but at
  // the order panel's ~380px width there isn't room next to a 44px-tall stepper for both a
  // readable name AND a separate price column, so the name got crushed. This keeps the stepper's
  // 44px touch height, gives the name its own full-width line, and is still far shorter than the
  // original card. The selected line gets the brand-yellow accent bar on its inline-start edge
  // plus a tinted background, so selection isn't carried by a faint yellow alone.
  return (
    <div className="min-h-[170px] flex-1 space-y-1 overflow-y-auto pe-1 scrollbar-none">
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
        const lineTotal = formatMoney(
          item.lineSubtotalAmount,
          draftOrder?.currencyCode || catalogCurrencyCode,
          draftOrder?.currencyMinorUnitDigits || 2,
        );

        if (readOnly) {
          return (
            <div
              key={item.salesOrderLineId}
              className="flex items-center gap-2 rounded-pos border border-pos-border bg-pos-card px-2 py-1.5"
            >
              <span className="pos-num shrink-0 rounded-pos bg-pos-tint px-1.5 py-0.5 text-[11px] font-black text-pos-primary-text">
                {Number(item.quantity)}×
              </span>
              <span className="pos-fs-line min-w-0 flex-1 truncate text-pos-text">
                {item.productName}
                {item.variantName && item.variantName !== "Standard" && (
                  <span className="text-pos-muted"> · {item.variantName}</span>
                )}
                {item.modifiers.length > 0 && (
                  <span className="text-pos-primary-text"> · +{item.modifiers.length}</span>
                )}
              </span>
              <span className="pos-num pos-fs-line shrink-0 font-bold text-pos-text">{lineTotal}</span>
            </div>
          );
        }

        return (
          <div
            key={item.salesOrderLineId}
            onClick={() => onSelectLine?.(item.salesOrderLineId)}
            className={`relative cursor-pointer rounded-pos border px-2 py-1 transition ${
              selected
                ? "border-pos-warning-text/70 bg-pos-warning-tint before:absolute before:inset-y-1.5 before:start-0 before:w-[3px] before:rounded-full before:bg-pos-warning"
                : "border-pos-border bg-pos-card hover:border-pos-primary"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="pos-fs-line min-w-0 flex-1 truncate text-pos-text">
                {item.productName}
                {item.variantName && item.variantName !== "Standard" && (
                  <span className="text-pos-muted"> · {item.variantName}</span>
                )}
              </span>
              {item.modifiers.length > 0 && (
                <span className="pos-num shrink-0 rounded-full bg-pos-tint px-1.5 py-0.5 text-[9px] font-bold text-pos-primary-text">
                  +{item.modifiers.length}
                </span>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeDraftLine(item.salesOrderLineId);
                }}
                disabled={!canEditDraft}
                aria-label="Remove line"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-pos text-pos-danger-text transition hover:bg-pos-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="mt-1 flex items-center justify-between gap-2">
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

              <span className="pos-num pos-fs-line truncate font-bold text-pos-text">{lineTotal}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
