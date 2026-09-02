import { httpClient } from "../../../shared/api/httpClient";
import type {
  ConfirmDiscoveredDeviceRequest,
  ConfirmDiscoveredDeviceResponse,
  DiscoveredDeviceReportResponse,
  DiscoveredDevicesFilters,
} from "../types/devices.types";

function edgeAgentsBaseUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/edge-agents`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function getDiscoveredDevices(
  companyId: string,
  branchId: string,
  edgeAgentId: string,
  filters: DiscoveredDevicesFilters = {},
) {
  const response = await httpClient.get<DiscoveredDeviceReportResponse[]>(
    `${edgeAgentsBaseUrl(companyId, branchId)}/${edgeAgentId}/discovered-devices`,
    { params: compactParams(filters) },
  );

  return response.data;
}

// discoveryId must be encodeURIComponent-ed — the backend runs
// Uri.UnescapeDataString on the route segment.
export async function confirmDiscoveredDevice(
  companyId: string,
  branchId: string,
  edgeAgentId: string,
  discoveryId: string,
  payload: ConfirmDiscoveredDeviceRequest,
) {
  const response = await httpClient.post<ConfirmDiscoveredDeviceResponse>(
    `${edgeAgentsBaseUrl(companyId, branchId)}/${edgeAgentId}/discovered-devices/${encodeURIComponent(
      discoveryId,
    )}/confirm`,
    payload,
  );

  return response.data;
}
