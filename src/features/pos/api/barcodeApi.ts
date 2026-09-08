import { httpClient } from "../../../shared/api/httpClient";
import type { BranchSellableCatalogItem } from "../types/sellableCatalog.types";

// ResolvedFrom is diagnostic-only ("Barcode" for a real ProductVariantBarcode match, "Sku" for
// the documented legacy fallback) -- not meant to change cashier-facing behavior.
export type SellableCatalogItemByCode = {
  item: BranchSellableCatalogItem;
  resolvedFrom: string;
};

export async function resolveSellableCatalogItemByCode(
  companyId: string,
  branchId: string,
  code: string,
) {
  const response = await httpClient.get<SellableCatalogItemByCode>(
    `/api/companies/${companyId}/branches/${branchId}/catalog/sellable/by-code`,
    { params: { code } },
  );

  return response.data;
}
