import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useSalesOverview } from "../../features/sales/hooks/useSalesOrders";
import { useSalesRankings } from "../../features/sales/hooks/useSalesRankings";
import { presetDateRange } from "../../features/sales/utils/dateRangePresets";
import { previousPeriod } from "../../features/sales/utils/salesRankings";
import { SalesKpiCards } from "../../features/sales/components/overview/SalesKpiCards";
import { SalesTrendChart } from "../../features/sales/components/overview/SalesTrendChart";
import { SalesRankingTable } from "../../features/sales/components/overview/SalesRankingTable";
import { SalesStatusBreakdown } from "../../features/sales/components/overview/SalesStatusBreakdown";
import { useInventoryLocations, useInventoryLocationStock } from "../../features/inventory/hooks/useInventory";
import { ROUTES } from "../../utils/routes";
import { SALES_ORDERS_VIEW_PERMISSION } from "../../features/authorization/constants/applicationPermissions";

const INVENTORY_VIEW_PERMISSION = "Inventory.View";
const LOW_STOCK_LIMIT = 6;

// Compact, dashboard-sized version of InventoryOverviewPanel's "needs attention" list (zero /
// negative on-hand quantity) -- no movement cards, no location picker, just the alert. Silently
// renders nothing without Inventory.View or when the company has no inventory locations at all,
// since this is a bonus section on the home page, not something worth an error state over.
function LowStockAlerts({ companyId, branchId }) {
  const { t } = useI18n();
  const permissionQuery = useHasPermission(companyId, INVENTORY_VIEW_PERMISSION);
  const canView = Boolean(companyId) && Boolean(branchId) && permissionQuery.hasPermission;

  const locationsQuery = useInventoryLocations(companyId, branchId, {}, canView);
  const locations = useMemo(
    () => (locationsQuery.data ?? []).filter((location) => location.status !== "Suspended"),
    [locationsQuery.data],
  );
  const locationId = locations.find((location) => location.isDefault)?.inventoryLocationId || locations[0]?.inventoryLocationId || "";

  const stockQuery = useInventoryLocationStock(companyId, branchId, locationId, canView && Boolean(locationId));
  const attention = useMemo(() => {
    const items = stockQuery.data?.items ?? [];
    return items
      .filter((item) => Number(item.quantityOnHand) <= 0)
      .sort((a, b) => Number(a.quantityOnHand) - Number(b.quantityOnHand))
      .slice(0, LOW_STOCK_LIMIT);
  }, [stockQuery.data]);

  if (!permissionQuery.hasPermission || !locations.length) return null;

  return (
    <section className="min-w-0 rounded-2xl border border-line bg-surface p-3.5">
      <h2 className="odoo-title mb-2.5 flex items-center gap-1.5 truncate border-b border-line pb-2 text-base">
        <TriangleAlert size={16} className="text-warning" />
        {t("inventory.overview.needsAttention")}
      </h2>
      {stockQuery.isLoading ? (
        <LoadingState label={t("inventory.overview.loading")} />
      ) : attention.length ? (
        <ul>
          {attention.map((item) => (
            <li
              key={item.inventoryItemId}
              className="flex items-center justify-between gap-2 border-b border-line py-1.5 last:border-0"
            >
              <span className="min-w-0 truncate text-sm text-ink" title={item.name}>
                {item.name} <span className="text-xs text-subtle">· {item.code}</span>
              </span>
              <span className={`pos-num shrink-0 text-sm font-bold ${Number(item.quantityOnHand) < 0 ? "text-danger" : "text-warning"}`}>
                {Number(item.quantityOnHand).toLocaleString("en-US", { maximumFractionDigits: 3 })}{" "}
                {item.baseUnitOfMeasure?.symbol ?? ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-subtle">{t("inventory.overview.allGood")}</p>
      )}
    </section>
  );
}

function Section({ title, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-line bg-surface p-3.5">
      <h2 className="odoo-title mb-2.5 truncate border-b border-line pb-2 text-base">{title}</h2>
      {children}
    </section>
  );
}

export default function Dashboard({ onLogout }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const permissionQuery = useHasPermission(currentCompanyId, SALES_ORDERS_VIEW_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !permissionQuery.isLoading &&
    permissionQuery.hasPermission;

  const todayRange = useMemo(() => presetDateRange("today"), []);
  const yesterdayRange = useMemo(() => previousPeriod(todayRange), [todayRange]);
  const last7Range = useMemo(() => presetDateRange("last7"), []);

  const todayQuery = useSalesOverview(currentCompanyId, currentBranchId, todayRange, canQuery);
  const yesterdayQuery = useSalesOverview(
    currentCompanyId,
    currentBranchId,
    yesterdayRange ?? {},
    canQuery && Boolean(yesterdayRange),
  );
  const trendQuery = useSalesOverview(currentCompanyId, currentBranchId, last7Range, canQuery);

  const rankingsQuery = useSalesRankings(
    currentCompanyId,
    currentBranchId,
    todayRange,
    {
      walkInCustomer: t("salesOrders.overview.rankings.walkIn"),
      unknownSalesperson: (userId) => t("salesOrders.overview.rankings.unknownUser", { id: userId.slice(0, 6) }),
      uncategorized: t("salesOrders.overview.rankings.uncategorized"),
    },
    canQuery && Boolean(todayQuery.data?.orderCount),
  );

  const overview = todayQuery.data;

  return (
    <AppLayout onLogout={onLogout} activePath={ROUTES.DASHBOARD}>
      {!currentCompanyId || !currentBranchId ? (
        <EmptyState
          title={t("salesOrders.companyBranchRequired.title")}
          message={t("salesOrders.companyBranchRequired.message")}
        />
      ) : permissionQuery.isLoading || todayQuery.isLoading ? (
        <LoadingState label={t("salesOrders.loading")} />
      ) : !permissionQuery.hasPermission ? (
        <ErrorState
          title={t("salesOrders.permissionRequired.title")}
          message={t("salesOrders.permissionRequired.message")}
        />
      ) : todayQuery.isError ? (
        <ErrorState
          title={t("salesOrders.error.title")}
          message={todayQuery.error?.message || t("salesOrders.error.message")}
        />
      ) : (
        overview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-lg font-bold text-ink">{t("dash.todaySnapshot")}</h1>
              <button
                type="button"
                onClick={() => navigate(ROUTES.SALES)}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-raised px-3 py-1.5 text-xs font-bold text-ink hover:bg-hover"
              >
                {t("dash.viewAll")}
                <ArrowLeft size={14} />
              </button>
            </div>

            {overview.orderCount === 0 ? (
              <EmptyState
                title={t("salesOrders.overview.empty.title")}
                message={t("salesOrders.overview.empty.message")}
              />
            ) : (
              <>
                <SalesKpiCards overview={overview} previousOverview={yesterdayQuery.data} />
                <Section title={t("salesOrders.overview.status.title")}>
                  <SalesStatusBreakdown breakdown={overview.statusBreakdown} />
                </Section>
              </>
            )}

            <Section title={`${t("dash.salesOverview")} · ${t("dash.last7Days")}`}>
              {trendQuery.isLoading ? (
                <LoadingState label={t("salesOrders.loading")} />
              ) : (
                <SalesTrendChart trend={trendQuery.data?.trend ?? []} currencyCode={trendQuery.data?.currencyCode} />
              )}
            </Section>

            <div className="grid gap-3 lg:grid-cols-2">
              <Section title={t("dash.topProducts")}>
                {rankingsQuery.isLoading ? (
                  <LoadingState label={t("salesOrders.overview.rankings.loading")} />
                ) : rankingsQuery.isError || !rankingsQuery.data ? (
                  <p className="py-6 text-center text-xs text-subtle">{t("salesOrders.overview.rankings.error")}</p>
                ) : (
                  <SalesRankingTable
                    rows={rankingsQuery.data.products}
                    currencyCode={overview.currencyCode}
                    nameHeader={t("salesOrders.overview.rankings.product")}
                    countHeader={t("salesOrders.overview.rankings.units")}
                    limit={5}
                  />
                )}
              </Section>
              <Section title={t("salesOrders.overview.rankings.topCustomers")}>
                {rankingsQuery.isLoading ? (
                  <LoadingState label={t("salesOrders.overview.rankings.loading")} />
                ) : rankingsQuery.isError || !rankingsQuery.data ? (
                  <p className="py-6 text-center text-xs text-subtle">{t("salesOrders.overview.rankings.error")}</p>
                ) : (
                  <SalesRankingTable
                    rows={rankingsQuery.data.customers}
                    currencyCode={overview.currencyCode}
                    nameHeader={t("salesOrders.overview.rankings.customer")}
                    countHeader={t("salesOrders.overview.rankings.orders")}
                    limit={5}
                  />
                )}
              </Section>
            </div>

            <LowStockAlerts companyId={currentCompanyId} branchId={currentBranchId} />
          </div>
        )
      )}
    </AppLayout>
  );
}
