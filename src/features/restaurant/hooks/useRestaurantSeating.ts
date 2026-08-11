import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeRestaurantFloorStatus,
  changeRestaurantTableStatus,
  createRestaurantFloor,
  createRestaurantTable,
  getRestaurantFloorDetails,
  getRestaurantFloors,
  getRestaurantSeating,
  getRestaurantTableDetails,
  getRestaurantTables,
  updateRestaurantFloor,
  updateRestaurantTable,
} from "../api/restaurantSeatingApi";
import type {
  ChangeRestaurantFloorStatusRequest,
  ChangeRestaurantTableStatusRequest,
  CreateRestaurantFloorRequest,
  CreateRestaurantTableRequest,
  RestaurantStatusFilter,
  UpdateRestaurantFloorRequest,
  UpdateRestaurantTableRequest,
} from "../types/restaurantSeating.types";

export const restaurantSeatingQueryKeys = {
  all: ["restaurant-seating"] as const,
  list: (companyId: string, branchId: string) =>
    ["restaurant-seating", companyId, branchId] as const,
  adminFloors: (
    companyId: string,
    branchId: string,
    filters: RestaurantStatusFilter = {},
  ) => ["restaurant", companyId, branchId, "floors", filters] as const,
  adminFloor: (companyId: string, branchId: string, restaurantFloorId: string) =>
    ["restaurant", companyId, branchId, "floors", restaurantFloorId] as const,
  adminTables: (
    companyId: string,
    branchId: string,
    restaurantFloorId: string,
    filters: RestaurantStatusFilter = {},
  ) =>
    ["restaurant", companyId, branchId, "floors", restaurantFloorId, "tables", filters] as const,
  adminTable: (
    companyId: string,
    branchId: string,
    restaurantFloorId: string,
    restaurantTableId: string,
  ) =>
    ["restaurant", companyId, branchId, "floors", restaurantFloorId, "tables", restaurantTableId] as const,
};

export function useRestaurantSeating(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: restaurantSeatingQueryKeys.list(companyId || "", branchId || ""),
    queryFn: () => getRestaurantSeating(companyId as string, branchId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function useInvalidateRestaurantSeating() {
  const queryClient = useQueryClient();

  return (companyId: string | null | undefined, branchId: string | null | undefined) => {
    if (!companyId || !branchId) return;

    queryClient.invalidateQueries({
      queryKey: restaurantSeatingQueryKeys.list(companyId, branchId),
    });
  };
}

function invalidateRestaurantAdmin(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  restaurantFloorId?: string | null,
  restaurantTableId?: string | null,
) {
  if (!companyId || !branchId) return;

  queryClient.invalidateQueries({
    queryKey: ["restaurant", companyId, branchId, "floors"],
  });
  queryClient.invalidateQueries({
    queryKey: restaurantSeatingQueryKeys.list(companyId, branchId),
  });

  if (restaurantFloorId) {
    queryClient.invalidateQueries({
      queryKey: restaurantSeatingQueryKeys.adminFloor(
        companyId,
        branchId,
        restaurantFloorId,
      ),
    });
    queryClient.invalidateQueries({
      queryKey: [
        "restaurant",
        companyId,
        branchId,
        "floors",
        restaurantFloorId,
        "tables",
      ],
    });
  }

  if (restaurantFloorId && restaurantTableId) {
    queryClient.invalidateQueries({
      queryKey: restaurantSeatingQueryKeys.adminTable(
        companyId,
        branchId,
        restaurantFloorId,
        restaurantTableId,
      ),
    });
  }
}

export function useRestaurantFloors(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: RestaurantStatusFilter = {},
  enabled = true,
) {
  return useQuery({
    queryKey: restaurantSeatingQueryKeys.adminFloors(
      companyId || "",
      branchId || "",
      filters,
    ),
    queryFn: () => getRestaurantFloors(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function useRestaurantFloorDetails(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  restaurantFloorId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: restaurantSeatingQueryKeys.adminFloor(
      companyId || "",
      branchId || "",
      restaurantFloorId || "",
    ),
    queryFn: () =>
      getRestaurantFloorDetails(
        companyId as string,
        branchId as string,
        restaurantFloorId as string,
      ),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(restaurantFloorId) && enabled,
  });
}

export function useRestaurantTables(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  restaurantFloorId: string | null | undefined,
  filters: RestaurantStatusFilter = {},
  enabled = true,
) {
  return useQuery({
    queryKey: restaurantSeatingQueryKeys.adminTables(
      companyId || "",
      branchId || "",
      restaurantFloorId || "",
      filters,
    ),
    queryFn: () =>
      getRestaurantTables(
        companyId as string,
        branchId as string,
        restaurantFloorId as string,
        filters,
      ),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(restaurantFloorId) && enabled,
  });
}

export function useRestaurantTableDetails(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  restaurantFloorId: string | null | undefined,
  restaurantTableId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: restaurantSeatingQueryKeys.adminTable(
      companyId || "",
      branchId || "",
      restaurantFloorId || "",
      restaurantTableId || "",
    ),
    queryFn: () =>
      getRestaurantTableDetails(
        companyId as string,
        branchId as string,
        restaurantFloorId as string,
        restaurantTableId as string,
      ),
    enabled:
      Boolean(companyId) &&
      Boolean(branchId) &&
      Boolean(restaurantFloorId) &&
      Boolean(restaurantTableId) &&
      enabled,
  });
}

export function useCreateRestaurantFloor(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRestaurantFloorRequest) =>
      createRestaurantFloor(companyId as string, branchId as string, payload),
    onSuccess: () => invalidateRestaurantAdmin(queryClient, companyId, branchId),
  });
}

export function useUpdateRestaurantFloor(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  restaurantFloorId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateRestaurantFloorRequest) =>
      updateRestaurantFloor(
        companyId as string,
        branchId as string,
        restaurantFloorId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateRestaurantAdmin(queryClient, companyId, branchId, restaurantFloorId),
  });
}

export function useChangeRestaurantFloorStatus(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  restaurantFloorId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeRestaurantFloorStatusRequest) =>
      changeRestaurantFloorStatus(
        companyId as string,
        branchId as string,
        restaurantFloorId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateRestaurantAdmin(queryClient, companyId, branchId, restaurantFloorId),
  });
}

export function useCreateRestaurantTable(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  restaurantFloorId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRestaurantTableRequest) =>
      createRestaurantTable(
        companyId as string,
        branchId as string,
        restaurantFloorId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateRestaurantAdmin(queryClient, companyId, branchId, restaurantFloorId),
  });
}

export function useUpdateRestaurantTable(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  restaurantFloorId: string | null | undefined,
  restaurantTableId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateRestaurantTableRequest) =>
      updateRestaurantTable(
        companyId as string,
        branchId as string,
        restaurantFloorId as string,
        restaurantTableId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateRestaurantAdmin(
        queryClient,
        companyId,
        branchId,
        restaurantFloorId,
        restaurantTableId,
      ),
  });
}

export function useChangeRestaurantTableStatus(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  restaurantFloorId: string | null | undefined,
  restaurantTableId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeRestaurantTableStatusRequest) =>
      changeRestaurantTableStatus(
        companyId as string,
        branchId as string,
        restaurantFloorId as string,
        restaurantTableId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateRestaurantAdmin(
        queryClient,
        companyId,
        branchId,
        restaurantFloorId,
        restaurantTableId,
      ),
  });
}
