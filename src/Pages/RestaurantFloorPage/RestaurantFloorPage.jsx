import { useState } from "react";
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
import {
  TABLE_TONES,
  TABLE_TONE_LABEL_KEYS,
  TABLE_TONE_SWATCH_CLASSES,
} from "../../features/restaurant/utils/floorOperationalState";
import { ROUTES } from "../../utils/routes";

const RESTAURANT_VIEW_PERMISSION = "Restaurant.View";
const RESTAURANT_MANAGE_PERMISSION = "Restaurant.Manage";
const SALES_ORDERS_VIEW_PERMISSION = "SalesOrders.View";
export default function RestaurantFloorPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

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

  const filteredTables = tables.filter((table) => {
    if (floorFilter && table.restaurantFloorId !== floorFilter) return false;
    // Suspended tables (Restaurant admin -> Suspend) are taken off the floor plan. There is no
    // delete -- suspending is how a table is removed from service.
    if (table.configuredStatus === "Suspended") return false;
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
            <div className="flex items-center gap-2">
              {floors.length > 1 && (
                <select
                  value={floorFilter}
                  onChange={(event) => setFloorFilter(event.target.value)}
                  className="h-9 rounded-xl border border-white/10 bg-black/20 px-2.5 text-xs text-white outline-none"
                >
                  <option value="">{t("restaurantFloor.filters.allFloors")}</option>
                  {floors.map((floor) => (
                    <option key={floor.restaurantFloorId} value={floor.restaurantFloorId}>
                      {floor.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => floorStateQuery.refetch()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100"
              >
                <RefreshCw size={14} />
                {t("restaurantFloor.refresh")}
              </button>
            </div>
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
                  <div className="mb-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                    {TABLE_TONES.map((tone) => (
                      <span key={tone} className="flex items-center gap-1.5">
                        <span className={`h-3 w-5 rounded border-2 ${TABLE_TONE_SWATCH_CLASSES[tone]}`} />
                        {t(TABLE_TONE_LABEL_KEYS[tone])}
                      </span>
                    ))}
                  </div>
                )}
                {!floorStateQuery.isLoading && !floorStateQuery.isError && filteredTables.length > 0 && (
                  // Floor-plan grid: every table the same fixed size (--floor-table-h / --floor-table-fs, read by
                  // RestaurantTableTile), auto-filling as many columns as fit -- ~20 tables on one
                  // desktop screen. Tune the size from these two values.
                  <div
                    className="grid grid-cols-[repeat(auto-fill,minmax(var(--floor-table-min-w),1fr))] gap-2 sm:gap-4"
                    style={{
                      // Responsive: two tables per row on a phone, growing to the full size on wide screens.
                      "--floor-table-min-w": "clamp(130px, 40vw, 180px)",
                      "--floor-table-h": "clamp(84px, 24vw, 112px)",
                      "--floor-table-fs": "clamp(1.6rem, 6vw, 2.25rem)",
                    }}
                  >
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
