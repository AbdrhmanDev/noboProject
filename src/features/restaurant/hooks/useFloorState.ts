import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRestaurantFloorState,
  openRestaurantTableSession,
  releaseRestaurantTableSession,
  updateRestaurantTableSession,
} from "../api/restaurantFloorOpsApi";
import type {
  OpenRestaurantTableSessionRequest,
  RestaurantFloorStateFilters,
  RestaurantFloorStateFloor,
  RestaurantFloorStateTable,
  UpdateRestaurantTableSessionRequest,
} from "../types/restaurantFloorOps.types";

const REFRESH_INTERVAL_MS = 15000;
const EMPTY_FLOORS: RestaurantFloorStateFloor[] = [];
const EMPTY_TABLES: RestaurantFloorStateTable[] = [];

export const floorStateQueryKeys = {
  all: ["restaurant", "floor-state"] as const,
  state: (companyId: string, branchId: string, filters: RestaurantFloorStateFilters = {}) =>
    ["restaurant", "floor-state", companyId, branchId, filters] as const,
};

// Refresh lives entirely in the query's own refetchInterval — no component
// setInterval, no derived-array useEffect/setState mirroring the query
// result. That combination (unstable query data -> effect -> setState ->
// re-render) is exactly what caused the earlier Restaurant Floor routing
// freeze; this hook renders floor-state's own query data directly, so there
// is nothing here that can loop.
//
// The real response root is `{ floors: [{ ..., tables: [...] }] }` — there
// is no root-level `tables` array, so it's flattened here into a single
// `tables` list with floor context merged onto each entry
// (restaurantFloorId/floorName/floorSortOrder). This useMemo is keyed on
// `query.data`, which TanStack Query keeps referentially stable across
// renders that don't produce new data, so it recomputes only when a real
// fetch/refetch lands — never every render, and never via an
// effect+setState pair that could reintroduce the earlier loop.
export function useFloorState(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: RestaurantFloorStateFilters = {},
  enabled = true,
) {
  const query = useQuery({
    queryKey: floorStateQueryKeys.state(companyId || "", branchId || "", filters),
    queryFn: () => getRestaurantFloorState(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
    refetchInterval: enabled ? REFRESH_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
  });

  const floors = useMemo(() => {
    if (!query.data) return EMPTY_FLOORS;
    return query.data.floors.map(({ restaurantFloorId, name, sortOrder }) => ({
      restaurantFloorId,
      name,
      sortOrder,
    }));
  }, [query.data]);

  const tables = useMemo(() => {
    if (!query.data) return EMPTY_TABLES;
    return query.data.floors.flatMap((floor) =>
      floor.tables.map((table) => ({
        ...table,
        restaurantFloorId: floor.restaurantFloorId,
        floorName: floor.name,
        floorSortOrder: floor.sortOrder,
      })),
    );
  }, [query.data]);

  return { ...query, floors, tables };
}

function invalidateFloorState(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  if (!companyId || !branchId) return;
  queryClient.invalidateQueries({ queryKey: ["restaurant", "floor-state", companyId, branchId] });
}

export function useOpenTableSession(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableId, payload }: { tableId: string; payload: OpenRestaurantTableSessionRequest }) =>
      openRestaurantTableSession(companyId as string, branchId as string, tableId, payload),
    onSuccess: () => invalidateFloorState(queryClient, companyId, branchId),
  });
}

export function useUpdateTableSession(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string;
      payload: UpdateRestaurantTableSessionRequest;
    }) => updateRestaurantTableSession(companyId as string, branchId as string, sessionId, payload),
    onSuccess: () => invalidateFloorState(queryClient, companyId, branchId),
  });
}

export function useReleaseTableSession(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      releaseRestaurantTableSession(companyId as string, branchId as string, sessionId),
    onSuccess: () => invalidateFloorState(queryClient, companyId, branchId),
  });
}
