import { useI18n } from "../../../i18n/I18nContext";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { useCurrentPlatformAccess } from "../hooks/usePlatform";

// Direct-URL safety net for the NOBO Control Plane (mirrors EntitlementGate's own pattern exactly)
// -- a normal Company user (including a Company Owner) who navigates straight to /platform/* must
// see an honest "not available" state, not a half-rendered page. This is UX only; every platform
// backend endpoint independently re-checks the specific Platform.* permission it needs regardless
// of what this gate does.
export function PlatformAccessGate({ children }) {
  const { t } = useI18n();
  const accessQuery = useCurrentPlatformAccess();

  if (accessQuery.isLoading) {
    return <LoadingState label={t("platform.checkingAccess")} />;
  }

  if (accessQuery.isError) {
    return (
      <ErrorState
        title={t("platform.unavailableTitle")}
        message={t("platform.unavailableMessage")}
      />
    );
  }

  if (!accessQuery.data?.isPlatformStaff) {
    return (
      <EmptyState
        title={t("platform.notStaffTitle")}
        message={t("platform.notStaffMessage")}
      />
    );
  }

  return children;
}
