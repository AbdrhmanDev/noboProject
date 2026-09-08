import { useState } from "react";
import { AlertTriangle, CheckCircle2, Tag } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import type { ApiError } from "../../../shared/api/apiError";
import { useSetDeviceLabelPrinterProfile } from "../hooks/useDevices";
import { getDeviceErrorMessageKey } from "../utils/devicesFormatters";
import type {
  DeviceResponse,
  LabelOrientation,
  LabelPrinterLanguage,
  LabelPrinterProfilePreset,
} from "../types/devices.types";
import { AdvancedSettingsDisclosure } from "./AdvancedSettingsDisclosure";

type LabelPrinterProfilePanelProps = {
  companyId: string;
  branchId: string;
  device: DeviceResponse;
  canManage: boolean;
};

const PRESET_OPTIONS: LabelPrinterProfilePreset[] = ["Generic2x1Zpl", "Generic3x2Zpl", "Custom"];
const LANGUAGE_OPTIONS: LabelPrinterLanguage[] = [
  "Zpl",
  "Tspl",
  "Epl",
  "Cpcl",
  "WindowsDriver",
  "Other",
  "Unknown",
];
const ORIENTATION_OPTIONS: LabelOrientation[] = ["Normal", "Inverted"];

// Only ZPL is actually rendered/executed today (Nobo.EdgeAgent.Printing.LabelPrinterAdapter only
// handles the "ZPL" adapter) -- the other LabelPrinterLanguage enum values exist so an admin can
// record what a physical printer speaks even before software support exists for it. Never implying
// real print support for those keeps this UI honest per spec.
const EXECUTABLE_LANGUAGE: LabelPrinterLanguage = "Zpl";

// Mirrors LabelPrinterProfile.Generic2x1ZplPreset()/Generic3x2ZplPreset() exactly, so a
// newly-picked (not-yet-saved) preset can preview its real derived values immediately.
const PRESET_EFFECTIVE_VALUES: Record<
  Exclude<LabelPrinterProfilePreset, "Custom">,
  { widthMm: number; heightMm: number; dpi: number; gapMm: number; orientation: LabelOrientation; printerLanguage: LabelPrinterLanguage }
> = {
  Generic2x1Zpl: { widthMm: 51, heightMm: 25, dpi: 203, gapMm: 2, orientation: "Normal", printerLanguage: "Zpl" },
  Generic3x2Zpl: { widthMm: 76, heightMm: 51, dpi: 203, gapMm: 2, orientation: "Normal", printerLanguage: "Zpl" },
};

// Matches LabelPrinterProfile's real backend validation constants exactly (Min/MaxWidthMm,
// Min/MaxHeightMm, Min/MaxDpi, Min/MaxGapMm) — UX pre-check only, backend stays authoritative.
const CUSTOM_BOUNDS = {
  widthMm: { min: 10, max: 200 },
  heightMm: { min: 10, max: 300 },
  dpi: { min: 150, max: 600 },
  gapMm: { min: 0, max: 20 },
};

