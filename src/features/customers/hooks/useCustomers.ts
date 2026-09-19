import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCustomer, getCustomers } from "../api/customersApi";
import type { CreateCustomerRequest, CustomerListFilters } from "../types/customer.types";

export const customersQueryKeys = {
  list: (companyId: string, filters: CustomerListFilters) =>
    ["customers", companyId, "list", filters] as const,
};

export function useCustomers(
  companyId: string | null | undefined,
  filters: CustomerListFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: customersQueryKeys.list(companyId || "", filters),
    queryFn: () => getCustomers(companyId as string, filters),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useCreateCustomer(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerRequest) => createCustomer(companyId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", companyId] });
    },
  });
}
