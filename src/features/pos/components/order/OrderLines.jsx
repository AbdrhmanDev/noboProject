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
    <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1 scrollbar-none">
      {!draftLines.length && (
        <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-white/10 text-center">
          <div>
            <ShoppingCart className="mx-auto mb-2 text-slate-600" size={26} />
            <p className="text-xs text-slate-500">السلة فارغة</p>
            <p className="mt-1 text-[10px] text-slate-600">اختر المنتجات لإنشاء مسودة بيع حقيقية</p>
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
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-0.5 transition ${
              selected
                ? "bg-blue-500/[0.06] ring-1 ring-inset ring-blue-400/60"
                : "bg-white/[0.02] hover:bg-white/[0.05]"
            }`}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                removeDraftLine(item.salesOrderLineId);
              }}
              disabled={!canEditDraft}
              className="shrink-0 text-slate-500 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 truncate text-xs font-bold text-slate-100">
                <span className="truncate">{item.productName}</span>
                {item.variantName && item.variantName !== "Standard" && (
                  <span className="shrink-0 truncate text-[10px] font-normal text-slate-500">
                    · {item.variantName}
                  </span>
                )}
                {item.modifiers.length > 0 && (
                  <span className="shrink-0 rounded bg-blue-500/10 px-1 py-0.5 text-[9px] font-normal text-blue-200">
                    +{item.modifiers.length}
                  </span>
                )}
              </div>
            </div>

            <div
              className="flex h-11 shrink-0 items-center rounded-lg border border-white/10"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => changeQty(item.salesOrderLineId, -1)}
                disabled={!canEditDraft}
                className="grid h-11 w-11 place-items-center text-slate-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Minus size={15} />
              </button>
              <button
                type="button"
                onClick={() => onEditQuantity?.(item.salesOrderLineId, Number(item.quantity))}
                disabled={!canEditDraft || !onEditQuantity}
                aria-label="Edit quantity"
                className={`min-w-9 px-1 text-center text-xs font-bold transition-opacity ${pending ? "opacity-60" : ""} ${onEditQuantity ? "hover:text-blue-300" : ""}`}
              >
                {Number(item.quantity)}
              </button>
              <button
                type="button"
                onClick={() => changeQty(item.salesOrderLineId, 1)}
                disabled={!canEditDraft}
                className="grid h-11 w-11 place-items-center text-blue-300 hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} />
              </button>
            </div>

            <span className="w-16 shrink-0 text-right text-xs font-bold">
              {formatMoney(
                item.lineSubtotalAmount,
                draftOrder?.currencyCode || catalogCurrencyCode,
                draftOrder?.currencyMinorUnitDigits || 2,
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
