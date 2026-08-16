import { httpClient } from "../../../shared/api/httpClient";
import type {
  ChangeInventoryItemStatusRequest,
  ChangeInventoryLocationStatusRequest,
  CreateInventoryItemRequest,
  CreateInventoryLocationRequest,
  InventoryItem,
  InventoryItemFilters,
  InventoryItemListResponse,
  InventoryLocation,
  InventoryLocationFilters,
  InventoryLocationStock,
  InventoryStockTransactionDetails,
  InventoryStockTransactionFilters,
  InventoryStockTransactionListResponse,
  ModifierOptionInventoryAdjustments,
  PostManualStockAdjustmentRequest,
  PostManualStockAdjustmentResponse,
  ProductVariantInventoryConsumption,
  SetModifierOptionInventoryAdjustmentRequest,
  SetModifierOptionInventoryAdjustmentResponse,
  SetProductVariantInventoryComponentRequest,
  SetProductVariantInventoryComponentResponse,
  UpdateInventoryItemRequest,
  UpdateInventoryLocationRequest,
} from "../types/inventory.types";

function companyInventoryUrl(companyId: string) {
  return `/api/companies/${companyId}/inventory`;
}

function branchInventoryUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/inventory`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

// Inventory Items

export async function getActiveInventoryItems(companyId: string) {
  const response = await httpClient.get<InventoryItem[]>(
    `${companyInventoryUrl(companyId)}/items`,
  );

  return response.data;
}

export async function getInventoryItems(
  companyId: string,
  filters: InventoryItemFilters = {},
) {
  const response = await httpClient.get<InventoryItemListResponse>(
    `${companyInventoryUrl(companyId)}/admin/items`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getInventoryItemDetails(companyId: string, inventoryItemId: string) {
  const response = await httpClient.get<InventoryItem>(
    `${companyInventoryUrl(companyId)}/admin/items/${inventoryItemId}`,
  );

  return response.data;
}

export async function createInventoryItem(
  companyId: string,
  payload: CreateInventoryItemRequest,
) {
  const response = await httpClient.post<InventoryItem>(
    `${companyInventoryUrl(companyId)}/items`,
    payload,
  );

  return response.data;
}

export async function updateInventoryItem(
  companyId: string,
  inventoryItemId: string,
  payload: UpdateInventoryItemRequest,
) {
  const response = await httpClient.put<InventoryItem>(
    `${companyInventoryUrl(companyId)}/admin/items/${inventoryItemId}`,
    payload,
  );

  return response.data;
}

export async function changeInventoryItemStatus(
  companyId: string,
  inventoryItemId: string,
  payload: ChangeInventoryItemStatusRequest,
) {
  const response = await httpClient.put<InventoryItem>(
    `${companyInventoryUrl(companyId)}/admin/items/${inventoryItemId}/status`,
    payload,
  );

  return response.data;
}

// Inventory Locations

export async function getOperationalInventoryLocations(companyId: string, branchId: string) {
  const response = await httpClient.get<InventoryLocation[]>(
    `${branchInventoryUrl(companyId, branchId)}/locations`,
  );

  return response.data;
}

export async function getInventoryLocations(
  companyId: string,
  branchId: string,
  filters: InventoryLocationFilters = {},
) {
  const response = await httpClient.get<InventoryLocation[]>(
    `${branchInventoryUrl(companyId, branchId)}/admin/locations`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getInventoryLocationDetails(
  companyId: string,
  branchId: string,
  inventoryLocationId: string,
) {
  const response = await httpClient.get<InventoryLocation>(
    `${branchInventoryUrl(companyId, branchId)}/admin/locations/${inventoryLocationId}`,
  );

  return response.data;
}

export async function createInventoryLocation(
  companyId: string,
  branchId: string,
  payload: CreateInventoryLocationRequest,
) {
  const response = await httpClient.post<InventoryLocation>(
    `${branchInventoryUrl(companyId, branchId)}/locations`,
    payload,
  );

  return response.data;
}

export async function updateInventoryLocation(
  companyId: string,
  branchId: string,
  inventoryLocationId: string,
  payload: UpdateInventoryLocationRequest,
) {
  const response = await httpClient.put<InventoryLocation>(
    `${branchInventoryUrl(companyId, branchId)}/admin/locations/${inventoryLocationId}`,
    payload,
  );

  return response.data;
}

export async function changeInventoryLocationStatus(
  companyId: string,
  branchId: string,
  inventoryLocationId: string,
  payload: ChangeInventoryLocationStatusRequest,
) {
  const response = await httpClient.put<InventoryLocation>(
    `${branchInventoryUrl(companyId, branchId)}/admin/locations/${inventoryLocationId}/status`,
    payload,
  );

  return response.data;
}

// Product Variant Consumption Components

export async function getProductVariantInventoryConsumption(
  companyId: string,
  productVariantId: string,
) {
  const response = await httpClient.get<ProductVariantInventoryConsumption>(
    `${companyInventoryUrl(companyId)}/consumption/variants/${productVariantId}`,
  );

  return response.data;
}

export async function setProductVariantInventoryComponent(
  companyId: string,
  productVariantId: string,
  inventoryItemId: string,
  payload: SetProductVariantInventoryComponentRequest,
) {
  const response = await httpClient.put<SetProductVariantInventoryComponentResponse>(
    `${companyInventoryUrl(companyId)}/consumption/variants/${productVariantId}/items/${inventoryItemId}`,
    payload,
  );

  return response.data;
}

export async function removeProductVariantInventoryComponent(
  companyId: string,
  productVariantId: string,
  inventoryItemId: string,
) {
  await httpClient.delete(
    `${companyInventoryUrl(companyId)}/consumption/variants/${productVariantId}/items/${inventoryItemId}`,
  );
}

// Modifier Option Inventory Adjustments

export async function getModifierOptionInventoryAdjustments(
  companyId: string,
  modifierOptionId: string,
) {
  const response = await httpClient.get<ModifierOptionInventoryAdjustments>(
    `${companyInventoryUrl(companyId)}/consumption/modifier-options/${modifierOptionId}`,
  );

  return response.data;
}

export async function setModifierOptionInventoryAdjustment(
  companyId: string,
  modifierOptionId: string,
  inventoryItemId: string,
  payload: SetModifierOptionInventoryAdjustmentRequest,
) {
  const response = await httpClient.put<SetModifierOptionInventoryAdjustmentResponse>(
    `${companyInventoryUrl(companyId)}/consumption/modifier-options/${modifierOptionId}/items/${inventoryItemId}`,
    payload,
  );

  return response.data;
}

export async function removeModifierOptionInventoryAdjustment(
  companyId: string,
  modifierOptionId: string,
  inventoryItemId: string,
) {
  await httpClient.delete(
    `${companyInventoryUrl(companyId)}/consumption/modifier-options/${modifierOptionId}/items/${inventoryItemId}`,
  );
}

// Stock

export async function getInventoryLocationStock(
  companyId: string,
  branchId: string,
  inventoryLocationId: string,
) {
  const response = await httpClient.get<InventoryLocationStock>(
    `${branchInventoryUrl(companyId, branchId)}/locations/${inventoryLocationId}/stock`,
  );

  return response.data;
}

// Manual Stock Adjustment

function createInventoryAdjustmentIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `inventory-adjustment-${crypto.randomUUID()}`;
  }

  return `inventory-adjustment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function postManualStockAdjustment(
  companyId: string,
  branchId: string,
  inventoryLocationId: string,
  payload: PostManualStockAdjustmentRequest,
) {
  const response = await httpClient.post<PostManualStockAdjustmentResponse>(
    `${branchInventoryUrl(companyId, branchId)}/locations/${inventoryLocationId}/adjustments`,
    payload,
    {
      headers: {
        "Idempotency-Key": createInventoryAdjustmentIdempotencyKey(),
      },
    },
  );

  return response.data;
}

// Ledger

export async function getInventoryStockTransactions(
  companyId: string,
  branchId: string,
  filters: InventoryStockTransactionFilters = {},
) {
  const response = await httpClient.get<InventoryStockTransactionListResponse>(
    `${branchInventoryUrl(companyId, branchId)}/transactions`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getInventoryStockTransactionDetails(
  companyId: string,
  branchId: string,
  inventoryStockTransactionId: string,
) {
  const response = await httpClient.get<InventoryStockTransactionDetails>(
    `${branchInventoryUrl(companyId, branchId)}/transactions/${inventoryStockTransactionId}`,
  );

  return response.data;
}
