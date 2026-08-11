import { useQuery } from "@tanstack/react-query";
import { getBranchSellableCatalog } from "../api/sellableCatalogApi";

export const sellableCatalogQueryKeys = {
  all: ["pos", "sellable-catalog"] as const,
  branch: (companyId: string, branchId: string) =>
    ["pos", "sellable-catalog", companyId, branchId] as const,
};

export function useSellableCatalog(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: sellableCatalogQueryKeys.branch(companyId || "", branchId || ""),
    queryFn: () => getBranchSellableCatalog(companyId as string, branchId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}
