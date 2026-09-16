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

// Root App entitlement codes only (mirrors backend Nobo.Application.Entitlements.EntitlementCatalog
// root codes) -- capability-level detail is not part of the list/overview shape, only of the full
// entitlements tree on the details page.
export type PlatformEnabledAppCode = "POS" | "INVENTORY" | "RESTAURANT" | "PROCUREMENT";

// Usage/Commercial/Activity fields mirror the backend's PlatformCompanyListItemResult exactly
// (Platform Customer Control Center, Phase 4/5). See that record's doc comments for the precise
// definition of each field -- the frontend never re-derives these, only displays them.
export type PlatformCompanyListItem = {
  companyId: string;
  legalName: string;
  tradeName: string | null;
  status: PlatformCompanyStatus;
  businessSectorId: string;
  businessSectorCode: string | null;
  businessSectorName: string | null;
  createdAtUtc: string;
  currencyCode: string;
  branchCount: number;
  userCount: number;
  activeUserCount: number;
  pendingInvitationCount: number;
  enabledAppCodes: PlatformEnabledAppCode[];
  ordersCount: number;
  salesAmount: number;
  lastActivityAtUtc: string | null;
};

export type PlatformCompanyListFilters = {
  search?: string;
  status?: PlatformCompanyStatus;
  pageNumber?: number;
  pageSize?: number;
  fromUtc?: string;
  toUtc?: string;
};

export type PlatformCompanyListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  fromUtc: string;
  toUtc: string;
  items: PlatformCompanyListItem[];
};

export type PlatformCompanyDetailsFilters = {
  fromUtc?: string;
  toUtc?: string;
};

// GET /api/platform/companies/{companyId} -- same identity/usage/activity fields as the list item,
// plus the full entitlements tree (not just root app codes) and the resolved date range.
export type PlatformCompanyDetails = {
  companyId: string;
  legalName: string;
  tradeName: string | null;
  status: PlatformCompanyStatus;
  businessSectorId: string;
  businessSectorCode: string | null;
  businessSectorName: string | null;
  createdAtUtc: string;
  currencyCode: string;
  fromUtc: string;
  toUtc: string;
  branchCount: number;
  userCount: number;
  activeUserCount: number;
  pendingInvitationCount: number;
  entitlements: PlatformCompanyEntitlement[];
  ordersCount: number;
  salesAmount: number;
  lastActivityAtUtc: string | null;
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
