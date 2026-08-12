import { httpClient } from "../../../shared/api/httpClient";
import type {
  CatalogStatusFilter,
  BranchProductVariantAvailability,
  BranchProductVariantAvailabilityFilters,
  BranchProductVariantAvailabilityListResponse,
  CategoryAdmin,
  ChangeCatalogStatusRequest,
  CreateCategoryRequest,
  CreateCategoryResponse,
  CreateModifierGroupRequest,
  CreateModifierGroupResponse,
  CreateModifierOptionRequest,
  CreateModifierOptionResponse,
  CreateProductRequest,
  CreateProductResponse,
  CreateProductVariantRequest,
  CreateProductVariantResponse,
  ModifierGroupDetails,
  ModifierGroupFilters,
  ModifierGroupListResponse,
  ModifierOptionAdmin,
  ModifierOptionListResponse,
  ProductAdminFilters,
  ProductDetails,
  ProductVariantModifierGroupListResponse,
  ProductListResponse,
  ProductVariantAdmin,
  SetBranchProductVariantAvailabilityRequest,
  SetBranchProductVariantAvailabilityResponse,
  SetProductVariantModifierGroupRequest,
  SetProductVariantModifierGroupResponse,
  UnitOfMeasure,
  UpdateCategoryRequest,
  UpdateModifierGroupRequest,
  UpdateModifierOptionRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
} from "../types/catalog.types";

function catalogUrl(companyId: string) {
  return `/api/companies/${companyId}/catalog`;
}

function branchCatalogUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/catalog`;
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

export async function getBranchProductVariantAvailabilities(
  companyId: string,
  branchId: string,
  filters: BranchProductVariantAvailabilityFilters = {},
) {
  const response = await httpClient.get<BranchProductVariantAvailabilityListResponse>(
    `${branchCatalogUrl(companyId, branchId)}/availability`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getBranchProductVariantAvailability(
  companyId: string,
  branchId: string,
  productVariantId: string,
) {
  const response = await httpClient.get<BranchProductVariantAvailability>(
    `${branchCatalogUrl(companyId, branchId)}/variants/${productVariantId}/availability`,
  );

  return response.data;
}

export async function setBranchProductVariantAvailability(
  companyId: string,
  branchId: string,
  productVariantId: string,
  payload: SetBranchProductVariantAvailabilityRequest,
) {
  const response = await httpClient.put<SetBranchProductVariantAvailabilityResponse>(
    `${branchCatalogUrl(companyId, branchId)}/variants/${productVariantId}/availability`,
    payload,
  );

  return response.data;
}

export async function getActiveUnitsOfMeasure() {
  const response = await httpClient.get<UnitOfMeasure[]>("/api/units-of-measure");

  return response.data;
}

export async function getModifierGroups(
  companyId: string,
  filters: ModifierGroupFilters = {},
) {
  const response = await httpClient.get<ModifierGroupListResponse>(
    `${catalogUrl(companyId)}/modifier-groups`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getModifierGroupDetails(
  companyId: string,
  modifierGroupId: string,
) {
  const response = await httpClient.get<ModifierGroupDetails>(
    `${catalogUrl(companyId)}/modifier-groups/${modifierGroupId}`,
  );

  return response.data;
}

export async function createModifierGroup(
  companyId: string,
  payload: CreateModifierGroupRequest,
) {
  const response = await httpClient.post<CreateModifierGroupResponse>(
    `${catalogUrl(companyId)}/modifier-groups`,
    payload,
  );

  return response.data;
}

export async function updateModifierGroup(
  companyId: string,
  modifierGroupId: string,
  payload: UpdateModifierGroupRequest,
) {
  const response = await httpClient.put<ModifierGroupDetails>(
    `${catalogUrl(companyId)}/modifier-groups/${modifierGroupId}`,
    payload,
  );

  return response.data;
}

export async function changeModifierGroupStatus(
  companyId: string,
  modifierGroupId: string,
  payload: ChangeCatalogStatusRequest,
) {
  const response = await httpClient.put<ModifierGroupDetails>(
    `${catalogUrl(companyId)}/modifier-groups/${modifierGroupId}/status`,
    payload,
  );

  return response.data;
}

export async function getModifierOptions(
  companyId: string,
  modifierGroupId: string,
  filters: CatalogStatusFilter = {},
) {
  const response = await httpClient.get<ModifierOptionListResponse>(
    `${catalogUrl(companyId)}/modifier-groups/${modifierGroupId}/options`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getModifierOptionDetails(
  companyId: string,
  modifierGroupId: string,
  modifierOptionId: string,
) {
  const response = await httpClient.get<ModifierOptionAdmin>(
    `${catalogUrl(companyId)}/modifier-groups/${modifierGroupId}/options/${modifierOptionId}`,
  );

  return response.data;
}

export async function createModifierOption(
  companyId: string,
  modifierGroupId: string,
  payload: CreateModifierOptionRequest,
) {
  const response = await httpClient.post<CreateModifierOptionResponse>(
    `${catalogUrl(companyId)}/modifier-groups/${modifierGroupId}/options`,
    payload,
  );

  return response.data;
}

export async function updateModifierOption(
  companyId: string,
  modifierGroupId: string,
  modifierOptionId: string,
  payload: UpdateModifierOptionRequest,
) {
  const response = await httpClient.put<ModifierOptionAdmin>(
    `${catalogUrl(companyId)}/modifier-groups/${modifierGroupId}/options/${modifierOptionId}`,
    payload,
  );

  return response.data;
}

export async function changeModifierOptionStatus(
  companyId: string,
  modifierGroupId: string,
  modifierOptionId: string,
  payload: ChangeCatalogStatusRequest,
) {
  const response = await httpClient.put<ModifierOptionAdmin>(
    `${catalogUrl(companyId)}/modifier-groups/${modifierGroupId}/options/${modifierOptionId}/status`,
    payload,
  );

  return response.data;
}

export async function getProductVariantModifierGroups(
  companyId: string,
  productVariantId: string,
) {
  const response = await httpClient.get<ProductVariantModifierGroupListResponse>(
    `${catalogUrl(companyId)}/variants/${productVariantId}/modifier-groups`,
  );

  return response.data;
}

export async function setProductVariantModifierGroup(
  companyId: string,
  productVariantId: string,
  modifierGroupId: string,
  payload: SetProductVariantModifierGroupRequest,
) {
  const response = await httpClient.put<SetProductVariantModifierGroupResponse>(
    `${catalogUrl(companyId)}/variants/${productVariantId}/modifier-groups/${modifierGroupId}`,
    payload,
  );

  return response.data;
}
