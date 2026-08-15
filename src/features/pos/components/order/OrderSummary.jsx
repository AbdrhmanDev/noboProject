import { Gift } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { Metric } from "../PosPrimitives";

export function OrderSummary({
  draftOrder,
  canEditDraft,
  isDraftMutationPending,
  onOpenDiscount,
  subtotal,
  discountValue,
  vat,
  total,
  catalogCurrencyCode,
  shouldShowPaymentPanel,
  paymentState,
  settlementCurrencyCode,
  settlementMinorUnitDigits,
  remainingAmount,
  isFullyPaid,
}) {
  return (
    <div className="mt-3 shrink-0 border-t border-white/10 pt-3">
      <button
        type="button"
        onClick={onOpenDiscount}
        disabled={!canEditDraft || isDraftMutationPending}
        className="mb-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-slate-300 hover:border-pink-400/35 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex items-center gap-2">
          <Gift size={14} className="text-pink-300" />
          خصم وعروض
        </span>
        <span className="font-bold text-pink-300">
          {draftOrder?.discount
            ? formatMoney(
                draftOrder.discount.appliedAmount,
                draftOrder.currencyCode,
                draftOrder.currencyMinorUnitDigits,
              )
            : "إضافة"}
        </span>
      </button>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>المجموع الفرعي</span>
          <span>{formatMoney(subtotal, catalogCurrencyCode, 2)}</span>
        </div>
        <div className="flex justify-between text-pink-300">
          <span>الخصم</span>
          <span>- {formatMoney(discountValue, catalogCurrencyCode, 2)}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>ضريبة القيمة المضافة 15%</span>
          <span>{formatMoney(vat, catalogCurrencyCode, 2)}</span>
        </div>
        <div className="mt-2 flex items-end justify-between border-t border-white/10 pt-2">
          <span className="font-bold">الإجمالي</span>
          <span className="text-2xl font-black text-blue-300">
            {formatMoney(total, catalogCurrencyCode, 2)}
          </span>
        </div>
      </div>
      {shouldShowPaymentPanel && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
          <Metric
            label="Paid"
            value={formatMoney(
              paymentState?.netPaidAmount ?? 0,
              settlementCurrencyCode,
              settlementMinorUnitDigits,
            )}
            tone="green"
          />
          <Metric
            label="Refunded"
            value={formatMoney(
              paymentState?.refundedAmount ?? 0,
              settlementCurrencyCode,
              settlementMinorUnitDigits,
            )}
            tone="pink"
          />
          <Metric
            label="Remaining"
            value={formatMoney(remainingAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
            tone={isFullyPaid ? "green" : "gold"}
          />
        </div>
      )}
    </div>
  );
}
