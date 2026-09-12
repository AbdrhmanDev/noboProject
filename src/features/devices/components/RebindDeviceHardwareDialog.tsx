import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import type { ApiError } from "../../../shared/api/apiError";
import { useLatestDiscoveredDevices } from "../hooks/useDiscovery";
import { useRebindDeviceHardware } from "../hooks/useDevices";
import { getDeviceErrorMessageKey } from "../utils/devicesFormatters";
import type {
  DeviceHardwareBindingResponse,
  DeviceResponse,
  DiscoveredDeviceCandidateResponse,
} from "../types/devices.types";
import { DevicesModal } from "./DevicesModal";

type RebindDeviceHardwareDialogProps = {
  companyId: string;
  branchId: string;
  device: DeviceResponse;
  currentBinding: DeviceHardwareBindingResponse | null | undefined;
  edgeAgentId: string;
  // Pass the already-loaded latest-report candidates when opening this from the Discovery page
  // (avoids a second fetch of the same report); omitted when opening from Device Details, where
  // this dialog fetches its own copy of the exact same "current hardware state" snapshot.
  candidates?: DiscoveredDeviceCandidateResponse[];
  onClose: () => void;
  onSuccess: () => void;
};

const selectClass =
  "mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/60";

export function RebindDeviceHardwareDialog({
  companyId,
  branchId,
  device,
  currentBinding,
  edgeAgentId,
  candidates: providedCandidates,
  onClose,
  onSuccess,
}: RebindDeviceHardwareDialogProps) {
  const { t } = useI18n();
  const [discoveryId, setDiscoveryId] = useState("");
  const [formError, setFormError] = useState("");

  const shouldFetchOwnReport = providedCandidates === undefined;
  const latestReportQuery = useLatestDiscoveredDevices(
    companyId,
    branchId,
    edgeAgentId,
    shouldFetchOwnReport,
  );
  const candidates = providedCandidates ?? latestReportQuery.data?.candidates ?? [];

  // Never offered as a target: hardware already bound to a DIFFERENT device (Part E -- this
  // dialog must not even present a "steal" option, let alone allow submitting one). Hardware
  // already bound to THIS SAME device is allowed and shown -- picking it back is the explicit
  // "reconcile connection metadata" path for already-bound hardware (Part F).
  const selectableCandidates = candidates.filter(
    (candidate) => !candidate.matchedDeviceId || candidate.matchedDeviceId === device.deviceId,
  );

  const selectedCandidate = useMemo(
    () => selectableCandidates.find((candidate) => candidate.discoveryId === discoveryId) || null,
    [selectableCandidates, discoveryId],
  );

  const rebindMutation = useRebindDeviceHardware(companyId, branchId, device.deviceId);

  const submit = async () => {
    setFormError("");

    if (!selectedCandidate) {
      setFormError(t("devices.rebind.candidateRequired"));
      return;
    }

    try {
      await rebindMutation.mutateAsync({
        edgeAgentId,
        discoveryId: selectedCandidate.discoveryId,
        expectedCurrentBindingId: currentBinding?.id ?? null,
      });
      toast.success(t("devices.toast.hardwareReplaced"));
      onSuccess();
    } catch (error) {
      const apiError = error as ApiError;
      const messageKey = getDeviceErrorMessageKey(apiError);
      setFormError(messageKey ? t(messageKey) : apiError.message || t("devices.error.generic"));
    }
  };

  const currentLabel = currentBinding
    ? device.manufacturer || device.model
      ? [device.manufacturer, device.model].filter(Boolean).join(" ")
      : t("devices.enum.transportType." + currentBinding.transportType.toLowerCase())
    : t("devices.rebind.noCurrentHardware");

  return (
    <DevicesModal title={t("devices.rebind.title")} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-slate-400">{t("devices.rebind.hint", { device: device.name })}</p>

        {formError && (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {formError}
          </div>
        )}

        {shouldFetchOwnReport && latestReportQuery.isLoading && (
          <p className="text-xs text-slate-500">{t("devices.loading")}</p>
        )}

        <label className="block text-xs font-semibold text-slate-400">
          {t("devices.rebind.selectCandidate")}
          <select
            value={discoveryId}
            onChange={(event) => setDiscoveryId(event.target.value)}
            className={selectClass}
          >
            <option value="">{t("devices.device.none")}</option>
            {selectableCandidates.map((candidate) => (
              <option key={candidate.discoveryId} value={candidate.discoveryId}>
                {candidate.displayName || candidate.discoveryId}
                {candidate.matchedDeviceId === device.deviceId ? ` (${t("devices.rebind.currentHardware")})` : ""}
              </option>
            ))}
          </select>
        </label>

        {selectableCandidates.length === 0 && !latestReportQuery.isLoading && (
          <p className="text-[11px] text-amber-300">{t("devices.rebind.noCandidates")}</p>
        )}

        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">{t("devices.rebind.current")}</span>
            <span className="font-bold text-white">{currentLabel}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <span className="text-slate-500">{t("devices.rebind.new")}</span>
            <span className="font-bold text-white">
              {selectedCandidate?.displayName || "—"}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">{t("devices.rebind.preserveNote")}</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={rebindMutation.isPending}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-sm font-bold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("devices.actions.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={rebindMutation.isPending || !selectedCandidate}
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rebindMutation.isPending ? t("devices.actions.saving") : t("devices.rebind.confirm")}
          </button>
        </div>
      </div>
    </DevicesModal>
  );
}
