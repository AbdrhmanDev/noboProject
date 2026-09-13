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

// Company Entitlement = what NOBO has enabled for the company to own (App/Capability, e.g.
// "INVENTORY" / "INVENTORY.ADJUSTMENTS") -- deliberately separate from EffectivePermissions
// (what a USER inside the company may do). `enabled` is already hierarchy-resolved server-side
// (a disabled parent app makes every child effectively disabled too), so the frontend never has
// to re-derive that algorithm itself.
export type CompanyEntitlementKind = "App" | "Capability";

export type CompanyEntitlement = {
  code: string;
  parentCode: string | null;
  kind: CompanyEntitlementKind;
  enabled: boolean;
};

export type CompanyEntitlements = {
  entitlements: CompanyEntitlement[];
};

export type BusinessSector = {
  id: string;
  code: string;
  name: string;
};

export type CompanyAddress = {
  countryCode: string;
  city: string;
  district?: string | null;
  street?: string | null;
  buildingNumber?: string | null;
  additionalNumber?: string | null;
  postalCode?: string | null;
};

export type CreateCompanyRequest = {
  legalName: string;
  tradeName?: string | null;
  businessSectorId: string;
  taxNumber?: string | null;
  commercialRegistrationNumber?: string | null;
  registeredAddress: CompanyAddress;
};

export type CreateCompanyResponse = {
  companyId: string;
  legalName: string;
  tradeName: string | null;
  businessSectorId: string;
  companyStatus: CompanyStatus;
  ownerMembershipId: string;
  currency: string;
  language: string;
  timeZone: string;
};
