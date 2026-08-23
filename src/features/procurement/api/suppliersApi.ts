import { httpClient } from "../../../shared/api/httpClient";
import type {
  ChangeSupplierStatusResponse,
  CreateSupplierRequest,
  Supplier,
  SuppliersListFilters,
  SuppliersListResponse,
  UpdateSupplierRequest,
} from "../types/procurement.types";

function suppliersBaseUrl(companyId: string) {
  return `/api/companies/${companyId}/suppliers`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function getSuppliers(
  companyId: string,
  filters: SuppliersListFilters = {},
) {
  const response = await httpClient.get<SuppliersListResponse>(suppliersBaseUrl(companyId), {
    params: compactParams(filters),
  });

  return response.data;
}

// The suppliers list endpoint rejects pageSize=200 with a 400 (this
// backend's confirmed page-size ceiling elsewhere in this same codebase —
// SalesOrderRetrieval.PageSizeInvalid — is 100; that's the best-evidenced
// value available for this endpoint too, since no fresh authenticated call
// could be made to re-verify it endpoint-by-endpoint). For pickers/filters
// that genuinely need the complete supplier set (not the paginated
// management list), this drains every page at the legal page size instead
// of requesting one oversized page — correct regardless of how many
// suppliers actually exist, never assuming the set is capped at 100.
const SUPPLIER_DRAIN_PAGE_SIZE = 100;

export async function getAllSuppliers(
  companyId: string,
  filters: Omit<SuppliersListFilters, "pageNumber" | "pageSize"> = {},
) {
  const all: Supplier[] = [];
  let pageNumber = 1;

  while (true) {
    const page = await getSuppliers(companyId, {
      ...filters,
      pageNumber,
      pageSize: SUPPLIER_DRAIN_PAGE_SIZE,
    });
    all.push(...page.items);
    if (pageNumber >= page.totalPages) break;
    pageNumber += 1;
  }

  return all;
}

export async function getSupplierDetails(companyId: string, supplierId: string) {
  const response = await httpClient.get<Supplier>(`${suppliersBaseUrl(companyId)}/${supplierId}`);

  return response.data;
}

export async function createSupplier(companyId: string, payload: CreateSupplierRequest) {
  const response = await httpClient.post<Supplier>(suppliersBaseUrl(companyId), payload);

  return response.data;
}

export async function updateSupplier(
  companyId: string,
  supplierId: string,
  payload: UpdateSupplierRequest,
) {
  const response = await httpClient.put<Supplier>(
    `${suppliersBaseUrl(companyId)}/${supplierId}`,
    payload,
  );

  return response.data;
}

export async function activateSupplier(companyId: string, supplierId: string) {
  const response = await httpClient.post<ChangeSupplierStatusResponse>(
    `${suppliersBaseUrl(companyId)}/${supplierId}/activate`,
  );

  return response.data;
}

export async function suspendSupplier(companyId: string, supplierId: string) {
  const response = await httpClient.post<ChangeSupplierStatusResponse>(
    `${suppliersBaseUrl(companyId)}/${supplierId}/suspend`,
  );

  return response.data;
}
