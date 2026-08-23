import { httpClient } from "../../../shared/api/httpClient";
import type {
  CreatePurchaseOrderRequest,
  PostPurchaseGoodsReceiptRequest,
  PurchaseGoodsReceipt,
  PurchaseOrderDetails,
  PurchaseOrdersListFilters,
  PurchaseOrdersListResponse,
  UpdatePurchaseOrderRequest,
} from "../types/procurement.types";

function purchaseOrdersBaseUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/purchase-orders`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function getPurchaseOrders(
  companyId: string,
  branchId: string,
  filters: PurchaseOrdersListFilters = {},
) {
  const response = await httpClient.get<PurchaseOrdersListResponse>(
    purchaseOrdersBaseUrl(companyId, branchId),
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getPurchaseOrderDetails(
  companyId: string,
  branchId: string,
  purchaseOrderId: string,
) {
  const response = await httpClient.get<PurchaseOrderDetails>(
    `${purchaseOrdersBaseUrl(companyId, branchId)}/${purchaseOrderId}`,
  );

  return response.data;
}

export async function createPurchaseOrder(
  companyId: string,
  branchId: string,
  payload: CreatePurchaseOrderRequest,
) {
  const response = await httpClient.post<PurchaseOrderDetails>(
    purchaseOrdersBaseUrl(companyId, branchId),
    payload,
  );

  return response.data;
}

export async function updatePurchaseOrder(
  companyId: string,
  branchId: string,
  purchaseOrderId: string,
  payload: UpdatePurchaseOrderRequest,
) {
  const response = await httpClient.put<PurchaseOrderDetails>(
    `${purchaseOrdersBaseUrl(companyId, branchId)}/${purchaseOrderId}`,
    payload,
  );

  return response.data;
}

export async function submitPurchaseOrder(
  companyId: string,
  branchId: string,
  purchaseOrderId: string,
) {
  const response = await httpClient.post<PurchaseOrderDetails>(
    `${purchaseOrdersBaseUrl(companyId, branchId)}/${purchaseOrderId}/submit`,
  );

  return response.data;
}

export async function cancelPurchaseOrder(
  companyId: string,
  branchId: string,
  purchaseOrderId: string,
) {
  const response = await httpClient.post<PurchaseOrderDetails>(
    `${purchaseOrdersBaseUrl(companyId, branchId)}/${purchaseOrderId}/cancel`,
  );

  return response.data;
}

export async function closePurchaseOrder(
  companyId: string,
  branchId: string,
  purchaseOrderId: string,
) {
  const response = await httpClient.post<PurchaseOrderDetails>(
    `${purchaseOrdersBaseUrl(companyId, branchId)}/${purchaseOrderId}/close`,
  );

  return response.data;
}

export async function postPurchaseGoodsReceipt(
  companyId: string,
  branchId: string,
  purchaseOrderId: string,
  payload: PostPurchaseGoodsReceiptRequest,
) {
  const response = await httpClient.post<PurchaseGoodsReceipt>(
    `${purchaseOrdersBaseUrl(companyId, branchId)}/${purchaseOrderId}/receipts`,
    payload,
  );

  return response.data;
}

export async function getPurchaseGoodsReceipts(
  companyId: string,
  branchId: string,
  purchaseOrderId: string,
) {
  const response = await httpClient.get<PurchaseGoodsReceipt[]>(
    `${purchaseOrdersBaseUrl(companyId, branchId)}/${purchaseOrderId}/receipts`,
  );

  return response.data;
}
