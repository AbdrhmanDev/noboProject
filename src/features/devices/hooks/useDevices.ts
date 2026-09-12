import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDevice,
  getDeviceDetails,
  getDeviceHardwareBinding,
  getDevices,
  printProductVariantLabel,
  rebindDeviceHardware,
  setDeviceLabelPrinterProfile,
  setDeviceReceiptPrinterProfile,
  testPrintDevice,
  unbindDeviceHardware,
  updateDevice,
  updateDeviceStatus,
} from "../api/devicesApi";
import type {
  CreateDeviceRequest,
  DevicesListFilters,
  PrintProductVariantLabelRequest,
  RebindDeviceHardwareRequest,
  SetDeviceLabelPrinterProfileRequest,
  SetDeviceReceiptPrinterProfileRequest,
  UpdateDeviceRequest,
  UpdateDeviceStatusRequest,
} from "../types/devices.types";

export const deviceQueryKeys = {
  all: ["devices", "devices"] as const,
  list: (companyId: string, branchId: string, filters: DevicesListFilters = {}) =>
    ["devices", "devices", companyId, branchId, filters] as const,
  details: (companyId: string, branchId: string, deviceId: string) =>
    ["devices", "devices", companyId, branchId, "detail", deviceId] as const,
  hardwareBinding: (companyId: string, branchId: string, deviceId: string) =>
    ["devices", "devices", companyId, branchId, "hardware-binding", deviceId] as const,
};

function invalidateDevices(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  deviceId?: string | null,
) {
  if (!companyId || !branchId) return;

  queryClient.invalidateQueries({ queryKey: ["devices", "devices", companyId, branchId] });

  if (deviceId) {
    queryClient.invalidateQueries({
      queryKey: deviceQueryKeys.details(companyId, branchId, deviceId),
    });
    queryClient.invalidateQueries({
      queryKey: deviceQueryKeys.hardwareBinding(companyId, branchId, deviceId),
    });
  }
}

export function useDevices(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: DevicesListFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: deviceQueryKeys.list(companyId || "", branchId || "", filters),
    queryFn: () => getDevices(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function useDeviceDetails(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  deviceId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: deviceQueryKeys.details(companyId || "", branchId || "", deviceId || ""),
    queryFn: () => getDeviceDetails(companyId as string, branchId as string, deviceId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(deviceId) && enabled,
  });
}

export function useDeviceHardwareBinding(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  deviceId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: deviceQueryKeys.hardwareBinding(companyId || "", branchId || "", deviceId || ""),
    queryFn: () =>
      getDeviceHardwareBinding(companyId as string, branchId as string, deviceId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(deviceId) && enabled,
  });
}

export function useCreateDevice(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDeviceRequest) =>
      createDevice(companyId as string, branchId as string, payload),
    onSuccess: () => invalidateDevices(queryClient, companyId, branchId),
  });
}

export function useUpdateDevice(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  deviceId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDeviceRequest) =>
      updateDevice(companyId as string, branchId as string, deviceId as string, payload),
    onSuccess: () => invalidateDevices(queryClient, companyId, branchId, deviceId),
  });
}

export function useUpdateDeviceStatus(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  deviceId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDeviceStatusRequest) =>
      updateDeviceStatus(companyId as string, branchId as string, deviceId as string, payload),
    onSuccess: () => invalidateDevices(queryClient, companyId, branchId, deviceId),
  });
}

export function useSetDeviceReceiptPrinterProfile(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  deviceId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetDeviceReceiptPrinterProfileRequest) =>
      setDeviceReceiptPrinterProfile(
        companyId as string,
        branchId as string,
        deviceId as string,
        payload,
      ),
    onSuccess: () => invalidateDevices(queryClient, companyId, branchId, deviceId),
  });
}

export function useSetDeviceLabelPrinterProfile(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  deviceId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetDeviceLabelPrinterProfileRequest) =>
      setDeviceLabelPrinterProfile(
        companyId as string,
        branchId as string,
        deviceId as string,
        payload,
      ),
    onSuccess: () => invalidateDevices(queryClient, companyId, branchId, deviceId),
  });
}

export function usePrintProductVariantLabel(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  deviceId: string | null | undefined,
) {
  return useMutation({
    mutationFn: (payload: PrintProductVariantLabelRequest) =>
      printProductVariantLabel(companyId as string, branchId as string, deviceId as string, payload),
  });
}

// Part C: only invalidates the hardware-binding/detail queries -- the device list/other detail
// fields are unaffected, matching the backend's "logical Device untouched" guarantee.
export function useUnbindDeviceHardware(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  deviceId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unbindDeviceHardware(companyId as string, branchId as string, deviceId as string),
    onSuccess: () => invalidateDevices(queryClient, companyId, branchId, deviceId),
  });
}

// Part D: also invalidates the discovery queries -- the replaced/old hardware's matchedDeviceId
// on the current discovery snapshot is now stale until refetched.
export function useRebindDeviceHardware(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  deviceId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RebindDeviceHardwareRequest) =>
      rebindDeviceHardware(companyId as string, branchId as string, deviceId as string, payload),
    onSuccess: () => {
      invalidateDevices(queryClient, companyId, branchId, deviceId);
      if (companyId && branchId) {
        queryClient.invalidateQueries({ queryKey: ["devices", "discovery"] });
      }
    },
  });
}

export function useTestPrintDevice(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  deviceId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => testPrintDevice(companyId as string, branchId as string, deviceId as string),
    onSuccess: () => {
      if (!companyId || !branchId) return;
      queryClient.invalidateQueries({ queryKey: ["devices", "print-jobs", companyId, branchId] });
    },
  });
}
