import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  disableCompanyCompliance,
  enableCompanyCompliance,
  getCompanyComplianceStatus,
} from "../api/companyComplianceApi";
import type { DisableCompanyComplianceRequest } from "../types/companyCompliance.types";

// "companyCompliance" (not "complianceStatus") so a later branch-level compliance feature can use
// its own, clearly distinct key prefix without ever colliding with or being invalidated by this
// one -- company-level and branch-level enablement are different concepts (see the page's own
// comment) and must never share a cache key just because they both start with "compliance".
export const companyComplianceQueryKeys = {
  status: (companyId: string) => ["companyCompliance", "status", companyId] as const,
};

export function useCompanyComplianceStatus(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: companyComplianceQueryKeys.status(companyId || ""),
    queryFn: () => getCompanyComplianceStatus(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>, companyId: string | null | undefined) {
  if (!companyId) return;
  queryClient.invalidateQueries({ queryKey: companyComplianceQueryKeys.status(companyId) });
  // No branch-level compliance query exists yet anywhere in this frontend (verified by source
  // inspection before writing this feature) -- there is nothing else to invalidate today. Once a
  // branch-level compliance screen is built, its query key(s) belong here too, so re-enabling or
  // disabling the company master immediately refreshes what that screen shows.
}

export function useEnableCompanyCompliance(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => enableCompanyCompliance(companyId as string),
    onSuccess: (result) => {
      queryClient.setQueryData(companyComplianceQueryKeys.status(companyId || ""), result.status);
      invalidate(queryClient, companyId);
    },
  });
}

export function useDisableCompanyCompliance(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DisableCompanyComplianceRequest = {}) =>
      disableCompanyCompliance(companyId as string, payload),
    onSuccess: (result) => {
      queryClient.setQueryData(companyComplianceQueryKeys.status(companyId || ""), result.status);
      invalidate(queryClient, companyId);
    },
  });
}
