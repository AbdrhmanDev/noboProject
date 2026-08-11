import { httpClient } from "../../../shared/api/httpClient";
import type {
  ChangeRestaurantFloorStatusRequest,
  ChangeRestaurantTableStatusRequest,
  CreateRestaurantFloorRequest,
  CreateRestaurantFloorResponse,
  CreateRestaurantTableRequest,
  CreateRestaurantTableResponse,
  RestaurantFloorDetails,
  RestaurantFloorListItem,
  RestaurantSeatingFloor,
  RestaurantStatusFilter,
  RestaurantTableAdmin,
  UpdateRestaurantFloorRequest,
  UpdateRestaurantTableRequest,
} from "../types/restaurantSeating.types";

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

export async function getRestaurantSeating(companyId: string, branchId: string) {
  const response = await httpClient.get<RestaurantSeatingFloor[]>(
    `${restaurantBaseUrl(companyId, branchId)}/seating`,
  );

  return response.data;
}

export async function getRestaurantFloors(
  companyId: string,
  branchId: string,
  filters: RestaurantStatusFilter = {},
) {
  const response = await httpClient.get<RestaurantFloorListItem[]>(
    `${restaurantBaseUrl(companyId, branchId)}/floors`,
    {
      params: compactParams(filters),
    },
  );

  return response.data;
}

export async function getRestaurantFloorDetails(
  companyId: string,
  branchId: string,
  restaurantFloorId: string,
) {
  const response = await httpClient.get<RestaurantFloorDetails>(
    `${restaurantBaseUrl(companyId, branchId)}/floors/${restaurantFloorId}`,
  );

  return response.data;
}

export async function createRestaurantFloor(
  companyId: string,
  branchId: string,
  payload: CreateRestaurantFloorRequest,
) {
  const response = await httpClient.post<CreateRestaurantFloorResponse>(
    `${restaurantBaseUrl(companyId, branchId)}/floors`,
    payload,
  );

  return response.data;
}

export async function updateRestaurantFloor(
  companyId: string,
  branchId: string,
  restaurantFloorId: string,
  payload: UpdateRestaurantFloorRequest,
) {
  const response = await httpClient.put<RestaurantFloorDetails>(
    `${restaurantBaseUrl(companyId, branchId)}/floors/${restaurantFloorId}`,
    payload,
  );

  return response.data;
}

export async function changeRestaurantFloorStatus(
  companyId: string,
  branchId: string,
  restaurantFloorId: string,
  payload: ChangeRestaurantFloorStatusRequest,
) {
  const response = await httpClient.put<RestaurantFloorDetails>(
    `${restaurantBaseUrl(companyId, branchId)}/floors/${restaurantFloorId}/status`,
    payload,
  );

  return response.data;
}

export async function getRestaurantTables(
  companyId: string,
  branchId: string,
  restaurantFloorId: string,
  filters: RestaurantStatusFilter = {},
) {
  const response = await httpClient.get<RestaurantTableAdmin[]>(
    `${restaurantBaseUrl(companyId, branchId)}/floors/${restaurantFloorId}/tables`,
    {
      params: compactParams(filters),
    },
  );

  return response.data;
}

export async function getRestaurantTableDetails(
  companyId: string,
  branchId: string,
  restaurantFloorId: string,
  restaurantTableId: string,
) {
  const response = await httpClient.get<RestaurantTableAdmin>(
    `${restaurantBaseUrl(companyId, branchId)}/floors/${restaurantFloorId}/tables/${restaurantTableId}`,
  );

  return response.data;
}

export async function createRestaurantTable(
  companyId: string,
  branchId: string,
  restaurantFloorId: string,
  payload: CreateRestaurantTableRequest,
) {
  const response = await httpClient.post<CreateRestaurantTableResponse>(
    `${restaurantBaseUrl(companyId, branchId)}/floors/${restaurantFloorId}/tables`,
    payload,
  );

  return response.data;
}

export async function updateRestaurantTable(
  companyId: string,
  branchId: string,
  restaurantFloorId: string,
  restaurantTableId: string,
  payload: UpdateRestaurantTableRequest,
) {
  const response = await httpClient.put<RestaurantTableAdmin>(
    `${restaurantBaseUrl(companyId, branchId)}/floors/${restaurantFloorId}/tables/${restaurantTableId}`,
    payload,
  );

  return response.data;
}

export async function changeRestaurantTableStatus(
  companyId: string,
  branchId: string,
  restaurantFloorId: string,
  restaurantTableId: string,
  payload: ChangeRestaurantTableStatusRequest,
) {
  const response = await httpClient.put<RestaurantTableAdmin>(
    `${restaurantBaseUrl(companyId, branchId)}/floors/${restaurantFloorId}/tables/${restaurantTableId}/status`,
    payload,
  );

  return response.data;
}
