import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, RefreshCw } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useRestaurantFloorView } from "../../features/restaurant/hooks/useRestaurantFloorView";
import { RestaurantTableTile } from "../../features/restaurant/components/RestaurantTableTile";
import { RestaurantTableDetailsPanel } from "../../features/restaurant/components/RestaurantTableDetailsPanel";
import {
  deriveTableOperationalState,
  OPERATIONAL_STATE_LABEL_KEYS,
} from "../../features/restaurant/utils/restaurantFloorState";
import { ROUTES } from "../../utils/routes";

const RESTAURANT_VIEW_PERMISSION = "Restaurant.View";
const SALES_ORDERS_VIEW_PERMISSION = "SalesOrders.View";
// Matches this codebase's existing operational-live-view convention
// (Kitchen's useKitchenTickets uses the same 15s interval).
const REFRESH_INTERVAL_MS = 15000;
const STATE_FILTERS = ["AVAILABLE", "OCCUPIED", "WAITING_PAYMENT", "PAID", "UNAVAILABLE"];

export default function RestaurantFloorPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const [stateFilter, setStateFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [selectedTableId, setSelectedTableId] = useState(null);

  const viewPermissionQuery = useHasPermission(currentCompanyId, RESTAURANT_VIEW_PERMISSION);
  const ordersPermissionQuery = useHasPermission(currentCompanyId, SALES_ORDERS_VIEW_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canViewOrders = !ordersPermissionQuery.isLoading && ordersPermissionQuery.hasPermission;

  const floorView = useRestaurantFloorView(currentCompanyId, currentBranchId, {
    enabled: canQuery,
    canViewOrders,
  });

  useEffect(() => {
    if (!canQuery) return undefined;
    const interval = window.setInterval(() => floorView.refetch(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
    // floorView is a new object every render (not memoized), so this effect
    // tears down and recreates the interval on each render — harmless for a
    // "roughly every 15s" background refresh, and far safer than risking a
    // stale refetch closure over a captured-but-outdated query client
    // reference.
  }, [canQuery, floorView]);

  const tablesWithState = useMemo(
    () =>
      floorView.tables.map((table) => ({
        table,
        state: deriveTableOperationalState(table),
      })),
    [floorView.tables],
  );

  const filteredTables = tablesWithState.filter(({ table, state }) => {
    if (stateFilter && state !== stateFilter) return false;
    if (floorFilter && table.restaurantFloorId !== floorFilter) return false;
    return true;
  });

  const summary = useMemo(() => {
    const counts = { total: tablesWithState.length, AVAILABLE: 0, OCCUPIED: 0, WAITING_PAYMENT: 0, PAID: 0, UNAVAILABLE: 0 };
    tablesWithState.forEach(({ state }) => {
      counts[state] += 1;
    });
    return counts;
  }, [tablesWithState]);

  const selectedEntry = tablesWithState.find(({ table }) => table.restaurantTableId === selectedTableId) || null;

  return (
    <AppLayout activePath={ROUTES.RESTAURANT_FLOOR}>
      <main className="space-y-4" dir="rtl">
        <header className="rounded-2xl border border-white/10 bg-[#0c1424]/85 p-4 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <LayoutGrid size={16} className="text-blue-300" />
                {t("nav.restaurant")}
              </div>
              <h1 className="mt-1 text-2xl font-black text-white">{t("restaurantFloor.title")}</h1>
              <p className="mt-0.5 text-[11px] text-slate-500">{t("restaurantFloor.subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => floorView.refetch()}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
            >
              <RefreshCw size={14} />
              {t("restaurantFloor.refresh")}
            </button>
          </div>
        </header>

        {!currentCompanyId || !currentBranchId ? (
          <EmptyState
            title={t("restaurantFloor.companyBranchRequired.title")}
            message={t("restaurantFloor.companyBranchRequired.message")}
          />
        ) : viewPermissionQuery.isLoading ? (
          <LoadingState label={t("restaurantFloor.loading")} />
        ) : !viewPermissionQuery.hasPermission ? (
          <ErrorState
            title={t("restaurantFloor.permissionRequired.title")}
            message={t("restaurantFloor.permissionRequired.message")}
          />
        ) : (
          <>
            {/* Summary strip — operational seating counts, not a sales KPI */}
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-[#0c1424] p-3">
                <div className="text-[10px] text-slate-500">{t("restaurantFloor.summary.total")}</div>
                <div className="mt-1 text-xl font-black text-white">{summary.total}</div>
              </div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] p-3">
                <div className="text-[10px] text-emerald-300/80">{t(OPERATIONAL_STATE_LABEL_KEYS.AVAILABLE)}</div>
                <div className="mt-1 text-xl font-black text-emerald-300">{summary.AVAILABLE}</div>
              </div>
              <div className="rounded-xl border border-blue-400/20 bg-blue-500/[0.06] p-3">
                <div className="text-[10px] text-blue-300/80">{t(OPERATIONAL_STATE_LABEL_KEYS.OCCUPIED)}</div>
                <div className="mt-1 text-xl font-black text-blue-300">{summary.OCCUPIED}</div>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3">
                <div className="text-[10px] text-amber-300/80">{t(OPERATIONAL_STATE_LABEL_KEYS.WAITING_PAYMENT)}</div>
                <div className="mt-1 text-xl font-black text-amber-300">{summary.WAITING_PAYMENT}</div>
              </div>
            </section>

            {/* Filters */}
            <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <button
                type="button"
                onClick={() => setStateFilter("")}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                  stateFilter === "" ? "border-blue-400/70 bg-blue-500/15 text-blue-100" : "border-white/10 bg-black/10 text-slate-400 hover:bg-white/10"
                }`}
              >
                {t("restaurantFloor.filters.all")}
              </button>
              {STATE_FILTERS.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => setStateFilter(state)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                    stateFilter === state ? "border-blue-400/70 bg-blue-500/15 text-blue-100" : "border-white/10 bg-black/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {t(OPERATIONAL_STATE_LABEL_KEYS[state])}
                </button>
              ))}

              {floorView.floors.length > 1 && (
                <select
                  value={floorFilter}
                  onChange={(event) => setFloorFilter(event.target.value)}
                  className="ms-auto h-8 rounded-lg border border-white/10 bg-black/20 px-2.5 text-[11px] text-white outline-none"
                >
                  <option value="">{t("restaurantFloor.filters.allFloors")}</option>
                  {floorView.floors.map((floor) => (
                    <option key={floor.restaurantFloorId} value={floor.restaurantFloorId}>
                      {floor.name}
                    </option>
                  ))}
                </select>
              )}
            </section>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
              <section className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0c1424] p-3">
                {floorView.isLoading && <LoadingState label={t("restaurantFloor.loading")} />}
                {floorView.isError && (
                  <>
                    <ErrorState title={t("restaurantFloor.error.title")} message={t("restaurantFloor.error.message")} />
                    <button
                      type="button"
                      onClick={() => floorView.refetch()}
                      className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.035] py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
                    >
                      {t("restaurantFloor.retry")}
                    </button>
                  </>
                )}
                {!floorView.isLoading && !floorView.isError && filteredTables.length === 0 && (
                  <EmptyState title={t("restaurantFloor.empty.title")} message={t("restaurantFloor.empty.message")} />
                )}
                {!floorView.isLoading && !floorView.isError && filteredTables.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                    {filteredTables.map(({ table, state }) => (
                      <RestaurantTableTile
                        key={table.restaurantTableId}
                        table={table}
                        state={state}
                        order={table.orders[0] || null}
                        canViewOrders={canViewOrders}
                        selected={selectedTableId === table.restaurantTableId}
                        onSelect={() => setSelectedTableId(table.restaurantTableId)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {selectedEntry && (
                <RestaurantTableDetailsPanel
                  table={selectedEntry.table}
                  state={selectedEntry.state}
                  companyId={currentCompanyId}
                  branchId={currentBranchId}
                  canViewOrders={canViewOrders}
                  onClose={() => setSelectedTableId(null)}
                />
              )}
            </div>
          </>
        )}
      </main>
    </AppLayout>
  );
}
