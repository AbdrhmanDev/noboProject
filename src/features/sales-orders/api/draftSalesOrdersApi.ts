import { httpClient } from "../../../shared/api/httpClient";
import type {
  CancelSalesOrderRequest,
  CancelSalesOrderResponse,
  CloseSalesOrderResponse,
  ConfirmSalesOrderResponse,
  CreateDraftSalesOrderRequest,
  DraftSalesOrder,
  RetrievableSalesOrdersFilters,
  RetrievableSalesOrdersResponse,
  UpdateDraftSalesOrderRequest,
  VoidPreparedSalesOrderRequest,
  VoidPreparedSalesOrderResponse,
} from "../types/draftSalesOrder.types";

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

function salesOrdersBaseUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/sales-orders`;
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function createDraftSalesOrder(
  companyId: string,
  branchId: string,
  payload: CreateDraftSalesOrderRequest,
) {
  const response = await httpClient.post<DraftSalesOrder>(
    salesOrdersBaseUrl(companyId, branchId),
    payload,
    {
      headers: {
        "Idempotency-Key": createIdempotencyKey(),
      },
    },
  );

  return response.data;
}

export async function updateDraftSalesOrder(
  companyId: string,
  branchId: string,
  salesOrderId: string,
  payload: UpdateDraftSalesOrderRequest,
) {
  const response = await httpClient.put<DraftSalesOrder>(
    `${salesOrdersBaseUrl(companyId, branchId)}/${salesOrderId}/draft`,
    payload,
  );

  return response.data;
}

export async function getRetrievableSalesOrders(
  companyId: string,
  branchId: string,
  filters: RetrievableSalesOrdersFilters = {},
) {
  const response = await httpClient.get<RetrievableSalesOrdersResponse>(
    `${salesOrdersBaseUrl(companyId, branchId)}/retrievable`,
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getSalesOrderDetails(
  companyId: string,
  branchId: string,
  salesOrderId: string,
) {
  const response = await httpClient.get<Record<string, any>>(
    `${salesOrdersBaseUrl(companyId, branchId)}/${salesOrderId}`,
  );

  return normalizeDraftDetails(response.data);
}

export async function confirmSalesOrder(
  companyId: string,
  branchId: string,
  salesOrderId: string,
) {
  const response = await httpClient.post<ConfirmSalesOrderResponse>(
    `${salesOrdersBaseUrl(companyId, branchId)}/${salesOrderId}/confirm`,
  );

  return response.data;
}

export async function closeSalesOrder(
  companyId: string,
  branchId: string,
  salesOrderId: string,
) {
  const response = await httpClient.post<CloseSalesOrderResponse>(
    `${salesOrdersBaseUrl(companyId, branchId)}/${salesOrderId}/close`,
  );

  return response.data;
}

export async function cancelSalesOrder(
  companyId: string,
  branchId: string,
  salesOrderId: string,
  payload: CancelSalesOrderRequest,
) {
  const response = await httpClient.post<CancelSalesOrderResponse>(
    `${salesOrdersBaseUrl(companyId, branchId)}/${salesOrderId}/cancel`,
    payload,
  );

  return response.data;
}

export async function voidPreparedSalesOrder(
  companyId: string,
  branchId: string,
  salesOrderId: string,
  payload: VoidPreparedSalesOrderRequest,
) {
  const response = await httpClient.post<VoidPreparedSalesOrderResponse>(
    `${salesOrdersBaseUrl(companyId, branchId)}/${salesOrderId}/void-prepared`,
    payload,
  );

  return response.data;
}

function normalizeDraftDetails(data: Record<string, any>): DraftSalesOrder {
  if ("priceListId" in data && "lines" in data && data.lines?.[0]?.unitPrice !== undefined) {
    return data as DraftSalesOrder;
  }

  const discount = data.discounts?.[0] || null;

  return {
    salesOrderId: data.salesOrderId,
    companyId: data.companyId,
    branchId: data.branchId,
    priceListId: "",
    priceListName: "",
    currencyCode: data.currencyCode,
    fulfillmentType: data.fulfillmentType,
    restaurantTableId: data.restaurantTable?.restaurantTableId || null,
    status: data.status,
    draftVersion: data.draftVersion,
    confirmedAtUtc: data.confirmedAtUtc || null,
    confirmedByUserId: data.confirmedByUserId || null,
    cancelledAtUtc: data.cancelledAtUtc || null,
    cancelledByUserId: data.cancelledByUserId || null,
    cancellationReason: data.cancellationReason || null,
    closedAtUtc: data.closedAtUtc || null,
    closedByUserId: data.closedByUserId || null,
    cancellationKind: data.cancellationKind || null,
    subtotalAmount: data.subtotalAmount,
    isTaxEnabled: Boolean(data.taxSummaries?.length),
    priceListTaxMode: null,
    discountAmount: data.discountAmount,
    netAmount: data.netAmount,
    taxAmount: data.taxAmount,
    grossAmount: data.grossAmount,
    currencyMinorUnitDigits: data.currencyMinorUnitDigits,
    payableAmount: data.payableAmount,
    grossPaidAmount: data.grossPaidAmount,
    refundedAmount: data.refundedAmount,
    netPaidAmount: data.netPaidAmount,
    remainingAmount: data.remainingAmount,
    isFullyPaid: data.isFullyPaid,
    createdByUserId: data.createdByUserId,
    createdAtUtc: data.createdAtUtc,
    discount: discount
      ? {
          salesOrderDiscountId: discount.salesOrderDiscountId,
          kind: discount.kind,
          type: discount.type,
          requestedValue: discount.requestedValue,
          appliedAmount: discount.appliedAmount,
          reason: discount.reason,
          appliedByUserId: discount.appliedByUserId,
          appliedAtUtc: discount.appliedAtUtc,
        }
      : null,
    taxSummaries: (data.taxSummaries || []).map((summary: Record<string, any>) => ({
      taxCategoryId: summary.taxCategoryId,
      taxCategoryCode: summary.taxCategoryCodeSnapshot ?? summary.taxCategoryCode,
      taxCategoryName: summary.taxCategoryNameSnapshot ?? summary.taxCategoryName,
      treatment: summary.taxTreatmentSnapshot ?? summary.treatment,
      ratePercent: summary.taxRatePercentSnapshot ?? summary.ratePercent,
      configuredAmount: summary.configuredAmount,
      netAmount: summary.netAmount,
      taxAmount: summary.taxAmount,
      grossAmount: summary.grossAmount,
    })),
    payments: data.payments || [],
    kitchenTickets: (data.kitchenTickets || []).map((ticket: Record<string, any>) => ({
      kitchenTicketId: ticket.kitchenTicketId,
      kitchenStationId: ticket.kitchenStationId,
      kitchenStationCode: ticket.kitchenStationCode,
      kitchenStationName: ticket.kitchenStationName,
      status: ticket.status,
    })),
    lines: (data.lines || []).map((line: Record<string, any>) => ({
      salesOrderLineId: line.salesOrderLineId,
      lineNumber: line.lineNumber,
      productVariantId: line.productVariantId,
      productName: line.productName,
      variantName: line.variantName,
      sku: line.sku,
      salesUnitOfMeasure: {
        id: line.salesUnitOfMeasureId,
        code: line.uomCode,
        name: line.uomName,
        symbol: line.uomSymbol,
      },
      quantity: line.quantity,
      baseUnitPrice: line.unitBasePrice,
      modifierUnitAdjustmentTotal: line.modifierTotalPerUnit,
      unitPrice: line.unitFinalPrice,
      lineSubtotalAmount: line.lineSubtotal,
      discountAmount: line.discountAmount,
      discountedAmount: line.discountedAmount,
      modifiers: (line.modifiers || []).map((modifier: Record<string, any>) => ({
        modifierGroupId: modifier.modifierGroupId,
        modifierGroupName: modifier.modifierGroupNameSnapshot,
        modifierOptionId: modifier.modifierOptionId,
        modifierOptionName: modifier.modifierOptionNameSnapshot,
        amountAdjustment: modifier.priceAdjustmentSnapshot,
      })),
    })),
  };
}
