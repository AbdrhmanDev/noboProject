import { httpClient } from "../../../shared/api/httpClient";
import type { ApprovedCompanyProfile, ApprovedProfileVersion } from "../types/companyProfile.types";

// Real routes only: Nobo.Api.Companies.CompanyProfileEndpoints, company side (CompanyProfile.View).
// Read-only -- there is no write path here; a new version comes only from an approved amendment.

export async function getApprovedCompanyProfile(companyId: string) {
  const response = await httpClient.get<ApprovedCompanyProfile>(`/api/companies/${companyId}/profile`);
  return response.data;
}

export async function listApprovedCompanyProfileVersions(companyId: string) {
  const response = await httpClient.get<ApprovedProfileVersion[]>(`/api/companies/${companyId}/profile/versions`);
  return response.data;
}

export async function getApprovedCompanyProfileVersion(companyId: string, versionNumber: number) {
  const response = await httpClient.get<ApprovedCompanyProfile>(`/api/companies/${companyId}/profile/versions/${versionNumber}`);
  return response.data;
}
