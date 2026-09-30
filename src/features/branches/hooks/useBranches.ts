import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeBranchStatus, createBranch, getBranchDetails, getBranches, updateBranch } from "../api/branchesApi";
import type { Branch, ChangeBranchStatusRequest, CreateBranchRequest, UpdateBranchRequest } from "../types/branch.types";

export const branchQueryKeys = {
  all: ["branches"] as const,
  byCompany: (companyId: string) => ["branches", companyId] as const,
  details: (companyId: string, branchId: string) => ["branches", companyId, branchId] as const,
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

export function useBranchDetails(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: branchQueryKeys.details(companyId || "", branchId || ""),
    queryFn: () => getBranchDetails(companyId as string, branchId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
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

export function useUpdateBranch(companyId: string | null | undefined, branchId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBranchRequest) => updateBranch(companyId as string, branchId as string, payload),
    onSuccess: () => {
      if (!companyId) return;
      queryClient.invalidateQueries({ queryKey: branchQueryKeys.byCompany(companyId) });
      if (branchId) queryClient.invalidateQueries({ queryKey: branchQueryKeys.details(companyId, branchId) });
    },
  });
}

export function useChangeBranchStatus(companyId: string | null | undefined, branchId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangeBranchStatusRequest) =>
      changeBranchStatus(companyId as string, branchId as string, payload),
    onSuccess: () => {
      if (!companyId) return;
      queryClient.invalidateQueries({ queryKey: branchQueryKeys.byCompany(companyId) });
      if (branchId) queryClient.invalidateQueries({ queryKey: branchQueryKeys.details(companyId, branchId) });
    },
  });
}