function LanguageBadge({ language, t }: { language: LabelPrinterLanguage; t: (key: string) => string }) {
  const supported = language === EXECUTABLE_LANGUAGE;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        supported ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
      }`}
    >
      {supported ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
      {language}
    </span>
  );
}

// LabelPrinterProfile is only meaningful for a Label Printer -- unlike the receipt printer
// profile, there is no legacy default: a device with no profile assigned simply cannot print yet
// (see LabelPrinterProfile's backend remarks), so this panel shows a clear notice instead of a
// "using default" one when profile is null. Terminology here is deliberately its own (Label
// Width/Height, not "paper") since a label roll isn't a receipt roll.
export function LabelPrinterProfilePanel({
  companyId,
  branchId,
  device,
  canManage,
}: LabelPrinterProfilePanelProps) {
  const { t } = useI18n();
  const profile = device.labelPrinterProfile;

  const [preset, setPreset] = useState<LabelPrinterProfilePreset>(profile?.preset ?? "Generic2x1Zpl");
  const [language, setLanguage] = useState<LabelPrinterLanguage>(profile?.printerLanguage ?? "Zpl");
  const [widthMm, setWidthMm] = useState(String(profile?.widthMm ?? 51));
  const [heightMm, setHeightMm] = useState(String(profile?.heightMm ?? 25));
  const [dpi, setDpi] = useState(String(profile?.dpi ?? 203));
  const [gapMm, setGapMm] = useState(String(profile?.gapMm ?? 2));
  const [orientation, setOrientation] = useState<LabelOrientation>(profile?.orientation ?? "Normal");
  const [submitError, setSubmitError] = useState("");

  const mutation = useSetDeviceLabelPrinterProfile(companyId, branchId, device.deviceId);
  const isCustom = preset === "Custom";
  const presetEffective = !isCustom ? PRESET_EFFECTIVE_VALUES[preset] : null;

  const save = async () => {
    setSubmitError("");
    try {
      await mutation.mutateAsync({
        preset,
        customPrinterLanguage: isCustom ? language : null,
        customWidthMm: isCustom ? Number(widthMm) : null,
        customHeightMm: isCustom ? Number(heightMm) : null,
        customDpi: isCustom ? Number(dpi) : null,
        customGapMm: isCustom && gapMm !== "" ? Number(gapMm) : null,
        customOrientation: isCustom ? orientation : null,
      });
      toast.success(t("devices.labelPrinterProfile.savedSuccessfully"));
    } catch (error) {
      const apiError = error as ApiError;
      const messageKey = getDeviceErrorMessageKey(apiError);
      setSubmitError(messageKey ? t(messageKey) : apiError.message || t("devices.error.generic"));
    }
  };

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0a1220] px-3 py-2 text-xs text-white outline-none focus:border-blue-400/60";

  const effectiveWidthMm = isCustom ? widthMm : String(presetEffective?.widthMm ?? "");
  const effectiveHeightMm = isCustom ? heightMm : String(presetEffective?.heightMm ?? "");
  const effectiveDpi = isCustom ? dpi : presetEffective?.dpi;
  const effectiveGapMm = isCustom ? gapMm : presetEffective?.gapMm;
  const effectiveOrientation = isCustom ? orientation : presetEffective?.orientation;
  const effectiveLanguage = isCustom ? language : (presetEffective?.printerLanguage ?? profile?.printerLanguage);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1728] p-4">
      <div className="flex items-center gap-2 text-sm font-black text-white">
        <Tag size={16} className="text-blue-300" />
        {t("devices.labelPrinterProfile.title")}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        {device.name} · {t(`devices.enum.deviceType.${lowerFirst(device.deviceType)}`)}
      </div>

      {!profile && (
        <p className="mt-2 text-[11px] text-amber-300">{t("devices.labelPrinterProfile.notConfigured")}</p>
      )}

      {/* Simple / business view — physical label size + language, never raw first. */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-[11px] font-semibold text-slate-400">
          {t("devices.labelPrinterProfile.profileLabel")}
          <select
            className={`${inputClass} mt-1`}
            value={preset}
            disabled={!canManage}
            onChange={(event) => setPreset(event.target.value as LabelPrinterProfilePreset)}
          >
            {PRESET_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`devices.labelPrinterProfile.preset.${lowerFirst(option)}`)}
              </option>
            ))}
          </select>
        </label>

        <div>
          <div className="text-[11px] font-semibold text-slate-400">{t("devices.labelPrinterProfile.labelSize")}</div>
          {isCustom ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                className={inputClass}
                value={widthMm}
                min={CUSTOM_BOUNDS.widthMm.min}
                max={CUSTOM_BOUNDS.widthMm.max}
                disabled={!canManage}
                onChange={(event) => setWidthMm(event.target.value)}
              />
              <span className="shrink-0 text-slate-500">×</span>
              <input
                type="number"
                className={inputClass}
                value={heightMm}
                min={CUSTOM_BOUNDS.heightMm.min}
                max={CUSTOM_BOUNDS.heightMm.max}
                disabled={!canManage}
                onChange={(event) => setHeightMm(event.target.value)}
              />
              <span className="shrink-0 text-[11px] text-slate-500">mm</span>
            </div>
          ) : (
            <div className="mt-1 flex h-[38px] items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-bold text-white">
              {effectiveWidthMm && effectiveHeightMm ? `${effectiveWidthMm} × ${effectiveHeightMm} mm` : "—"}
            </div>
          )}
        </div>
      </div>

      {effectiveLanguage && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-slate-500">{t("devices.labelPrinterProfile.printerLanguage")}:</span>
          <LanguageBadge language={effectiveLanguage} t={t} />
          {effectiveLanguage !== EXECUTABLE_LANGUAGE && (
            <span className="text-amber-300">{t("devices.labelPrinterProfile.languageUnsupportedWarning")}</span>
          )}
        </div>
      )}

      <AdvancedSettingsDisclosure label={t("devices.labelPrinterProfile.advancedSettings")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              {t("devices.labelPrinterProfile.printerLanguage")}
            </label>
            {isCustom ? (
              <>
                <select
                  className={inputClass}
                  value={language}
                  disabled={!canManage}
                  onChange={(event) => setLanguage(event.target.value as LabelPrinterLanguage)}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                      {option !== EXECUTABLE_LANGUAGE ? ` (${t("devices.labelPrinterProfile.notYetSupported")})` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">{t("devices.labelPrinterProfile.helpPrinterLanguage")}</p>
              </>
            ) : (
              <div className="flex h-[34px] items-center rounded-lg border border-white/10 bg-white/[0.02] px-3 text-xs font-bold text-slate-300">
                {effectiveLanguage}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">{t("devices.labelPrinterProfile.dpi")}</label>
            {isCustom ? (
              <input
                type="number"
                className={inputClass}
                value={dpi}
                min={CUSTOM_BOUNDS.dpi.min}
                max={CUSTOM_BOUNDS.dpi.max}
                disabled={!canManage}
                onChange={(event) => setDpi(event.target.value)}
              />
            ) : (
              <div className="flex h-[34px] items-center rounded-lg border border-white/10 bg-white/[0.02] px-3 text-xs font-bold text-slate-300">
                {effectiveDpi ?? "—"}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">{t("devices.labelPrinterProfile.gapMm")}</label>
            {isCustom ? (
              <input
                type="number"
                className={inputClass}
                value={gapMm}
                min={CUSTOM_BOUNDS.gapMm.min}
                max={CUSTOM_BOUNDS.gapMm.max}
                disabled={!canManage}
                onChange={(event) => setGapMm(event.target.value)}
              />
            ) : (
              <div className="flex h-[34px] items-center rounded-lg border border-white/10 bg-white/[0.02] px-3 text-xs font-bold text-slate-300">
                {effectiveGapMm ?? "—"}
              </div>
            )}
            <p className="mt-1 text-[11px] text-slate-500">{t("devices.labelPrinterProfile.helpGap")}</p>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              {t("devices.labelPrinterProfile.orientation")}
            </label>
            {isCustom ? (
              <select
                className={inputClass}
                value={orientation}
                disabled={!canManage}
                onChange={(event) => setOrientation(event.target.value as LabelOrientation)}
              >
                {ORIENTATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {t(`devices.labelPrinterProfile.orientation.${lowerFirst(option)}`)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex h-[34px] items-center rounded-lg border border-white/10 bg-white/[0.02] px-3 text-xs font-bold text-slate-300">
                {effectiveOrientation
                  ? t(`devices.labelPrinterProfile.orientation.${lowerFirst(effectiveOrientation)}`)
                  : "—"}
              </div>
            )}
          </div>
          <div className="col-span-2 sm:col-span-3">
            <p className="text-[11px] text-slate-500">{t("devices.labelPrinterProfile.helpDpi")}</p>
          </div>
        </div>
      </AdvancedSettingsDisclosure>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={save}
          disabled={!canManage || mutation.isPending}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mutation.isPending
            ? t("devices.labelPrinterProfile.saving")
            : t("devices.labelPrinterProfile.save")}
        </button>
        {!canManage && (
          <p className="text-[11px] text-slate-500">{t("devices.labelPrinterProfile.permissionRequired")}</p>
        )}
      </div>

      {submitError && (
        <div className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {submitError}
        </div>
      )}
    </div>
  );
}

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
