import { AlertTriangle } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { PlatformModal } from "./PlatformModal";

// Root-App-OFF gets the explicit "what this does and doesn't do" confirmation the task requires
// (section 12): never implies data deletion, always states history/child-capability preservation.
// A child capability toggle uses a lighter, generic confirmation.
export function ConfirmToggleEntitlementDialog({ entitlement, nextEnabled, isPending, onConfirm, onClose }) {
  const { t } = useI18n();
  const isRootApp = entitlement.kind === "App";
  const isTurningOff = !nextEnabled;

  const title = nextEnabled
    ? t("platform.confirm.enableTitle", { code: entitlement.code })
    : t("platform.confirm.disableTitle", { code: entitlement.code });

  return (
    <PlatformModal title={title} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-warning bg-warning-soft p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
          <div className="space-y-1.5 text-sm leading-5 text-warning">
            {isRootApp && isTurningOff ? (
              <>
                <p>{t("platform.confirm.disableAppConsequence1")}</p>
                <p>{t("platform.confirm.disableAppConsequence2")}</p>
                <p>{t("platform.confirm.disableAppConsequence3")}</p>
                <p>{t("platform.confirm.disableAppConsequence4")}</p>
              </>
            ) : isRootApp ? (
              <p>{t("platform.confirm.enableAppConsequence")}</p>
            ) : (
              <p>
                {nextEnabled
                  ? t("platform.confirm.enableCapabilityConsequence")
                  : t("platform.confirm.disableCapabilityConsequence")}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-line bg-raised text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("platform.actions.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isTurningOff ? "bg-danger hover:brightness-110" : "bg-success hover:brightness-110"
            }`}
          >
            {isPending
              ? t("platform.actions.saving")
              : nextEnabled
                ? t("platform.actions.enable")
                : t("platform.actions.disable")}
          </button>
        </div>
      </div>
    </PlatformModal>
  );
}
