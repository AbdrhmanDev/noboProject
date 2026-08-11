import { httpClient } from "../../../shared/api/httpClient";
import type {
  ChangeKitchenStationStatusRequest,
  CreateKitchenStationRequest,
  CreateKitchenStationResponse,
  KitchenStationDetails,
  KitchenStationFilters,
  KitchenStationListItem,
  KitchenTicketLifecycleResponse,
  OpenKitchenTicket,
  OperationalKitchenStation,
  ProductVariantKitchenRoute,
  SetProductVariantKitchenRouteRequest,
  SetProductVariantKitchenRouteResponse,
  UpdateKitchenStationRequest,
} from "../types/kitchen.types";

function kitchenBaseUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/kitchen`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
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

export async function getKitchenStations(
  companyId: string,
  branchId: string,
  filters: KitchenStationFilters = {},
) {
  const response = await httpClient.get<KitchenStationListItem[]>(
    `${kitchenBaseUrl(companyId, branchId)}/admin/stations`,
    {
      params: compactParams(filters),
    },
  );

  return response.data;
}

export async function getKitchenStationDetails(
  companyId: string,
  branchId: string,
  kitchenStationId: string,
) {
  const response = await httpClient.get<KitchenStationDetails>(
    `${kitchenBaseUrl(companyId, branchId)}/admin/stations/${kitchenStationId}`,
  );

  return response.data;
}

export async function createKitchenStation(
  companyId: string,
  branchId: string,
  payload: CreateKitchenStationRequest,
) {
  const response = await httpClient.post<CreateKitchenStationResponse>(
    `${kitchenBaseUrl(companyId, branchId)}/stations`,
    payload,
  );

  return response.data;
}

export async function updateKitchenStation(
  companyId: string,
  branchId: string,
  kitchenStationId: string,
  payload: UpdateKitchenStationRequest,
) {
  const response = await httpClient.put<KitchenStationDetails>(
    `${kitchenBaseUrl(companyId, branchId)}/admin/stations/${kitchenStationId}`,
    payload,
  );

  return response.data;
}

export async function changeKitchenStationStatus(
  companyId: string,
  branchId: string,
  kitchenStationId: string,
  payload: ChangeKitchenStationStatusRequest,
) {
  const response = await httpClient.put<KitchenStationDetails>(
    `${kitchenBaseUrl(companyId, branchId)}/admin/stations/${kitchenStationId}/status`,
    payload,
  );

  return response.data;
}

export async function getProductVariantKitchenRoutes(
  companyId: string,
  branchId: string,
  productVariantId: string,
) {
  const response = await httpClient.get<ProductVariantKitchenRoute[]>(
    `${kitchenBaseUrl(companyId, branchId)}/routes/variants/${productVariantId}`,
  );

  return response.data;
}

export async function setProductVariantKitchenRoute(
  companyId: string,
  branchId: string,
  productVariantId: string,
  kitchenStationId: string,
  payload: SetProductVariantKitchenRouteRequest,
) {
  const response = await httpClient.put<SetProductVariantKitchenRouteResponse>(
    `${kitchenBaseUrl(companyId, branchId)}/routes/variants/${productVariantId}/stations/${kitchenStationId}`,
    payload,
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
