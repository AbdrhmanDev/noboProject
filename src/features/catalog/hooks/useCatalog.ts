import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sellableCatalogQueryKeys } from "../../pos/hooks/useSellableCatalog";
import {
  changeCategoryStatus,
  changeModifierGroupStatus,
  changeModifierOptionStatus,
  changeProductStatus,
  changeProductVariantStatus,
  createCategory,
  createModifierGroup,
  createModifierOption,
  createProduct,
  createProductVariant,
  getActiveUnitsOfMeasure,
  getBranchProductVariantAvailabilities,
  getBranchProductVariantAvailability,
  getCategories,
  getCategoryDetails,
  getModifierGroupDetails,
  getModifierGroups,
  getModifierOptionDetails,
  getModifierOptions,
  getProductDetails,
  getProductVariantModifierGroups,
  getProducts,
  getProductVariantDetails,
  getProductVariants,
  setBranchProductVariantAvailability,
  setProductVariantModifierGroup,
  updateCategory,
  updateModifierGroup,
  updateModifierOption,
  updateProduct,
  updateProductVariant,
} from "../api/catalogApi";
import type {
  CatalogStatusFilter,
  BranchProductVariantAvailabilityFilters,
  ChangeCatalogStatusRequest,
  CreateCategoryRequest,
  CreateModifierGroupRequest,
  CreateModifierOptionRequest,
  CreateProductRequest,
  CreateProductVariantRequest,
  ModifierGroupFilters,
  ProductAdminFilters,
  SetBranchProductVariantAvailabilityRequest,
  SetProductVariantModifierGroupRequest,
  UpdateCategoryRequest,
  UpdateModifierGroupRequest,
  UpdateModifierOptionRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
} from "../types/catalog.types";

export const catalogQueryKeys = {
  all: ["catalog"] as const,
  categories: (companyId: string, filters: CatalogStatusFilter = {}) =>
    ["catalog", companyId, "categories", filters] as const,
  category: (companyId: string, categoryId: string) =>
    ["catalog", companyId, "categories", categoryId] as const,
  products: (companyId: string, filters: ProductAdminFilters = {}) =>
    ["catalog", companyId, "products", filters] as const,
  product: (companyId: string, productId: string) =>
    ["catalog", companyId, "products", productId] as const,
  variants: (companyId: string, productId: string, filters: CatalogStatusFilter = {}) =>
    ["catalog", companyId, "products", productId, "variants", filters] as const,
  variant: (companyId: string, productId: string, productVariantId: string) =>
    ["catalog", companyId, "products", productId, "variants", productVariantId] as const,
  branchVariantAvailabilities: (
    companyId: string,
    branchId: string,
    filters: BranchProductVariantAvailabilityFilters = {},
  ) => ["catalog", companyId, "branches", branchId, "variant-availability", filters] as const,
  branchVariantAvailability: (
    companyId: string,
    branchId: string,
    productVariantId: string,
  ) => ["catalog", companyId, "branches", branchId, "variant-availability", productVariantId] as const,
  modifierGroups: (companyId: string, filters: ModifierGroupFilters = {}) =>
    ["catalog", companyId, "modifier-groups", filters] as const,
  modifierGroup: (companyId: string, modifierGroupId: string) =>
    ["catalog", companyId, "modifier-groups", modifierGroupId] as const,
  modifierOptions: (
    companyId: string,
    modifierGroupId: string,
    filters: CatalogStatusFilter = {},
  ) => ["catalog", companyId, "modifier-groups", modifierGroupId, "options", filters] as const,
  modifierOption: (
    companyId: string,
    modifierGroupId: string,
    modifierOptionId: string,
  ) =>
    ["catalog", companyId, "modifier-groups", modifierGroupId, "options", modifierOptionId] as const,
  variantModifierGroups: (companyId: string, productVariantId: string) =>
    ["catalog", companyId, "variants", productVariantId, "modifier-groups"] as const,
  unitsOfMeasure: ["catalog", "units-of-measure"] as const,
};

