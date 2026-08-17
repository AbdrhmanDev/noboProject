export type CatalogAdminStatus = "Active" | "Suspended";

export type CatalogStatusFilter = {
  status?: CatalogAdminStatus | "";
};

export type BranchProductVariantAvailabilityFilters = {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type CategoryAdmin = {
  categoryId: string;
  companyId: string;
  name: string;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
  sortOrder: number;
  status: CatalogAdminStatus;
  createdAtUtc: string;
};

export type CreateCategoryRequest = {
  name: string;
  parentCategoryId: string | null;
  sortOrder: number;
};

export type CreateCategoryResponse = Omit<CategoryAdmin, "parentCategoryName">;

export type UpdateCategoryRequest = CreateCategoryRequest;

export type ChangeCatalogStatusRequest = {
  status: CatalogAdminStatus;
};

export type ProductAdminFilters = {
  categoryId?: string | "";
  status?: CatalogAdminStatus | "";
  search?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type ModifierGroupFilters = {
  status?: CatalogAdminStatus | "";
  search?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type ProductVariantSummary = {
  productVariantId: string;
  name: string;
  sku: string | null;
  salesUnitOfMeasureId: string;
  salesUnitOfMeasureCode: string;
  salesUnitOfMeasureName: string;
  salesUnitOfMeasureSymbol: string;
  sortOrder: number;
  status: CatalogAdminStatus;
  createdAtUtc: string;
};

export type ProductAdminListItem = {
  productId: string;
  companyId: string;
  categoryId: string | null;
  categoryName: string | null;
  salesTaxCategoryId: string | null;
  salesTaxCategoryCode: string | null;
  salesTaxCategoryName: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  status: CatalogAdminStatus;
  createdAtUtc: string;
  variantCount: number;
};

export type ProductListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: ProductAdminListItem[];
};

export type ProductDetails = Omit<ProductAdminListItem, "variantCount"> & {
  variants: ProductVariantSummary[];
};

export type CreateProductRequest = {
  name: string;
  description: string | null;
  categoryId: string | null;
  sortOrder: number;
  imageUrl: string | null;
};

export type CreateProductResponse = {
  productId: string;
  companyId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  status: CatalogAdminStatus;
  createdAtUtc: string;
};

export type UpdateProductRequest = CreateProductRequest;

export type ProductVariantAdmin = {
  productVariantId: string;
  companyId: string;
  productId: string;
  productName: string;
  salesUnitOfMeasureId: string;
  salesUnitOfMeasureCode: string;
  salesUnitOfMeasureName: string;
  salesUnitOfMeasureSymbol: string;
  salesUnitOfMeasureAllowsFractionalQuantity: boolean;
  name: string;
  sku: string | null;
  sortOrder: number;
  status: CatalogAdminStatus;
  createdAtUtc: string;
};

export type BranchProductVariantAvailability = {
  availabilityId: string | null;
  branchId: string;
  productId: string;
  productName: string;
  productStatus: CatalogAdminStatus;
  productVariantId: string;
  variantName: string;
  sku: string | null;
  variantStatus: CatalogAdminStatus;
  isConfigured: boolean;
  isAvailable: boolean;
  createdAtUtc: string | null;
  updatedAtUtc: string | null;
};

export type BranchProductVariantAvailabilityListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: BranchProductVariantAvailability[];
};

export type SetBranchProductVariantAvailabilityRequest = {
  isAvailable: boolean;
};

export type SetBranchProductVariantAvailabilityResponse = {
  availabilityId: string;
  branchId: string;
  productVariantId: string;
  isAvailable: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  wasCreated: boolean;
};

export type CreateProductVariantRequest = {
  name: string;
  sku: string | null;
  salesUnitOfMeasureId: string;
  sortOrder: number;
};

export type CreateProductVariantResponse = {
  productVariantId: string;
  companyId: string;
  productId: string;
  salesUnitOfMeasureId: string;
  name: string;
  sku: string | null;
  sortOrder: number;
  status: CatalogAdminStatus;
  createdAtUtc: string;
};

export type UpdateProductVariantRequest = {
  name: string;
  sku: string | null;
  sortOrder: number;
};

export type UnitOfMeasure = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  dimension: string;
  allowsFractionalQuantity: boolean;
};

export type ModifierGroupListItem = {
  modifierGroupId: string;
  companyId: string;
  name: string;
  status: CatalogAdminStatus;
  createdAtUtc: string;
  optionCount: number;
};

export type ModifierGroupListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: ModifierGroupListItem[];
};

export type ModifierGroupOptionSummary = {
  modifierOptionId: string;
  name: string;
  sortOrder: number;
  status: CatalogAdminStatus;
  createdAtUtc: string;
};

export type ModifierGroupDetails = Omit<ModifierGroupListItem, "optionCount"> & {
  options: ModifierGroupOptionSummary[];
};

export type CreateModifierGroupRequest = {
  name: string;
};

export type CreateModifierGroupResponse = Omit<ModifierGroupDetails, "options">;

export type UpdateModifierGroupRequest = CreateModifierGroupRequest;

export type ModifierOptionListResponse = {
  items: ModifierOptionAdmin[];
};

export type ModifierOptionAdmin = {
  modifierOptionId: string;
  modifierGroupId: string;
  groupName: string;
  name: string;
  sortOrder: number;
  status: CatalogAdminStatus;
  createdAtUtc: string;
};

export type CreateModifierOptionRequest = {
  name: string;
  sortOrder: number;
};

export type CreateModifierOptionResponse = Omit<
  ModifierOptionAdmin,
  "groupName"
>;

export type UpdateModifierOptionRequest = CreateModifierOptionRequest;

export type ProductVariantModifierGroup = {
  productVariantId: string;
  productVariantName: string;
  modifierGroupId: string;
  modifierGroupName: string;
  modifierGroupStatus: CatalogAdminStatus;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  isEnabled: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  optionCount: number;
};

export type ProductVariantModifierGroupListResponse = {
  items: ProductVariantModifierGroup[];
};

export type SetProductVariantModifierGroupRequest = {
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  isEnabled: boolean;
};

export type SetProductVariantModifierGroupResponse =
  SetProductVariantModifierGroupRequest & {
    productVariantModifierGroupId: string;
    productVariantId: string;
    modifierGroupId: string;
    createdAtUtc: string;
    updatedAtUtc: string;
    wasCreated: boolean;
  };
