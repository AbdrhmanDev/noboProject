export type CatalogAdminStatus = "Active" | "Suspended";

export type CatalogStatusFilter = {
  status?: CatalogAdminStatus | "";
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
};

export type CreateProductResponse = {
  productId: string;
  companyId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
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