function invalidateCatalogAdmin(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productId?: string | null,
  productVariantId?: string | null,
) {
  if (!companyId) return;

  queryClient.invalidateQueries({ queryKey: ["catalog", companyId, "categories"] });
  queryClient.invalidateQueries({ queryKey: ["catalog", companyId, "products"] });

  if (productId) {
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.product(companyId, productId),
    });
    queryClient.invalidateQueries({
      queryKey: ["catalog", companyId, "products", productId, "variants"],
    });
  }

  if (productId && productVariantId) {
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.variant(companyId, productId, productVariantId),
    });
  }

  if (branchId) {
    queryClient.invalidateQueries({
      queryKey: sellableCatalogQueryKeys.branch(companyId, branchId),
    });
  }
}

function invalidateBranchVariantAvailability(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productVariantId?: string | null,
) {
  if (!companyId || !branchId) return;

  queryClient.invalidateQueries({
    queryKey: ["catalog", companyId, "branches", branchId, "variant-availability"],
  });

  if (productVariantId) {
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.branchVariantAvailability(
        companyId,
        branchId,
        productVariantId,
      ),
    });
  }

  queryClient.invalidateQueries({
    queryKey: sellableCatalogQueryKeys.branch(companyId, branchId),
  });
}

function invalidateCatalogModifiers(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  modifierGroupId?: string | null,
  modifierOptionId?: string | null,
  productVariantId?: string | null,
) {
  if (!companyId) return;

  queryClient.invalidateQueries({
    queryKey: ["catalog", companyId, "modifier-groups"],
  });

  if (modifierGroupId) {
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.modifierGroup(companyId, modifierGroupId),
    });
    queryClient.invalidateQueries({
      queryKey: ["catalog", companyId, "modifier-groups", modifierGroupId, "options"],
    });
  }

  if (modifierGroupId && modifierOptionId) {
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.modifierOption(
        companyId,
        modifierGroupId,
        modifierOptionId,
      ),
    });
  }

  if (productVariantId) {
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.variantModifierGroups(companyId, productVariantId),
    });
  }

  if (branchId) {
    queryClient.invalidateQueries({
      queryKey: sellableCatalogQueryKeys.branch(companyId, branchId),
    });
  }
}

export function useCategories(
  companyId: string | null | undefined,
  filters: CatalogStatusFilter = {},
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.categories(companyId || "", filters),
    queryFn: () => getCategories(companyId as string, filters),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useCategoryDetails(
  companyId: string | null | undefined,
  categoryId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.category(companyId || "", categoryId || ""),
    queryFn: () => getCategoryDetails(companyId as string, categoryId as string),
    enabled: Boolean(companyId) && Boolean(categoryId) && enabled,
  });
}

export function useProducts(
  companyId: string | null | undefined,
  filters: ProductAdminFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.products(companyId || "", filters),
    queryFn: () => getProducts(companyId as string, filters),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useProductDetails(
  companyId: string | null | undefined,
  productId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.product(companyId || "", productId || ""),
    queryFn: () => getProductDetails(companyId as string, productId as string),
    enabled: Boolean(companyId) && Boolean(productId) && enabled,
  });
}

export function useProductVariants(
  companyId: string | null | undefined,
  productId: string | null | undefined,
  filters: CatalogStatusFilter = {},
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.variants(companyId || "", productId || "", filters),
    queryFn: () =>
      getProductVariants(companyId as string, productId as string, filters),
    enabled: Boolean(companyId) && Boolean(productId) && enabled,
  });
}

export function useProductVariantDetails(
  companyId: string | null | undefined,
  productId: string | null | undefined,
  productVariantId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.variant(
      companyId || "",
      productId || "",
      productVariantId || "",
    ),
    queryFn: () =>
      getProductVariantDetails(
        companyId as string,
        productId as string,
        productVariantId as string,
      ),
    enabled:
      Boolean(companyId) && Boolean(productId) && Boolean(productVariantId) && enabled,
  });
}

