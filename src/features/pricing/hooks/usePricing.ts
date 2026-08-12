import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sellableCatalogQueryKeys } from "../../pos/hooks/useSellableCatalog";
import {
  changePriceListStatus,
  createPriceList,
  getModifierPriceDetails,
  getModifierPrices,
  getPriceListDetails,
  getPriceLists,
  getProductVariantPriceDetails,
  getProductVariantPrices,
  removeModifierOptionPrice,
  removeProductVariantPrice,
  setModifierOptionPrice,
  setPriceListTaxMode,
  setProductVariantPrice,
  updatePriceList,
} from "../api/pricingApi";
import type {
  ChangePriceListStatusRequest,
  CreatePriceListRequest,
  PriceListFilters,
  ProductVariantPriceFilters,
  SetModifierOptionPriceRequest,
  SetPriceListTaxModeRequest,
  SetProductVariantPriceRequest,
  UpdatePriceListRequest,
} from "../types/pricing.types";

export const pricingQueryKeys = {
  all: ["pricing"] as const,
  priceLists: (companyId: string, filters: PriceListFilters = {}) =>
    ["pricing", companyId, "price-lists", filters] as const,
  priceList: (companyId: string, priceListId: string) =>
    ["pricing", companyId, "price-lists", priceListId] as const,
  variantPrices: (
    companyId: string,
    priceListId: string,
    filters: ProductVariantPriceFilters = {},
  ) => ["pricing", companyId, "price-lists", priceListId, "items", filters] as const,
  variantPrice: (companyId: string, priceListId: string, productVariantId: string) =>
    ["pricing", companyId, "price-lists", priceListId, "items", productVariantId] as const,
  modifierPrices: (companyId: string, priceListId: string, productVariantId: string) =>
    [
      "pricing",
      companyId,
      "price-lists",
      priceListId,
      "variants",
      productVariantId,
      "modifier-prices",
    ] as const,
  modifierPrice: (
    companyId: string,
    priceListId: string,
    productVariantId: string,
    modifierGroupId: string,
    modifierOptionId: string,
  ) =>
    [
      "pricing",
      companyId,
      "price-lists",
      priceListId,
      "variants",
      productVariantId,
      "modifier-groups",
      modifierGroupId,
      "options",
      modifierOptionId,
    ] as const,
};

function invalidatePriceLists(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  priceListId?: string | null,
) {
  if (!companyId) return;

  queryClient.invalidateQueries({ queryKey: ["pricing", companyId, "price-lists"] });
  if (priceListId) {
    queryClient.invalidateQueries({
      queryKey: pricingQueryKeys.priceList(companyId, priceListId),
    });
  }
}

function invalidatePricingValues(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  priceListId: string | null | undefined,
  productVariantId?: string | null,
  modifierGroupId?: string | null,
  modifierOptionId?: string | null,
) {
  if (!companyId || !priceListId) return;

  queryClient.invalidateQueries({
    queryKey: ["pricing", companyId, "price-lists", priceListId, "items"],
  });

  if (productVariantId) {
    queryClient.invalidateQueries({
      queryKey: pricingQueryKeys.variantPrice(companyId, priceListId, productVariantId),
    });
    queryClient.invalidateQueries({
      queryKey: pricingQueryKeys.modifierPrices(companyId, priceListId, productVariantId),
    });
  }

  if (productVariantId && modifierGroupId && modifierOptionId) {
    queryClient.invalidateQueries({
      queryKey: pricingQueryKeys.modifierPrice(
        companyId,
        priceListId,
        productVariantId,
        modifierGroupId,
        modifierOptionId,
      ),
    });
  }

  if (branchId) {
    queryClient.invalidateQueries({
      queryKey: sellableCatalogQueryKeys.branch(companyId, branchId),
    });
  }
}

export function usePriceLists(
  companyId: string | null | undefined,
  filters: PriceListFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: pricingQueryKeys.priceLists(companyId || "", filters),
    queryFn: () => getPriceLists(companyId as string, filters),
    enabled: Boolean(companyId) && enabled,
  });
}

export function usePriceListDetails(
  companyId: string | null | undefined,
  priceListId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: pricingQueryKeys.priceList(companyId || "", priceListId || ""),
    queryFn: () => getPriceListDetails(companyId as string, priceListId as string),
    enabled: Boolean(companyId) && Boolean(priceListId) && enabled,
  });
}

export function useProductVariantPrices(
  companyId: string | null | undefined,
  priceListId: string | null | undefined,
  filters: ProductVariantPriceFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: pricingQueryKeys.variantPrices(companyId || "", priceListId || "", filters),
    queryFn: () =>
      getProductVariantPrices(companyId as string, priceListId as string, filters),
    enabled: Boolean(companyId) && Boolean(priceListId) && enabled,
  });
}

