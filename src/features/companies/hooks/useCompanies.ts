import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCompany,
  getCompanyDetails,
  getCompanyEntitlements,
  getCompanyPermissions,
  getMyCompanies,
} from "../api/companiesApi";
import { getBusinessSectors } from "../api/businessSectorsApi";
import type {
  CompanyEntitlements,
  CreateCompanyRequest,
  EffectivePermissions,
} from "../types/company.types";

export const companyQueryKeys = {
  all: ["companies"] as const,
  mine: ["companies", "mine"] as const,
  details: (companyId: string) => ["companies", companyId, "details"] as const,
  permissions: (companyId: string) => ["companies", companyId, "permissions"] as const,
  entitlements: (companyId: string) => ["companies", companyId, "entitlements"] as const,
};

export const businessSectorQueryKeys = {
  all: ["business-sectors"] as const,
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

export function useBusinessSectors() {
  return useQuery({
    queryKey: businessSectorQueryKeys.all,
    queryFn: getBusinessSectors,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCompanyRequest) => createCompany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.mine });
    },
  });
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

// Company Entitlement = what NOBO has enabled for the company to own -- kept completely separate
// from permissions above. The backend already resolves the App/Capability hierarchy (a disabled
// parent makes every child effectively disabled) before this response is built, so `enabled` here
// is the final answer; this hook must never re-derive that algorithm client-side.
export function useCompanyEntitlements(companyId: string | null | undefined) {
  return useQuery({
    queryKey: companyQueryKeys.entitlements(companyId || ""),
    queryFn: () => getCompanyEntitlements(companyId as string),
    enabled: Boolean(companyId),
  });
}

export function isEntitlementEnabled(
  entitlements: CompanyEntitlements | null | undefined,
  code: string,
) {
  return entitlements?.entitlements.some((entitlement) => entitlement.code === code && entitlement.enabled) ?? false;
}

export function useHasEntitlement(companyId: string | null | undefined, code: string) {
  const query = useCompanyEntitlements(companyId);

  return {
    ...query,
    hasEntitlement: isEntitlementEnabled(query.data, code),
  };
}

// Clean hasApp/hasCapability API over the same query (Hierarchical Company Entitlements task,
// section 13) -- both are the same effective-enabled lookup, this just names the call sites more
// clearly at usage (e.g. hasApp("INVENTORY") vs hasCapability("INVENTORY.ADJUSTMENTS")).
export function useEntitlements(companyId: string | null | undefined) {
  const query = useCompanyEntitlements(companyId);

  return {
    ...query,
    hasApp: (code: string) => isEntitlementEnabled(query.data, code),
    hasCapability: (code: string) => isEntitlementEnabled(query.data, code),
  };
}