export function useBranchProductVariantAvailabilities(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: BranchProductVariantAvailabilityFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.branchVariantAvailabilities(
      companyId || "",
      branchId || "",
      filters,
    ),
    queryFn: () =>
      getBranchProductVariantAvailabilities(
        companyId as string,
        branchId as string,
        filters,
      ),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function useBranchProductVariantAvailability(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productVariantId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.branchVariantAvailability(
      companyId || "",
      branchId || "",
      productVariantId || "",
    ),
    queryFn: () =>
      getBranchProductVariantAvailability(
        companyId as string,
        branchId as string,
        productVariantId as string,
      ),
    enabled:
      Boolean(companyId) && Boolean(branchId) && Boolean(productVariantId) && enabled,
  });
}

export function useActiveUnitsOfMeasure(enabled = true) {
  return useQuery({
    queryKey: catalogQueryKeys.unitsOfMeasure,
    queryFn: getActiveUnitsOfMeasure,
    enabled,
  });
}

export function useModifierGroups(
  companyId: string | null | undefined,
  filters: ModifierGroupFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.modifierGroups(companyId || "", filters),
    queryFn: () => getModifierGroups(companyId as string, filters),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useModifierGroupDetails(
  companyId: string | null | undefined,
  modifierGroupId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.modifierGroup(companyId || "", modifierGroupId || ""),
    queryFn: () =>
      getModifierGroupDetails(companyId as string, modifierGroupId as string),
    enabled: Boolean(companyId) && Boolean(modifierGroupId) && enabled,
  });
}

export function useModifierOptions(
  companyId: string | null | undefined,
  modifierGroupId: string | null | undefined,
  filters: CatalogStatusFilter = {},
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.modifierOptions(
      companyId || "",
      modifierGroupId || "",
      filters,
    ),
    queryFn: () =>
      getModifierOptions(companyId as string, modifierGroupId as string, filters),
    enabled: Boolean(companyId) && Boolean(modifierGroupId) && enabled,
  });
}

export function useModifierOptionDetails(
  companyId: string | null | undefined,
  modifierGroupId: string | null | undefined,
  modifierOptionId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.modifierOption(
      companyId || "",
      modifierGroupId || "",
      modifierOptionId || "",
    ),
    queryFn: () =>
      getModifierOptionDetails(
        companyId as string,
        modifierGroupId as string,
        modifierOptionId as string,
      ),
    enabled:
      Boolean(companyId) &&
      Boolean(modifierGroupId) &&
      Boolean(modifierOptionId) &&
      enabled,
  });
}

export function useProductVariantModifierGroups(
  companyId: string | null | undefined,
  productVariantId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.variantModifierGroups(companyId || "", productVariantId || ""),
    queryFn: () =>
      getProductVariantModifierGroups(companyId as string, productVariantId as string),
    enabled: Boolean(companyId) && Boolean(productVariantId) && enabled,
  });
}

export function useCreateCategory(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) =>
      createCategory(companyId as string, payload),
    onSuccess: () => invalidateCatalogAdmin(queryClient, companyId, branchId),
  });
}

export function useUpdateCategory(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  categoryId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCategoryRequest) =>
      updateCategory(companyId as string, categoryId as string, payload),
    onSuccess: () => {
      invalidateCatalogAdmin(queryClient, companyId, branchId);
      if (companyId && categoryId) {
        queryClient.invalidateQueries({
          queryKey: catalogQueryKeys.category(companyId, categoryId),
        });
      }
    },
  });
}

export function useChangeCategoryStatus(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  categoryId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeCatalogStatusRequest) =>
      changeCategoryStatus(companyId as string, categoryId as string, payload),
    onSuccess: () => {
      invalidateCatalogAdmin(queryClient, companyId, branchId);
      if (companyId && categoryId) {
        queryClient.invalidateQueries({
          queryKey: catalogQueryKeys.category(companyId, categoryId),
        });
      }
    },
  });
}

export function useCreateProduct(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductRequest) =>
      createProduct(companyId as string, payload),
    onSuccess: () => invalidateCatalogAdmin(queryClient, companyId, branchId),
  });
}

