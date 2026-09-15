import { useI18n } from "../../../i18n/I18nContext";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { useCompany } from "../context/CompanyContext";
import {
  hasEffectivePermission,
  isEntitlementEnabled,
  useCompanyEntitlements,
  useCompanyPermissions,
} from "../hooks/useCompanies";

// Direct-URL protection (Section 1/2 of the Permission-Driven Tenant Application Shell task):
// sidebar visibility alone (PermissionNavItem) never stopped a manually-typed URL from rendering
// an unauthorized page -- only Commercial-App entitlement had a route-level gate (see the old
// EntitlementGate, which this supersedes). This is the one reusable guard every tenant route
// needing a permission and/or entitlement check should use, instead of re-implementing the same
// three query/loading/error/deny checks per page. Backend remains the real security boundary
// regardless -- this is UX only, exactly like EntitlementGate was.
//
// `permission` / `permissions` follow PermissionNavItem's own any-of semantics by default; pass
// `matchMode="all"` for the rare case a route needs every listed permission (e.g. Device
// Discovery, which mirrors DevicesNavGroup's `canViewDevices && canViewEdgeAgents`).
export function RouteAccessGate({ permission, permissions, matchMode = "any", entitlement, children }) {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const permissionQuery = useCompanyPermissions(currentCompanyId);
  const entitlementsQuery = useCompanyEntitlements(currentCompanyId);
  const requiredPermissions = permissions || (permission ? [permission] : []);

  if (!currentCompanyId) {
    return null;
  }

  const entitlementLoading = Boolean(entitlement) && entitlementsQuery.isLoading;
  const entitlementErrored = Boolean(entitlement) && entitlementsQuery.isError;

  if (permissionQuery.isLoading || entitlementLoading) {
    return <LoadingState label={t("entitlements.checking")} />;
  }

  if (permissionQuery.isError || entitlementErrored) {
    return (
      <ErrorState
        title={t("access.unavailableTitle")}
        message={t("access.unavailableMessage")}
      />
    );
  }

  if (entitlement && !isEntitlementEnabled(entitlementsQuery.data, entitlement)) {
    return (
      <EmptyState
        title={t("entitlements.appNotEnabledTitle")}
        message={t("entitlements.appNotEnabledMessage")}
      />
    );
  }

  const hasPermission =
    requiredPermissions.length === 0 ||
    (matchMode === "all"
      ? requiredPermissions.every((requiredPermission) =>
          hasEffectivePermission(permissionQuery.data, requiredPermission),
        )
      : requiredPermissions.some((requiredPermission) =>
          hasEffectivePermission(permissionQuery.data, requiredPermission),
        ));

  if (!hasPermission) {
    return (
      <EmptyState
        title={t("access.deniedTitle")}
        message={t("access.deniedMessage")}
      />
    );
  }

  return children;
}
