import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateGenerationUnit,
  assignGenerationUnitToBranch,
  createGenerationUnit,
  deactivateGenerationUnit,
  getBranchGenerationUnit,
  getGenerationUnit,
  listGenerationUnits,
} from "../api/generationUnitsApi";
import type { AssignGenerationUnitRequest, CreateGenerationUnitRequest } from "../types/generationUnit.types";

export const generationUnitQueryKeys = {
  byCompany: (companyId: string) => ["generationUnits", companyId] as const,
  details: (companyId: string, unitId: string) => ["generationUnits", companyId, unitId] as const,
  branchAssignment: (companyId: string, branchId: string) =>
    ["generationUnits", companyId, "branch", branchId] as const,
};

export function useGenerationUnits(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: generationUnitQueryKeys.byCompany(companyId || ""),
    queryFn: () => listGenerationUnits(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useGenerationUnitDetails(
  companyId: string | null | undefined,
  unitId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: generationUnitQueryKeys.details(companyId || "", unitId || ""),
    queryFn: () => getGenerationUnit(companyId as string, unitId as string),
    enabled: Boolean(companyId) && Boolean(unitId) && enabled,
  });
}

// The branch's CURRENT generation unit (no history endpoint exists -- see the feature's own types
// file comment). Used both by the Branches page (to show each branch's assigned unit) and the
// Generation Units page (to resolve "which branches use this unit" one branch at a time, since the
// unit list only returns a COUNT, never the branch ids).
export function useBranchGenerationUnit(
  companyId: string | null | undefined,
  branchId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: generationUnitQueryKeys.branchAssignment(companyId || "", branchId || ""),
    queryFn: () => getBranchGenerationUnit(companyId as string, branchId as string),
    enabled: Boolean(companyId) && Boolean(branchId) && enabled,
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>, companyId: string | null | undefined) {
  if (!companyId) return;
  queryClient.invalidateQueries({ queryKey: generationUnitQueryKeys.byCompany(companyId) });
}

export function useCreateGenerationUnit(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGenerationUnitRequest) => createGenerationUnit(companyId as string, payload),
    onSuccess: () => invalidateAll(queryClient, companyId),
  });
}

export function useActivateGenerationUnit(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (unitId: string) => activateGenerationUnit(companyId as string, unitId),
    onSuccess: () => invalidateAll(queryClient, companyId),
  });
}

export function useDeactivateGenerationUnit(companyId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (unitId: string) => deactivateGenerationUnit(companyId as string, unitId),
    onSuccess: () => invalidateAll(queryClient, companyId),
  });
}

export function useAssignGenerationUnitToBranch(companyId: string | null | undefined, branchId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignGenerationUnitRequest) =>
      assignGenerationUnitToBranch(companyId as string, branchId as string, payload),
    onSuccess: () => {
      if (!companyId || !branchId) return;
      queryClient.invalidateQueries({ queryKey: generationUnitQueryKeys.branchAssignment(companyId, branchId) });
      invalidateAll(queryClient, companyId); // AssignedBranchCount on both the old and new unit changed
    },
  });
}
