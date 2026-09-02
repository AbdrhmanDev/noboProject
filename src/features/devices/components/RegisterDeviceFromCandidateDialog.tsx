import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import type { ApiError } from "../../../shared/api/apiError";
import { useKitchenStations } from "../../kitchen/hooks/useKitchen";
import { usePosTerminals } from "../../pos/hooks/usePosTerminals";
import { useConfirmDiscoveredDevice } from "../hooks/useDiscovery";
import { DEVICE_TYPES } from "../schemas/deviceForm.schema";
import { getDeviceErrorMessageKey } from "../utils/devicesFormatters";
import type { DeviceType, DiscoveredDeviceCandidateResponse } from "../types/devices.types";
import { DevicesModal } from "./DevicesModal";

type RegisterDeviceFromCandidateDialogProps = {
  companyId: string;
  branchId: string;
  edgeAgentId: string;
  candidate: DiscoveredDeviceCandidateResponse;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClass =
  "mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60";

// Admin must explicitly pick deviceType from the real fixed list —
// deviceCategoryGuess only prefills a suggestion below, it never
// auto-submits or hides the choice.
export function RegisterDeviceFromCandidateDialog({
  companyId,
  branchId,
  edgeAgentId,
  candidate,
  onClose,
  onSuccess,
}: RegisterDeviceFromCandidateDialogProps) {
  const { t } = useI18n();
  const posTerminalsQuery = usePosTerminals(companyId, branchId, true);
  const kitchenStationsQuery = useKitchenStations(companyId, branchId);

  const [code, setCode] = useState("");
  const [name, setName] = useState(candidate.displayName || "");
  const [deviceType, setDeviceType] = useState<DeviceType>(
    candidate.deviceCategoryGuess || "ReceiptPrinter",
  );
  const [posTerminalId, setPosTerminalId] = useState("");
  const [kitchenStationId, setKitchenStationId] = useState("");
  const [formError, setFormError] = useState("");

  const confirmMutation = useConfirmDiscoveredDevice(companyId, branchId, edgeAgentId);

  const submit = async () => {
    setFormError("");

    if (!code.trim()) {
      setFormError(t("devices.form.codeRequired"));
      return;
    }
    if (!name.trim()) {
      setFormError(t("devices.form.nameRequired"));
      return;
    }

    try {
      await confirmMutation.mutateAsync({
        discoveryId: candidate.discoveryId,
        payload: {
          createDevice: {
            code: code.trim(),
            name: name.trim(),
            deviceType,
            posTerminalId: posTerminalId || null,
            kitchenStationId: kitchenStationId || null,
            certification: candidate.certificationStatus,
          },
        },
      });
      toast.success(t("devices.toast.candidateRegistered"));
      onSuccess();
    } catch (error) {
      const apiError = error as ApiError;
      const messageKey = getDeviceErrorMessageKey(apiError);
      setFormError(messageKey ? t(messageKey) : apiError.message || t("devices.error.generic"));
    }
  };

  return (
    <DevicesModal title={t("devices.discovery.registerNew")} onClose={onClose} size="lg">
      <div className="space-y-3">
        {candidate.deviceCategoryGuess && (
          <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-100">
            {t("devices.discovery.categoryGuessHint", {
              guess: t(
                `devices.enum.deviceType.${candidate.deviceCategoryGuess.charAt(0).toLowerCase()}${candidate.deviceCategoryGuess.slice(1)}`,
              ),
            })}
          </div>
        )}

        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.code")}
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              maxLength={50}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.name")}
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={200}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block text-xs font-semibold text-slate-400">
          {t("devices.device.deviceType")}
          <select
            value={deviceType}
            onChange={(event) => setDeviceType(event.target.value as DeviceType)}
            className={inputClass}
          >
            {DEVICE_TYPES.map((value) => (
              <option key={value} value={value}>
                {t(`devices.enum.deviceType.${value.charAt(0).toLowerCase()}${value.slice(1)}`)}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.posTerminal")}
            <select
              value={posTerminalId}
              onChange={(event) => setPosTerminalId(event.target.value)}
              className={inputClass}
            >
              <option value="">{t("devices.device.none")}</option>
              {(posTerminalsQuery.data || []).map((terminal) => (
                <option key={terminal.posTerminalId} value={terminal.posTerminalId}>
                  {terminal.code} — {terminal.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.kitchenStation")}
            <select
              value={kitchenStationId}
              onChange={(event) => setKitchenStationId(event.target.value)}
              className={inputClass}
            >
              <option value="">{t("devices.device.none")}</option>
              {(kitchenStationsQuery.data || []).map((station) => (
                <option key={station.kitchenStationId} value={station.kitchenStationId}>
                  {station.code} — {station.name}
                </option>
              ))}
            </select>
          </label>
        </div>

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
            {confirmMutation.isPending
              ? t("devices.actions.saving")
              : t("devices.discovery.registerNew")}
          </button>
        </div>
      </div>
    </DevicesModal>
  );
}
