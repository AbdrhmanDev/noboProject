import { httpClient } from "../../../shared/api/httpClient";
import type {
  ConfirmDiscoveredDeviceRequest,
  ConfirmDiscoveredDeviceResponse,
  DiscoveredDeviceReportResponse,
  DiscoveredDevicesFilters,
  RequestDiscoveryRefreshResponse,
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

// The deterministic "current hardware state" snapshot -- one report (or null if this edge agent
// has never reported discovery), never the historical list getDiscoveredDevices returns. The
// backend answers "no discovery yet" with 204 No Content, which axios surfaces as an empty string
// body, not null -- normalized here so callers only ever see a real report or null.
export async function getLatestDiscoveredDevices(
  companyId: string,
  branchId: string,
  edgeAgentId: string,
) {
  const response = await httpClient.get<DiscoveredDeviceReportResponse | "">(
    `${edgeAgentsBaseUrl(companyId, branchId)}/${edgeAgentId}/discovered-devices/latest`,
  );

  return response.status === 204 || !response.data
    ? null
    : (response.data as DiscoveredDeviceReportResponse);
}

// Part A of the live-refresh task: asks the backend to record a refresh request, which the Edge
// Agent picks up on its own next heartbeat (see EdgeAgentWorker.TryHandleDiscoveryRefreshRequestAsync)
// -- this call itself never runs discovery synchronously and never restarts anything.
export async function requestDiscoveryRefresh(
  companyId: string,
  branchId: string,
  edgeAgentId: string,
) {
  const response = await httpClient.post<RequestDiscoveryRefreshResponse>(
    `${edgeAgentsBaseUrl(companyId, branchId)}/${edgeAgentId}/discovery/refresh`,
    {},
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
