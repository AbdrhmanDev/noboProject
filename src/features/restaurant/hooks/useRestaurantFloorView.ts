import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { getRestaurantFloorDetails } from "../api/restaurantSeatingApi";
import {
  restaurantSeatingQueryKeys,
  useRestaurantFloors,
  useRestaurantSeating,
} from "./useRestaurantSeating";
import { useRetrievableSalesOrders } from "../../sales-orders/hooks/useDraftSalesOrder";
import type { RetrievableSalesOrder } from "../../sales-orders/types/draftSalesOrder.types";
import type { FloorViewTable } from "../utils/restaurantFloorState";

// A branch realistically has a handful of floors (few requests), never a
// large number of tables per request — this keeps the N+1 surface bounded
// to O(floors), not O(tables). It reuses the exact same query keys/functions
// RestaurantAdminPage already uses for its own floor-details panel, so the
// two share cache instead of duplicating fetches.
//
// Active Dine-In orders come from the existing lightweight
// /sales-orders/retrievable endpoint (Draft/Confirmed only — Closed/
// Cancelled orders never occupy a table, which is exactly the semantic this
// view needs) rather than fetching full order details per table. 100 is the
// backend's hard maximum (SalesOrderRetrieval.PageSizeInvalid rejects
// anything above it) — a branch can genuinely have more than 100 active
// Dine-In orders, so this view drives the existing infinite query to drain
// every page rather than requesting one oversized page.
const ACTIVE_ORDERS_PAGE_SIZE = 100;

