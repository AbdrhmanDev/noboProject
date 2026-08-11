import { httpClient } from "../../../shared/api/httpClient";
import type { BranchSellableCatalogResponse } from "../types/sellableCatalog.types";

export async function getBranchSellableCatalog(
  companyId: string,
  branchId: string,
) {
  const response = await httpClient.get<BranchSellableCatalogResponse>(
    `/api/companies/${companyId}/branches/${branchId}/catalog/sellable`,
  );

  return response.data;
}
