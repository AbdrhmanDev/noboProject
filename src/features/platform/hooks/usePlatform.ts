import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignPlatformStaffRole,
  getCurrentPlatformAccess,
  getPlatformCompanies,
  getPlatformCompanyEntitlements,
  getPlatformStaff,
  revokePlatformStaffRole,
  setPlatformCompanyEntitlement,
} from "../api/platformApi";
import type {
  AssignPlatformStaffRoleRequest,
  PlatformCompanyListFilters,
  SetPlatformCompanyEntitlementRequest,
} from "../types/platform.types";

export const platformQueryKeys = {
  access: ["platform", "me", "access"] as const,
  companies: (filters: PlatformCompanyListFilters) => ["platform", "companies", filters] as const,
  entitlements: (companyId: string) => ["platform", "companies", companyId, "entitlements"] as const,
  staff: ["platform", "staff"] as const,
};

// "Am I NOBO staff" -- the frontend counterpart to useCompanyEntitlements/useHasPermission for the
// tenant side, but keyed off platform authorization instead. Used both to gate nav visibility and
// the /platform/* routes themselves; the backend remains the real security boundary regardless.
export function useCurrentPlatformAccess(enabled = true) {
  return useQuery({
    queryKey: platformQueryKeys.access,
    queryFn: getCurrentPlatformAccess,
    enabled,
    // A 401/403 here just means "not platform staff" -- don't retry it as if it were a transient
    // network failure.
    retry: false,
  });
}

export function usePlatformCompanies(filters: PlatformCompanyListFilters = {}, enabled = true) {
  return useQuery({
    queryKey: platformQueryKeys.companies(filters),
    queryFn: () => getPlatformCompanies(filters),
    enabled,
  });
}

export function usePlatformCompanyEntitlements(companyId: string | null | undefined) {
  return useQuery({
    queryKey: platformQueryKeys.entitlements(companyId || ""),
    queryFn: () => getPlatformCompanyEntitlements(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useSetPlatformCompanyEntitlement(companyId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entitlementCode,
      payload,
    }: {
      entitlementCode: string;
      payload: SetPlatformCompanyEntitlementRequest;
    }) => setPlatformCompanyEntitlement(companyId as string, entitlementCode, payload),
    onSuccess: () => {
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.entitlements(companyId) });
      }
    },
  });
}

export function usePlatformStaff(enabled = true) {
  return useQuery({
    queryKey: platformQueryKeys.staff,
    queryFn: getPlatformStaff,
    enabled,
  });
}

export function useAssignPlatformStaffRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignPlatformStaffRoleRequest) => assignPlatformStaffRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.staff });
    },
  });
}

export function useRevokePlatformStaffRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleCode }: { userId: string; roleCode: string }) =>
      revokePlatformStaffRole(userId, roleCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.staff });
    },
  });
}
