import { httpClient } from "../../../shared/api/httpClient";
import type { SalesOrdersListFilters, SalesOrdersListResponse } from "../types/salesOrder.types";

// Deliberately not imported from features/sales-orders/api/draftSalesOrdersApi
// — that file is owned by POS/draft-order work happening in parallel, and
// its helpers aren't exported anyway. This is the "clean Sales-module query
// layer" the task asks for; the couple of lines below are the entire cost of
// keeping the two features decoupled.
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

// GET /sales-orders — the general list endpoint (confirmed distinct from
// POS's /sales-orders/retrievable: it accepts the full status range and a
// createdFromUtc/createdToUtc date range, where /retrievable only accepts
// Draft/Confirmed and a GUID search term).
export async function getSalesOrders(
  companyId: string,
  branchId: string,
  filters: SalesOrdersListFilters = {},
) {
  const response = await httpClient.get<SalesOrdersListResponse>(
    salesOrdersBaseUrl(companyId, branchId),
    { params: compactParams(filters) },
  );

  return response.data;
}
