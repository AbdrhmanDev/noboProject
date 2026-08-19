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
}) {
  return (
    <div className="min-h-36 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-none">
      {!draftLines.length && (
        <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-white/10 text-center">
          <div>
            <ShoppingCart className="mx-auto mb-2 text-slate-600" size={26} />
            <p className="text-xs text-slate-500">السلة فارغة</p>
            <p className="mt-1 text-[10px] text-slate-600">اختر المنتجات لإنشاء مسودة بيع حقيقية</p>
          </div>
        </div>
      )}
      {draftLines.length > 0 && (
        <p className="px-0.5 text-[9px] text-slate-600" title="Arrow keys select a line · + / - change quantity · Delete removes it">
          ↑↓ select · + / − qty · Del remove
        </p>
      )}
      {draftLines.map((item) => {
        const pending = isLinePending?.(item.salesOrderLineId);
        const selected = selectedLineId === item.salesOrderLineId;

        return (
          <div
            key={item.salesOrderLineId}
            onClick={() => onSelectLine?.(item.salesOrderLineId)}
            className={`cursor-pointer rounded-xl border p-2.5 transition ${
              selected
                ? "border-blue-400/60 bg-blue-500/[0.06]"
                : "border-white/7 bg-white/[0.025] hover:border-white/15"
            }`}
          >
            <div className="flex gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-sm font-black text-blue-300">
                {item.productName.trim().slice(0, 1) || "#"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-slate-100">{item.productName}</div>
                <div className="mt-0.5 text-[10px] text-slate-500">
                  {item.variantName}
                  {item.sku ? ` · ${item.sku}` : ""}
                </div>
                {item.modifiers.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.modifiers.map((modifier) => (
                      <span
                        key={`${item.salesOrderLineId}-${modifier.modifierOptionId}`}
                        className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] text-blue-200"
                      >
                        {modifier.modifierOptionName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeDraftLine(item.salesOrderLineId)}
                disabled={!canEditDraft}
                className="text-slate-500 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => changeQty(item.salesOrderLineId, -1)}
                  disabled={!canEditDraft}
                  className="grid h-7 w-7 place-items-center text-slate-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Minus size={13} />
                </button>
                <span
                  className={`w-9 text-center text-xs font-bold transition-opacity ${pending ? "opacity-60" : ""}`}
                >
                  {Number(item.quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => changeQty(item.salesOrderLineId, 1)}
                  disabled={!canEditDraft}
                  className="grid h-7 w-7 place-items-center text-blue-300 hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={13} />
                </button>
              </div>
              <span className="text-xs font-bold">
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
