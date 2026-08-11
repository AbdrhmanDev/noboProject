import { httpClient } from "../../../shared/api/httpClient";
import type { RestaurantSeatingFloor } from "../types/restaurantSeating.types";

export async function getRestaurantSeating(companyId: string, branchId: string) {
  const response = await httpClient.get<RestaurantSeatingFloor[]>(
    `/api/companies/${companyId}/branches/${branchId}/restaurant/seating`,
  );

  return response.data;
}
