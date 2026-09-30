import { httpClient } from "../../../shared/api/httpClient";
import type {
  AssignGenerationUnitRequest,
  AssignGenerationUnitResponse,
  BranchGenerationUnit,
  CreateGenerationUnitRequest,
  GenerationUnit,
  SetGenerationUnitStatusResponse,
} from "../types/generationUnit.types";

function unitsUrl(companyId: string) {
  return `/api/companies/${companyId}/compliance/generation-units`;
}

export async function listGenerationUnits(companyId: string) {
  const response = await httpClient.get<GenerationUnit[]>(unitsUrl(companyId));
  return response.data;
}

export async function getGenerationUnit(companyId: string, unitId: string) {
  const response = await httpClient.get<GenerationUnit>(`${unitsUrl(companyId)}/${unitId}`);
  return response.data;
}

export async function createGenerationUnit(companyId: string, payload: CreateGenerationUnitRequest) {
  const response = await httpClient.post<GenerationUnit>(unitsUrl(companyId), payload);
  return response.data;
}

export async function activateGenerationUnit(companyId: string, unitId: string) {
  const response = await httpClient.post<SetGenerationUnitStatusResponse>(`${unitsUrl(companyId)}/${unitId}/activate`, {});
  return response.data;
}

export async function deactivateGenerationUnit(companyId: string, unitId: string) {
  const response = await httpClient.post<SetGenerationUnitStatusResponse>(`${unitsUrl(companyId)}/${unitId}/deactivate`, {});
  return response.data;
}

export async function getBranchGenerationUnit(companyId: string, branchId: string) {
  const response = await httpClient.get<BranchGenerationUnit>(
    `/api/companies/${companyId}/branches/${branchId}/compliance/generation-unit`,
  );
  return response.data;
}

export async function assignGenerationUnitToBranch(
  companyId: string,
  branchId: string,
  payload: AssignGenerationUnitRequest,
) {
  const response = await httpClient.put<AssignGenerationUnitResponse>(
    `/api/companies/${companyId}/branches/${branchId}/compliance/generation-unit`,
    payload,
  );
  return response.data;
}
