import { httpClient } from "../../../shared/api/httpClient";
import type { Branch, CreateBranchRequest, CreateBranchResponse } from "../types/branch.types";

export async function getBranches(companyId: string) {
  const response = await httpClient.get<Branch[]>(
    `/api/companies/${companyId}/branches`,
  );

  return response.data;
}

export async function createBranch(companyId: string, payload: CreateBranchRequest) {
  const response = await httpClient.post<CreateBranchResponse>(
    `/api/companies/${companyId}/branches`,
    payload,
  );

  return response.data;
}
