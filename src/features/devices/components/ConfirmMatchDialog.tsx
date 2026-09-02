import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import type { ApiError } from "../../../shared/api/apiError";
import { useDevices } from "../hooks/useDevices";
import { useConfirmDiscoveredDevice } from "../hooks/useDiscovery";
import { getDeviceErrorMessageKey } from "../utils/devicesFormatters";
import type { DiscoveredDeviceCandidateResponse } from "../types/devices.types";
import { DevicesModal } from "./DevicesModal";

type ConfirmMatchDialogProps = {
  companyId: string;
  branchId: string;
  edgeAgentId: string;
  candidate: DiscoveredDeviceCandidateResponse;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClass =
  "mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60";

export function ConfirmMatchDialog({
  companyId,
  branchId,
  edgeAgentId,
  candidate,
  onClose,
  onSuccess,
}: ConfirmMatchDialogProps) {
  const { t } = useI18n();
  const devicesQuery = useDevices(companyId, branchId);
  const [deviceId, setDeviceId] = useState(candidate.proposal?.proposedDeviceId || "");
  const [formError, setFormError] = useState("");

  const confirmMutation = useConfirmDiscoveredDevice(companyId, branchId, edgeAgentId);

  const submit = async () => {
    setFormError("");

    if (!deviceId) {
      setFormError(t("devices.discovery.deviceRequired"));
      return;
    }

    try {
      await confirmMutation.mutateAsync({
        discoveryId: candidate.discoveryId,
        payload: { existingDeviceId: deviceId },
      });
      toast.success(t("devices.toast.candidateLinked"));
      onSuccess();
    } catch (error) {
      const apiError = error as ApiError;
      const messageKey = getDeviceErrorMessageKey(apiError);
      setFormError(messageKey ? t(messageKey) : apiError.message || t("devices.error.generic"));
    }
  };

  return (
    <DevicesModal title={t("devices.discovery.linkExisting")} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-slate-400">{t("devices.discovery.linkExistingHint")}</p>

        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        <label className="block text-xs font-semibold text-slate-400">
          {t("devices.discovery.selectDevice")}
          <select
            value={deviceId}
            onChange={(event) => setDeviceId(event.target.value)}
            className={inputClass}
          >
            <option value="">{t("devices.device.none")}</option>
            {(devicesQuery.data || []).map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.code} — {device.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={confirmMutation.isPending}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-sm font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("devices.actions.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={confirmMutation.isPending}
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmMutation.isPending ? t("devices.actions.saving") : t("devices.discovery.confirmLink")}
          </button>
        </div>
      </div>
    </DevicesModal>
  );
}
