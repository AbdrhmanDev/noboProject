import { AlertTriangle } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { ProcurementModal } from "./ProcurementModal";

// NOBO-styled confirmation, used wherever this feature needs a real confirm
// step (Suspend/Activate Supplier, Submit/Cancel/Close PO) instead of
// window.confirm.
export function ConfirmActionDialog({
  title,
  message,
  confirmLabel,
  tone = "danger",
  isPending,
  onConfirm,
  onClose,
}) {
  const { t } = useI18n();
  const confirmClasses =
    tone === "danger" ? "bg-danger hover:brightness-110" : "bg-accent hover:bg-accent-strong";

  return (
    <ProcurementModal title={title} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-warning bg-warning-soft p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
          <p className="text-sm leading-5 text-warning">{message}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-line bg-raised text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("procurement.actions.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmClasses}`}
          >
            {isPending ? t("procurement.actions.saving") : confirmLabel}
          </button>
        </div>
      </div>
    </ProcurementModal>
  );
}
