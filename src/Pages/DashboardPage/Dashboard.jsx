import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarRange, Clock3, ReceiptText, ShoppingCart, Wallet } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { formatMoney } from "../../shared/utils/formatters";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useSalesOrders, useSalesOverview } from "../../features/sales/hooks/useSalesOrders";
import { useSalesRankings } from "../../features/sales/hooks/useSalesRankings";
import { presetDateRange } from "../../features/sales/utils/dateRangePresets";
import { previousPeriod } from "../../features/sales/utils/salesRankings";
import { useInventoryLocations, useInventoryLocationStock } from "../../features/inventory/hooks/useInventory";
import {
  AlertsPanel,
  CategoryDonut,
  DashboardCard,
  KpiTile,
  RecentOrders,
  TrendCompareChart,
} from "../../features/dashboard/components/DashboardWidgets";
import { ROUTES, salesOrderDetailsPath } from "../../utils/routes";
import { SALES_ORDERS_VIEW_PERMISSION } from "../../features/authorization/constants/applicationPermissions";

const INVENTORY_VIEW_PERMISSION = "Inventory.View";
const PERIODS = ["today", "last7", "last30"];
const RECENT_ORDERS_FILTERS = { pageNumber: 1, pageSize: 5 };

// Items at zero / negative on hand at the branch's default inventory location (or its first active
// one). Null when the user lacks Inventory.View or the branch has no locations -- the alert is then
// simply left out, as it's a bonus on the home page.
function useOutOfStockCount(companyId, branchId) {
  const permissionQuery = useHasPermission(companyId, INVENTORY_VIEW_PERMISSION);
  const canView = Boolean(companyId) && Boolean(branchId) && permissionQuery.hasPermission;
  const locationsQuery = useInventoryLocations(companyId, branchId, {}, canView);
  const locations = useMemo(
    () => (locationsQuery.data ?? []).filter((location) => location.status !== "Suspended"),
    [locationsQuery.data],
  );
  const locationId = locations.find((location) => location.isDefault)?.inventoryLocationId || locations[0]?.inventoryLocationId || "";
  const stockQuery = useInventoryLocationStock(companyId, branchId, locationId, canView && Boolean(locationId));
  if (!canView || !locationId || !stockQuery.data) return null;
  return (stockQuery.data.items ?? []).filter((item) => Number(item.quantityOnHand) <= 0).length;
}

const draftCount = (overview) => overview?.statusBreakdown?.find((entry) => entry.status === "Draft")?.orderCount ?? 0;

