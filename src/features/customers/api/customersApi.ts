import { httpClient } from "../../../shared/api/httpClient";
import type {
  Customer,
  CustomerListFilters,
  CreateCustomerRequest,
  PagedCustomers,
} from "../types/customer.types";

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function getCustomers(companyId: string, filters: CustomerListFilters = {}) {
  const response = await httpClient.get<PagedCustomers>(`/api/companies/${companyId}/customers`, {
    params: compactParams(filters),
  });
  return response.data;
}

export async function createCustomer(companyId: string, payload: CreateCustomerRequest) {
  const response = await httpClient.post<Customer>(`/api/companies/${companyId}/customers`, payload);
  return response.data;
}
