// Mirrors Nobo.Api.Companies.CompanyProfileEndpoints EXACTLY (read-only source inspection:
// ApprovedCompanyProfileResponse and its nested records). This is the FULL profile shape -- every
// field the real GET /api/companies/{companyId}/profile response returns, nothing added.

export type ApprovedProfileVersion = {
  versionId: string;
  versionNumber: number;
  supersedesVersionNumber: number | null;
  sourceRegistrationRequestId: string;
  approvedByUserId: string;
  approvedAtUtc: string;
  contentHash: string;
};

export type ProfileIdentity = {
  legalName: string;
  tradeName: string | null;
  taxNumber: string | null;
  commercialRegistrationNumber: string | null;
  businessSectorId: string;
};

export type ProfileAddress = {
  countryCode: string;
  city: string;
  district: string | null;
  street: string | null;
  buildingNumber: string | null;
  additionalNumber: string | null;
  postalCode: string | null;
  unitNumber: string | null;
  shortAddress: string | null;
};

export type ProfileFinancial = {
  bankName: string | null;
  iban: string | null;
  fiscalYear: string | null;
  vatFilingFrequency: string | null;
  annualRevenue: number | null;
  annualExpenses: number | null;
};

export type ProfileRepresentative = {
  fullName: string | null;
  identificationNumber: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  authorityBasis: string | null;
};

export type ProfileContacts = {
  primaryPhone: string | null;
  primaryEmail: string;
};

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

// Provenance: which registration field REVISION the approved value of a field came from. Reference
// only -- the registration history itself is not copied/exposed here; read-only, never editable.
export type ProfileFieldProvenance = {
  fieldKey: string;
  sourceRevisionId: string | null;
};

export type ApprovedCompanyProfile = {
  companyId: string;
  version: ApprovedProfileVersion;
  identity: ProfileIdentity;
  address: ProfileAddress;
  financial: ProfileFinancial;
  representative: ProfileRepresentative;
  contacts: ProfileContacts;
  proposedBranches: ProfileProposedBranch[];
  provenance: ProfileFieldProvenance[];
};