// Home dashboard: greeting + period switch, four KPI tiles (vs the previous period of the same
// length), sales trend against that previous period, sales by category, latest orders and alerts.
// Everything comes from the existing sales overview / rankings / orders / inventory endpoints.
export default function Dashboard({ onLogout }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();
  const [period, setPeriod] = useState("last7");

  const permissionQuery = useHasPermission(currentCompanyId, SALES_ORDERS_VIEW_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) && Boolean(currentBranchId) && !permissionQuery.isLoading && permissionQuery.hasPermission;

  const range = useMemo(() => presetDateRange(period), [period]);
  const previousRange = useMemo(() => previousPeriod(range), [range]);
  // A single day has one trend point, so "today" charts the last 7 days instead.
  const trendRange = useMemo(() => (period === "today" ? presetDateRange("last7") : range), [period, range]);
  const previousTrendRange = useMemo(() => previousPeriod(trendRange), [trendRange]);

  const overviewQuery = useSalesOverview(currentCompanyId, currentBranchId, range, canQuery);
  const previousQuery = useSalesOverview(currentCompanyId, currentBranchId, previousRange ?? {}, canQuery && Boolean(previousRange));
  const trendQuery = useSalesOverview(currentCompanyId, currentBranchId, trendRange, canQuery && period === "today");
  const previousTrendQuery = useSalesOverview(
    currentCompanyId,
    currentBranchId,
    previousTrendRange ?? {},
    canQuery && period === "today" && Boolean(previousTrendRange),
  );
  const recentOrdersQuery = useSalesOrders(currentCompanyId, currentBranchId, RECENT_ORDERS_FILTERS, canQuery);
  const rankingsQuery = useSalesRankings(
    currentCompanyId,
    currentBranchId,
    range,
    {
      walkInCustomer: t("salesOrders.overview.rankings.walkIn"),
      unknownSalesperson: (userId) => t("salesOrders.overview.rankings.unknownUser", { id: userId.slice(0, 6) }),
      uncategorized: t("salesOrders.overview.rankings.uncategorized"),
    },
    canQuery && Boolean(overviewQuery.data?.orderCount),
  );
  const outOfStock = useOutOfStockCount(currentCompanyId, currentBranchId);

  const overview = overviewQuery.data;
  const previous = previousQuery.data;
  const currencyCode = overview?.currencyCode;
  const money = (amount) => (currencyCode ? formatMoney(amount, currencyCode, 2) : Math.round(amount).toLocaleString("en-US"));
  const trend = period === "today" ? trendQuery.data?.trend : overview?.trend;
  const previousTrend = period === "today" ? previousTrendQuery.data?.trend : previous?.trend;

  const ordersPath = `${ROUTES.SALES}?tab=orders`;
  const alerts = [
    outOfStock > 0 && {
      key: "stock",
      tone: "danger",
      text: t("dash.alert.outOfStock", { count: outOfStock }),
      onOpen: () => navigate(ROUTES.INVENTORY),
    },
    overview?.outstandingAmount > 0 && {
      key: "outstanding",
      tone: "warning",
      // Isolated (LRI…PDI) so the Latin amount + currency keeps its order inside RTL text.
      text: t("dash.alert.outstanding", { amount: `\u2066${money(overview.outstandingAmount)}\u2069` }),
      onOpen: () => navigate(ordersPath),
    },
    draftCount(overview) > 0 && {
      key: "drafts",
      tone: "info",
      text: t("dash.alert.drafts", { count: draftCount(overview) }),
      onOpen: () => navigate(ordersPath),
    },
  ].filter(Boolean);

  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.DASHBOARD}>
      {!currentCompanyId || !currentBranchId ? (
        <EmptyState title={t("salesOrders.companyBranchRequired.title")} message={t("salesOrders.companyBranchRequired.message")} />
      ) : permissionQuery.isLoading ? (
        <LoadingState label={t("salesOrders.loading")} />
      ) : !permissionQuery.hasPermission ? (
        <ErrorState title={t("salesOrders.permissionRequired.title")} message={t("salesOrders.permissionRequired.message")} />
      ) : (
        <div className="space-y-4">
          {/* Greeting + period */}
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="dash-display text-3xl font-black leading-tight text-ink">{t("dash.welcome")}</h1>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-surface)]" role="group" aria-label={t("dash.period")}>
              <CalendarRange size={15} className="mx-1.5 text-subtle" />
              {PERIODS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                  aria-pressed={period === value}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    period === value ? "bg-accent text-white" : "text-muted hover:bg-hover hover:text-ink"
                  }`}
                >
                  {t(`salesOrders.overview.dateRange.${value}`)}
                </button>
              ))}
            </div>
          </header>

          {overviewQuery.isError ? (
            <ErrorState title={t("salesOrders.error.title")} message={overviewQuery.error?.message || t("salesOrders.error.message")} />
          ) : overviewQuery.isLoading || !overview ? (
            <LoadingState label={t("salesOrders.loading")} />
          ) : (
            <>
              {/* KPI tiles */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiTile
                  icon={Wallet}
                  tone="success"
                  label={t("salesOrders.overview.kpi.salesAmount")}
                  value={money(overview.payableAmount)}
                  current={overview.payableAmount}
                  previous={previous?.payableAmount}
                />
                <KpiTile
                  icon={ShoppingCart}
                  tone="info"
                  label={t("salesOrders.overview.kpi.orders")}
                  value={overview.orderCount.toLocaleString("en-US")}
                  current={overview.orderCount}
                  previous={previous?.orderCount}
                />
                <KpiTile
                  icon={ReceiptText}
                  tone="warning"
                  label={t("salesOrders.overview.kpi.averageOrderValue")}
                  value={money(overview.averageOrderValue)}
                  current={overview.averageOrderValue}
                  previous={previous?.averageOrderValue}
                />
                <KpiTile
                  icon={Clock3}
                  tone="danger"
                  label={t("salesOrders.overview.kpi.outstanding")}
                  value={money(overview.outstandingAmount)}
                  current={overview.outstandingAmount}
                  previous={previous?.outstandingAmount}
                  upIsGood={false}
                />
              </div>

              {/* Trend + categories */}
              <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <DashboardCard title={t("dash.salesTrend")}>
                  {period === "today" && trendQuery.isLoading ? (
                    <LoadingState label={t("salesOrders.loading")} />
                  ) : (
                    <TrendCompareChart trend={trend ?? []} previousTrend={previousTrend} currencyCode={currencyCode} />
                  )}
                </DashboardCard>
                <DashboardCard title={t("salesOrders.overview.rankings.byCategory")}>
                  {overview.orderCount === 0 ? (
                    <p className="py-10 text-center text-sm text-subtle">{t("salesOrders.overview.rankings.empty")}</p>
                  ) : rankingsQuery.isLoading ? (
                    <LoadingState label={t("salesOrders.overview.rankings.loading")} />
                  ) : rankingsQuery.isError || !rankingsQuery.data ? (
                    <p className="py-10 text-center text-sm text-subtle">{t("salesOrders.overview.rankings.error")}</p>
                  ) : (
                    <CategoryDonut rows={rankingsQuery.data.categories} currencyCode={currencyCode} />
                  )}
                </DashboardCard>
              </div>

              {/* Latest orders + alerts */}
              <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <DashboardCard
                  title={t("dash.recentOrders")}
                  action={
                    <button type="button" onClick={() => navigate(ordersPath)} className="text-xs font-bold text-accent hover:underline">
                      {t("dash.viewAll")}
                    </button>
                  }
                >
                  <RecentOrders query={recentOrdersQuery} onOpenOrder={(id) => navigate(salesOrderDetailsPath(id))} />
                </DashboardCard>
                <DashboardCard title={t("dash.alerts")}>
                  <AlertsPanel alerts={alerts} />
                </DashboardCard>
              </div>
            </>
          )}
        </div>
      )}
    </AppLayout>
  );
}
