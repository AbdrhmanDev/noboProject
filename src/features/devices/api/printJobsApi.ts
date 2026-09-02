import { httpClient } from "../../../shared/api/httpClient";
import type { PrintJobResponse, PrintJobsListFilters } from "../types/devices.types";

function printJobsBaseUrl(companyId: string, branchId: string) {
  return `/api/companies/${companyId}/branches/${branchId}/print-jobs`;
}

function compactParams(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export async function getPrintJobs(
  companyId: string,
  branchId: string,
  filters: PrintJobsListFilters = {},
) {
  const response = await httpClient.get<PrintJobResponse[]>(
    printJobsBaseUrl(companyId, branchId),
    { params: compactParams(filters) },
  );

  return response.data;
}

export async function getPrintJobDetails(
  companyId: string,
  branchId: string,
  printJobId: string,
) {
  const response = await httpClient.get<PrintJobResponse>(
    `${printJobsBaseUrl(companyId, branchId)}/${printJobId}`,
  );

  return response.data;
}
