export type BranchStatus = "Active" | "Suspended";

export type BranchAddress = {
  countryCode: string;
  city: string;
  district: string | null;
  street: string | null;
  buildingNumber: string | null;
  additionalNumber: string | null;
  postalCode: string | null;
};

export type Branch = {
  branchId: string;
  companyId: string;
  name: string;
  code: string;
  phoneNumber: string | null;
  status: BranchStatus;
  address: BranchAddress;
  createdAtUtc: string;
};

export type CreateBranchAddress = {
  countryCode: string;
  city: string;
  district?: string | null;
  street?: string | null;
  buildingNumber?: string | null;
  additionalNumber?: string | null;
  postalCode?: string | null;
};

export type CreateBranchRequest = {
  name: string;
  code: string;
  phone?: string | null;
  address: CreateBranchAddress;
};

export type CreateBranchResponse = {
  branchId: string;
  companyId: string;
  name: string;
  code: string;
  phone: string | null;
  status: BranchStatus;
  address: BranchAddress;
  createdAtUtc: string;
};

// Mirrors Nobo.Api.Branches.BranchEndpointContracts.UpdateBranchRequest EXACTLY -- note the property
// is `phoneNumber` here (not `phone`, unlike CreateBranchRequest): the backend itself is inconsistent
// between the two DTOs, and this type follows it as-is rather than "fixing" it.
export type UpdateBranchAddress = {
  countryCode: string;
  city: string;
  district?: string | null;
  street?: string | null;
  buildingNumber?: string | null;
  additionalNumber?: string | null;
  postalCode?: string | null;
};

export type UpdateBranchRequest = {
  name: string;
  code: string;
  phoneNumber?: string | null;
  address: UpdateBranchAddress;
};

// Mirrors Nobo.Domain.Branches.BranchStatus exactly (Active | Suspended) -- ChangeBranchStatusRequest
// takes the enum member name as a plain string; the handler is the only place that validates it.
export type ChangeBranchStatusRequest = {
  status: BranchStatus;
};
