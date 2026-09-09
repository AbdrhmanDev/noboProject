import { useState } from "react";
import { ChevronDown, ChevronUp, Gift } from "lucide-react";
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
  // Subtotal/discount/tax collapse behind a toggle by default — only the
  // total (what the cashier actually needs at a glance) stays permanently
  // visible. This is the single biggest structural item in the basket's
  // fixed chrome; collapsing it is what actually buys the line list room
  // to show more than one or two lines at 1366x768.
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  return (
    <div className="mt-1 shrink-0 border-t border-white/10 pt-1">
      <button
        type="button"
        onClick={() => setDetailsExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-0.5 py-0.5 text-xs"
      >
        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
          {detailsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          التفاصيل
          {draftOrder?.discount && (
            <span className="flex items-center gap-0.5 text-pink-300">
              <Gift size={11} />
              -
              {formatMoney(
                draftOrder.discount.appliedAmount,
                draftOrder.currencyCode,
                draftOrder.currencyMinorUnitDigits,
              )}
            </span>
          )}
        </span>
        <span className="flex items-baseline gap-2">
          <span className="font-bold text-slate-300">الإجمالي</span>
          <span className="text-xl font-black text-blue-300">
            {formatMoney(total, catalogCurrencyCode, 2)}
          </span>
        </span>
      </button>

      {detailsExpanded && (
        <div className="mt-1 space-y-0.5 border-t border-white/10 pt-1 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>المجموع الفرعي</span>
            <span>{formatMoney(subtotal, catalogCurrencyCode, 2)}</span>
          </div>
          <div className="flex justify-between text-pink-300">
            <span>الخصم</span>
            <span>- {formatMoney(discountValue, catalogCurrencyCode, 2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>{getTaxLabel(draftOrder)}</span>
            <span>{formatMoney(vat, catalogCurrencyCode, 2)}</span>
          </div>
        </div>
      )}
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
