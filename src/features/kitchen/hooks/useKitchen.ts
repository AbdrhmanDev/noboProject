import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeKitchenStationStatus,
  createKitchenStation,
  getKitchenStationDetails,
  getKitchenStations,
  getOpenKitchenTickets,
  getOperationalKitchenStations,
  getProductVariantKitchenRoutes,
  markKitchenTicketReady,
  setProductVariantKitchenRoute,
  startKitchenTicketPreparation,
  updateKitchenStation,
} from "../api/kitchenApi";
import type {
  ChangeKitchenStationStatusRequest,
  CreateKitchenStationRequest,
  KitchenStationFilters,
  SetProductVariantKitchenRouteRequest,
  UpdateKitchenStationRequest,
} from "../types/kitchen.types";

export const kitchenQueryKeys = {
  all: ["kitchen"] as const,
  stations: (companyId: string, branchId: string) =>
    ["kitchen", companyId, branchId, "stations"] as const,
  adminStations: (
    companyId: string,
    branchId: string,
    filters: KitchenStationFilters = {},
  ) => ["kitchen", companyId, branchId, "admin", "stations", filters] as const,
  adminStation: (companyId: string, branchId: string, kitchenStationId: string) =>
    ["kitchen", companyId, branchId, "admin", "stations", kitchenStationId] as const,
  variantRoutes: (companyId: string, branchId: string, productVariantId: string) =>
    ["kitchen", companyId, branchId, "routes", "variants", productVariantId] as const,
  openTickets: (companyId: string, branchId: string, kitchenStationId: string) =>
    ["kitchen", companyId, branchId, "stations", kitchenStationId, "tickets", "open"] as const,
};

export function useOperationalKitchenStations(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: kitchenQueryKeys.stations(companyId || "", branchId || ""),
    queryFn: () =>
      getOperationalKitchenStations(companyId as string, branchId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function useKitchenStations(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: KitchenStationFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: kitchenQueryKeys.adminStations(
      companyId || "",
      branchId || "",
      filters,
    ),
    queryFn: () =>
      getKitchenStations(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function useKitchenStationDetails(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  kitchenStationId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: kitchenQueryKeys.adminStation(
      companyId || "",
      branchId || "",
      kitchenStationId || "",
    ),
    queryFn: () =>
      getKitchenStationDetails(
        companyId as string,
        branchId as string,
        kitchenStationId as string,
      ),
    enabled:
      Boolean(companyId) &&
      Boolean(branchId) &&
      Boolean(kitchenStationId) &&
      enabled,
  });
}

export function useProductVariantKitchenRoutes(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productVariantId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: kitchenQueryKeys.variantRoutes(
      companyId || "",
      branchId || "",
      productVariantId || "",
    ),
    queryFn: () =>
      getProductVariantKitchenRoutes(
        companyId as string,
        branchId as string,
        productVariantId as string,
      ),
    enabled:
      Boolean(companyId) &&
      Boolean(branchId) &&
      Boolean(productVariantId) &&
      enabled,
  });
}

function invalidateKitchenAdmin(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  kitchenStationId?: string | null,
) {
  if (!companyId || !branchId) return;

  queryClient.invalidateQueries({
    queryKey: ["kitchen", companyId, branchId, "admin", "stations"],
  });
  queryClient.invalidateQueries({
    queryKey: kitchenQueryKeys.stations(companyId, branchId),
  });

  if (kitchenStationId) {
    queryClient.invalidateQueries({
      queryKey: kitchenQueryKeys.adminStation(companyId, branchId, kitchenStationId),
    });
  }
}

export function useCreateKitchenStation(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateKitchenStationRequest) =>
      createKitchenStation(companyId as string, branchId as string, payload),
    onSuccess: () => invalidateKitchenAdmin(queryClient, companyId, branchId),
  });
}

export function useUpdateKitchenStation(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  kitchenStationId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateKitchenStationRequest) =>
      updateKitchenStation(
        companyId as string,
        branchId as string,
        kitchenStationId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateKitchenAdmin(queryClient, companyId, branchId, kitchenStationId),
  });
}

export function useChangeKitchenStationStatus(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  kitchenStationId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeKitchenStationStatusRequest) =>
      changeKitchenStationStatus(
        companyId as string,
        branchId as string,
        kitchenStationId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateKitchenAdmin(queryClient, companyId, branchId, kitchenStationId),
  });
}

export function useSetProductVariantKitchenRoute(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productVariantId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      kitchenStationId,
      payload,
    }: {
      kitchenStationId: string;
      payload: SetProductVariantKitchenRouteRequest;
    }) =>
      setProductVariantKitchenRoute(
        companyId as string,
        branchId as string,
        productVariantId as string,
        kitchenStationId,
        payload,
      ),
    onSuccess: (_data, variables) => {
      if (!companyId || !branchId || !productVariantId) return;

      queryClient.invalidateQueries({
        queryKey: kitchenQueryKeys.variantRoutes(companyId, branchId, productVariantId),
      });
      queryClient.invalidateQueries({
        queryKey: ["kitchen", companyId, branchId, "admin", "stations"],
      });
      queryClient.invalidateQueries({
        queryKey: kitchenQueryKeys.adminStation(
          companyId,
          branchId,
          variables.kitchenStationId,
        ),
      });
    },
  });
}

export function useOpenKitchenTickets(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  kitchenStationId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: kitchenQueryKeys.openTickets(
      companyId || "",
      branchId || "",
      kitchenStationId || "",
    ),
    queryFn: () =>
      getOpenKitchenTickets(
        companyId as string,
        branchId as string,
        kitchenStationId as string,
      ),
    enabled:
      Boolean(companyId) &&
      Boolean(branchId) &&
      Boolean(kitchenStationId) &&
      enabled,
    refetchInterval: enabled ? 15000 : false,
  });
}

export function useStartKitchenTicketPreparation(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  kitchenStationId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kitchenTicketId: string) =>
      startKitchenTicketPreparation(
        companyId as string,
        branchId as string,
        kitchenStationId as string,
        kitchenTicketId,
      ),
    onSuccess: () => {
      if (!companyId || !branchId || !kitchenStationId) return;

      queryClient.invalidateQueries({
        queryKey: kitchenQueryKeys.openTickets(
          companyId,
          branchId,
          kitchenStationId,
        ),
      });
    },
  });
}

export function useMarkKitchenTicketReady(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  kitchenStationId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kitchenTicketId: string) =>
      markKitchenTicketReady(
        companyId as string,
        branchId as string,
        kitchenStationId as string,
        kitchenTicketId,
      ),
    onSuccess: () => {
      if (!companyId || !branchId || !kitchenStationId) return;

      queryClient.invalidateQueries({
        queryKey: kitchenQueryKeys.openTickets(
          companyId,
          branchId,
          kitchenStationId,
        ),
      });
    },
  });
}
