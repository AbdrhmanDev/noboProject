import { useQuery } from "@tanstack/react-query";
import {
  getCompanyDetails,
  getCompanyPermissions,
  getMyCompanies,
} from "../api/companiesApi";
import type { EffectivePermissions } from "../types/company.types";

export const companyQueryKeys = {
  all: ["companies"] as const,
  mine: ["companies", "mine"] as const,
  details: (companyId: string) => ["companies", companyId, "details"] as const,
  permissions: (companyId: string) => ["companies", companyId, "permissions"] as const,
};

export function useMyCompanies(enabled = true) {
  return useQuery({
    queryKey: companyQueryKeys.mine,
    queryFn: getMyCompanies,
    enabled,
  });
}

export function useCompanyDetails(companyId: string | null | undefined) {
  return useQuery({
    queryKey: companyQueryKeys.details(companyId || ""),
    queryFn: () => getCompanyDetails(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function useCompanyPermissions(companyId: string | null | undefined) {
  return useQuery({
    queryKey: companyQueryKeys.permissions(companyId || ""),
    queryFn: () => getCompanyPermissions(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function usePermissions(companyId: string | null | undefined) {
  return useCompanyPermissions(companyId);
}

export function hasEffectivePermission(
  effectivePermissions: EffectivePermissions | null | undefined,
  permission: string,
) {
  if (!effectivePermissions) return false;
  return effectivePermissions.isOwner || effectivePermissions.permissions.includes(permission);
}

export function useHasPermission(
  companyId: string | null | undefined,
  permission: string,
) {
  const query = useCompanyPermissions(companyId);

  return {
    ...query,
    hasPermission: hasEffectivePermission(query.data, permission),
  };
}
