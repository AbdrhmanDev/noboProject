import { httpClient } from "../../../shared/api/httpClient";
import type {
  CompanyDetails,
  CompanyPermissions,
  MyCompany,
} from "../types/company.types";

export async function getMyCompanies() {
  const response = await httpClient.get<MyCompany[]>("/api/companies/mine");
  return response.data;
}

export async function getCompanyDetails(companyId: string) {
  const response = await httpClient.get<CompanyDetails>(`/api/companies/${companyId}`);
  return response.data;
}

export async function getCompanyPermissions(companyId: string) {
  const response = await httpClient.get<CompanyPermissions>(
    `/api/companies/${companyId}/me/permissions`,
  );
  return response.data;
}
