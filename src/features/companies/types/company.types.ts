export type CompanyStatus = "Active" | "Suspended";
export type MembershipStatus = "Active" | "Suspended";

export type MyCompany = {
  companyId: string;
  membershipId: string;
  legalName: string;
  tradeName: string | null;
  businessSectorId: string;
  businessSectorCode: string;
  businessSectorName: string;
  companyStatus: CompanyStatus;
  membershipStatus: MembershipStatus;
  defaultCurrency: string;
  defaultLanguage: string;
  timeZone: string;
  createdAtUtc: string;
};

export type CompanyDetails = unknown;

export type CompanyRoleSummary = {
  roleId: string;
  code: string;
  name: string;
};

export type EffectivePermissions = {
  isOwner: boolean;
  permissions: string[];
  roles: CompanyRoleSummary[];
};

export type CompanyPermissions = EffectivePermissions;
