import { Gift } from "lucide-react";
import { formatMoney } from "../../../../shared/utils/formatters";
import { Metric } from "../PosPrimitives";
import { useI18n } from "../../../../i18n/I18nContext";


function getTaxLabel(t, draftOrder) {
  const summaries = draftOrder?.taxSummaries || [];

  if (!draftOrder?.isTaxEnabled || summaries.length === 0) {
    return t("pos.sum.vat");
  }

  const distinctRates = Array.from(
    new Set(summaries.map((summary) => Number(summary.ratePercent))),
  );

  if (distinctRates.length === 1) {
    return t("pos.sum.vatRate", { rate: distinctRates[0] });
  }

  return t("pos.sum.vatMulti");
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
  const { t } = useI18n();
  return (
    <div className="mt-1.5 shrink-0 border-t border-pos-border pt-1.5">
      <div className="text-[13px] leading-[18px]">
        <div className="flex justify-between text-pos-muted">
          <span className="flex items-center">
            <i className="pos-dot" style={{ "--pos-accent": "var(--brand-blue)" }} />
            {t("pos.sum.subtotal")}
          </span>
          <span className="pos-num">{formatMoney(subtotal, catalogCurrencyCode, 2)}</span>
        </div>
        <div className="flex justify-between text-pos-warning-text">
          <span className="flex items-center gap-1">
            <i className="pos-dot !me-0" style={{ "--pos-accent": "var(--brand-yellow)" }} />
            {t("pos.sum.discount")}
            {draftOrder?.discount && <Gift size={11} />}
          </span>
          <span className="pos-num">- {formatMoney(discountValue, catalogCurrencyCode, 2)}</span>
        </div>
        <div className="flex justify-between text-pos-muted">
          <span className="flex items-center">
            <i className="pos-dot" style={{ "--pos-accent": "var(--brand-pink)" }} />
            {getTaxLabel(t, draftOrder)}
          </span>
          <span className="pos-num">{formatMoney(vat, catalogCurrencyCode, 2)}</span>
        </div>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between rounded-pos bg-pos-tint px-2 py-1">
        <span className="pos-fs-line font-bold text-pos-text">{t("pos.sum.total")}</span>
        <span className="pos-num pos-fs-total text-pos-text">{formatMoney(total, catalogCurrencyCode, 2)}</span>
      </div>
      {shouldShowPaymentPanel && (
        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
          <Metric
            label={t("pos.sum.paid")}
            value={formatMoney(netPaidAmount ?? 0, settlementCurrencyCode, settlementMinorUnitDigits)}
            tone="green"
          />
          <Metric
            label={t("pos.sum.refunded")}
            value={formatMoney(
              draftOrder?.refundedAmount ?? 0,
              settlementCurrencyCode,
              settlementMinorUnitDigits,
            )}
            tone="pink"
          />
          <Metric
            label={t("pos.sum.remaining")}
            value={formatMoney(remainingAmount, settlementCurrencyCode, settlementMinorUnitDigits)}
            tone={isFullyPaid ? "green" : "gold"}
          />
        </div>
      )}
    </div>
  );
}
