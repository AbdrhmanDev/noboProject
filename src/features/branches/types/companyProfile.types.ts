// Mirrors Nobo.Api.Companies.CompanyProfileEndpoints (read-only from source) EXACTLY -- only the
// pieces this feature actually needs (the approved profile's proposed branches + materialization).
// The full profile (identity/financial/representative/contacts) is fetched as part of the same
// response but this feature does not otherwise use it.

export type ApprovedProfileVersion = {
  versionId: string;
  versionNumber: number;
  supersedesVersionNumber: number | null;
  sourceRegistrationRequestId: string;
  approvedByUserId: string;
  approvedAtUtc: string;
  contentHash: string;
};

// Ordinal is the proposal's position in the approved list -- the identity ApplyCompanyProposedBranch
// takes. MaterializedBranchId/MaterializedBranchStatus are null until APPLIED (derived from the real
// branch's own provenance fields, never written onto the approved version itself).
export type ProfileProposedBranch = {
  name: string;
  code: string | null;
  phoneNumber: string | null;
  countryCode: string;
  city: string;
  district: string | null;
  street: string | null;
  buildingNumber: string | null;
  postalCode: string | null;
  ordinal: number;
  materializedBranchId: string | null;
  materializedBranchStatus: string | null;
};

export type ApprovedCompanyProfile = {
  companyId: string;
  version: ApprovedProfileVersion;
  proposedBranches: ProfileProposedBranch[];
  // identity/address/financial/representative/contacts fields also exist on this response but are
  // out of scope for the Branches/Generation Units feature and are intentionally not typed here.
};

export type ApplyProposedBranchRequest = {
  code?: string | null;
};

// result is "created" (201) or "already_exists" (200, idempotent replay) -- never an error for a
// proposal that was already applied.
export type ApplyProposedBranchResult = "created" | "already_exists";

export type ApplyProposedBranchResponse = {
  result: ApplyProposedBranchResult;
  branchId: string;
  companyId: string;
  sourceProfileVersionNumber: number;
  proposalOrdinal: number;
  code: string;
  name: string;
  phone: string | null;
  status: string;
};