export function useUpdateProduct(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProductRequest) =>
      updateProduct(companyId as string, productId as string, payload),
    onSuccess: () => invalidateCatalogAdmin(queryClient, companyId, branchId, productId),
  });
}

export function useChangeProductStatus(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeCatalogStatusRequest) =>
      changeProductStatus(companyId as string, productId as string, payload),
    onSuccess: () => invalidateCatalogAdmin(queryClient, companyId, branchId, productId),
  });
}

export function useCreateProductVariant(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductVariantRequest) =>
      createProductVariant(companyId as string, productId as string, payload),
    onSuccess: () => invalidateCatalogAdmin(queryClient, companyId, branchId, productId),
  });
}

export function useUpdateProductVariant(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productId: string | null | undefined,
  productVariantId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProductVariantRequest) =>
      updateProductVariant(
        companyId as string,
        productId as string,
        productVariantId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateCatalogAdmin(
        queryClient,
        companyId,
        branchId,
        productId,
        productVariantId,
      ),
  });
}

export function useChangeProductVariantStatus(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productId: string | null | undefined,
  productVariantId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeCatalogStatusRequest) =>
      changeProductVariantStatus(
        companyId as string,
        productId as string,
        productVariantId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateCatalogAdmin(
        queryClient,
        companyId,
        branchId,
        productId,
        productVariantId,
      ),
  });
}

export function useSetBranchProductVariantAvailability(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productVariantId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetBranchProductVariantAvailabilityRequest) =>
      setBranchProductVariantAvailability(
        companyId as string,
        branchId as string,
        productVariantId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateBranchVariantAvailability(
        queryClient,
        companyId,
        branchId,
        productVariantId,
      ),
  });
}

export function useCreateModifierGroup(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateModifierGroupRequest) =>
      createModifierGroup(companyId as string, payload),
    onSuccess: () => invalidateCatalogModifiers(queryClient, companyId, branchId),
  });
}

export function useUpdateModifierGroup(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  modifierGroupId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateModifierGroupRequest) =>
      updateModifierGroup(companyId as string, modifierGroupId as string, payload),
    onSuccess: () =>
      invalidateCatalogModifiers(queryClient, companyId, branchId, modifierGroupId),
  });
}

export function useChangeModifierGroupStatus(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  modifierGroupId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeCatalogStatusRequest) =>
      changeModifierGroupStatus(
        companyId as string,
        modifierGroupId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateCatalogModifiers(queryClient, companyId, branchId, modifierGroupId),
  });
}

export function useCreateModifierOption(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  modifierGroupId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateModifierOptionRequest) =>
      createModifierOption(
        companyId as string,
        modifierGroupId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateCatalogModifiers(queryClient, companyId, branchId, modifierGroupId),
  });
}

export function useUpdateModifierOption(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  modifierGroupId: string | null | undefined,
  modifierOptionId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateModifierOptionRequest) =>
      updateModifierOption(
        companyId as string,
        modifierGroupId as string,
        modifierOptionId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateCatalogModifiers(
        queryClient,
        companyId,
        branchId,
        modifierGroupId,
        modifierOptionId,
      ),
  });
}

export function useChangeModifierOptionStatus(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  modifierGroupId: string | null | undefined,
  modifierOptionId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeCatalogStatusRequest) =>
      changeModifierOptionStatus(
        companyId as string,
        modifierGroupId as string,
        modifierOptionId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateCatalogModifiers(
        queryClient,
        companyId,
        branchId,
        modifierGroupId,
        modifierOptionId,
      ),
  });
}

export function useSetProductVariantModifierGroup(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  productVariantId: string | null | undefined,
  modifierGroupId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetProductVariantModifierGroupRequest) =>
      setProductVariantModifierGroup(
        companyId as string,
        productVariantId as string,
        modifierGroupId as string,
        payload,
      ),
    onSuccess: () =>
      invalidateCatalogModifiers(
        queryClient,
        companyId,
        branchId,
        modifierGroupId,
        null,
        productVariantId,
      ),
  });
}
