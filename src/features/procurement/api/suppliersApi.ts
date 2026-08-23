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
