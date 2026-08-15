import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBranch, getBranches } from "../api/branchesApi";
import type { Branch, CreateBranchRequest } from "../types/branch.types";

export const branchQueryKeys = {
  all: ["branches"] as const,
  byCompany: (companyId: string) => ["branches", companyId] as const,
};

export function isBranchEnterable(branch: Branch) {
  return branch.status === "Active";
}

export function useBranches(
  companyId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: branchQueryKeys.byCompany(companyId || ""),
    queryFn: () => getBranches(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useCreateBranch(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBranchRequest) => createBranch(companyId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchQueryKeys.byCompany(companyId || "") });
    },
  });
}
