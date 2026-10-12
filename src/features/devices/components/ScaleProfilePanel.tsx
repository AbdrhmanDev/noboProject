import { useState } from "react";
import { Scale, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import type { ApiError } from "../../../shared/api/apiError";
import { useSetDeviceSerialSettings, useUpdateDevice } from "../hooks/useDevices";
import { getDeviceErrorMessageKey } from "../utils/devicesFormatters";
import type {
  DeviceHardwareBindingResponse,
  DeviceResponse,
  ScaleProtocolProfile,
} from "../types/devices.types";
import { AdvancedSettingsDisclosure } from "./AdvancedSettingsDisclosure";

type ScaleProfilePanelProps = {
  companyId: string;
  branchId: string;
  device: DeviceResponse;
  hardwareBinding: DeviceHardwareBindingResponse | null | undefined;
  canManage: boolean;
};

// Matches System.IO.Ports.Parity/StopBits member names exactly -- the same convention
// DeviceHardwareBinding.ConfigureSerialSettings already enforces server-side (Phase F.5/F.9).
const PARITY_OPTIONS = ["None", "Odd", "Even", "Mark", "Space"] as const;
const STOP_BITS_OPTIONS = ["None", "One", "Two", "OnePointFive"] as const;

// Same bounds DeviceHardwareBinding/EdgeAgentOptionsValidator already enforce server-side --
// client-side pre-check only, the backend remains authoritative.
const BAUD_RATE_BOUNDS = { min: 110, max: 921600 };
const DATA_BITS_BOUNDS = { min: 5, max: 8 };

// GenericLineV1 is the only backend-supported profile today (ScaleConnectionProfileValidator,
// Phase F.9) -- a one-item dropdown rather than a free-text field, so the UI can never submit an
// unsupported spelling.
const PROFILE_OPTIONS: ScaleProtocolProfile["profile"][] = ["GenericLineV1"];

const DEFAULT_PROFILE: ScaleProtocolProfile = {
  profile: "GenericLineV1",
  allowedUnits: ["KG"],
  stableMarker: "S",
  unstableMarker: "U",
  frameDelimiter: "\n",
  maxFrameLength: 256,
  readTimeoutMs: 1000,
};

// Parses device.connectionConfigurationJson into structured fields -- falls back to defaults
// (never throws) for an empty/unparseable value, since the panel must always render something
// editable even for a Scale device that has no profile configured yet.
function parseProfile(connectionConfigurationJson: string | null): ScaleProtocolProfile {
  if (!connectionConfigurationJson) return { ...DEFAULT_PROFILE };

  try {
    const parsed = JSON.parse(connectionConfigurationJson);
    return {
      profile: parsed.profile === "GenericLineV1" ? "GenericLineV1" : "GenericLineV1",
      allowedUnits: Array.isArray(parsed.allowedUnits) && parsed.allowedUnits.length > 0
        ? parsed.allowedUnits
        : [...DEFAULT_PROFILE.allowedUnits],
      stableMarker: typeof parsed.stableMarker === "string" ? parsed.stableMarker : null,
      unstableMarker: typeof parsed.unstableMarker === "string" ? parsed.unstableMarker : null,
      frameDelimiter: typeof parsed.frameDelimiter === "string" ? parsed.frameDelimiter : DEFAULT_PROFILE.frameDelimiter,
      maxFrameLength: typeof parsed.maxFrameLength === "number" ? parsed.maxFrameLength : DEFAULT_PROFILE.maxFrameLength,
      readTimeoutMs: typeof parsed.readTimeoutMs === "number" ? parsed.readTimeoutMs : DEFAULT_PROFILE.readTimeoutMs,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

// Variable-Weight Products Phase F.9: the Scale-device configuration panel -- Serial/COM line
// settings (reusing the existing serial-settings endpoint, Phase F.5/F.6) plus the GenericLineV1
// protocol profile (reusing the existing generic ConnectionConfigurationJson field on
// updateDevice, Phase F.7/F.9's own server-side validation). Saving either section here never
// opens a COM port or starts a reader -- it only persists configuration; a real reader only ever
// activates later, through the Edge Agent's own runtime resolution (Phase F.8), once this
// device is Active, its hardware is bound to a real Serial transport, and its profile validates.
export function ScaleProfilePanel({
  companyId,
  branchId,
  device,
  hardwareBinding,
  canManage,
}: ScaleProfilePanelProps) {
  const { t } = useI18n();

  const isSerialTransport = hardwareBinding?.transportType === "SerialCom";

  const [baudRate, setBaudRate] = useState(String(hardwareBinding?.baudRate ?? 9600));
  const [dataBits, setDataBits] = useState(String(hardwareBinding?.dataBits ?? 8));
  const [parity, setParity] = useState(hardwareBinding?.parity ?? "None");
  const [stopBits, setStopBits] = useState(hardwareBinding?.stopBits ?? "One");
  const [serialError, setSerialError] = useState("");

  const initialProfile = parseProfile(device.connectionConfigurationJson);
  const [profile, setProfile] = useState(initialProfile.profile);
  const [allowedUnitsText, setAllowedUnitsText] = useState(initialProfile.allowedUnits.join(", "));
  const [stableMarker, setStableMarker] = useState(initialProfile.stableMarker ?? "");
  const [unstableMarker, setUnstableMarker] = useState(initialProfile.unstableMarker ?? "");
  const [frameDelimiter, setFrameDelimiter] = useState(initialProfile.frameDelimiter);
  const [maxFrameLength, setMaxFrameLength] = useState(String(initialProfile.maxFrameLength));
  const [readTimeoutMs, setReadTimeoutMs] = useState(String(initialProfile.readTimeoutMs));
  const [profileError, setProfileError] = useState("");

  const serialMutation = useSetDeviceSerialSettings(companyId, branchId, device.deviceId);
  const profileMutation = useUpdateDevice(companyId, branchId, device.deviceId);

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0a1220] px-3 py-2 text-xs text-white outline-none focus:border-blue-400/60";

  const saveSerialSettings = async () => {
    setSerialError("");
    const baudRateNumber = Number(baudRate);
    const dataBitsNumber = Number(dataBits);

    if (!Number.isInteger(baudRateNumber) || baudRateNumber < BAUD_RATE_BOUNDS.min || baudRateNumber > BAUD_RATE_BOUNDS.max) {
      setSerialError(t("devices.scaleProfile.error.baudRateInvalid"));
      return;
    }
    if (!Number.isInteger(dataBitsNumber) || dataBitsNumber < DATA_BITS_BOUNDS.min || dataBitsNumber > DATA_BITS_BOUNDS.max) {
      setSerialError(t("devices.scaleProfile.error.dataBitsInvalid"));
      return;
    }

    try {
      await serialMutation.mutateAsync({
        baudRate: baudRateNumber,
        dataBits: dataBitsNumber,
        parity,
        stopBits,
      });
      toast.success(t("devices.scaleProfile.serialSavedSuccessfully"));
    } catch (error) {
      const apiError = error as ApiError;
      const messageKey = getDeviceErrorMessageKey(apiError);
      setSerialError(messageKey ? t(messageKey) : apiError.message || t("devices.error.generic"));
    }
  };

  const saveProfile = async () => {
    setProfileError("");

    const allowedUnits = allowedUnitsText
      .split(",")
      .map((unit) => unit.trim())
      .filter((unit) => unit.length > 0);

    if (allowedUnits.length === 0) {
      setProfileError(t("devices.scaleProfile.error.allowedUnitsRequired"));
      return;
    }
    if (!stableMarker.trim() && !unstableMarker.trim()) {
      setProfileError(t("devices.scaleProfile.error.markerRequired"));
      return;
    }
    if (stableMarker.trim() && unstableMarker.trim() && stableMarker.trim().toLowerCase() === unstableMarker.trim().toLowerCase()) {
      setProfileError(t("devices.scaleProfile.error.markersMustDiffer"));
      return;
    }

    const builtProfile: ScaleProtocolProfile = {
      profile,
      allowedUnits,
      stableMarker: stableMarker.trim() || null,
      unstableMarker: unstableMarker.trim() || null,
      frameDelimiter,
      maxFrameLength: Number(maxFrameLength),
      readTimeoutMs: Number(readTimeoutMs),
    };

    try {
      // No dedicated "set scale profile" endpoint exists -- this reuses the EXISTING updateDevice
      // call, resending every current device field unchanged except connectionConfigurationJson
      // (Step 3: "Reuse an existing endpoint ... if one exists").
      await profileMutation.mutateAsync({
        code: device.code,
        name: device.name,
        deviceType: device.deviceType,
        manufacturer: device.manufacturer,
        model: device.model,
        serialNumber: device.serialNumber,
        firmwareVersion: device.firmwareVersion,
        connectionType: device.connectionType,
        connectionConfigurationJson: JSON.stringify(builtProfile),
        posTerminalId: device.posTerminalId,
        kitchenStationId: device.kitchenStationId,
        edgeAgentId: device.edgeAgentId,
        certification: device.certificationStatus,
      });
      toast.success(t("devices.scaleProfile.profileSavedSuccessfully"));
    } catch (error) {
      const apiError = error as ApiError;
      // Device.InvalidInput (ScaleConnectionProfileValidator's own rejection) has no specific
      // i18n key by design -- the backend's own message is already a specific, readable reason
      // (e.g. "StableMarker and UnstableMarker must differ."), exactly like
      // DeviceHardwareBinding.Conflict's existing fallback-to-raw-message pattern.
      const messageKey = getDeviceErrorMessageKey(apiError);
      setProfileError(messageKey ? t(messageKey) : apiError.message || t("devices.error.generic"));
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1728] p-4">
      <div className="flex items-center gap-2 text-sm font-black text-white">
        <Scale size={16} className="text-blue-300" />
        {t("devices.scaleProfile.title")}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">{device.name}</div>

      {/* Compatibility disclaimer -- never implies GenericLineV1 works with every scale. */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
        <TriangleAlert size={14} className="mt-0.5 shrink-0" />
        <span>{t("devices.scaleProfile.compatibilityNotice")}</span>
      </div>

      {/* ---- Serial/COM settings ---- */}
      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="text-[11px] font-bold text-slate-300">{t("devices.scaleProfile.serialSectionTitle")}</div>

        {!isSerialTransport ? (
          <p className="mt-2 text-[11px] text-slate-500">
            {t("devices.scaleProfile.noSerialHardwareBound")}
          </p>
        ) : (
          <>
            <div className="mt-2 text-[11px] text-slate-500">
              {t("devices.scaleProfile.comPort")}:{" "}
              <span className="font-bold text-white">{hardwareBinding?.comPort ?? "—"}</span>
              <span className="ms-2 text-slate-600">{t("devices.scaleProfile.comPortHelp")}</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="block text-[11px] font-semibold text-slate-400">
                {t("devices.scaleProfile.baudRate")}
                <input
                  type="number"
                  className={`${inputClass} mt-1`}
                  value={baudRate}
                  min={BAUD_RATE_BOUNDS.min}
                  max={BAUD_RATE_BOUNDS.max}
                  disabled={!canManage}
                  onChange={(event) => setBaudRate(event.target.value)}
                />
              </label>
              <label className="block text-[11px] font-semibold text-slate-400">
                {t("devices.scaleProfile.dataBits")}
                <input
                  type="number"
                  className={`${inputClass} mt-1`}
                  value={dataBits}
                  min={DATA_BITS_BOUNDS.min}
                  max={DATA_BITS_BOUNDS.max}
                  disabled={!canManage}
                  onChange={(event) => setDataBits(event.target.value)}
                />
              </label>
              <label className="block text-[11px] font-semibold text-slate-400">
                {t("devices.scaleProfile.parity")}
                <select
                  className={`${inputClass} mt-1`}
                  value={parity}
                  disabled={!canManage}
                  onChange={(event) => setParity(event.target.value)}
                >
                  {PARITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-semibold text-slate-400">
                {t("devices.scaleProfile.stopBits")}
                <select
                  className={`${inputClass} mt-1`}
                  value={stopBits}
                  disabled={!canManage}
                  onChange={(event) => setStopBits(event.target.value)}
                >
                  {STOP_BITS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={saveSerialSettings}
                disabled={!canManage || serialMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {serialMutation.isPending ? t("devices.scaleProfile.saving") : t("devices.scaleProfile.saveSerial")}
              </button>
            </div>
            {serialError && (
              <div className="mt-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {serialError}
              </div>
            )}
          </>
        )}
      </div>

      {/* ---- Protocol profile ---- */}
      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="text-[11px] font-bold text-slate-300">{t("devices.scaleProfile.profileSectionTitle")}</div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-[11px] font-semibold text-slate-400">
            {t("devices.scaleProfile.profile")}
            <select
              className={`${inputClass} mt-1`}
              value={profile}
              disabled={!canManage}
              onChange={(event) => setProfile(event.target.value as ScaleProtocolProfile["profile"])}
            >
              {PROFILE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[11px] font-semibold text-slate-400">
            {t("devices.scaleProfile.allowedUnits")}
            <input
              type="text"
              className={`${inputClass} mt-1`}
              value={allowedUnitsText}
              placeholder="KG, G"
              disabled={!canManage}
              onChange={(event) => setAllowedUnitsText(event.target.value)}
            />
          </label>

          <label className="block text-[11px] font-semibold text-slate-400">
            {t("devices.scaleProfile.stableMarker")}
            <input
              type="text"
              className={`${inputClass} mt-1`}
              value={stableMarker}
              placeholder="S"
              disabled={!canManage}
              onChange={(event) => setStableMarker(event.target.value)}
            />
          </label>

          <label className="block text-[11px] font-semibold text-slate-400">
            {t("devices.scaleProfile.unstableMarker")}
            <input
              type="text"
              className={`${inputClass} mt-1`}
              value={unstableMarker}
              placeholder="U"
              disabled={!canManage}
              onChange={(event) => setUnstableMarker(event.target.value)}
            />
          </label>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">{t("devices.scaleProfile.helpMarkers")}</p>

        <AdvancedSettingsDisclosure label={t("devices.scaleProfile.advancedSettings")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block text-[11px] text-slate-400">
              {t("devices.scaleProfile.frameDelimiter")}
              <select
                className={`${inputClass} mt-1`}
                value={frameDelimiter}
                disabled={!canManage}
                onChange={(event) => setFrameDelimiter(event.target.value)}
              >
                <option value="\n">{t("devices.scaleProfile.delimiter.lf")}</option>
                <option value="\r\n">{t("devices.scaleProfile.delimiter.crlf")}</option>
                <option value="\r">{t("devices.scaleProfile.delimiter.cr")}</option>
              </select>
            </label>
            <label className="block text-[11px] text-slate-400">
              {t("devices.scaleProfile.maxFrameLength")}
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={maxFrameLength}
                min={1}
                disabled={!canManage}
                onChange={(event) => setMaxFrameLength(event.target.value)}
              />
            </label>
            <label className="block text-[11px] text-slate-400">
              {t("devices.scaleProfile.readTimeoutMs")}
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={readTimeoutMs}
                min={1}
                disabled={!canManage}
                onChange={(event) => setReadTimeoutMs(event.target.value)}
              />
            </label>
          </div>
        </AdvancedSettingsDisclosure>

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={saveProfile}
            disabled={!canManage || profileMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {profileMutation.isPending ? t("devices.scaleProfile.saving") : t("devices.scaleProfile.saveProfile")}
          </button>
          {!canManage && (
            <p className="text-[11px] text-slate-500">{t("devices.scaleProfile.permissionRequired")}</p>
          )}
        </div>
        {profileError && (
          <div className="mt-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {profileError}
          </div>
        )}
      </div>

      {/* Activation explainer -- Step 4: make activation conditions clear to administrators. */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] text-slate-400">
        <div className="mb-1 font-semibold text-slate-300">{t("devices.scaleProfile.activationTitle")}</div>
        <p>{t("devices.scaleProfile.activationExplainer")}</p>
        <p className="mt-1">{t("devices.scaleProfile.localOverrideNotice")}</p>
      </div>
    </div>
  );
}
