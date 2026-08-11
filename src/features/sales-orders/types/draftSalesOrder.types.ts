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

export type DraftSalesOrder = {
  salesOrderId: string;
  companyId: string;
  branchId: string;
  priceListId: string;
  priceListName: string;
  currencyCode: string;
  fulfillmentType: SalesOrderFulfillmentType;
  restaurantTableId: string | null;
  status: "Draft" | "Confirmed" | "Cancelled" | "Closed";
  draftVersion: number;
  subtotalAmount: number;
  isTaxEnabled: boolean;
  priceListTaxMode: string | null;
  discountAmount: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  currencyMinorUnitDigits: number;
  payableAmount: number;
  createdByUserId: string;
  createdAtUtc: string;
  wasAlreadyCreated?: boolean;
  discount: DraftSalesOrderDiscount | null;
  taxSummaries: unknown[];
  lines: DraftSalesOrderLine[];
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
