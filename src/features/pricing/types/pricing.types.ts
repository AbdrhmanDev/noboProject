export type PricingStatus = "Active" | "Suspended";
export type PriceListTaxMode = "Inclusive" | "Exclusive";
export type PriceConfigurationFilter = "configured" | "missing" | "";

export type PriceListFilters = {
  status?: PricingStatus | "";
  search?: string;
};

export type PriceList = {
  priceListId: string;
  companyId: string;
  name: string;
  currencyCode: string;
  isDefault: boolean;
  taxMode: PriceListTaxMode | null;
  status: PricingStatus;
  createdAtUtc: string;
};

export type PriceListListResponse = {
  items: PriceList[];
};

export type CreatePriceListRequest = {
  name: string;
  isDefault: boolean;
  taxMode: PriceListTaxMode | null;
};

export type CreatePriceListResponse = PriceList & {
  taxMode: PriceListTaxMode;
};

export type UpdatePriceListRequest = {
  name: string;
};

export type ChangePriceListStatusRequest = {
  status: PricingStatus;
};

export type SetPriceListTaxModeRequest = {
  taxMode: PriceListTaxMode | null;
};

export type SetPriceListTaxModeResponse = {
  priceListId: string;
  companyId: string;
  taxMode: PriceListTaxMode;
};

export type ProductVariantPriceFilters = {
  categoryId?: string | "";
  productId?: string | "";
  search?: string;
  configuration?: PriceConfigurationFilter;
  pageNumber?: number;
  pageSize?: number;
};

export type ProductVariantPrice = {
  priceListId: string;
  priceListName: string;
  currencyCode: string;
  productVariantId: string;
  sku: string | null;
  variantName: string;
  variantStatus: PricingStatus;
  productId: string;
  productName: string;
  productStatus: PricingStatus;
  categoryId: string | null;
  categoryName: string | null;
  isConfigured: boolean;
  amount: number | null;
  createdAtUtc: string | null;
  updatedAtUtc: string | null;
};

export type ProductVariantPriceListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: ProductVariantPrice[];
};

export type SetProductVariantPriceRequest = {
  amount: number;
};

export type SetProductVariantPriceResponse = {
  priceListItemId: string;
  priceListId: string;
  productVariantId: string;
  amount: number;
  currencyCode: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  wasCreated: boolean;
};

export type ModifierPrice = {
  priceListId: string;
  priceListName: string;
  currencyCode: string;
  productVariantId: string;
  productVariantName: string;
  productVariantModifierGroupId: string;
  modifierGroupId: string;
  modifierGroupName: string;
  modifierGroupStatus: PricingStatus;
  isAssignmentEnabled: boolean;
  minSelections: number;
  maxSelections: number;
  assignmentSortOrder: number;
  modifierOptionId: string;
  modifierOptionName: string;
  modifierOptionStatus: PricingStatus;
  modifierOptionSortOrder: number;
  isConfigured: boolean;
  amountAdjustment: number | null;
  createdAtUtc: string | null;
  updatedAtUtc: string | null;
};

export type ModifierPriceListResponse = {
  items: ModifierPrice[];
};

export type SetModifierOptionPriceRequest = {
  amountAdjustment: number;
};

export type SetModifierOptionPriceResponse = {
  modifierOptionPriceId: string;
  priceListId: string;
  productVariantId: string;
  modifierGroupId: string;
  modifierOptionId: string;
  amountAdjustment: number;
  currencyCode: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  wasCreated: boolean;
};