export function useProductVariantPriceDetails(
  companyId: string | null | undefined,
  priceListId: string | null | undefined,
  productVariantId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: pricingQueryKeys.variantPrice(
      companyId || "",
      priceListId || "",
      productVariantId || "",
    ),
    queryFn: () =>
      getProductVariantPriceDetails(
        companyId as string,
        priceListId as string,
        productVariantId as string,
      ),
    enabled:
      Boolean(companyId) && Boolean(priceListId) && Boolean(productVariantId) && enabled,
  });
}

export function useModifierPrices(
  companyId: string | null | undefined,
  priceListId: string | null | undefined,
  productVariantId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: pricingQueryKeys.modifierPrices(
      companyId || "",
      priceListId || "",
      productVariantId || "",
    ),
    queryFn: () =>
      getModifierPrices(
        companyId as string,
        priceListId as string,
        productVariantId as string,
      ),
    enabled:
      Boolean(companyId) && Boolean(priceListId) && Boolean(productVariantId) && enabled,
  });
}

export function useModifierPriceDetails(
  companyId: string | null | undefined,
  priceListId: string | null | undefined,
  productVariantId: string | null | undefined,
  modifierGroupId: string | null | undefined,
  modifierOptionId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: pricingQueryKeys.modifierPrice(
      companyId || "",
      priceListId || "",
      productVariantId || "",
      modifierGroupId || "",
      modifierOptionId || "",
    ),
    queryFn: () =>
      getModifierPriceDetails(
        companyId as string,
        priceListId as string,
        productVariantId as string,
        modifierGroupId as string,
        modifierOptionId as string,
      ),
    enabled:
      Boolean(companyId) &&
      Boolean(priceListId) &&
      Boolean(productVariantId) &&
      Boolean(modifierGroupId) &&
      Boolean(modifierOptionId) &&
      enabled,
  });
}

export function useCreatePriceList(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePriceListRequest) =>
      createPriceList(companyId as string, payload),
    onSuccess: () => invalidatePriceLists(queryClient, companyId),
  });
}

export function useUpdatePriceList(
  companyId: string | null | undefined,
  priceListId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePriceListRequest) =>
      updatePriceList(companyId as string, priceListId as string, payload),
    onSuccess: () => invalidatePriceLists(queryClient, companyId, priceListId),
  });
}

export function useChangePriceListStatus(
  companyId: string | null | undefined,
  priceListId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangePriceListStatusRequest) =>
      changePriceListStatus(companyId as string, priceListId as string, payload),
    onSuccess: () => invalidatePriceLists(queryClient, companyId, priceListId),
  });
}

export function useSetPriceListTaxMode(
  companyId: string | null | undefined,
  priceListId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetPriceListTaxModeRequest) =>
      setPriceListTaxMode(companyId as string, priceListId as string, payload),
    onSuccess: () => invalidatePriceLists(queryClient, companyId, priceListId),
  });
}

export function useSetProductVariantPrice(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  priceListId: string | null | undefined,
  productVariantId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetProductVariantPriceRequest) =>
      setProductVariantPrice(
        companyId as string,
        priceListId as string,
        productVariantId as string,
        payload,
      ),
    onSuccess: () =>
      invalidatePricingValues(queryClient, companyId, branchId, priceListId, productVariantId),
  });
}

export function useRemoveProductVariantPrice(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  priceListId: string | null | undefined,
  productVariantId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      removeProductVariantPrice(
        companyId as string,
        priceListId as string,
        productVariantId as string,
      ),
    onSuccess: () =>
      invalidatePricingValues(queryClient, companyId, branchId, priceListId, productVariantId),
  });
}

export function useSetModifierOptionPrice(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  priceListId: string | null | undefined,
  productVariantId: string | null | undefined,
  modifierGroupId: string | null | undefined,
  modifierOptionId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetModifierOptionPriceRequest) =>
      setModifierOptionPrice(
        companyId as string,
        priceListId as string,
        productVariantId as string,
        modifierGroupId as string,
        modifierOptionId as string,
        payload,
      ),
    onSuccess: () =>
      invalidatePricingValues(
        queryClient,
        companyId,
        branchId,
        priceListId,
        productVariantId,
        modifierGroupId,
        modifierOptionId,
      ),
  });
}

export function useRemoveModifierOptionPrice(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  priceListId: string | null | undefined,
  productVariantId: string | null | undefined,
  modifierGroupId: string | null | undefined,
  modifierOptionId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      removeModifierOptionPrice(
        companyId as string,
        priceListId as string,
        productVariantId as string,
        modifierGroupId as string,
        modifierOptionId as string,
      ),
    onSuccess: () =>
      invalidatePricingValues(
        queryClient,
        companyId,
        branchId,
        priceListId,
        productVariantId,
        modifierGroupId,
        modifierOptionId,
      ),
  });
}
