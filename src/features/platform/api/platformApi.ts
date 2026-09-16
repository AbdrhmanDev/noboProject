import { httpClient } from "../../../shared/api/httpClient";
import type {
  AssignPlatformStaffRoleRequest,
  CurrentPlatformAccess,
  PlatformCompanyDetails,
  PlatformCompanyDetailsFilters,
  PlatformCompanyEntitlement,
  PlatformCompanyEntitlementsResponse,
  PlatformCompanyListFilters,
  PlatformCompanyListResponse,
  PlatformStaffMember,
  SetPlatformCompanyEntitlementRequest,
} from "../types/platform.types";

// Mirrors the backend's hard limit exactly (GetPlatformCompaniesHandler.HandleAsync ->
// "PlatformCompanyList.PageSizeInvalid" -- Page size must be between 1 and 100, the same MaxPageSize
// convention every other paginated list endpoint in this backend uses). NOT a frontend-invented
// number: any caller of getPlatformCompanies must stay at or below this value or the backend
// returns HTTP 400.
export const PLATFORM_COMPANY_LIST_MAX_PAGE_SIZE = 100;

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function getCurrentPlatformAccess() {
  const response = await httpClient.get<CurrentPlatformAccess>("/api/platform/me/access");
  return response.data;
}

export async function getPlatformCompanies(filters: PlatformCompanyListFilters = {}) {
  const response = await httpClient.get<PlatformCompanyListResponse>("/api/platform/companies", {
    params: compactParams(filters),
  });
  return response.data;
}

export async function getPlatformCompanyDetails(
  companyId: string,
  filters: PlatformCompanyDetailsFilters = {},
) {
  const response = await httpClient.get<PlatformCompanyDetails>(
    `/api/platform/companies/${companyId}`,
    { params: compactParams(filters) },
  );
  return response.data;
}

export async function getPlatformCompanyEntitlements(companyId: string) {
  const response = await httpClient.get<PlatformCompanyEntitlementsResponse>(
    `/api/platform/companies/${companyId}/entitlements`,
  );
  return response.data;
}

export async function setPlatformCompanyEntitlement(
  companyId: string,
  entitlementCode: string,
  payload: SetPlatformCompanyEntitlementRequest,
) {
  const response = await httpClient.put<PlatformCompanyEntitlement>(
    `/api/platform/companies/${companyId}/entitlements/${entitlementCode}`,
    payload,
  );
  return response.data;
}

export async function getPlatformStaff() {
  const response = await httpClient.get<PlatformStaffMember[]>("/api/platform/staff");
  return response.data;
}

export async function assignPlatformStaffRole(payload: AssignPlatformStaffRoleRequest) {
  const response = await httpClient.post<PlatformStaffMember>("/api/platform/staff/assign", payload);
  return response.data;
}

export async function revokePlatformStaffRole(userId: string, roleCode: string) {
  const response = await httpClient.delete<{ revoked: boolean }>(
    `/api/platform/staff/${userId}/roles/${roleCode}`,
  );
  return response.data;
}
