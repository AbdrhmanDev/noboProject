import { httpClient } from "../../../shared/api/httpClient";
import type {
  CreateDeviceRequest,
  DeviceHardwareBindingResponse,
  DeviceResponse,
  DevicesListFilters,
  TestPrintResponse,
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
