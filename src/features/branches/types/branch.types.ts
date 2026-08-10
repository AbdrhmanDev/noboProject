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
