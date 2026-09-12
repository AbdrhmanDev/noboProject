import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmDiscoveredDevice,
  getDiscoveredDevices,
  getLatestDiscoveredDevices,
  requestDiscoveryRefresh,
} from "../api/discoveryApi";
import { deviceQueryKeys } from "./useDevices";
import type { ConfirmDiscoveredDeviceRequest, DiscoveredDevicesFilters } from "../types/devices.types";

export const discoveryQueryKeys = {
  all: ["devices", "discovery"] as const,
  list: (
    companyId: string,
    branchId: string,
    edgeAgentId: string,
    filters: DiscoveredDevicesFilters = {},
  ) => ["devices", "discovery", companyId, branchId, edgeAgentId, filters] as const,
  latest: (companyId: string, branchId: string, edgeAgentId: string) =>
    ["devices", "discovery", "latest", companyId, branchId, edgeAgentId] as const,
};

export function useDiscoveredDevices(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  edgeAgentId: string | null | undefined,
  filters: DiscoveredDevicesFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: discoveryQueryKeys.list(companyId || "", branchId || "", edgeAgentId || "", filters),
    queryFn: () =>
      getDiscoveredDevices(companyId as string, branchId as string, edgeAgentId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(edgeAgentId) && enabled,
  });
}

// The normal Discovery screen's "current hardware state" -- the single latest discovery report,
// not the historical list useDiscoveredDevices above returns (that hook/endpoint is preserved
// unchanged for future diagnostics/history use).
export function useLatestDiscoveredDevices(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  edgeAgentId: string | null | undefined,
  enabled = true,
  // Set only while actively waiting on a just-requested refresh (Part A) -- a short-lived poll,
  // never a standing background scan; the page turns it off again once the refresh resolves or
  // times out. Accepting a function (not just a number/false) lets the caller stop polling the
  // instant a fresher report arrives, evaluated by TanStack Query itself against its own latest
  // fetched data -- deliberately not something this hook or its caller decides via a React effect
  // reacting to that same data (that pattern is a lint-flagged setState-in-effect render cascade).
  refetchInterval?: number | false | ((query: { state: { data: unknown } }) => number | false),
) {
  return useQuery({
    queryKey: discoveryQueryKeys.latest(companyId || "", branchId || "", edgeAgentId || ""),
    queryFn: () =>
      getLatestDiscoveredDevices(companyId as string, branchId as string, edgeAgentId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(edgeAgentId) && enabled,
    refetchInterval: refetchInterval ?? false,
  });
}

// Part A: records the refresh request backend-side; the actual discovery run happens
// asynchronously on the Edge Agent's own next heartbeat (see
// EdgeAgentWorker.TryHandleDiscoveryRefreshRequestAsync) -- this mutation resolving successfully
// only means "the request was recorded", never "discovery has run".
export function useRequestDiscoveryRefresh(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  edgeAgentId: string | null | undefined,
) {
  return useMutation({
    mutationFn: () =>
      requestDiscoveryRefresh(companyId as string, branchId as string, edgeAgentId as string),
  });
}

export function useConfirmDiscoveredDevice(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  edgeAgentId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      discoveryId,
      payload,
    }: {
      discoveryId: string;
      payload: ConfirmDiscoveredDeviceRequest;
    }) =>
      confirmDiscoveredDevice(
        companyId as string,
        branchId as string,
        edgeAgentId as string,
        discoveryId,
        payload,
      ),
    onSuccess: (result) => {
      if (!companyId || !branchId) return;

      // discoveryQueryKeys.all's prefix covers both the historical list and the latest-snapshot
      // query below (["devices","discovery","latest",...]) -- a plain
      // ["devices","discovery",companyId,...] filter would NOT match the "latest" key, since React
      // Query matches by exact positional prefix and "latest" sits where companyId does there.
      queryClient.invalidateQueries({ queryKey: discoveryQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["devices", "devices", companyId, branchId] });
      queryClient.invalidateQueries({
        queryKey: deviceQueryKeys.hardwareBinding(companyId, branchId, result.deviceId),
      });
    },
  });
}
