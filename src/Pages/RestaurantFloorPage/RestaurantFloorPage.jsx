import { useLayoutEffect, useRef, useState } from "react";
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
// Sizes the floor grid to exactly the space left on screen: from the grid's top edge to the bottom of
// the window, minus whatever the page still has BELOW the grid (scroller padding, the section's own
// padding, AppLayout's padding and footer). With that height the document is never taller than the
// window, so there is no vertical page scroll -- extra tables go sideways instead. Recomputed when the
// window resizes and whenever anything on the page changes size (filters wrapping, the details
// drawer opening, the header). Returns [ref for the grid, height in px | null].
function useFitToViewportHeight(enabled) {
  const ref = useRef(null);
  const [height, setHeight] = useState(null);

  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const below = document.documentElement.scrollHeight - (rect.bottom + window.scrollY);
      const next = Math.floor(window.innerHeight - top - Math.max(0, below));
      setHeight((current) => (current === next ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [enabled]);

  return [ref, height];
}

export default function RestaurantFloorPage() {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const { currentBranchId } = useBranch();

  const [floorFilter, setFloorFilter] = useState("");
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [floorGridRef, floorGridHeight] = useFitToViewportHeight(true);
  // Table size that fills the measured height with a whole number of rows (no dead band at the
  // bottom): the most rows a full-size table allows -- rounding up when it's only a few px short --
  // then each table shrinks a little to fit, kept between 64px and the full 112px. A tile is the table
  // plus 3rem of chairs and padding; rows are 16px apart.
  const FLOOR_GAP = 16;
  const FLOOR_TILE_EXTRA = 48;
  const floorRows = floorGridHeight
    ? Math.max(1, Math.round((floorGridHeight + FLOOR_GAP) / (112 + FLOOR_TILE_EXTRA + FLOOR_GAP)))
    : null;
  const floorTableHeight = floorRows
    ? Math.min(112, Math.max(64, Math.floor((floorGridHeight - (floorRows - 1) * FLOOR_GAP) / floorRows - FLOOR_TILE_EXTRA)))
    : null;

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
                  // Floor-plan grid, scrolling SIDEWAYS: the area has a fixed height that fits the screen, the
                  // tables fill each column top to bottom (grid-flow-col) as many rows as that height allows,
                  // and any extra tables add columns to the right/left -- so the page never grows downward.
                  // Every table is the same fixed size (--floor-table-h / --floor-table-fs, read by
                  // RestaurantTableTile); --floor-tile-h is that plus the chair rows and padding around it.
                  <div className="overflow-x-auto overflow-y-hidden pb-2">
                    <div
                      ref={floorGridRef}
                      className="grid min-h-[var(--floor-tile-h)] grid-flow-col auto-cols-[var(--floor-table-min-w)] grid-rows-[repeat(auto-fill,var(--floor-tile-h))] content-start gap-4"
                      style={{
                        // Measured height (see useFitToViewportHeight); before the first measure, a
                        // CSS estimate so the grid never renders unbounded.
                        height: floorGridHeight ?? "calc(100dvh - 15rem)",
                        "--floor-table-min-w": "clamp(130px, 40vw, 180px)",
                        "--floor-table-h": floorTableHeight ? `${floorTableHeight}px` : "clamp(84px, 24vw, 112px)",
                        "--floor-tile-h": "calc(var(--floor-table-h) + 3rem)",
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
