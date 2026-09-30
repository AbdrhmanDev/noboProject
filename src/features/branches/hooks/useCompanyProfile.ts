import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applyProposedBranch, getApprovedCompanyProfile } from "../api/companyProfileApi";
import { branchQueryKeys } from "./useBranches";
import type { ApplyProposedBranchRequest } from "../types/companyProfile.types";

export const companyProfileQueryKeys = {
  approved: (companyId: string) => ["companyProfile", companyId, "approved"] as const,
};

// Requires CompanyProfile.View (the owner always has it) -- callers gate `enabled` on that permission
// so a viewer without it gets no failed request, just an absent section.
export function useApprovedCompanyProfile(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: companyProfileQueryKeys.approved(companyId || ""),
    queryFn: () => getApprovedCompanyProfile(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

// Turns ONE proposed branch of the CURRENT approved profile into a real branch (Branches.Manage).
// Idempotent per proposal (result: "created" | "already_exists"); invalidates both the branch list
// (the new branch must appear there) and the approved profile (MaterializedBranchId/Status change).
export function useApplyProposedBranch(companyId: string | null | undefined, versionNumber: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ordinal, payload }: { ordinal: number; payload?: ApplyProposedBranchRequest }) =>
      applyProposedBranch(companyId as string, versionNumber as number, ordinal, payload),
    onSuccess: () => {
      if (!companyId) return;
      queryClient.invalidateQueries({ queryKey: branchQueryKeys.byCompany(companyId) });
      queryClient.invalidateQueries({ queryKey: companyProfileQueryKeys.approved(companyId) });
    },
  });
}
