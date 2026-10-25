import { httpClient } from "../../../shared/api/httpClient";
import type { BranchSellableCatalogItem } from "../types/sellableCatalog.types";

// ResolvedFrom: "Barcode" for a real ProductVariantBarcode match, "Sku" for the documented legacy
// fallback -- both diagnostic only -- and (Scale Label Barcodes Phase 1) "ScaleLabel" when the code
// was decoded as a label-printing scale's barcode. Only ScaleLabel changes POS behavior:
// decodedWeight is then the label's weight in item.salesUnitOfMeasure (null otherwise), and the
// RAW scanned code must be sent back as the draft line's scaleLabelBarcode.
export type SellableCatalogItemByCode = {
  item: BranchSellableCatalogItem;
  resolvedFrom: string;
  decodedWeight?: number | null;
};

export const SCALE_LABEL_RESOLVED_FROM = "ScaleLabel";

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
