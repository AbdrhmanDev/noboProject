import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import type { ApiError } from "../../../shared/api/apiError";
import { useKitchenStations } from "../../kitchen/hooks/useKitchen";
import { usePosTerminals } from "../../pos/hooks/usePosTerminals";
import { useCreateDevice, useUpdateDevice } from "../hooks/useDevices";
import { useEdgeAgents } from "../hooks/useEdgeAgents";
import {
  CERTIFICATION_STATUSES,
  CONNECTION_TYPES,
  DEVICE_TYPES,
  deviceFormSchema,
  type DeviceFormValues,
} from "../schemas/deviceForm.schema";
import type { DeviceResponse } from "../types/devices.types";
import { DevicesModal } from "./DevicesModal";

type DeviceFormDialogProps = {
  companyId: string;
  branchId: string;
  device?: DeviceResponse | null;
  onClose: () => void;
  onSuccess: (device: DeviceResponse) => void;
};

const inputClass =
  "mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60";

function toRequestValue(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

export function DeviceFormDialog({
  companyId,
  branchId,
  device,
  onClose,
  onSuccess,
}: DeviceFormDialogProps) {
  const { t } = useI18n();
  const isEdit = Boolean(device);

  const edgeAgentsQuery = useEdgeAgents(companyId, branchId);
  const posTerminalsQuery = usePosTerminals(companyId, branchId, true);
  const kitchenStationsQuery = useKitchenStations(companyId, branchId);

  const createMutation = useCreateDevice(companyId, branchId);
  const updateMutation = useUpdateDevice(companyId, branchId, device?.deviceId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      code: device?.code || "",
      name: device?.name || "",
      deviceType: device?.deviceType || "ReceiptPrinter",
      manufacturer: device?.manufacturer || "",
      model: device?.model || "",
      serialNumber: device?.serialNumber || "",
      firmwareVersion: device?.firmwareVersion || "",
      connectionType: device?.connectionType || "Usb",
      connectionConfigurationJson: device?.connectionConfigurationJson || "",
      posTerminalId: device?.posTerminalId || "",
      kitchenStationId: device?.kitchenStationId || "",
      edgeAgentId: device?.edgeAgentId || "",
      certification: "Unknown",
    },
  });

  const fieldMessage = (key?: string) => (key ? t(key) : undefined);

  const onSubmit = async (values: DeviceFormValues) => {
    const payload = {
      code: values.code.trim(),
      name: values.name.trim(),
      deviceType: values.deviceType,
      manufacturer: toRequestValue(values.manufacturer),
      model: toRequestValue(values.model),
      serialNumber: toRequestValue(values.serialNumber),
      firmwareVersion: toRequestValue(values.firmwareVersion),
      connectionType: values.connectionType,
      connectionConfigurationJson: toRequestValue(values.connectionConfigurationJson),
      posTerminalId: toRequestValue(values.posTerminalId),
      kitchenStationId: toRequestValue(values.kitchenStationId),
      edgeAgentId: toRequestValue(values.edgeAgentId),
      certification: isEdit ? undefined : values.certification,
    };

    try {
      const result = isEdit
        ? await updateMutation.mutateAsync(payload)
        : await createMutation.mutateAsync(payload);
      toast.success(isEdit ? t("devices.toast.deviceUpdated") : t("devices.toast.deviceCreated"));
      onSuccess(result);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || t("devices.error.generic"));
    }
  };

  return (
    <DevicesModal
      title={isEdit ? t("devices.device.edit") : t("devices.device.new")}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.code")}
            <input type="text" disabled={isPending} maxLength={50} {...register("code")} className={inputClass} />
            {fieldMessage(errors.code?.message) && (
              <span className="mt-1 block text-xs text-rose-300">{fieldMessage(errors.code?.message)}</span>
            )}
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.name")}
            <input type="text" disabled={isPending} maxLength={200} {...register("name")} className={inputClass} />
            {fieldMessage(errors.name?.message) && (
              <span className="mt-1 block text-xs text-rose-300">{fieldMessage(errors.name?.message)}</span>
            )}
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.deviceType")}
            <select disabled={isPending} {...register("deviceType")} className={inputClass}>
              {DEVICE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {t(`devices.enum.deviceType.${value.charAt(0).toLowerCase()}${value.slice(1)}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.connectionType")}
            <select disabled={isPending} {...register("connectionType")} className={inputClass}>
              {CONNECTION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {t(`devices.enum.connectionType.${value.charAt(0).toLowerCase()}${value.slice(1)}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.manufacturer")}
            <input type="text" disabled={isPending} {...register("manufacturer")} className={inputClass} />
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.model")}
            <input type="text" disabled={isPending} {...register("model")} className={inputClass} />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.serialNumber")}
            <input type="text" disabled={isPending} {...register("serialNumber")} className={inputClass} />
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.firmwareVersion")}
            <input type="text" disabled={isPending} {...register("firmwareVersion")} className={inputClass} />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.posTerminal")}
            <select disabled={isPending} {...register("posTerminalId")} className={inputClass}>
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
            <select disabled={isPending} {...register("kitchenStationId")} className={inputClass}>
              <option value="">{t("devices.device.none")}</option>
              {(kitchenStationsQuery.data || []).map((station) => (
                <option key={station.kitchenStationId} value={station.kitchenStationId}>
                  {station.code} — {station.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.edgeAgent")}
            <select disabled={isPending} {...register("edgeAgentId")} className={inputClass}>
              <option value="">{t("devices.device.none")}</option>
              {(edgeAgentsQuery.data || []).map((agent) => (
                <option key={agent.edgeAgentId} value={agent.edgeAgentId}>
                  {agent.code} — {agent.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!isEdit && (
          <label className="block text-xs font-semibold text-slate-400">
            {t("devices.device.certification")}
            <select disabled={isPending} {...register("certification")} className={inputClass}>
              {CERTIFICATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {t(`devices.enum.certification.${value.charAt(0).toLowerCase()}${value.slice(1)}`)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-xs font-semibold text-slate-400">
          {t("devices.device.advancedJson")}
          <textarea
            disabled={isPending}
            {...register("connectionConfigurationJson")}
            rows={4}
            placeholder={t("devices.device.advancedJsonPlaceholder")}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 font-mono text-xs text-white outline-none focus:border-blue-400/60"
          />
          <span className="mt-1 block text-[11px] font-normal text-slate-500">
            {t("devices.device.advancedJsonHint")}
          </span>
          {fieldMessage(errors.connectionConfigurationJson?.message) && (
            <span className="mt-1 block text-xs text-rose-300">
              {fieldMessage(errors.connectionConfigurationJson?.message)}
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? t("devices.actions.saving") : isEdit ? t("devices.actions.saveChanges") : t("devices.device.new")}
        </button>
      </form>
    </DevicesModal>
  );
}
