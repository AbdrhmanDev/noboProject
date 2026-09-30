import { useQuery } from "@tanstack/react-query";
import {
  getApprovedCompanyProfile,
  getApprovedCompanyProfileVersion,
  listApprovedCompanyProfileVersions,
} from "../api/companyProfileApi";

export const companyProfileQueryKeys = {
  current: (companyId: string) => ["companyProfile", companyId, "current"] as const,
  versions: (companyId: string) => ["companyProfile", companyId, "versions"] as const,
  version: (companyId: string, versionNumber: number) => ["companyProfile", companyId, "version", versionNumber] as const,
};

export function useApprovedCompanyProfile(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: companyProfileQueryKeys.current(companyId || ""),
    queryFn: () => getApprovedCompanyProfile(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useApprovedCompanyProfileVersions(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: companyProfileQueryKeys.versions(companyId || ""),
    queryFn: () => listApprovedCompanyProfileVersions(companyId as string),
    enabled: Boolean(companyId) && enabled,
  });
}

export function useApprovedCompanyProfileVersion(
  companyId: string | null | undefined,
  versionNumber: number | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: companyProfileQueryKeys.version(companyId || "", versionNumber ?? -1),
    queryFn: () => getApprovedCompanyProfileVersion(companyId as string, versionNumber as number),
    enabled: Boolean(companyId) && versionNumber != null && enabled,
  });
}
