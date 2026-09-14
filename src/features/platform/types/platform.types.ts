// NOBO Platform (Control Plane) types -- deliberately separate from company.types.ts. Platform
// authorization is a completely independent axis from tenant CompanyMembership/CompanyPermissions/
// CompanyEntitlements: a user's platform access never depends on which company (if any) they
// belong to, and a Company Owner has no platform access by default.

export type CurrentPlatformRole = {
  roleId: string;
  code: string;
  name: string;
};

export type CurrentPlatformAccess = {
  isPlatformStaff: boolean;
  permissions: string[];
  roles: CurrentPlatformRole[];
};

export type PlatformCompanyStatus = "Active" | "Suspended";

export type PlatformCompanyListItem = {
  companyId: string;
  legalName: string;
  tradeName: string | null;
  status: PlatformCompanyStatus;
  businessSectorId: string;
  businessSectorCode: string | null;
  businessSectorName: string | null;
  createdAtUtc: string;
};

export type PlatformCompanyListFilters = {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type PlatformCompanyListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: PlatformCompanyListItem[];
};

// EntitlementKind mirrors the backend's Nobo.Application.Entitlements.EntitlementKind.
export type PlatformEntitlementKind = "App" | "Capability";

// ConfiguredStatus: "Enabled" | "Disabled" | "NotConfigured" -- distinct from effectiveEnabled,
// which additionally accounts for the whole ancestor chain (a child can be configured Enabled but
// effectively disabled because its parent App is off). The frontend must never re-derive this
// hierarchy itself -- both values already come fully resolved from the backend.
export type PlatformEntitlementConfiguredStatus = "Enabled" | "Disabled" | "NotConfigured";

export type PlatformCompanyEntitlement = {
  code: string;
  parentCode: string | null;
  kind: PlatformEntitlementKind;
  implemented: boolean;
  configuredStatus: PlatformEntitlementConfiguredStatus;
  effectiveEnabled: boolean;
};

export type PlatformCompanyEntitlementsResponse = {
  companyId: string;
  entitlements: PlatformCompanyEntitlement[];
};

export type SetPlatformCompanyEntitlementRequest = {
  enabled: boolean;
};

// ---- Platform Staff ----

export type PlatformStaffRole = {
  roleId: string;
  code: string;
  name: string;
};

export type PlatformStaffMember = {
  userId: string;
  displayName: string;
  email: string;
  emailConfirmed: boolean;
  roles: PlatformStaffRole[];
  permissions: string[];
};

export type AssignPlatformStaffRoleRequest = {
  email: string;
  roleCode: string;
};
