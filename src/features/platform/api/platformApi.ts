import { httpClient } from "../../../shared/api/httpClient";
import type {
  AssignPlatformStaffRoleRequest,
  CurrentPlatformAccess,
  PlatformCompanyEntitlement,
  PlatformCompanyEntitlementsResponse,
  PlatformCompanyListFilters,
  PlatformCompanyListResponse,
  PlatformStaffMember,
  SetPlatformCompanyEntitlementRequest,
} from "../types/platform.types";

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
