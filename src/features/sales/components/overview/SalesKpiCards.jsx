import { useI18n } from "../../../../i18n/I18nContext";
import { formatMoney } from "../../../../shared/utils/formatters";

function Money({ amount, currencyCode }) {
  if (!currencyCode) return <span>{Math.round(amount).toLocaleString("en-US")}</span>;
  return <span>{formatMoney(amount, currencyCode, 2)}</span>;
}

function KpiCard({ label, value, tone = "default" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-3.5">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div
        className={`mt-1.5 text-xl font-black ${
          tone === "danger" ? "text-amber-300" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

// Primary KPI row uses real backend metrics only — payableAmount is
// deliberately labeled "Sales Amount", never "Revenue" (backend avoids that
// term on purpose). Secondary chips avoid overloading the first viewport.
export function SalesKpiCards({ overview }) {
  const { t } = useI18n();
  const currencyCode = overview.currencyCode;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <KpiCard
          label={t("salesOrders.overview.kpi.salesAmount")}
          value={<Money amount={overview.payableAmount} currencyCode={currencyCode} />}
        />
        <KpiCard
          label={t("salesOrders.overview.kpi.orders")}
          value={overview.orderCount.toLocaleString("en-US")}
        />
        <KpiCard
          label={t("salesOrders.overview.kpi.averageOrderValue")}
          value={<Money amount={overview.averageOrderValue} currencyCode={currencyCode} />}
        />
        <KpiCard
          label={t("salesOrders.overview.kpi.netPaid")}
          value={<Money amount={overview.netPaidAmount} currencyCode={currencyCode} />}
        />
        <KpiCard
          label={t("salesOrders.overview.kpi.outstanding")}
          value={<Money amount={overview.outstandingAmount} currencyCode={currencyCode} />}
          tone={overview.outstandingAmount > 0 ? "danger" : "default"}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <KpiCard
          label={t("salesOrders.overview.kpi.subtotal")}
          value={<Money amount={overview.subtotalAmount} currencyCode={currencyCode} />}
        />
        <KpiCard
          label={t("salesOrders.overview.kpi.discount")}
          value={<Money amount={overview.discountAmount} currencyCode={currencyCode} />}
        />
        <KpiCard
          label={t("salesOrders.overview.kpi.tax")}
          value={<Money amount={overview.taxAmount} currencyCode={currencyCode} />}
        />
      </div>
    </div>
  );
}
