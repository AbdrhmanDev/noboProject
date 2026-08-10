import { useQuery } from "@tanstack/react-query";
import { getBranches } from "../api/branchesApi";
import type { Branch } from "../types/branch.types";

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
