import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../../shared/components/ui";
import { useI18n } from "../../../../i18n/I18nContext";
import { useSalesOverview } from "../../hooks/useSalesOrders";
import { presetDateRange } from "../../utils/dateRangePresets";
import { DateRangeSelector } from "./DateRangeSelector";
import { SalesKpiCards } from "./SalesKpiCards";
import { SalesTrendChart } from "./SalesTrendChart";
import { SalesPaymentBreakdown } from "./SalesPaymentBreakdown";
import { SalesFulfillmentBreakdown } from "./SalesFulfillmentBreakdown";
import { SalesStatusBreakdown } from "./SalesStatusBreakdown";
import { SalesRankingTable } from "./SalesRankingTable";
import { SalesCategoryTreemap } from "./SalesCategoryTreemap";
import { useSalesRankings } from "../../hooks/useSalesRankings";
import { previousPeriod } from "../../utils/salesRankings";

function Section({ title, children, aside }) {
  return (
    <section className="min-w-0 rounded-2xl border border-line bg-surface p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-line pb-2">
        <h2 className="odoo-title truncate text-base">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function SalesOverviewView({ companyId, branchId, canQuery }) {
  const { t } = useI18n();
  const [preset, setPreset] = useState("today");
  const [range, setRange] = useState(() => presetDateRange("today"));

  const filters = useMemo(() => ({ fromUtc: range.fromUtc, toUtc: range.toUtc }), [range]);
  const overviewQuery = useSalesOverview(companyId, branchId, filters, canQuery);
  const overview = overviewQuery.data;

  // Same-length period right before the selected one, for the KPI deltas.
  const previousFilters = useMemo(() => previousPeriod(range), [range]);
  const previousOverviewQuery = useSalesOverview(
    companyId,
    branchId,
    previousFilters ?? {},
    canQuery && Boolean(previousFilters),
  );

  const rankingsQuery = useSalesRankings(
    companyId,
    branchId,
    range,
    {
      walkInCustomer: t("salesOrders.overview.rankings.walkIn"),
      unknownSalesperson: (userId) => t("salesOrders.overview.rankings.unknownUser", { id: userId.slice(0, 6) }),
      uncategorized: t("salesOrders.overview.rankings.uncategorized"),
    },
    canQuery && Boolean(overview?.orderCount),
  );
  const rankings = rankingsQuery.data;
  const rankingsBody = (render) => {
    if (rankingsQuery.isLoading) return <LoadingState label={t("salesOrders.overview.rankings.loading")} />;
    if (rankingsQuery.isError || !rankings) {
      return <p className="py-6 text-center text-xs text-subtle">{t("salesOrders.overview.rankings.error")}</p>;
    }
    return render(rankings);
  };

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-line bg-surface p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DateRangeSelector preset={preset} onPresetChange={setPreset} onRangeChange={setRange} />
          <button
            type="button"
            onClick={() => overviewQuery.refetch()}
            className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-xs font-bold text-ink"
          >
            <RefreshCw size={14} />
            {t("salesOrders.refresh")}
          </button>
        </div>
      </section>

      {overviewQuery.isLoading && <LoadingState label={t("salesOrders.loading")} />}

      {overviewQuery.isError && (
        <>
          <ErrorState
            title={t("salesOrders.error.title")}
            message={overviewQuery.error?.message || t("salesOrders.error.message")}
          />
          <button
            type="button"
            onClick={() => overviewQuery.refetch()}
            className="w-full rounded-xl border border-line bg-raised py-2 text-xs font-bold text-ink hover:bg-hover"
          >
            {t("salesOrders.retry")}
          </button>
        </>
      )}

      {!overviewQuery.isLoading && !overviewQuery.isError && overview && overview.orderCount === 0 && (
        <EmptyState
          title={t("salesOrders.overview.empty.title")}
          message={t("salesOrders.overview.empty.message")}
        />
      )}

      {!overviewQuery.isLoading && !overviewQuery.isError && overview && overview.orderCount > 0 && (
        <>
          <SalesKpiCards
            overview={overview}
            previousOverview={previousFilters ? previousOverviewQuery.data : null}
          />

          <Section title={t("salesOrders.overview.trend.title")}>
            <SalesTrendChart trend={overview.trend} currencyCode={overview.currencyCode} />
          </Section>

          {rankings?.truncated && (
            <p className="rounded-xl border border-warning bg-warning-soft px-3 py-2 text-[11px] text-warning">
              {t("salesOrders.overview.rankings.truncated", { count: rankings.orderCount })}
            </p>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            <Section title={t("salesOrders.overview.rankings.topProducts")}>
              {rankingsBody((data) => (
                <SalesRankingTable
                  rows={data.products}
                  currencyCode={overview.currencyCode}
                  nameHeader={t("salesOrders.overview.rankings.product")}
                  countHeader={t("salesOrders.overview.rankings.units")}
                />
              ))}
            </Section>
            <Section title={t("salesOrders.overview.rankings.byCategory")}>
              {rankingsBody((data) => (
                <SalesCategoryTreemap rows={data.categories} currencyCode={overview.currencyCode} />
              ))}
            </Section>
            <Section title={t("salesOrders.overview.rankings.topCustomers")}>
              {rankingsBody((data) => (
                <SalesRankingTable
                  rows={data.customers}
                  currencyCode={overview.currencyCode}
                  nameHeader={t("salesOrders.overview.rankings.customer")}
                  countHeader={t("salesOrders.overview.rankings.orders")}
                />
              ))}
            </Section>
            <Section title={t("salesOrders.overview.rankings.topSalespeople")}>
              {rankingsBody((data) => (
                <SalesRankingTable
                  rows={data.salespeople}
                  currencyCode={overview.currencyCode}
                  nameHeader={t("salesOrders.overview.rankings.salesperson")}
                  countHeader={t("salesOrders.overview.rankings.orders")}
                />
              ))}
            </Section>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Section title={t("salesOrders.overview.payment.title")}>
              <SalesPaymentBreakdown
                breakdown={overview.paymentMethodBreakdown}
                currencyCode={overview.currencyCode}
              />
            </Section>
            <Section title={t("salesOrders.overview.fulfillment.title")}>
              <SalesFulfillmentBreakdown
                breakdown={overview.fulfillmentBreakdown}
                currencyCode={overview.currencyCode}
              />
            </Section>
          </div>

          <Section title={t("salesOrders.overview.status.title")}>
            <SalesStatusBreakdown breakdown={overview.statusBreakdown} />
          </Section>
        </>
      )}
    </div>
  );
}
