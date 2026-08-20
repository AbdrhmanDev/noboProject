import type { SalesOrderFulfillmentType } from "../../sales-orders/types/draftSalesOrder.types";

export type SalesOrderStatus = "Draft" | "Confirmed" | "Cancelled" | "Closed";

// GET /api/companies/{companyId}/branches/{branchId}/sales-orders — every
// field below is always present in the response (confirmed via the live
// OpenAPI SalesOrderListItemResult schema); fields marked `| null` are
// genuinely nullable per that schema, not defensively-optional guesses.
export type SalesOrderListItem = {
  salesOrderId: string;
  orderNumber: number;
  orderNumberFormatted: string;
  status: SalesOrderStatus;
  cancellationKind: string | null;
  fulfillmentType: SalesOrderFulfillmentType | null;
  draftVersion: number;
  createdAtUtc: string;
  confirmedAtUtc: string | null;
  cancelledAtUtc: string | null;
  closedAtUtc: string | null;
  restaurantTableId: string | null;
  restaurantTableCode: string | null;
  lineCount: number;
  totalQuantity: number;
  currencyCode: string;
  currencyMinorUnitDigits: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  payableAmount: number;
  discountAmount: number;
  grossPaidAmount: number;
  refundedAmount: number;
  netPaidAmount: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  kitchenTicketCount: number;
  newKitchenTicketCount: number;
  preparingKitchenTicketCount: number;
  readyKitchenTicketCount: number;
  cancelledKitchenTicketCount: number;
};

export type SalesOrdersListFilters = {
  pageNumber?: number;
  pageSize?: number;
  status?: SalesOrderStatus | "";
  fulfillmentType?: SalesOrderFulfillmentType | "";
  createdFromUtc?: string;
  createdToUtc?: string;
  restaurantTableId?: string;
  // Accepts bare "100245" or "ORD-100245" — sent to the backend as-is, never
  // used to filter client-side.
  orderNumber?: string;
};

export type SalesOrdersListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: SalesOrderListItem[];
};

// ---- Sales Overview ----
// GET /api/companies/{companyId}/branches/{branchId}/sales/overview
// Monetary scope is Confirmed + Closed only (backend-enforced); orderCount
// in statusBreakdown covers every status for operational visibility.

export type SalesOverviewFilters = {
  fromUtc?: string;
  toUtc?: string;
};

export type SalesOverviewPaymentMethodBreakdown = {
  paymentMethodId: string;
  paymentMethodName: string;
  netAmount: number;
  transactionCount: number;
};

export type SalesOverviewFulfillmentBreakdown = {
  fulfillmentType: SalesOrderFulfillmentType | null;
  orderCount: number;
  salesAmount: number;
};

export type SalesOverviewTrendPoint = {
  date: string;
  orderCount: number;
  salesAmount: number;
};

export type SalesOverviewStatusBreakdown = {
  status: SalesOrderStatus;
  orderCount: number;
};

// currencyCode is nullable — it is only ever null when orderCount is 0 (no
// orders in range), which callers should treat as the empty-range state,
// not an error.
export type SalesOverview = {
  fromUtc: string | null;
  toUtc: string | null;
  currencyCode: string | null;
  orderCount: number;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  payableAmount: number;
  netPaidAmount: number;
  outstandingAmount: number;
  averageOrderValue: number;
  paymentMethodBreakdown: SalesOverviewPaymentMethodBreakdown[];
  fulfillmentBreakdown: SalesOverviewFulfillmentBreakdown[];
  trend: SalesOverviewTrendPoint[];
  statusBreakdown: SalesOverviewStatusBreakdown[];
};
