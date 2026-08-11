import { httpClient } from "../../../shared/api/httpClient";
import type {
  KitchenTicketLifecycleResponse,
  OpenKitchenTicket,
  OperationalKitchenStation,
} from "../types/kitchen.types";

function kitchenBaseUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/kitchen`;
}

export async function getOperationalKitchenStations(
  companyId: string,
  branchId: string,
) {
  const response = await httpClient.get<OperationalKitchenStation[]>(
    `${kitchenBaseUrl(companyId, branchId)}/stations`,
  );

  return response.data;
}

export async function getOpenKitchenTickets(
  companyId: string,
  branchId: string,
  kitchenStationId: string,
) {
  const response = await httpClient.get<OpenKitchenTicket[]>(
    `${kitchenBaseUrl(companyId, branchId)}/stations/${kitchenStationId}/tickets/open`,
  );

  return response.data;
}

export async function startKitchenTicketPreparation(
  companyId: string,
  branchId: string,
  kitchenStationId: string,
  kitchenTicketId: string,
) {
  const response = await httpClient.post<KitchenTicketLifecycleResponse>(
    `${kitchenBaseUrl(companyId, branchId)}/stations/${kitchenStationId}/tickets/${kitchenTicketId}/start`,
  );

  return response.data;
}

export async function markKitchenTicketReady(
  companyId: string,
  branchId: string,
  kitchenStationId: string,
  kitchenTicketId: string,
) {
  const response = await httpClient.post<KitchenTicketLifecycleResponse>(
    `${kitchenBaseUrl(companyId, branchId)}/stations/${kitchenStationId}/tickets/${kitchenTicketId}/ready`,
  );

  return response.data;
}
