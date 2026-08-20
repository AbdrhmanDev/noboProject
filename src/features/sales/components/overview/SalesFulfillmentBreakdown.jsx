import { useI18n } from "../../../../i18n/I18nContext";
import { EmptyState } from "../../../../shared/components/ui";
import { formatMoney } from "../../../../shared/utils/formatters";
import { fulfillmentLabelKey } from "../../utils/salesOrderFormatters";

export function SalesFulfillmentBreakdown({ breakdown, currencyCode }) {
  const { t } = useI18n();

  if (!breakdown.length) {
    return <EmptyState title={t("salesOrders.overview.fulfillment.empty")} />;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {breakdown.map((item) => {
        const labelKey = fulfillmentLabelKey(item.fulfillmentType);
        const label = labelKey ? t(labelKey) : item.fulfillmentType || "—";

        return (
          <div key={item.fulfillmentType || "none"} className="rounded-xl bg-white/[0.025] p-3">
            <div className="text-[11px] font-bold text-slate-300">{label}</div>
            <div className="mt-1 text-base font-black text-white">
              {currencyCode ? formatMoney(item.salesAmount, currencyCode, 2) : item.salesAmount}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500">
              {item.orderCount} {t("salesOrders.overview.kpi.orders")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
