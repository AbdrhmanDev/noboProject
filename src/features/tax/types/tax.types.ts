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
  // VAT-registered (KSA Phase 1/2) but no valid Saudi VAT number on the company profile: tax invoices print without it and without a QR.
  sellerVatNumberMissing?: boolean;
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

// Confirmed orders with no invoice yet: they block a billing-regime change until paid or cancelled.
export type BillingRegimeBlockingOrder = {
  salesOrderId: string;
  orderNumber: string;
  branchId: string;
  branchName: string;
  status: string;
  createdAtUtc: string;
  confirmedAtUtc: string | null;
  currencyCode: string;
  payableAmount: number;
  paidAmount: number;
};

export type BillingRegimeBlockingOrders = {
  total: number;
  items: BillingRegimeBlockingOrder[];
};

export type CancelStaleDraftSalesOrdersRequest = {
  olderThanDays: number;
  reason?: string | null;
  previewOnly: boolean;
};

export type CancelStaleDraftSalesOrdersResponse = {
  olderThanDays: number;
  matching: number;
  cancelled: number;
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
