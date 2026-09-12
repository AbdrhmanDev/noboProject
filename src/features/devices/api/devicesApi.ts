import { httpClient } from "../../../shared/api/httpClient";
import type {
  CreateDeviceRequest,
  DeviceHardwareBindingResponse,
  DeviceResponse,
  DevicesListFilters,
  PrintProductVariantLabelRequest,
  PrintProductVariantLabelResponse,
  RebindDeviceHardwareRequest,
  RebindDeviceHardwareResponse,
  SetDeviceLabelPrinterProfileRequest,
  SetDeviceReceiptPrinterProfileRequest,
  TestPrintResponse,
  UnbindDeviceHardwareResponse,
  UpdateDeviceRequest,
  UpdateDeviceStatusRequest,
} from "../types/devices.types";

function devicesBaseUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/devices`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function getDevices(
  companyId: string,
  branchId: string,
  filters: DevicesListFilters = {},
) {
  const response = await httpClient.get<DeviceResponse[]>(devicesBaseUrl(companyId, branchId), {
    params: compactParams(filters),
  });

  return response.data;
}

export async function getDeviceDetails(companyId: string, branchId: string, deviceId: string) {
  const response = await httpClient.get<DeviceResponse>(
    `${devicesBaseUrl(companyId, branchId)}/${deviceId}`,
  );

  return response.data;
}

export async function createDevice(
  companyId: string,
  branchId: string,
  payload: CreateDeviceRequest,
) {
  const response = await httpClient.post<DeviceResponse>(
    devicesBaseUrl(companyId, branchId),
    payload,
  );

  return response.data;
}

export async function updateDevice(
  companyId: string,
  branchId: string,
  deviceId: string,
  payload: UpdateDeviceRequest,
) {
  const response = await httpClient.put<DeviceResponse>(
    `${devicesBaseUrl(companyId, branchId)}/${deviceId}`,
    payload,
  );

  return response.data;
}

export async function updateDeviceStatus(
  companyId: string,
  branchId: string,
  deviceId: string,
  payload: UpdateDeviceStatusRequest,
) {
  const response = await httpClient.put<DeviceResponse>(
    `${devicesBaseUrl(companyId, branchId)}/${deviceId}/status`,
    payload,
  );

  return response.data;
}

export async function setDeviceReceiptPrinterProfile(
  companyId: string,
  branchId: string,
  deviceId: string,
  payload: SetDeviceReceiptPrinterProfileRequest,
) {
  const response = await httpClient.put<DeviceResponse>(
    `${devicesBaseUrl(companyId, branchId)}/${deviceId}/printer-profile`,
    payload,
  );

  return response.data;
}

export async function setDeviceLabelPrinterProfile(
  companyId: string,
  branchId: string,
  deviceId: string,
  payload: SetDeviceLabelPrinterProfileRequest,
) {
  const response = await httpClient.put<DeviceResponse>(
    `${devicesBaseUrl(companyId, branchId)}/${deviceId}/label-printer-profile`,
    payload,
  );

  return response.data;
}

export async function printProductVariantLabel(
  companyId: string,
  branchId: string,
  deviceId: string,
  payload: PrintProductVariantLabelRequest,
) {
  const response = await httpClient.post<PrintProductVariantLabelResponse>(
    `${devicesBaseUrl(companyId, branchId)}/${deviceId}/print-label`,
    payload,
  );

  return response.data;
}

export async function testPrintDevice(companyId: string, branchId: string, deviceId: string) {
  const response = await httpClient.post<TestPrintResponse>(
    `${devicesBaseUrl(companyId, branchId)}/${deviceId}/test-print`,
  );

  return response.data;
}

// New endpoint (added alongside this frontend feature) — returns null when
// the device has never been confirmed against a discovered candidate.
export async function getDeviceHardwareBinding(
  companyId: string,
  branchId: string,
  deviceId: string,
) {
  const response = await httpClient.get<DeviceHardwareBindingResponse | null>(
    `${devicesBaseUrl(companyId, branchId)}/${deviceId}/hardware-binding`,
  );

  return response.data;
}

// Part C: removes the hardware relationship only -- the logical Device itself is untouched
// server-side (see UnbindDeviceHardwareHandler's remarks).
export async function unbindDeviceHardware(companyId: string, branchId: string, deviceId: string) {
  const response = await httpClient.post<UnbindDeviceHardwareResponse>(
    `${devicesBaseUrl(companyId, branchId)}/${deviceId}/hardware-binding/unbind`,
  );

  return response.data;
}

// Part D: one atomic backend operation that replaces the current binding with a fresh discovered
// candidate, preserving deviceId/assignments/history (see RebindDeviceHardwareHandler's remarks).
export async function rebindDeviceHardware(
  companyId: string,
  branchId: string,
  deviceId: string,
  payload: RebindDeviceHardwareRequest,
) {
  const response = await httpClient.post<RebindDeviceHardwareResponse>(
    `${devicesBaseUrl(companyId, branchId)}/${deviceId}/hardware-binding/rebind`,
    payload,
  );

  return response.data;
}
