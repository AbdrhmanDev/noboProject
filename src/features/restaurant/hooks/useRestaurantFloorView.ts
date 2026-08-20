import { useMemo } from "react";
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
// view needs) rather than fetching full order details per table.
const ACTIVE_ORDERS_PAGE_SIZE = 200;

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

  const isLoading =
    floorsQuery.isLoading ||
    seatingQuery.isLoading ||
    floorDetailsQueries.some((query) => query.isLoading) ||
    (canViewOrders && ordersQuery.isLoading);

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

  const tables = useMemo<FloorViewTable[]>(() => {
    if (floorsQuery.isLoading || floorDetailsQueries.some((query) => query.isLoading)) return [];

    const seatingByTableId = new Map<string, { isOccupied: boolean; openSalesOrderCount: number }>();
    (seatingQuery.data || []).forEach((floor) => {
      floor.tables.forEach((table) => {
        seatingByTableId.set(table.restaurantTableId, {
          isOccupied: table.isOccupied,
          openSalesOrderCount: table.openSalesOrderCount,
        });
      });
    });

    // useRetrievableSalesOrders is an infinite query (built for the POS
    // Retrieve modal's "Load more" UX); this view never calls
    // fetchNextPage, so .pages will only ever hold the first (large) page —
    // flattened defensively rather than assumed.
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
    // once per page render, not per keystroke) and it's the only way to
    // avoid the alternative: a real stale-data bug where a floor's query
    // resolves but this memo doesn't notice.
  }, [floors, seatingQuery.data, ordersQuery.data, floorsQuery.isLoading, floorDetailsQueries]);

  return { tables, floors, isLoading, isError, refetch };
}
