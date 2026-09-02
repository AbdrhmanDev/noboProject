import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { confirmDiscoveredDevice, getDiscoveredDevices } from "../api/discoveryApi";
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

      queryClient.invalidateQueries({
        queryKey: ["devices", "discovery", companyId, branchId, edgeAgentId],
      });
      queryClient.invalidateQueries({ queryKey: ["devices", "devices", companyId, branchId] });
      queryClient.invalidateQueries({
        queryKey: deviceQueryKeys.hardwareBinding(companyId, branchId, result.deviceId),
      });
    },
  });
}
