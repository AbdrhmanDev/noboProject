import { httpClient } from "../../../shared/api/httpClient";
import type { Branch } from "../types/branch.types";

export async function getBranches(companyId: string) {
  const response = await httpClient.get<Branch[]>(
    `/api/companies/${companyId}/branches`,
  );

  return response.data;
}
