import { useQuery } from "@tanstack/react-query";
import { getSalesOrders, getSalesOverview } from "../api/salesOrdersApi";
import type { SalesOrdersListFilters, SalesOverviewFilters } from "../types/salesOrder.types";

export const salesOrderQueryKeys = {
  all: ["sales", "orders"] as const,
  list: (companyId: string, branchId: string, filters: SalesOrdersListFilters = {}) =>
    ["sales", "orders", companyId, branchId, filters] as const,
  overview: (companyId: string, branchId: string, filters: SalesOverviewFilters = {}) =>
    ["sales", "overview", companyId, branchId, filters] as const,
};

export function useSalesOrders(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: SalesOrdersListFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: salesOrderQueryKeys.list(companyId || "", branchId || "", filters),
    queryFn: () => getSalesOrders(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

export function useSalesOverview(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: SalesOverviewFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: salesOrderQueryKeys.overview(companyId || "", branchId || "", filters),
    queryFn: () => getSalesOverview(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}
