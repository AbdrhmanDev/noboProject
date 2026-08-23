import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateSupplier,
  createSupplier,
  getAllSuppliers,
  getSupplierDetails,
  getSuppliers,
  suspendSupplier,
  updateSupplier,
} from "../api/suppliersApi";
import type {
  CreateSupplierRequest,
  SuppliersListFilters,
  UpdateSupplierRequest,
} from "../types/procurement.types";

export const supplierQueryKeys = {
  all: ["procurement", "suppliers"] as const,
  list: (companyId: string, filters: SuppliersListFilters = {}) =>
    ["procurement", "suppliers", companyId, filters] as const,
  details: (companyId: string, supplierId: string) =>
    ["procurement", "suppliers", companyId, "detail", supplierId] as const,
  allForPicker: (companyId: string, filters: Omit<SuppliersListFilters, "pageNumber" | "pageSize"> = {}) =>
    ["procurement", "suppliers", companyId, "all", filters] as const,
};

function invalidateSuppliers(
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | null | undefined,
  supplierId?: string | null,
) {
  if (!companyId) return;

  queryClient.invalidateQueries({ queryKey: ["procurement", "suppliers", companyId] });

  if (supplierId) {
    queryClient.invalidateQueries({
      queryKey: supplierQueryKeys.details(companyId, supplierId),
    });
  }
}

export function useSuppliers(
  companyId: string | null | undefined,
  filters: SuppliersListFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: supplierQueryKeys.list(companyId || "", filters),
    queryFn: () => getSuppliers(companyId as string, filters),
    enabled: Boolean(companyId) && enabled,
  });
}

// For pickers/filters that need the complete active (or all) supplier set
// as a single flat array — never used by the main Suppliers management
// list, which stays a normal server-paginated useSuppliers() at ~25/page.
export function useAllSuppliers(
  companyId: string | null | undefined,
  filters: Omit<SuppliersListFilters, "pageNumber" | "pageSize"> = {},
  enabled = true,
) {
  return useQuery({
    queryKey: supplierQueryKeys.allForPicker(companyId || "", filters),
    queryFn: () => getAllSuppliers(companyId as string, filters),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useSupplierDetails(
  companyId: string | null | undefined,
  supplierId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: supplierQueryKeys.details(companyId || "", supplierId || ""),
    queryFn: () => getSupplierDetails(companyId as string, supplierId as string),
    enabled: Boolean(companyId) && Boolean(supplierId) && enabled,
  });
}

export function useCreateSupplier(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupplierRequest) => createSupplier(companyId as string, payload),
    onSuccess: () => invalidateSuppliers(queryClient, companyId),
  });
}

export function useUpdateSupplier(
  companyId: string | null | undefined,
  supplierId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSupplierRequest) =>
      updateSupplier(companyId as string, supplierId as string, payload),
    onSuccess: () => invalidateSuppliers(queryClient, companyId, supplierId),
  });
}

export function useActivateSupplier(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplierId: string) => activateSupplier(companyId as string, supplierId),
    onSuccess: (_, supplierId) => invalidateSuppliers(queryClient, companyId, supplierId),
  });
}

export function useSuspendSupplier(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplierId: string) => suspendSupplier(companyId as string, supplierId),
    onSuccess: (_, supplierId) => invalidateSuppliers(queryClient, companyId, supplierId),
  });
}
