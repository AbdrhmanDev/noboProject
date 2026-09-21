import { useMemo } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeKitchenStationStatus,
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
  KitchenStationFilters,
  OpenKitchenTicket,
  OperationalKitchenStation,
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

export type KitchenBoardTicket = OpenKitchenTicket & {
  kitchenStationId: string;
  kitchenStationName: string;
};

// The kitchen board shows every active station on one screen. Tickets are still fetched (and
// started / marked ready) per station because that is how the API is scoped, so each ticket keeps
// the station it belongs to. Queries share their keys with useOpenKitchenTickets.
export function useAllOpenKitchenTickets(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  stations: OperationalKitchenStation[],
  enabled = true,
) {
  const active = enabled && Boolean(companyId) && Boolean(branchId);
  const results = useQueries({
    queries: stations.map((station) => ({
      queryKey: kitchenQueryKeys.openTickets(companyId || "", branchId || "", station.kitchenStationId),
      queryFn: () =>
        getOpenKitchenTickets(companyId as string, branchId as string, station.kitchenStationId),
      enabled: active,
      refetchInterval: active ? 15000 : (false as const),
    })),
  });

  const dataKey = results.map((result) => result.dataUpdatedAt).join(",");
  const tickets = useMemo<KitchenBoardTicket[]>(() => {
    const merged: KitchenBoardTicket[] = [];
    results.forEach((result, index) => {
      const station = stations[index];
      for (const ticket of result.data ?? []) {
        merged.push({
          ...ticket,
          kitchenStationId: station.kitchenStationId,
          kitchenStationName: station.name,
        });
      }
    });
    // Oldest first: the kitchen works the queue in the order orders arrived.
    return merged.sort(
      (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, stations]);

  return {
    tickets,
    isLoading: results.length > 0 && results.every((result) => result.isLoading),
    isFetching: results.some((result) => result.isFetching),
    failedCount: results.filter((result) => result.isError).length,
    stationCount: results.length,
    refetch: () => Promise.all(results.map((result) => result.refetch())),
  };
}

export function useKitchenTicketActions(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();
  const refresh = (kitchenStationId: string) => {
    if (!companyId || !branchId) return;
    queryClient.invalidateQueries({
      queryKey: kitchenQueryKeys.openTickets(companyId, branchId, kitchenStationId),
    });
  };

  const start = useMutation({
    mutationFn: ({ kitchenStationId, kitchenTicketId }: { kitchenStationId: string; kitchenTicketId: string }) =>
      startKitchenTicketPreparation(companyId as string, branchId as string, kitchenStationId, kitchenTicketId),
    onSuccess: (_data, variables) => refresh(variables.kitchenStationId),
  });
  const ready = useMutation({
    mutationFn: ({ kitchenStationId, kitchenTicketId }: { kitchenStationId: string; kitchenTicketId: string }) =>
      markKitchenTicketReady(companyId as string, branchId as string, kitchenStationId, kitchenTicketId),
    onSuccess: (_data, variables) => refresh(variables.kitchenStationId),
  });

  return { start, ready };
}
