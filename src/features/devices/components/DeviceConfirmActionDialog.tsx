import { AlertTriangle } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import { DevicesModal } from "./DevicesModal";

type DeviceConfirmActionDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

// NOBO-styled confirmation used wherever this feature needs a real confirm
// step (status changes, etc.) instead of window.confirm.
export function DeviceConfirmActionDialog({
  title,
  message,
  confirmLabel,
  tone = "danger",
  isPending,
  onConfirm,
  onClose,
}: DeviceConfirmActionDialogProps) {
  const { t } = useI18n();
  const confirmClasses =
    tone === "danger" ? "bg-rose-600 hover:brightness-110" : "bg-blue-600 hover:brightness-110";

  return (
    <DevicesModal title={title} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-xs leading-5 text-amber-100">{message}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-sm font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("devices.actions.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmClasses}`}
          >
            {isPending ? t("devices.actions.saving") : confirmLabel}
          </button>
        </div>
      </div>
    </DevicesModal>
  );
}
