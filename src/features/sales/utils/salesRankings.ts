import type { DraftSalesOrder } from "../../sales-orders/types/draftSalesOrder.types";

// ---- Previous period (KPI deltas) ----

export type UtcRange = { fromUtc?: string; toUtc?: string };

// The period of the same length that ends where `range` starts: [from - length, from). Only
// defined for a closed range -- an open-ended custom range has no comparable previous period.
export function previousPeriod(range: UtcRange): UtcRange | null {
  if (!range.fromUtc || !range.toUtc) return null;
  const from = new Date(range.fromUtc).getTime();
  const to = new Date(range.toUtc).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;
  const length = to - from;
  return { fromUtc: new Date(from - length).toISOString(), toUtc: new Date(from).toISOString() };
}

// Percentage change from `previous` to `current`. null when there is nothing to compare against
// (no previous period, or a previous value of 0 -- a percentage of zero is meaningless).
export function percentChange(current: number, previous: number | null | undefined): number | null {
  if (previous === null || previous === undefined || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// ---- Rankings (top products / customers / salespeople / categories) ----
// Aggregated client-side from the full details of the period's Confirmed + Closed orders, until
// the backend exposes a rankings endpoint (see the Sales rankings API spec).

export type RankingRow = {
  key: string;
  label: string;
  quantity: number; // units for products; orders for customers / salespeople / categories
  amount: number;
};

export type SalesRankings = {
  products: RankingRow[];
  customers: RankingRow[];
  salespeople: RankingRow[];
  categories: RankingRow[];
};

type Labels = {
  walkInCustomer: string;
  unknownSalesperson: (userId: string) => string;
  uncategorized: string;
};

function addTo(map: Map<string, RankingRow>, key: string, label: string, quantity: number, amount: number) {
  const row = map.get(key) ?? { key, label, quantity: 0, amount: 0 };
  row.quantity += quantity;
  row.amount += amount;
  map.set(key, row);
}

const byAmountDesc = (a: RankingRow, b: RankingRow) => b.amount - a.amount || b.quantity - a.quantity;

export function buildSalesRankings(
  orders: DraftSalesOrder[],
  userNamesById: Map<string, string>,
  categoryByVariantId: Map<string, string>,
  labels: Labels,
): SalesRankings {
  const products = new Map<string, RankingRow>();
  const customers = new Map<string, RankingRow>();
  const salespeople = new Map<string, RankingRow>();
  const categories = new Map<string, RankingRow>();

  for (const order of orders) {
    const customerKey = order.customer?.customerId ?? order.customerId ?? "__walk_in__";
    addTo(customers, customerKey, order.customer?.name || labels.walkInCustomer, 1, Number(order.payableAmount) || 0);

    const userId = order.createdByUserId || "__unknown__";
    addTo(
      salespeople,
      userId,
      userNamesById.get(userId) || labels.unknownSalesperson(userId),
      1,
      Number(order.payableAmount) || 0,
    );

    const orderCategories = new Set<string>();
    for (const line of order.lines ?? []) {
      // Line revenue after the line's own discount; an order-level discount isn't spread over lines.
      const amount = Number(line.discountedAmount ?? line.lineSubtotalAmount) || 0;
      addTo(products, line.productName, line.productName, Number(line.quantity) || 0, amount);

      const category = categoryByVariantId.get(line.productVariantId) || labels.uncategorized;
      addTo(categories, category, category, 0, amount);
      orderCategories.add(category);
    }
    orderCategories.forEach((category) => addTo(categories, category, category, 1, 0));
  }

  return {
    products: [...products.values()].sort(byAmountDesc),
    customers: [...customers.values()].sort(byAmountDesc),
    salespeople: [...salespeople.values()].sort(byAmountDesc),
    categories: [...categories.values()].sort(byAmountDesc),
  };
}
