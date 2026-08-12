import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sellableCatalogQueryKeys } from "../../pos/hooks/useSellableCatalog";
import {
  changeCategoryStatus,
  changeProductStatus,
  changeProductVariantStatus,
  createCategory,
  createProduct,
  createProductVariant,
  getActiveUnitsOfMeasure,
  getCategories,
  getCategoryDetails,
  getProductDetails,
  getProducts,
  getProductVariantDetails,
  getProductVariants,
  updateCategory,
  updateProduct,
  updateProductVariant,
} from "../api/catalogApi";
import type {
  CatalogStatusFilter,
  ChangeCatalogStatusRequest,
  CreateCategoryRequest,
  CreateProductRequest,
  CreateProductVariantRequest,
  ProductAdminFilters,
  UpdateCategoryRequest,
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

export function useActiveUnitsOfMeasure(enabled = true) {
  return useQuery({
    queryKey: catalogQueryKeys.unitsOfMeasure,
    queryFn: getActiveUnitsOfMeasure,
    enabled,
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
