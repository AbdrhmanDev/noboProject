import { Gift } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { Metric } from "../PosPrimitives";

function getTaxLabel(draftOrder) {
  const summaries = draftOrder?.taxSummaries || [];

  if (!draftOrder?.isTaxEnabled || summaries.length === 0) {
    return "ضريبة القيمة المضافة";
  }

  const distinctRates = Array.from(
    new Set(summaries.map((summary) => Number(summary.ratePercent))),
  );

  if (distinctRates.length === 1) {
    return `ضريبة القيمة المضافة ${distinctRates[0]}%`;
  }

  return "ضريبة القيمة المضافة (أسعار متعددة)";
}

export function OrderSummary({
  draftOrder,
  subtotal,
  discountValue,
  vat,
  total,
  catalogCurrencyCode,
  shouldShowPaymentPanel,
  netPaidAmount,
  settlementCurrencyCode,
  settlementMinorUnitDigits,
  remainingAmount,
  isFullyPaid,
}) {
  return (
    <div className="mt-3 shrink-0 border-t border-line pt-3">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted">
          <span>المجموع الفرعي</span>
          <span>{formatMoney(subtotal, catalogCurrencyCode, 2)}</span>
        </div>
        <div className="flex justify-between text-danger">
          <span className="flex items-center gap-1">
            الخصم
            {draftOrder?.discount && <Gift size={11} />}
          </span>
          <span>- {formatMoney(discountValue, catalogCurrencyCode, 2)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>{getTaxLabel(draftOrder)}</span>
          <span>{formatMoney(vat, catalogCurrencyCode, 2)}</span>
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-2">
        <span className="font-bold text-ink">الإجمالي</span>
        <span className="text-3xl font-black text-accent">{formatMoney(total, catalogCurrencyCode, 2)}</span>
      </div>
      {shouldShowPaymentPanel && (
        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
          <Metric
            label="Paid"
            value={formatMoney(netPaidAmount ?? 0, settlementCurrencyCode, settlementMinorUnitDigits)}
            tone="green"
          />
          <Metric
            label="Refunded"
            value={formatMoney(
              draftOrder?.refundedAmount ?? 0,
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
