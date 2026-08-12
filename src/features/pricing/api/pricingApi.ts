import { httpClient } from "../../../shared/api/httpClient";
import type {
  ChangePriceListStatusRequest,
  CreatePriceListRequest,
  CreatePriceListResponse,
  ModifierPrice,
  ModifierPriceListResponse,
  PriceList,
  PriceListFilters,
  PriceListListResponse,
  ProductVariantPrice,
  ProductVariantPriceFilters,
  ProductVariantPriceListResponse,
  SetModifierOptionPriceRequest,
  SetModifierOptionPriceResponse,
  SetPriceListTaxModeRequest,
  SetPriceListTaxModeResponse,
  SetProductVariantPriceRequest,
  SetProductVariantPriceResponse,
  UpdatePriceListRequest,
} from "../types/pricing.types";

function priceListsUrl(companyId: string) {
  return `/api/companies/${companyId}/pricing/price-lists`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function getPriceLists(
  companyId: string,
  filters: PriceListFilters = {},
) {
  const response = await httpClient.get<PriceListListResponse>(
    priceListsUrl(companyId),
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getPriceListDetails(companyId: string, priceListId: string) {
  const response = await httpClient.get<PriceList>(
    `${priceListsUrl(companyId)}/${priceListId}`,
  );

  return response.data;
}

export async function createPriceList(
  companyId: string,
  payload: CreatePriceListRequest,
) {
  const response = await httpClient.post<CreatePriceListResponse>(
    priceListsUrl(companyId),
    payload,
  );

  return response.data;
}

export async function updatePriceList(
  companyId: string,
  priceListId: string,
  payload: UpdatePriceListRequest,
) {
  const response = await httpClient.put<PriceList>(
    `${priceListsUrl(companyId)}/${priceListId}`,
    payload,
  );

  return response.data;
}

export async function changePriceListStatus(
  companyId: string,
  priceListId: string,
  payload: ChangePriceListStatusRequest,
) {
  const response = await httpClient.put<PriceList>(
    `${priceListsUrl(companyId)}/${priceListId}/status`,
    payload,
  );

  return response.data;
}

export async function setPriceListTaxMode(
  companyId: string,
  priceListId: string,
  payload: SetPriceListTaxModeRequest,
) {
  const response = await httpClient.put<SetPriceListTaxModeResponse>(
    `${priceListsUrl(companyId)}/${priceListId}/tax-mode`,
    payload,
  );

  return response.data;
}

export async function getProductVariantPrices(
  companyId: string,
  priceListId: string,
  filters: ProductVariantPriceFilters = {},
) {
  const response = await httpClient.get<ProductVariantPriceListResponse>(
    `${priceListsUrl(companyId)}/${priceListId}/items`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getProductVariantPriceDetails(
  companyId: string,
  priceListId: string,
  productVariantId: string,
) {
  const response = await httpClient.get<ProductVariantPrice>(
    `${priceListsUrl(companyId)}/${priceListId}/items/${productVariantId}`,
  );

  return response.data;
}

export async function setProductVariantPrice(
  companyId: string,
  priceListId: string,
  productVariantId: string,
  payload: SetProductVariantPriceRequest,
) {
  const response = await httpClient.put<SetProductVariantPriceResponse>(
    `${priceListsUrl(companyId)}/${priceListId}/items/${productVariantId}`,
    payload,
  );

  return response.data;
}

export async function removeProductVariantPrice(
  companyId: string,
  priceListId: string,
  productVariantId: string,
) {
  const response = await httpClient.delete<ProductVariantPrice>(
    `${priceListsUrl(companyId)}/${priceListId}/items/${productVariantId}`,
  );

  return response.data;
}

export async function getModifierPrices(
  companyId: string,
  priceListId: string,
  productVariantId: string,
) {
  const response = await httpClient.get<ModifierPriceListResponse>(
    `${priceListsUrl(companyId)}/${priceListId}/variants/${productVariantId}/modifier-prices`,
  );

  return response.data;
}

export async function getModifierPriceDetails(
  companyId: string,
  priceListId: string,
  productVariantId: string,
  modifierGroupId: string,
  modifierOptionId: string,
) {
  const response = await httpClient.get<ModifierPrice>(
    `${priceListsUrl(companyId)}/${priceListId}/variants/${productVariantId}/modifier-groups/${modifierGroupId}/options/${modifierOptionId}`,
  );

  return response.data;
}

export async function setModifierOptionPrice(
  companyId: string,
  priceListId: string,
  productVariantId: string,
  modifierGroupId: string,
  modifierOptionId: string,
  payload: SetModifierOptionPriceRequest,
) {
  const response = await httpClient.put<SetModifierOptionPriceResponse>(
    `${priceListsUrl(companyId)}/${priceListId}/variants/${productVariantId}/modifier-groups/${modifierGroupId}/options/${modifierOptionId}`,
    payload,
  );

  return response.data;
}

export async function removeModifierOptionPrice(
  companyId: string,
  priceListId: string,
  productVariantId: string,
  modifierGroupId: string,
  modifierOptionId: string,
) {
  const response = await httpClient.delete<ModifierPrice>(
    `${priceListsUrl(companyId)}/${priceListId}/variants/${productVariantId}/modifier-groups/${modifierGroupId}/options/${modifierOptionId}`,
  );

  return response.data;
}
