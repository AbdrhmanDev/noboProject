import { httpClient } from "../../../shared/api/httpClient";
import type {
  CompanyComplianceChangeResult,
  CompanyComplianceStatus,
  DisableCompanyComplianceRequest,
} from "../types/companyCompliance.types";

// The three real endpoints, exactly as mapped by Nobo.Api.Compliance.CompanyComplianceEndpoints --
// no other route, no invented contract.
function statusUrl(companyId: string) {
  return `/api/companies/${companyId}/compliance/status`;
}

export async function getCompanyComplianceStatus(companyId: string) {
  const response = await httpClient.get<CompanyComplianceStatus>(statusUrl(companyId));
  return response.data;
}

export async function enableCompanyCompliance(companyId: string) {
  const response = await httpClient.post<CompanyComplianceChangeResult>(
    `/api/companies/${companyId}/compliance/enable`,
    {},
  );
  return response.data;
}

export async function disableCompanyCompliance(
  companyId: string,
  payload: DisableCompanyComplianceRequest = {},
) {
  const response = await httpClient.post<CompanyComplianceChangeResult>(
    `/api/companies/${companyId}/compliance/disable`,
    payload,
  );
  return response.data;
}
