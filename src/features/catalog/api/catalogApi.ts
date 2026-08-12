import { httpClient } from "../../../shared/api/httpClient";
import type {
  CatalogStatusFilter,
  CategoryAdmin,
  ChangeCatalogStatusRequest,
  CreateCategoryRequest,
  CreateCategoryResponse,
  CreateProductRequest,
  CreateProductResponse,
  CreateProductVariantRequest,
  CreateProductVariantResponse,
  ProductAdminFilters,
  ProductDetails,
  ProductListResponse,
  ProductVariantAdmin,
  UnitOfMeasure,
  UpdateCategoryRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
} from "../types/catalog.types";

function catalogUrl(companyId: string) {
  return `/api/companies/${companyId}/catalog`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function getCategories(
  companyId: string,
  filters: CatalogStatusFilter = {},
) {
  const response = await httpClient.get<CategoryAdmin[]>(
    `${catalogUrl(companyId)}/categories`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getCategoryDetails(companyId: string, categoryId: string) {
  const response = await httpClient.get<CategoryAdmin>(
    `${catalogUrl(companyId)}/categories/${categoryId}`,
  );

  return response.data;
}

export async function createCategory(
  companyId: string,
  payload: CreateCategoryRequest,
) {
  const response = await httpClient.post<CreateCategoryResponse>(
    `${catalogUrl(companyId)}/categories`,
    payload,
  );

  return response.data;
}

export async function updateCategory(
  companyId: string,
  categoryId: string,
  payload: UpdateCategoryRequest,
) {
  const response = await httpClient.put<CategoryAdmin>(
    `${catalogUrl(companyId)}/categories/${categoryId}`,
    payload,
  );

  return response.data;
}

export async function changeCategoryStatus(
  companyId: string,
  categoryId: string,
  payload: ChangeCatalogStatusRequest,
) {
  const response = await httpClient.put<CategoryAdmin>(
    `${catalogUrl(companyId)}/categories/${categoryId}/status`,
    payload,
  );

  return response.data;
}

export async function getProducts(
  companyId: string,
  filters: ProductAdminFilters = {},
) {
  const response = await httpClient.get<ProductListResponse>(
    `${catalogUrl(companyId)}/products`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getProductDetails(companyId: string, productId: string) {
  const response = await httpClient.get<ProductDetails>(
    `${catalogUrl(companyId)}/products/${productId}`,
  );

  return response.data;
}

export async function createProduct(
  companyId: string,
  payload: CreateProductRequest,
) {
  const response = await httpClient.post<CreateProductResponse>(
    `${catalogUrl(companyId)}/products`,
    payload,
  );

  return response.data;
}

export async function updateProduct(
  companyId: string,
  productId: string,
  payload: UpdateProductRequest,
) {
  const response = await httpClient.put<ProductDetails>(
    `${catalogUrl(companyId)}/products/${productId}`,
    payload,
  );

  return response.data;
}

export async function changeProductStatus(
  companyId: string,
  productId: string,
  payload: ChangeCatalogStatusRequest,
) {
  const response = await httpClient.put<ProductDetails>(
    `${catalogUrl(companyId)}/products/${productId}/status`,
    payload,
  );

  return response.data;
}

export async function getProductVariants(
  companyId: string,
  productId: string,
  filters: CatalogStatusFilter = {},
) {
  const response = await httpClient.get<ProductVariantAdmin[]>(
    `${catalogUrl(companyId)}/products/${productId}/variants`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getProductVariantDetails(
  companyId: string,
  productId: string,
  productVariantId: string,
) {
  const response = await httpClient.get<ProductVariantAdmin>(
    `${catalogUrl(companyId)}/products/${productId}/variants/${productVariantId}`,
  );

  return response.data;
}

export async function createProductVariant(
  companyId: string,
  productId: string,
  payload: CreateProductVariantRequest,
) {
  const response = await httpClient.post<CreateProductVariantResponse>(
    `${catalogUrl(companyId)}/products/${productId}/variants`,
    payload,
  );

  return response.data;
}

export async function updateProductVariant(
  companyId: string,
  productId: string,
  productVariantId: string,
  payload: UpdateProductVariantRequest,
) {
  const response = await httpClient.put<ProductVariantAdmin>(
    `${catalogUrl(companyId)}/products/${productId}/variants/${productVariantId}`,
    payload,
  );

  return response.data;
}

export async function changeProductVariantStatus(
  companyId: string,
  productId: string,
  productVariantId: string,
  payload: ChangeCatalogStatusRequest,
) {
  const response = await httpClient.put<ProductVariantAdmin>(
    `${catalogUrl(companyId)}/products/${productId}/variants/${productVariantId}/status`,
    payload,
  );

  return response.data;
}

export async function getActiveUnitsOfMeasure() {
  const response = await httpClient.get<UnitOfMeasure[]>("/api/units-of-measure");

  return response.data;
}
