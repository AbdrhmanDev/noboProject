export type TaxCategoryStatus = "Active" | "Suspended";
export type TaxTreatment = "StandardRated" | "ZeroRated" | "Exempt";

export type CompanyTaxSettings = {
  companyId: string;
  isTaxEnabled: boolean;
  isConfigured: boolean;
  createdAtUtc: string | null;
  updatedAtUtc: string | null;
};

export type SetCompanyTaxSettingsRequest = {
  isTaxEnabled: boolean;
};

export type SetCompanyTaxSettingsResponse = CompanyTaxSettings & {
  wasCreated: boolean;
};

export type TaxCategoryFilters = {
  status?: TaxCategoryStatus | "";
  treatment?: TaxTreatment | "";
  search?: string;
};

export type TaxCategory = {
  taxCategoryId: string;
  companyId: string;
  code: string;
  name: string;
  treatment: TaxTreatment;
  ratePercent: number;
  status: TaxCategoryStatus;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type CreateTaxCategoryRequest = {
  code: string;
  name: string;
  treatment: TaxTreatment;
  ratePercent: number;
};

export type CreateTaxCategoryResponse = Omit<TaxCategory, "status">;

export type UpdateTaxCategoryRequest = {
  code: string;
  name: string;
  ratePercent: number;
};

export type ChangeTaxCategoryStatusRequest = {
  status: TaxCategoryStatus;
};

export type SetProductSalesTaxCategoryRequest = {
  taxCategoryId: string | null;
};

export type SetProductSalesTaxCategoryResponse = {
  productId: string;
  companyId: string;
  salesTaxCategoryId: string | null;
};
