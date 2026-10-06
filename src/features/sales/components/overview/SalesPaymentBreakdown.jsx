import { useI18n } from "../../../../i18n/I18nContext";
import { EmptyState } from "../../../../shared/components/ui";
import { formatMoney } from "../../../../shared/utils/formatters";

// Renders backend netAmount directly — refunds are already reflected there,
// never subtracted again on the client.
export function SalesPaymentBreakdown({ breakdown, currencyCode }) {
  const { t } = useI18n();

  if (!breakdown.length) {
    return <EmptyState title={t("salesOrders.overview.payment.empty")} />;
  }

  const maxAmount = Math.max(...breakdown.map((item) => item.netAmount), 1);

  return (
    <div className="space-y-2">
      {breakdown.map((item) => (
        <div key={item.paymentMethodId} className="rounded-xl bg-raised p-2.5">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-bold text-ink">{item.paymentMethodName}</span>
            <span className="text-muted">
              {currencyCode ? formatMoney(item.netAmount, currencyCode, 2) : item.netAmount} ·{" "}
              {item.transactionCount} {t("salesOrders.overview.payment.transactions")}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-inset">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${(item.netAmount / maxAmount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
