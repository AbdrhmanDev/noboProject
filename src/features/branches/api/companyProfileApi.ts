import { httpClient } from "../../../shared/api/httpClient";
import type {
  ApplyProposedBranchRequest,
  ApplyProposedBranchResponse,
  ApprovedCompanyProfile,
} from "../types/companyProfile.types";

// Real routes only (Nobo.Api.Companies.CompanyProfileEndpoints), read-only inspection of the backend
// source. This feature only ever reads the CURRENT approved profile and applies ONE of its proposed
// branches; it never edits the profile itself (amendments are a separate, unrelated flow).

export async function getApprovedCompanyProfile(companyId: string) {
  const response = await httpClient.get<ApprovedCompanyProfile>(`/api/companies/${companyId}/profile`);
  return response.data;
}

export async function applyProposedBranch(
  companyId: string,
  versionNumber: number,
  ordinal: number,
  payload: ApplyProposedBranchRequest = {},
) {
  const response = await httpClient.post<ApplyProposedBranchResponse>(
    `/api/companies/${companyId}/profile/versions/${versionNumber}/proposed-branches/${ordinal}/apply`,
    payload,
  );
  return response.data;
}
