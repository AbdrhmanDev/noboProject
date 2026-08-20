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

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3.5">
      <h2 className="mb-2.5 text-xs font-black uppercase tracking-wide text-slate-500">{title}</h2>
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

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DateRangeSelector preset={preset} onPresetChange={setPreset} onRangeChange={setRange} />
          <button
            type="button"
            onClick={() => overviewQuery.refetch()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
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
            className="w-full rounded-xl border border-white/10 bg-white/[0.035] py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
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
          <SalesKpiCards overview={overview} />

          <Section title={t("salesOrders.overview.trend.title")}>
            <SalesTrendChart trend={overview.trend} currencyCode={overview.currencyCode} />
          </Section>

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
