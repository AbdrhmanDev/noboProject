import type { SalesOrderFulfillmentType } from "../../sales-orders/types/draftSalesOrder.types";

export type SalesOrderStatus = "Draft" | "Confirmed" | "Cancelled" | "Closed";

// GET /api/companies/{companyId}/branches/{branchId}/sales-orders — confirmed
// live via the app's OpenAPI document (route + query parameters), but that
// document does not describe response schemas for this backend, and no
// existing frontend code calls this endpoint yet. Only `salesOrderId` and
// `status` are certain; everything else is modeled optional and rendered
// defensively (never fabricated) — see salesOrdersApi.ts and SalesPage.jsx
// for how each field degrades when absent.
export type SalesOrderListItem = {
  salesOrderId: string;
  status: SalesOrderStatus;
  fulfillmentType?: SalesOrderFulfillmentType | null;
  restaurantTableId?: string | null;
  restaurantTableCode?: string | null;
  currencyCode?: string;
  currencyMinorUnitDigits?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  payableAmount?: number;
  netPaidAmount?: number;
  remainingAmount?: number;
  isFullyPaid?: boolean;
  createdAtUtc?: string;
  updatedAtUtc?: string;
};

export type SalesOrdersListFilters = {
  pageNumber?: number;
  pageSize?: number;
  status?: SalesOrderStatus | "";
  fulfillmentType?: SalesOrderFulfillmentType | "";
  createdFromUtc?: string;
  createdToUtc?: string;
};

export type SalesOrdersListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: SalesOrderListItem[];
};
