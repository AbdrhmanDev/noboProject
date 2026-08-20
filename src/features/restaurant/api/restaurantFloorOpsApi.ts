import { httpClient } from "../../../shared/api/httpClient";
import type {
  CreateRestaurantReservationRequest,
  OpenRestaurantTableSessionRequest,
  RestaurantFloorStateFilters,
  RestaurantFloorStateResponse,
  RestaurantReservationListItem,
  RestaurantReservationsListFilters,
  RestaurantReservationsListResponse,
  RestaurantTableSession,
  SeatRestaurantReservationRequest,
  UpdateRestaurantReservationRequest,
  UpdateRestaurantTableSessionRequest,
} from "../types/restaurantFloorOps.types";

function restaurantBaseUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/restaurant`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

// The response shape isn't described in this backend's OpenAPI document (see
// the contract note in restaurantFloorOps.types.ts) — reading it through a
// pass-through cast here keeps that single, documented assumption isolated
// to one place instead of scattered through every consumer.
export async function getRestaurantFloorState(
  companyId: string,
  branchId: string,
  filters: RestaurantFloorStateFilters = {},
) {
  const response = await httpClient.get<RestaurantFloorStateResponse>(
    `${restaurantBaseUrl(companyId, branchId)}/floor-state`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function openRestaurantTableSession(
  companyId: string,
  branchId: string,
  tableId: string,
  payload: OpenRestaurantTableSessionRequest,
) {
  const response = await httpClient.post<RestaurantTableSession>(
    `${restaurantBaseUrl(companyId, branchId)}/tables/${tableId}/session`,
    payload,
  );

  return response.data;
}

export async function getRestaurantTableSession(
  companyId: string,
  branchId: string,
  tableId: string,
) {
  const response = await httpClient.get<RestaurantTableSession>(
    `${restaurantBaseUrl(companyId, branchId)}/tables/${tableId}/session`,
  );

  return response.data;
}

export async function updateRestaurantTableSession(
  companyId: string,
  branchId: string,
  sessionId: string,
  payload: UpdateRestaurantTableSessionRequest,
) {
  const response = await httpClient.put<RestaurantTableSession>(
    `${restaurantBaseUrl(companyId, branchId)}/sessions/${sessionId}`,
    payload,
  );

  return response.data;
}

export async function releaseRestaurantTableSession(
  companyId: string,
  branchId: string,
  sessionId: string,
) {
  const response = await httpClient.post(
    `${restaurantBaseUrl(companyId, branchId)}/sessions/${sessionId}/release`,
  );

  return response.data;
}

export async function createRestaurantReservation(
  companyId: string,
  branchId: string,
  payload: CreateRestaurantReservationRequest,
) {
  const response = await httpClient.post<RestaurantReservationListItem>(
    `${restaurantBaseUrl(companyId, branchId)}/reservations`,
    payload,
  );

  return response.data;
}

export async function getRestaurantReservations(
  companyId: string,
  branchId: string,
  filters: RestaurantReservationsListFilters = {},
) {
  const response = await httpClient.get<RestaurantReservationsListResponse>(
    `${restaurantBaseUrl(companyId, branchId)}/reservations`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function updateRestaurantReservation(
  companyId: string,
  branchId: string,
  reservationId: string,
  payload: UpdateRestaurantReservationRequest,
) {
  const response = await httpClient.put<RestaurantReservationListItem>(
    `${restaurantBaseUrl(companyId, branchId)}/reservations/${reservationId}`,
    payload,
  );

  return response.data;
}

export async function cancelRestaurantReservation(
  companyId: string,
  branchId: string,
  reservationId: string,
) {
  const response = await httpClient.post(
    `${restaurantBaseUrl(companyId, branchId)}/reservations/${reservationId}/cancel`,
  );

  return response.data;
}

export async function noShowRestaurantReservation(
  companyId: string,
  branchId: string,
  reservationId: string,
) {
  const response = await httpClient.post(
    `${restaurantBaseUrl(companyId, branchId)}/reservations/${reservationId}/no-show`,
  );

  return response.data;
}

export async function seatRestaurantReservation(
  companyId: string,
  branchId: string,
  reservationId: string,
  payload: SeatRestaurantReservationRequest,
) {
  const response = await httpClient.post<RestaurantTableSession>(
    `${restaurantBaseUrl(companyId, branchId)}/reservations/${reservationId}/seat`,
    payload,
  );

  return response.data;
}
