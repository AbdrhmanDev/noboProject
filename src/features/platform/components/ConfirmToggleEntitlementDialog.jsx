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
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
          <div className="space-y-1.5 text-xs leading-5 text-amber-100">
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
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-sm font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("platform.actions.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isTurningOff ? "bg-rose-600 hover:brightness-110" : "bg-emerald-600 hover:brightness-110"
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
