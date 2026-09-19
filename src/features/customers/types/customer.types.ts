// Real backend Customer contract (Nobo.Domain.Customers.Customer / CustomerEndpointContracts) --
// company-scoped, never branch-scoped (POS Customer Data task). No field here is invented; every
// one mirrors an actual backend response property.
export type CustomerStatus = "Active" | "Suspended";

export type Customer = {
  customerId: string;
  companyId: string;
  customerNumber: number;
  customerNumberFormatted: string;
  name: string;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  address: string | null;
  note: string | null;
  status: CustomerStatus | string;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type CustomerListFilters = {
  search?: string;
  status?: CustomerStatus | "";
  pageNumber?: number;
  pageSize?: number;
};

export type PagedCustomers = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: Customer[];
};

export type CreateCustomerRequest = {
  name: string;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  address: string | null;
  note: string | null;
};
