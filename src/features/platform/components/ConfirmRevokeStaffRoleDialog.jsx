import { AlertTriangle } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { PlatformModal } from "./PlatformModal";

export function ConfirmRevokeStaffRoleDialog({ member, isPending, onConfirm, onClose }) {
  const { t } = useI18n();

  return (
    <PlatformModal title={t("platform.staff.revokeAdmin")} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-xs leading-5 text-amber-100">
            {t("platform.staff.confirmRevoke", { name: member.displayName })}
          </p>
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
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-rose-600 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? t("platform.actions.saving") : t("platform.staff.revoke")}
          </button>
        </div>
      </div>
    </PlatformModal>
  );
}