export function useRestaurantFloorView(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  { enabled = true, canViewOrders = true } = {},
) {
  const floorsQuery = useRestaurantFloors(companyId, branchId, {}, enabled);
  const floors = floorsQuery.data || [];

  const floorDetailsQueries = useQueries({
    queries: floors.map((floor) => ({
      queryKey: restaurantSeatingQueryKeys.adminFloor(
        companyId || "",
        branchId || "",
        floor.restaurantFloorId,
      ),
      queryFn: () =>
        getRestaurantFloorDetails(
          companyId as string,
          branchId as string,
          floor.restaurantFloorId,
        ),
      enabled: enabled && Boolean(companyId) && Boolean(branchId),
    })),
  });

  const seatingQuery = useRestaurantSeating(companyId, branchId, enabled);

  const ordersQuery = useRetrievableSalesOrders(
    companyId,
    branchId,
    { fulfillmentType: "DineIn", pageSize: ACTIVE_ORDERS_PAGE_SIZE },
    enabled && canViewOrders,
  );

  // Drains every retrievable-Dine-In page automatically: each time a page
  // resolves, hasNextPage is recomputed from that page's own
  // pageNumber/totalPages, so this effect keeps firing — and keeps calling
  // fetchNextPage — until the backend reports there's nothing left. Also
  // re-drives itself after every 15s refresh, since refetch() on an
  // infinite query re-fetches every page already loaded (not just the
  // first), which can transiently report hasNextPage again if the active
  // order count grew since the last drain.
  useEffect(() => {
    if (!canViewOrders) return;
    if (ordersQuery.hasNextPage && !ordersQuery.isFetchingNextPage) {
      ordersQuery.fetchNextPage();
    }
  }, [
    canViewOrders,
    ordersQuery.hasNextPage,
    ordersQuery.isFetchingNextPage,
    ordersQuery.fetchNextPage,
  ]);

  // True once every page has actually been drained — not just the first.
  const ordersFullyLoaded =
    !canViewOrders ||
    (!ordersQuery.isLoading && !ordersQuery.hasNextPage && !ordersQuery.isFetchingNextPage);
  const structureReady = !floorsQuery.isLoading && !floorDetailsQueries.some((query) => query.isLoading);

  const isError =
    floorsQuery.isError ||
    seatingQuery.isError ||
    floorDetailsQueries.some((query) => query.isError) ||
    (canViewOrders && ordersQuery.isError);

  const refetch = () => {
    floorsQuery.refetch();
    seatingQuery.refetch();
    floorDetailsQueries.forEach((query) => query.refetch());
    if (canViewOrders) ordersQuery.refetch();
  };

  // Recomputes freely from whatever data currently exists — including a
  // mid-drain, partially-paginated order set — but is only ever committed
  // to the published `tables` (below) once the full picture is actually
  // ready. This is what stops a table from flashing to Available on every
  // 15s refresh just because a later page hasn't landed yet.
  const rawTables = useMemo<FloorViewTable[]>(() => {
    if (!structureReady) return [];

    const seatingByTableId = new Map<
      string,
      { isOccupied: boolean; openSalesOrderCount: number }
    >();
    (seatingQuery.data || []).forEach((floor) => {
      floor.tables.forEach((table) => {
        seatingByTableId.set(table.restaurantTableId, {
          isOccupied: table.isOccupied,
          openSalesOrderCount: table.openSalesOrderCount,
        });
      });
    });

    // Every page fetched so far, flattened — deliberately not deduplicated
    // beyond what flattening already gives for free: the backend paginates
    // a stable, non-overlapping order set, so distinct pages never repeat
    // an order.
    const ordersByTableId = new Map<string, RetrievableSalesOrder[]>();
    const activeOrders = ordersQuery.data?.pages.flatMap((page) => page.items) || [];
    activeOrders.forEach((order) => {
      if (!order.restaurantTableId) return;
      const existing = ordersByTableId.get(order.restaurantTableId) || [];
      existing.push(order);
      ordersByTableId.set(order.restaurantTableId, existing);
    });
    ordersByTableId.forEach((orders) => {
      orders.sort(
        (a, b) => new Date(b.updatedAtUtc).getTime() - new Date(a.updatedAtUtc).getTime(),
      );
    });

    const result: FloorViewTable[] = [];
    floorDetailsQueries.forEach((query, index) => {
      const floor = floors[index];
      if (!query.data || !floor) return;

      query.data.tables.forEach((table) => {
        const seating = seatingByTableId.get(table.restaurantTableId) || null;
        result.push({
          restaurantTableId: table.restaurantTableId,
          restaurantFloorId: floor.restaurantFloorId,
          floorName: floor.name,
          code: table.code,
          name: table.name,
          sortOrder: table.sortOrder,
          adminStatus: table.status,
          isOccupied: seating ? seating.isOccupied : null,
          openSalesOrderCount: seating ? seating.openSalesOrderCount : null,
          orders: ordersByTableId.get(table.restaurantTableId) || [],
        });
      });
    });

    result.sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
    return result;
    // floorDetailsQueries is listed as a dependency (not just the values
    // read from it) since useQueries returns a fresh array every render —
    // this means the memo effectively recomputes each render rather than
    // only when a query settles, but that's a non-issue here (this runs
    // once per page render, not per keystroke, and its output is only
    // committed below once genuinely complete).
  }, [structureReady, floors, seatingQuery.data, ordersQuery.data, floorDetailsQueries]);

  // Published table set: only ever replaced once structure AND every order
  // page are both ready, so a background refresh can never briefly publish
  // a table as Available just because it's mid-drain.
  const [tables, setTables] = useState<FloorViewTable[] | null>(null);

  useEffect(() => {
    if (structureReady && ordersFullyLoaded) {
      setTables(rawTables);
    }
  }, [structureReady, ordersFullyLoaded, rawTables]);

  // isLoading only reflects genuine "nothing to show yet" — before the
  // first successful commit above. A 15s background refresh that re-drains
  // multiple pages does not flip this back to true; the previously
  // committed `tables` keeps rendering until the new commit lands.
  const isLoading =
    floorsQuery.isLoading ||
    seatingQuery.isLoading ||
    floorDetailsQueries.some((query) => query.isLoading) ||
    tables === null;

  return { tables: tables ?? [], floors, isLoading, isError, refetch };
}
