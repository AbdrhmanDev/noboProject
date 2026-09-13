import { httpClient } from "../../../shared/api/httpClient";
import type {
  CurrentPlatformAccess,
  PlatformCompanyEntitlement,
  PlatformCompanyEntitlementsResponse,
  PlatformCompanyListFilters,
  PlatformCompanyListResponse,
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
