import { useMemo } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPrintJobs } from "../../devices/api/printJobsApi";
import { printJobQueryKeys } from "../../devices/hooks/usePrintJobs";
import type { PrintJobResponse } from "../../devices/types/devices.types";
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

// P9.2: read-only. This NEVER creates a PrintJob -- the backend already creates one per kitchen
// ticket on order confirmation (unchanged, verified server-side); this only reads back its status
// via the EXISTING GET /api/companies/{companyId}/branches/{branchId}/print-jobs?documentType=
// KitchenTicket endpoint (Nobo.Api.Devices.PrintJobEndpoints -- the same one the Devices admin page
// already uses, filtered here). DocumentId on a KitchenTicket PrintJob IS the KitchenTicketId
// (verified in PrintJob.CreateKitchenTicket), so results key naturally onto open kitchen tickets.
// That endpoint requires Devices.View -- the caller gates `enabled` on it, never calls it blind.
// Polls on the same 15s cadence as the kitchen board itself (useAllOpenKitchenTickets) instead of
// the faster single-job cadence usePrintJobDetails uses elsewhere (this is a board of MANY jobs, not
// one job being watched closely), and stops entirely when disabled.
export function useKitchenTicketPrintJobs(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...printJobQueryKeys.all, companyId || "", branchId || "", "kitchen-tickets"] as const,
    queryFn: () =>
      getPrintJobs(companyId as string, branchId as string, { documentType: "KitchenTicket", take: 200 }),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
    refetchInterval: enabled ? 15000 : false,
  });
}

// documentId (== kitchenTicketId for a KitchenTicket job) -> its print job. When the same ticket
// somehow has more than one row (should not happen -- CreateKitchenTicket's own idempotency key is
// derived from the ticket id alone, per its comment), the most recently created one wins.
export function usePrintJobsByDocumentId(printJobs: PrintJobResponse[] | undefined) {
  return useMemo(() => {
    const map = new Map<string, PrintJobResponse>();
    for (const job of printJobs ?? []) {
      if (!job.documentId) continue;
      const existing = map.get(job.documentId);
      if (!existing || new Date(job.createdAtUtc).getTime() > new Date(existing.createdAtUtc).getTime()) {
        map.set(job.documentId, job);
      }
    }
    return map;
  }, [printJobs]);
}

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
