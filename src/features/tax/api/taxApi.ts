import { httpClient } from "../../../shared/api/httpClient";
import type {
  ChangeTaxCategoryStatusRequest,
  CompanyTaxSettings,
  CreateTaxCategoryRequest,
  CreateTaxCategoryResponse,
  SetCompanyTaxSettingsRequest,
  SetCompanyTaxSettingsResponse,
  SetProductSalesTaxCategoryRequest,
  SetProductSalesTaxCategoryResponse,
  TaxCategory,
  TaxCategoryFilters,
  UpdateTaxCategoryRequest,
} from "../types/tax.types";

function taxUrl(companyId: string) {
  return `/api/companies/${companyId}/tax`;
}

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

export async function getCompanyTaxSettings(companyId: string) {
  const response = await httpClient.get<CompanyTaxSettings>(
    `${taxUrl(companyId)}/settings`,
  );

  return response.data;
}

export async function setCompanyTaxSettings(
  companyId: string,
  payload: SetCompanyTaxSettingsRequest,
) {
  const response = await httpClient.put<SetCompanyTaxSettingsResponse>(
    `${taxUrl(companyId)}/settings`,
    payload,
  );

  return response.data;
}

export async function getTaxCategories(
  companyId: string,
  filters: TaxCategoryFilters = {},
) {
  const response = await httpClient.get<TaxCategory[]>(
    `${taxUrl(companyId)}/categories`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getTaxCategoryDetails(companyId: string, taxCategoryId: string) {
  const response = await httpClient.get<TaxCategory>(
    `${taxUrl(companyId)}/categories/${taxCategoryId}`,
  );

  return response.data;
}

export async function createTaxCategory(
  companyId: string,
  payload: CreateTaxCategoryRequest,
) {
  const response = await httpClient.post<CreateTaxCategoryResponse>(
    `${taxUrl(companyId)}/categories`,
    payload,
  );

  return response.data;
}

export async function updateTaxCategory(
  companyId: string,
  taxCategoryId: string,
  payload: UpdateTaxCategoryRequest,
) {
  const response = await httpClient.put<TaxCategory>(
    `${taxUrl(companyId)}/categories/${taxCategoryId}`,
    payload,
  );

  return response.data;
}

export async function changeTaxCategoryStatus(
  companyId: string,
  taxCategoryId: string,
  payload: ChangeTaxCategoryStatusRequest,
) {
  const response = await httpClient.put<TaxCategory>(
    `${taxUrl(companyId)}/categories/${taxCategoryId}/status`,
    payload,
  );

  return response.data;
}

export async function setProductSalesTaxCategory(
  companyId: string,
  productId: string,
  payload: SetProductSalesTaxCategoryRequest,
) {
  const response = await httpClient.put<SetProductSalesTaxCategoryResponse>(
    `${catalogUrl(companyId)}/products/${productId}/sales-tax-category`,
    payload,
  );

  return response.data;
}
