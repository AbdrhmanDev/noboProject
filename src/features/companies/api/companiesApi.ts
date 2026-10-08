import { httpClient } from "../../../shared/api/httpClient";
import type {
  CompanyDetails,
  CompanyEntitlements,
  CompanyPermissions,
  CreateCompanyRequest,
  CreateCompanyResponse,
  MyCompany,
} from "../types/company.types";

export async function getMyCompanies() {
  const response = await httpClient.get<MyCompany[]>("/api/companies/mine");
  return response.data;
}

export async function createCompany(payload: CreateCompanyRequest) {
  const response = await httpClient.post<CreateCompanyResponse>("/api/companies", payload);
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

export async function getCompanyEntitlements(companyId: string) {
  const response = await httpClient.get<CompanyEntitlements>(
    `/api/companies/${companyId}/me/entitlements`,
  );
  return response.data;
}

// The company logo, printed at the top of the POS customer receipt -- same upload pattern as
// uploadProductImage/deleteProductImage (SelfHosted-only; Cloud returns CompanyLogoStore.NotConfigured).
export async function uploadCompanyLogo(companyId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await httpClient.post<{ logoUrl: string }>(
    `/api/companies/${companyId}/logo`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

export async function deleteCompanyLogo(companyId: string) {
  await httpClient.delete(`/api/companies/${companyId}/logo`);
}

// Free-text lines (e.g. a delivery phone number) printed just above "Thank you" on the POS
// customer receipt.
export async function setCompanyReceiptContactLines(companyId: string, lines: string | null) {
  const response = await httpClient.put<{ lines: string[] }>(
    `/api/companies/${companyId}/receipt-contact-lines`,
    { lines },
  );
  return response.data;
}
