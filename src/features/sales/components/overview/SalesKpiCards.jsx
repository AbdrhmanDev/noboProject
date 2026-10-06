import { ArrowDown, ArrowUp } from "lucide-react";
import { useI18n } from "../../../../i18n/I18nContext";
import { formatMoney } from "../../../../shared/utils/formatters";
import { percentChange } from "../../utils/salesRankings";

function money(amount, currencyCode) {
  if (!currencyCode) return Math.round(amount).toLocaleString("en-US");
  return formatMoney(amount, currencyCode, 2);
}

function draftCount(overview) {
  return overview?.statusBreakdown?.find((entry) => entry.status === "Draft")?.orderCount ?? 0;
}

// Change vs the previous period of the same length. Up is good for every KPI shown here, so up =
// green, down = red. No previous figure (or a previous 0) -> no arrow, just "—".
function Delta({ current, previous }) {
  const { t } = useI18n();
  const change = percentChange(current, previous);

  if (change === null) {
    return <div className="mt-1 text-[11px] text-subtle">— {t("salesOrders.overview.kpi.sincePrevious")}</div>;
  }

  const up = change >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <div className="mt-1 flex items-center justify-center gap-1 text-[11px]">
      <span className={`flex items-center gap-0.5 font-bold ${up ? "text-success" : "text-danger"}`}>
        <Icon size={12} />
        <span className="pos-num">{Math.abs(change).toFixed(1)}%</span>
      </span>
      <span className="truncate text-subtle">{t("salesOrders.overview.kpi.sincePrevious")}</span>
    </div>
  );
}

function KpiCard({ label, value, current, previous, tone = "default" }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface p-3.5 text-center">
      <div className="odoo-title truncate text-start text-sm">{label}</div>
      <div
        className={`pos-num mt-1.5 truncate text-2xl font-normal sm:text-3xl ${
          tone === "danger" ? "text-danger" : "text-ink"
        }`}
      >
        {value}
      </div>
      <Delta current={current} previous={previous} />
    </div>
  );
}

function SmallStat({ label, value, tone }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface px-3 py-2">
      <div className="truncate text-[11px] text-subtle">{label}</div>
      <div className={`pos-num truncate text-sm font-black ${tone === "warning" ? "text-warning" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

// Odoo-style KPI row: Quotations (Draft orders), Orders, Sales amount and Average order, each with
// its change vs `previousOverview` (the same-length period right before). Real backend metrics
// only -- payableAmount is labeled "Sales Amount", never "Revenue" (the backend avoids that term).
export function SalesKpiCards({ overview, previousOverview }) {
  const { t } = useI18n();
  const currencyCode = overview.currencyCode;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <KpiCard
          label={t("salesOrders.overview.kpi.quotations")}
          value={draftCount(overview).toLocaleString("en-US")}
          current={draftCount(overview)}
          previous={previousOverview ? draftCount(previousOverview) : null}
        />
        <KpiCard
          label={t("salesOrders.overview.kpi.orders")}
          value={overview.orderCount.toLocaleString("en-US")}
          current={overview.orderCount}
          previous={previousOverview?.orderCount}
        />
        <KpiCard
          label={t("salesOrders.overview.kpi.salesAmount")}
          value={money(overview.payableAmount, currencyCode)}
          current={overview.payableAmount}
          previous={previousOverview?.payableAmount}
          tone={overview.payableAmount < 0 ? "danger" : "default"}
        />
        <KpiCard
          label={t("salesOrders.overview.kpi.averageOrderValue")}
          value={money(overview.averageOrderValue, currencyCode)}
          current={overview.averageOrderValue}
          previous={previousOverview?.averageOrderValue}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <SmallStat label={t("salesOrders.overview.kpi.netPaid")} value={money(overview.netPaidAmount, currencyCode)} />
        <SmallStat
          label={t("salesOrders.overview.kpi.outstanding")}
          value={money(overview.outstandingAmount, currencyCode)}
          tone={overview.outstandingAmount > 0 ? "warning" : undefined}
        />
        <SmallStat label={t("salesOrders.overview.kpi.subtotal")} value={money(overview.subtotalAmount, currencyCode)} />
        <SmallStat label={t("salesOrders.overview.kpi.discount")} value={money(overview.discountAmount, currencyCode)} />
        <SmallStat label={t("salesOrders.overview.kpi.tax")} value={money(overview.taxAmount, currencyCode)} />
      </div>
    </div>
  );
}
