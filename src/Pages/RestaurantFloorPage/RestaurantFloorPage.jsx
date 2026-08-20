import { useMemo, useState } from "react";
import { LayoutGrid, RefreshCw } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../../shared/components/ui";
import { useI18n } from "../../i18n/I18nContext";
import { useCompany } from "../../features/companies/context/CompanyContext";
import { useBranch } from "../../features/branches/context/BranchContext";
import { useHasPermission } from "../../features/companies/hooks/useCompanies";
import { useFloorState } from "../../features/restaurant/hooks/useFloorState";
import { RestaurantTableTile } from "../../features/restaurant/components/RestaurantTableTile";
import { RestaurantTableDetailsDrawer } from "../../features/restaurant/components/RestaurantTableDetailsDrawer";
import { OPERATIONAL_STATE_LABEL_KEYS } from "../../features/restaurant/utils/floorOperationalState";
import { ROUTES } from "../../utils/routes";

const RESTAURANT_VIEW_PERMISSION = "Restaurant.View";
const RESTAURANT_MANAGE_PERMISSION = "Restaurant.Manage";
const SALES_ORDERS_VIEW_PERMISSION = "SalesOrders.View";
const STATE_FILTERS = [
  "AVAILABLE",
  "RESERVED_SOON",
  "OCCUPIED",
  "WAITING_PAYMENT",
  "PAID_STILL_SEATED",
  "UNAVAILABLE",
];

export default function RestaurantFloorPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const [stateFilter, setStateFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [selectedTableId, setSelectedTableId] = useState(null);

  const viewPermissionQuery = useHasPermission(currentCompanyId, RESTAURANT_VIEW_PERMISSION);
  const managePermissionQuery = useHasPermission(currentCompanyId, RESTAURANT_MANAGE_PERMISSION);
  const ordersPermissionQuery = useHasPermission(currentCompanyId, SALES_ORDERS_VIEW_PERMISSION);
  const canQuery =
    Boolean(currentCompanyId) &&
    Boolean(currentBranchId) &&
    !viewPermissionQuery.isLoading &&
    viewPermissionQuery.hasPermission;
  const canManage = !managePermissionQuery.isLoading && managePermissionQuery.hasPermission;
  const canViewOrders = !ordersPermissionQuery.isLoading && ordersPermissionQuery.hasPermission;

  // Refresh lives entirely in the query's own refetchInterval (see
  // useFloorState) — floors/tables are memoized inside the hook itself
  // (flattening the real floors[].tables[] response shape), so there is
  // nothing here that can reintroduce the earlier routing-freeze loop.
  const floorStateQuery = useFloorState(currentCompanyId, currentBranchId, {}, canQuery);
  const { floors, tables } = floorStateQuery;

  const summary = useMemo(() => {
    const counts = {
      total: tables.length,
      AVAILABLE: 0,
      RESERVED_SOON: 0,
      OCCUPIED: 0,
      WAITING_PAYMENT: 0,
      PAID_STILL_SEATED: 0,
      UNAVAILABLE: 0,
    };
    tables.forEach((table) => {
      counts[table.operationalState] += 1;
    });
    return counts;
  }, [tables]);

  const filteredTables = tables.filter((table) => {
    if (stateFilter && table.operationalState !== stateFilter) return false;
    if (floorFilter && table.restaurantFloorId !== floorFilter) return false;
    return true;
  });

  const selectedTable = tables.find((table) => table.restaurantTableId === selectedTableId) || null;

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
              onClick={() => floorStateQuery.refetch()}
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
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
              <div className="rounded-xl border border-white/10 bg-[#0c1424] p-3">
                <div className="text-[10px] text-slate-500">{t("restaurantFloor.summary.total")}</div>
                <div className="mt-1 text-xl font-black text-white">{summary.total}</div>
              </div>
              {STATE_FILTERS.map((state) => (
                <div key={state} className="rounded-xl border border-white/10 bg-[#0c1424] p-3">
                  <div className="truncate text-[10px] text-slate-500">{t(OPERATIONAL_STATE_LABEL_KEYS[state])}</div>
                  <div className="mt-1 text-xl font-black text-white">{summary[state]}</div>
                </div>
              ))}
            </section>

            <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0c1424] p-3">
              <button
                type="button"
                onClick={() => setStateFilter("")}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                  stateFilter === ""
                    ? "border-blue-400/70 bg-blue-500/15 text-blue-100"
                    : "border-white/10 bg-black/10 text-slate-400 hover:bg-white/10"
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
                    stateFilter === state
                      ? "border-blue-400/70 bg-blue-500/15 text-blue-100"
                      : "border-white/10 bg-black/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {t(OPERATIONAL_STATE_LABEL_KEYS[state])}
                </button>
              ))}

              {floors.length > 1 && (
                <select
                  value={floorFilter}
                  onChange={(event) => setFloorFilter(event.target.value)}
                  className="ms-auto h-8 rounded-lg border border-white/10 bg-black/20 px-2.5 text-[11px] text-white outline-none"
                >
                  <option value="">{t("restaurantFloor.filters.allFloors")}</option>
                  {floors.map((floor) => (
                    <option key={floor.restaurantFloorId} value={floor.restaurantFloorId}>
                      {floor.name}
                    </option>
                  ))}
                </select>
              )}
            </section>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
              <section className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0c1424] p-3">
                {floorStateQuery.isLoading && <LoadingState label={t("restaurantFloor.loading")} />}
                {floorStateQuery.isError && (
                  <>
                    <ErrorState title={t("restaurantFloor.error.title")} message={t("restaurantFloor.error.message")} />
                    <button
                      type="button"
                      onClick={() => floorStateQuery.refetch()}
                      className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.035] py-2 text-xs font-bold text-slate-100 hover:bg-white/10"
                    >
                      {t("restaurantFloor.retry")}
                    </button>
                  </>
                )}
                {/* Two distinct empty states: genuinely zero tables from the
                    backend vs. a filter that happens to remove every table
                    from an otherwise non-empty set. Using the same message
                    for both was the exact "لا توجد طاولات" bug report. */}
                {!floorStateQuery.isLoading && !floorStateQuery.isError && tables.length === 0 && (
                  <EmptyState title={t("restaurantFloor.empty.title")} message={t("restaurantFloor.empty.message")} />
                )}
                {!floorStateQuery.isLoading &&
                  !floorStateQuery.isError &&
                  tables.length > 0 &&
                  filteredTables.length === 0 && (
                    <EmptyState
                      title={t("restaurantFloor.empty.filteredTitle")}
                      message={t("restaurantFloor.empty.filteredMessage")}
                    />
                  )}
                {!floorStateQuery.isLoading && !floorStateQuery.isError && filteredTables.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                    {filteredTables.map((table) => (
                      <RestaurantTableTile
                        key={table.restaurantTableId}
                        table={table}
                        canManage={canManage}
                        selected={selectedTableId === table.restaurantTableId}
                        onSelect={() => setSelectedTableId(table.restaurantTableId)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {selectedTable && (
                <RestaurantTableDetailsDrawer
                  table={selectedTable}
                  companyId={currentCompanyId}
                  branchId={currentBranchId}
                  canManage={canManage}
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
