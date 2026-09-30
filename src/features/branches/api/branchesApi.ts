import { httpClient } from "../../../shared/api/httpClient";
import type {
  Branch,
  ChangeBranchStatusRequest,
  CreateBranchRequest,
  CreateBranchResponse,
  UpdateBranchRequest,
} from "../types/branch.types";

export async function getBranches(companyId: string) {
  const response = await httpClient.get<Branch[]>(
    `/api/companies/${companyId}/branches`,
  );

  return response.data;
}

// GET .../branches/{branchId}: same BranchResponse shape as a list row (Branch type covers both --
// there is no separate, richer "details" DTO on the backend).
export async function getBranchDetails(companyId: string, branchId: string) {
  const response = await httpClient.get<Branch>(`/api/companies/${companyId}/branches/${branchId}`);
  return response.data;
}

export async function createBranch(companyId: string, payload: CreateBranchRequest) {
  const response = await httpClient.post<CreateBranchResponse>(
    `/api/companies/${companyId}/branches`,
    payload,
  );

  return response.data;
}

export async function updateBranch(companyId: string, branchId: string, payload: UpdateBranchRequest) {
  const response = await httpClient.put<Branch>(`/api/companies/${companyId}/branches/${branchId}`, payload);
  return response.data;
}

export async function changeBranchStatus(companyId: string, branchId: string, payload: ChangeBranchStatusRequest) {
  const response = await httpClient.put<Branch>(`/api/companies/${companyId}/branches/${branchId}/status`, payload);
  return response.data;
}
