import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOpenKitchenTickets,
  getOperationalKitchenStations,
  markKitchenTicketReady,
  startKitchenTicketPreparation,
} from "../api/kitchenApi";

export const kitchenQueryKeys = {
  all: ["kitchen"] as const,
  stations: (companyId: string, branchId: string) =>
    ["kitchen", companyId, branchId, "stations"] as const,
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
