import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogQueryKeys } from "../../catalog/hooks/useCatalog";
import { sellableCatalogQueryKeys } from "../../pos/hooks/useSellableCatalog";
import {
  changeTaxCategoryStatus,
  createTaxCategory,
  getCompanyTaxSettings,
  getTaxCategories,
  getTaxCategoryDetails,
  setCompanyTaxSettings,
  setProductSalesTaxCategory,
  updateTaxCategory,
} from "../api/taxApi";
import type {
  ChangeTaxCategoryStatusRequest,
  CreateTaxCategoryRequest,
  SetCompanyTaxSettingsRequest,
  SetProductSalesTaxCategoryRequest,
  TaxCategoryFilters,
  UpdateTaxCategoryRequest,
} from "../types/tax.types";

export const taxQueryKeys = {
  all: ["tax"] as const,
  settings: (companyId: string) => ["tax", companyId, "settings"] as const,
  categories: (companyId: string, filters: TaxCategoryFilters = {}) =>
    ["tax", companyId, "categories", filters] as const,
  category: (companyId: string, taxCategoryId: string) =>
    ["tax", companyId, "categories", taxCategoryId] as const,
};

function invalidateTax(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  taxCategoryId?: string | null,
) {
  if (!companyId) return;

  queryClient.invalidateQueries({ queryKey: taxQueryKeys.settings(companyId) });
  queryClient.invalidateQueries({ queryKey: ["tax", companyId, "categories"] });

  if (taxCategoryId) {
    queryClient.invalidateQueries({
      queryKey: taxQueryKeys.category(companyId, taxCategoryId),
    });
  }

  if (branchId) {
    queryClient.invalidateQueries({
      queryKey: sellableCatalogQueryKeys.branch(companyId, branchId),
    });
  }
}

function invalidateProductTaxAssignment(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productId: string | null | undefined,
) {
  if (!companyId) return;

  queryClient.invalidateQueries({ queryKey: ["catalog", companyId, "products"] });

  if (productId) {
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.product(companyId, productId),
    });
  }

  if (branchId) {
    queryClient.invalidateQueries({
      queryKey: sellableCatalogQueryKeys.branch(companyId, branchId),
    });
  }
}

export function useCompanyTaxSettings(
  companyId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: taxQueryKeys.settings(companyId || ""),
    queryFn: () => getCompanyTaxSettings(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useTaxCategories(
  companyId: string | null | undefined,
  filters: TaxCategoryFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: taxQueryKeys.categories(companyId || "", filters),
    queryFn: () => getTaxCategories(companyId as string, filters),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useTaxCategoryDetails(
  companyId: string | null | undefined,
  taxCategoryId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: taxQueryKeys.category(companyId || "", taxCategoryId || ""),
    queryFn: () => getTaxCategoryDetails(companyId as string, taxCategoryId as string),
    enabled: Boolean(companyId) && Boolean(taxCategoryId) && enabled,
  });
}

export function useSetCompanyTaxSettings(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetCompanyTaxSettingsRequest) =>
      setCompanyTaxSettings(companyId as string, payload),
    onSuccess: () => invalidateTax(queryClient, companyId, branchId),
  });
}

export function useCreateTaxCategory(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaxCategoryRequest) =>
      createTaxCategory(companyId as string, payload),
    onSuccess: () => invalidateTax(queryClient, companyId, branchId),
  });
}

export function useUpdateTaxCategory(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  taxCategoryId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTaxCategoryRequest) =>
      updateTaxCategory(companyId as string, taxCategoryId as string, payload),
    onSuccess: () => invalidateTax(queryClient, companyId, branchId, taxCategoryId),
  });
}

export function useChangeTaxCategoryStatus(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  taxCategoryId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeTaxCategoryStatusRequest) =>
      changeTaxCategoryStatus(companyId as string, taxCategoryId as string, payload),
    onSuccess: () => invalidateTax(queryClient, companyId, branchId, taxCategoryId),
  });
}

export function useSetProductSalesTaxCategory(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetProductSalesTaxCategoryRequest) =>
      setProductSalesTaxCategory(companyId as string, productId as string, payload),
    onSuccess: () =>
      invalidateProductTaxAssignment(queryClient, companyId, branchId, productId),
  });
}
