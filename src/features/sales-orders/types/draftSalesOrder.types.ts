export type SalesOrderFulfillmentType = "DineIn" | "Takeaway" | "Delivery";

export type DraftSalesOrderLineInput = {
  productVariantId: string;
  quantity: number;
  modifierOptionIds: string[];
};

export type DraftSalesOrderDiscountInput = {
  type: "FixedAmount" | "Percentage";
  value: number;
  reason: string;
};

export type CreateDraftSalesOrderRequest = {
  fulfillmentType: SalesOrderFulfillmentType;
  restaurantTableId: string | null;
  lines: DraftSalesOrderLineInput[];
  discount: DraftSalesOrderDiscountInput | null;
};

export type UpdateDraftSalesOrderRequest = CreateDraftSalesOrderRequest & {
  expectedDraftVersion: number;
};

export type DraftSalesOrderUnitOfMeasure = {
  id: string;
  code: string;
  name: string;
  symbol: string;
};

export type DraftSalesOrderLineModifier = {
  modifierGroupId: string;
  modifierGroupName: string;
  modifierOptionId: string;
  modifierOptionName: string;
  amountAdjustment: number;
};

export type DraftSalesOrderLine = {
  salesOrderLineId: string;
  lineNumber: number;
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string | null;
  salesUnitOfMeasure: DraftSalesOrderUnitOfMeasure;
  quantity: number;
  baseUnitPrice: number;
  modifierUnitAdjustmentTotal: number;
  unitPrice: number;
  lineSubtotalAmount: number;
  discountAmount: number;
  discountedAmount: number;
  modifiers: DraftSalesOrderLineModifier[];
};

export type DraftSalesOrderDiscount = {
  salesOrderDiscountId: string;
  kind: string;
  type: string;
  requestedValue: number;
  appliedAmount: number;
  reason: string;
  appliedByUserId: string;
  appliedAtUtc: string;
};

export type DraftSalesOrderTaxSummary = {
  taxCategoryId: string;
  taxCategoryCode: string;
  taxCategoryName: string;
  treatment: string;
  ratePercent: number;
  configuredAmount: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
};

export type DraftSalesOrderKitchenTicket = {
  kitchenTicketId: string;
  kitchenStationId: string;
  kitchenStationCode: string;
  kitchenStationName: string;
  status: "New" | "Preparing" | "Ready" | "Cancelled" | string;
};

// Real Dine-In table info from SalesOrderDetailsResult.restaurantTable —
// replaces the old shortened-GUID table display wherever available.
export type DraftSalesOrderRestaurantTable = {
  restaurantTableId: string;
  code: string;
  name: string | null;
  restaurantFloorId: string;
  restaurantFloorName: string;
};

export type DraftSalesOrder = {
  salesOrderId: string;
  orderNumber?: number;
  orderNumberFormatted?: string;
  companyId: string;
  branchId: string;
  priceListId: string;
  priceListName: string;
  currencyCode: string;
  fulfillmentType: SalesOrderFulfillmentType;
  restaurantTableId: string | null;
  restaurantTable?: DraftSalesOrderRestaurantTable | null;
  status: "Draft" | "Confirmed" | "Cancelled" | "Closed";
  cancellationKind?: "Standard" | "PreparedVoid" | string | null;
  draftVersion: number;
  confirmedAtUtc?: string | null;
  confirmedByUserId?: string | null;
  cancelledAtUtc?: string | null;
  cancelledByUserId?: string | null;
  cancellationReason?: string | null;
  closedAtUtc?: string | null;
  closedByUserId?: string | null;
  subtotalAmount: number;
  isTaxEnabled: boolean;
  priceListTaxMode: string | null;
  discountAmount: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  currencyMinorUnitDigits: number;
  payableAmount: number;
  grossPaidAmount?: number;
  refundedAmount?: number;
  netPaidAmount?: number;
  remainingAmount?: number;
  isFullyPaid?: boolean;
  createdByUserId: string;
  createdAtUtc: string;
  wasAlreadyCreated?: boolean;
  discount: DraftSalesOrderDiscount | null;
  taxSummaries: DraftSalesOrderTaxSummary[];
  lines: DraftSalesOrderLine[];
  payments?: unknown[];
  kitchenTickets?: DraftSalesOrderKitchenTicket[];
};

export type ConfirmSalesOrderKitchenTicketItemModifier = {
  modifierGroupName: string;
  modifierOptionName: string;
};

export type ConfirmSalesOrderKitchenTicketItem = {
  kitchenTicketItemId: string;
  salesOrderLineId: string;
  lineNumber: number;
  productName: string;
  variantName: string;
  quantity: number;
  uomCode: string;
  modifiers: ConfirmSalesOrderKitchenTicketItemModifier[];
};

export type ConfirmSalesOrderKitchenTicket = {
  kitchenTicketId: string;
  kitchenStationId: string;
  kitchenStationCode: string;
  kitchenStationName: string;
  status: string;
  items: ConfirmSalesOrderKitchenTicketItem[];
};

export type ConfirmSalesOrderResponse = {
  salesOrderId: string;
  status: "Confirmed";
  confirmedAtUtc: string;
  confirmedByUserId: string;
  wasAlreadyConfirmed: boolean;
  kitchenTickets: ConfirmSalesOrderKitchenTicket[];
};

export type CloseSalesOrderResponse = {
  salesOrderId: string;
  status: "Closed";
  closedAtUtc: string;
  closedByUserId: string;
  payableAmount: number;
  grossPaidAmount: number;
  refundedAmount: number;
  netPaidAmount: number;
  paidAmount: number;
  remainingAmount: number;
  wasAlreadyClosed: boolean;
};

export type CancelSalesOrderRequest = {
  reason: string;
};

export type CancelSalesOrderResponse = {
  salesOrderId: string;
  status: "Cancelled";
  cancelledAtUtc: string;
  cancelledByUserId: string;
  cancellationReason: string;
  wasAlreadyCancelled: boolean;
  inventoryReversed: boolean;
  inventoryStockTransactionId: string | null;
};

export type VoidPreparedSalesOrderRequest = {
  reason: string;
};

export type VoidPreparedSalesOrderKitchenTicket = {
  kitchenTicketId: string;
  status: string;
  startedAtUtc: string | null;
  startedByUserId: string | null;
  readyAtUtc: string | null;
  readyByUserId: string | null;
  cancelledAtUtc: string | null;
  cancelledByUserId: string | null;
};

export type VoidPreparedSalesOrderResponse = {
  salesOrderId: string;
  status: "Cancelled";
  cancellationKind: "PreparedVoid";
  cancelledAtUtc: string;
  cancelledByUserId: string;
  cancellationReason: string;
  wasAlreadyVoided: boolean;
  kitchenTickets: VoidPreparedSalesOrderKitchenTicket[];
};

export type RetrievableSalesOrderStatus = "Draft" | "Confirmed";

export type RetrievableSalesOrdersFilters = {
  pageNumber?: number;
  pageSize?: number;
  status?: RetrievableSalesOrderStatus | "";
  fulfillmentType?: SalesOrderFulfillmentType | "";
  restaurantTableId?: string;
  search?: string;
};

export type RetrievableSalesOrder = {
  salesOrderId: string;
  orderNumber: number;
  orderNumberFormatted: string;
  status: RetrievableSalesOrderStatus;
  fulfillmentType: SalesOrderFulfillmentType | null;
  restaurantTableId: string | null;
  restaurantTableCode: string | null;
  draftVersion: number;
  currencyCode: string;
  payableAmount: number;
  netPaidAmount: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type RetrievableSalesOrdersResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: RetrievableSalesOrder[];
};
