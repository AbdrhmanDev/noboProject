import { useQuery } from "@tanstack/react-query";
import { getSalesOrders } from "../api/salesOrdersApi";
import { getSalesOrderDetails } from "../../sales-orders/api/draftSalesOrdersApi";
import { getCompanyMemberships } from "../../users-access/api/usersAccessApi";
import { getBranchSellableCatalog } from "../../pos/api/sellableCatalogApi";
import type { DraftSalesOrder } from "../../sales-orders/types/draftSalesOrder.types";
import type { SalesOrderListItem } from "../types/salesOrder.types";
import { buildSalesRankings, type SalesRankings, type UtcRange } from "../utils/salesRankings";

// Client-side stand-in for a backend rankings endpoint: lists the period's orders, keeps the
// Confirmed + Closed ones (the same monetary scope /sales/overview uses), opens each one's details
// and aggregates the lines. Capped at MAX_ORDERS so a long period stays usable -- `truncated`
// tells the UI the figures cover only the most recent MAX_ORDERS orders. Replace the queryFn with
// a single call once the rankings endpoint exists (see the Sales rankings API spec).
const MAX_ORDERS = 300;
const LIST_PAGE_SIZE = 100;
const DETAIL_CONCURRENCY = 6;
const MONETARY_STATUSES = new Set(["Confirmed", "Closed"]);

export type SalesRankingsResult = SalesRankings & {
  orderCount: number;
  truncated: boolean;
};

type Labels = {
  walkInCustomer: string;
  unknownSalesperson: (userId: string) => string;
  uncategorized: string;
};

async function mapWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function listPeriodOrders(companyId: string, branchId: string, range: UtcRange) {
  const orders: SalesOrderListItem[] = [];
  let truncated = false;

  for (let pageNumber = 1; ; pageNumber += 1) {
    const page = await getSalesOrders(companyId, branchId, {
      pageNumber,
      pageSize: LIST_PAGE_SIZE,
      createdFromUtc: range.fromUtc,
      createdToUtc: range.toUtc,
    });
    orders.push(...page.items.filter((order) => MONETARY_STATUSES.has(order.status)));
    if (orders.length >= MAX_ORDERS) {
      truncated = orders.length > MAX_ORDERS || pageNumber < page.totalPages;
      return { orders: orders.slice(0, MAX_ORDERS), truncated };
    }
    if (pageNumber >= page.totalPages || page.items.length === 0) return { orders, truncated };
  }
}

// Optional lookups: a missing permission (or any failure) just falls back to generic labels.
async function loadUserNames(companyId: string) {
  try {
    const page = await getCompanyMemberships(companyId, { pageSize: 200 });
    return new Map(page.items.map((member) => [member.userId, member.displayName || member.email]));
  } catch {
    return new Map<string, string>();
  }
}

async function loadCategories(companyId: string, branchId: string) {
  try {
    const catalog = await getBranchSellableCatalog(companyId, branchId);
    return new Map(
      catalog.items
        .filter((item) => item.categoryName)
        .map((item) => [item.productVariantId, item.categoryName as string]),
    );
  } catch {
    return new Map<string, string>();
  }
}

export function useSalesRankings(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  range: UtcRange,
  labels: Labels,
  enabled = true,
) {
  return useQuery<SalesRankingsResult>({
    queryKey: ["sales", "rankings", companyId || "", branchId || "", range.fromUtc || "", range.toUtc || ""],
    queryFn: async () => {
      const [{ orders, truncated }, userNames, categories] = await Promise.all([
        listPeriodOrders(companyId as string, branchId as string, range),
        loadUserNames(companyId as string),
        loadCategories(companyId as string, branchId as string),
      ]);
      const details = (await mapWithConcurrency(orders, DETAIL_CONCURRENCY, (order) =>
        getSalesOrderDetails(companyId as string, branchId as string, order.salesOrderId),
      )) as DraftSalesOrder[];

      return {
        ...buildSalesRankings(details, userNames, categories, labels),
        orderCount: details.length,
        truncated,
      };
    },
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
    staleTime: 60_000,
  });
}
