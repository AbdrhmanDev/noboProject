import { useI18n } from "../../../i18n/I18nContext";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { useCompany } from "../context/CompanyContext";
import { useCompanyEntitlements, isEntitlementEnabled } from "../hooks/useCompanies";

// Direct-URL safety net (Hierarchical Company Entitlements task, section 15): route guards today
// only check authentication, so a user who navigates straight to e.g. /inventory must still see an
// honest "not available" state rather than the page half-rendering against data it can't reach --
// the backend already rejects the underlying requests either way; this is UX only; it is not the
// security boundary. Deliberately scoped to the handful of routes wired to a Commercial App in
// this task (POS/Inventory/Restaurant/Procurement) rather than a full router rewrite.
export function EntitlementGate({ code, children }) {
  const { t } = useI18n();
  const { currentCompanyId } = useCompany();
  const entitlementsQuery = useCompanyEntitlements(currentCompanyId);

  if (!currentCompanyId) {
    return null;
  }

  if (entitlementsQuery.isLoading) {
    return <LoadingState label={t("entitlements.checking")} />;
  }

  if (entitlementsQuery.isError) {
    return (
      <ErrorState
        title={t("entitlements.unavailableTitle")}
        message={t("entitlements.unavailableMessage")}
      />
    );
  }

  if (!isEntitlementEnabled(entitlementsQuery.data, code)) {
    return (
      <EmptyState
        title={t("entitlements.appNotEnabledTitle")}
        message={t("entitlements.appNotEnabledMessage")}
      />
    );
  }

  return children;
}
