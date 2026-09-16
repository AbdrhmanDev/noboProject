import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { ErrorState, LoadingState } from "../../shared/components/ui";
import { formatMoney } from "../../shared/utils/formatters";
import { useI18n } from "../../i18n/I18nContext";
import { PlatformAccessGate } from "../../features/platform/components/PlatformAccessGate";
import { PlatformDateRangeSelector } from "../../features/platform/components/PlatformDateRangeSelector";
import { PLATFORM_COMPANY_LIST_MAX_PAGE_SIZE } from "../../features/platform/api/platformApi";
import { usePlatformCompanies } from "../../features/platform/hooks/usePlatform";
import { presetDateRange } from "../../features/platform/utils/dateRangePresets";
import { ROUTES } from "../../utils/routes";

// This screen has no dedicated backend summary endpoint (Phase 4 deliberately only shipped a
// paginated companies list + a per-company details endpoint) -- rather than issuing one HTTP
// request per company (explicitly forbidden), the overview is computed from exactly TWO list
// calls: one page at the backend's own maximum page size (PLATFORM_COMPANY_LIST_MAX_PAGE_SIZE,
// currently 100 -- GetPlatformCompaniesHandler rejects anything above this with
// "PlatformCompanyList.PageSizeInvalid", so this MUST stay a real API contract constant, never a
// frontend-invented number) covering the most-recently-created companies, used for
// Branches/Tenant Users/Orders/Sales sums, and one tiny status-filtered page (pageSize=1, used only
// to read the authoritative TotalCount for Active Companies, which the backend already computes
// correctly regardless of page size). Total Customers also reads TotalCount directly, so it is
// always exact even if the primary page does not cover every company. When the platform has more
// companies than fit on one page, the four derived sums (Branches/Users/Orders/Sales) are genuinely
// partial and must say so -- see `isPartial` below -- rather than silently under-reporting.
const OVERVIEW_PAGE_SIZE = PLATFORM_COMPANY_LIST_MAX_PAGE_SIZE;

function MetricCard({ label, value, sub, partial }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {partial && <span className="ms-1 text-amber-300/80">*</span>}
      </div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

function PlatformOverviewContent() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [datePreset, setDatePreset] = useState("last30");
  const [dateRange, setDateRange] = useState(() => presetDateRange("last30"));

  const primaryFilters = useMemo(
    () => ({ pageNumber: 1, pageSize: OVERVIEW_PAGE_SIZE, fromUtc: dateRange.fromUtc, toUtc: dateRange.toUtc }),
    [dateRange],
  );
  const activeFilters = useMemo(
    () => ({ pageNumber: 1, pageSize: 1, status: "Active", fromUtc: dateRange.fromUtc, toUtc: dateRange.toUtc }),
    [dateRange],
  );

  const primaryQuery = usePlatformCompanies(primaryFilters);
  const activeQuery = usePlatformCompanies(activeFilters);

  const isLoading = primaryQuery.isLoading || activeQuery.isLoading;
  const isError = primaryQuery.isError || activeQuery.isError;

  const items = useMemo(() => primaryQuery.data?.items || [], [primaryQuery.data]);
  const totalCustomers = primaryQuery.data?.totalCount ?? 0;
  const activeCompanies = activeQuery.data?.totalCount ?? 0;
  const isPartial = totalCustomers > items.length;

  const totals = useMemo(() => {
    const branches = items.reduce((sum, item) => sum + item.branchCount, 0);
    const tenantUsers = items.reduce((sum, item) => sum + item.userCount, 0);
    const orders = items.reduce((sum, item) => sum + item.ordersCount, 0);

    const salesByCurrency = new Map();
    for (const item of items) {
      if (item.salesAmount === 0) continue;
      salesByCurrency.set(item.currencyCode, (salesByCurrency.get(item.currencyCode) || 0) + item.salesAmount);
    }

    return { branches, tenantUsers, orders, salesByCurrency };
  }, [items]);

  const days = datePreset === "last7" ? 7 : datePreset === "last30" ? 30 : null;
  const ordersLabel = days
    ? t("platform.overview.ordersPeriod", { days })
    : t("platform.companies.orders");
  const salesLabel = days
    ? t("platform.overview.salesPeriod", { days })
    : t("platform.companies.sales");

  const salesEntries = Array.from(totals.salesByCurrency.entries());
  const salesValue =
    salesEntries.length === 0
      ? formatMoney(0, items[0]?.currencyCode || "")
      : salesEntries.length === 1
        ? formatMoney(salesEntries[0][1], salesEntries[0][0])
        : salesEntries.map(([currency, amount]) => formatMoney(amount, currency)).join(" · ");

  return (
    <main className="space-y-4" dir="rtl">
      <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={16} className="text-blue-300" />
          {t("nav.platform")}
        </div>
        <h1 className="mt-1 text-2xl font-black text-white">{t("platform.overview.title")}</h1>
        <p className="mt-0.5 text-[11px] text-slate-500">{t("platform.overview.subtitle")}</p>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0c1424] p-3">
        <PlatformDateRangeSelector preset={datePreset} onPresetChange={setDatePreset} onRangeChange={setDateRange} />
        <button
          type="button"
          onClick={() => navigate(ROUTES.PLATFORM_COMPANIES)}
          className="text-xs font-bold text-blue-300 hover:text-blue-200"
        >
          {t("platform.overview.viewCustomers")}
        </button>
      </section>

      {isLoading && <LoadingState label={t("platform.loading")} />}
      {isError && !isLoading && <ErrorState title={t("platform.error.title")} message={t("platform.error.message")} />}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {/* Total Customers/Active Companies read TotalCount directly from the backend and are
                always exact -- never flagged as partial, unlike the four sums below. */}
            <MetricCard label={t("platform.overview.totalCustomers")} value={totalCustomers} />
            <MetricCard label={t("platform.overview.activeCompanies")} value={activeCompanies} />
            <MetricCard label={t("platform.overview.tenantUsers")} value={totals.tenantUsers} partial={isPartial} />
            <MetricCard label={t("platform.overview.branches")} value={totals.branches} partial={isPartial} />
            <MetricCard label={ordersLabel} value={totals.orders} partial={isPartial} />
            <MetricCard label={salesLabel} value={salesValue} partial={isPartial} />
          </div>
          {isPartial && (
            <p className="text-[11px] text-amber-300/80">
              * {t("platform.overview.partialNote", { count: items.length, total: totalCustomers })}
            </p>
          )}
        </>
      )}
    </main>
  );
}

export default function PlatformOverviewPage() {
  return (
    <AppLayout activePath={ROUTES.PLATFORM_OVERVIEW}>
      <PlatformAccessGate>
        <PlatformOverviewContent />
      </PlatformAccessGate>
    </AppLayout>
  );
}
