import { useMutation } from "@tanstack/react-query";
import { resolveSellableCatalogItemByCode } from "../api/barcodeApi";

export function useResolveBarcode(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  return useMutation({
    mutationFn: (code: string) =>
      resolveSellableCatalogItemByCode(companyId as string, branchId as string, code),
  });
}
