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

export type CompanyDetails = {
  companyId: string;
  legalName: string;
  tradeName: string | null;
  taxNumber: string | null;
  commercialRegistrationNumber: string | null;
  businessSectorId: string;
  businessSectorCode: string;
  businessSectorName: string;
  defaultCurrency: string;
  defaultLanguage: string;
  timeZone: string;
  status: CompanyStatus;
  registeredAddress: CompanyAddress;
  createdAtUtc: string;
  // The uploaded logo's served path (/api/companies/{id}/logo), printed at the top of the POS
  // customer receipt -- see useCompanyLogo.ts. Null when the company has no logo.
  logoUrl: string | null;
  // Free-text lines (e.g. a delivery phone number) printed just above "Thank you" on the receipt.
  receiptContactLines: string[];
};

export type CompanyRoleSummary = {
  roleId: string;
  code: string;
  name: string;
};

export type EffectivePermissions = {
  isOwner: boolean;
  permissions: string[];
  roles: CompanyRoleSummary[];
  // The caller's OWN CompanyMembership.SalesOrderVisibilityScope ("Own" | "Branch" | null). Used to
  // hide the all-orders Sales nav item for a member scoped to "Own" -- see navItems.jsx.
  salesOrderVisibilityScope: string | null;
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
