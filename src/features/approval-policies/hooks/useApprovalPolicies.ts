import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCompanyApprovalPolicy, setCompanyApprovalPolicy } from "../api/approvalPoliciesApi";
import type { SetCompanyApprovalPolicyRequest } from "../types/approvalPolicy.types";

// [feature, companyId, actionCode] -- same key-shape convention used across every other
// company-scoped feature (payments, approvals, ...), which is what naturally prevents a company
// switch from leaking the previous company's cached policy: a different companyId is simply a
// different cache entry, never the same one re-read stale.
export const approvalPolicyQueryKeys = {
  policy: (companyId: string, actionCode: string) =>
    ["approval-policies", companyId, actionCode] as const,
};

export function useCompanyApprovalPolicy(
  companyId: string | null | undefined,
  actionCode: string,
  enabled = true,
) {
  return useQuery({
    queryKey: approvalPolicyQueryKeys.policy(companyId || "", actionCode),
    queryFn: () => getCompanyApprovalPolicy(companyId as string, actionCode),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useSetCompanyApprovalPolicy(
  companyId: string | null | undefined,
  actionCode: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetCompanyApprovalPolicyRequest) =>
      setCompanyApprovalPolicy(companyId as string, actionCode, payload),
    onSuccess: () => {
      if (!companyId) return;
      queryClient.invalidateQueries({
        queryKey: approvalPolicyQueryKeys.policy(companyId, actionCode),
      });
    },
  });
}
