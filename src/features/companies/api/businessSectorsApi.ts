import { httpClient } from "../../../shared/api/httpClient";
import type { BusinessSector } from "../types/company.types";

export async function getBusinessSectors() {
  const response = await httpClient.get<BusinessSector[]>("/api/business-sectors");
  return response.data;
}
