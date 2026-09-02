import { useQuery } from "@tanstack/react-query";
import { getPrintJobDetails, getPrintJobs } from "../api/printJobsApi";
import type { PrintJobResponse, PrintJobsListFilters, PrintJobStatus } from "../types/devices.types";

const POLL_INTERVAL_MS = 1500;
const IN_FLIGHT_STATUSES: PrintJobStatus[] = ["Queued", "Claimed", "Printing"];

export const printJobQueryKeys = {
  all: ["devices", "print-jobs"] as const,
  list: (companyId: string, branchId: string, filters: PrintJobsListFilters = {}) =>
    ["devices", "print-jobs", companyId, branchId, filters] as const,
  details: (companyId: string, branchId: string, printJobId: string) =>
    ["devices", "print-jobs", companyId, branchId, "detail", printJobId] as const,
};

export function usePrintJobs(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  filters: PrintJobsListFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: printJobQueryKeys.list(companyId || "", branchId || "", filters),
    queryFn: () => getPrintJobs(companyId as string, branchId as string, filters),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

// Polls every ~1.5s while the job is still in flight (Queued/Claimed/
// Printing) and stops once it reaches a terminal state (Succeeded/Failed) —
// used by TestPrintPanel to drive the live status timeline.
export function usePrintJobDetails(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  printJobId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: printJobQueryKeys.details(companyId || "", branchId || "", printJobId || ""),
    queryFn: () =>
      getPrintJobDetails(companyId as string, branchId as string, printJobId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && Boolean(printJobId) && enabled,
    refetchInterval: (query) => {
      const status = (query.state.data as PrintJobResponse | undefined)?.status;
      if (!status) return POLL_INTERVAL_MS;
      return IN_FLIGHT_STATUSES.includes(status) ? POLL_INTERVAL_MS : false;
    },
  });
}
