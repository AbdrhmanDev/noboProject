export type TaxCategoryStatus = "Active" | "Suspended";
export type TaxTreatment = "StandardRated" | "ZeroRated" | "Exempt";

// "NotVatRegistered": no VAT, sales receipts, no QR. "KsaPhase1": VAT tax invoices with the 5-tag QR.
// "KsaPhase2": VAT + ZATCA integration (reached only by enabling the integration).
export type BillingRegime = "NotVatRegistered" | "KsaPhase1" | "KsaPhase2";

export type CompanyTaxSettings = {
  companyId: string;
  isTaxEnabled: boolean;
  isConfigured: boolean;
  createdAtUtc: string | null;
  updatedAtUtc: string | null;
  billingRegime?: BillingRegime;
};

export type SetCompanyBillingRegimeRequest = {
  targetRegime: "NotVatRegistered" | "KsaPhase1";
  // Required when moving to KsaPhase1: true = current prices include VAT, false = VAT is added on top.
  pricesIncludeVat?: boolean | null;
  reason?: string | null;
};

export type SetCompanyBillingRegimeResponse = {
  companyId: string;
  billingRegime: BillingRegime;
  isTaxEnabled: boolean;
  changed: boolean;
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
