import { useState } from "react";
import { Check, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import type { ApiError } from "../../../shared/api/apiError";
import { useSetDeviceReceiptPrinterProfile } from "../hooks/useDevices";
import { getDeviceErrorMessageKey } from "../utils/devicesFormatters";
import type { DeviceResponse, PrinterProfilePreset } from "../types/devices.types";
import { AdvancedSettingsDisclosure } from "./AdvancedSettingsDisclosure";

type PrinterProfilePanelProps = {
  companyId: string;
  branchId: string;
  device: DeviceResponse;
  canManage: boolean;
};

const PRESET_OPTIONS: PrinterProfilePreset[] = ["Generic58mm", "Generic80mm", "Custom"];

// Mirrors the real backend preset constants (ReceiptPrinterProfile.Generic58mmPreset/
// Generic80mmPreset) so a newly-picked (not-yet-saved) preset can preview its real derived
// values immediately, without waiting on a round trip.
const PRESET_EFFECTIVE_VALUES: Record<Exclude<PrinterProfilePreset, "Custom">, {
  paperWidthMm: number;
  printableWidthDots: number;
  dpi: number;
  cutterSupported: boolean;
  feedLinesBeforeCut: number;
}> = {
  Generic58mm: { paperWidthMm: 58, printableWidthDots: 384, dpi: 203, cutterSupported: true, feedLinesBeforeCut: 4 },
  Generic80mm: { paperWidthMm: 80, printableWidthDots: 576, dpi: 203, cutterSupported: true, feedLinesBeforeCut: 4 },
};

// Matches ReceiptPrinterProfile's real backend validation constants exactly (Min/MaxPaperWidthMm,
// Min/MaxPrintableWidthDots, Min/MaxDpi, Min/MaxFeedLinesBeforeCut) — this is a UX pre-check only,
// the backend remains authoritative and is always re-validated server-side on save.
const CUSTOM_BOUNDS = {
  paperWidthMm: { min: 10, max: 300 },
  printableWidthDots: { min: 64, max: 4096 },
  dpi: { min: 100, max: 600 },
  feedLinesBeforeCut: { min: 0, max: 20 },
};

// Printer Profile is only meaningful for a Receipt Printer -- the effective values shown here
// (paper width/dots/DPI/cutter/feed) are exactly what CustomerReceiptEscPosRenderer uses, per
// device, independent of any specific CustomerReceipt payload.
//
// UX shape: a simple "Paper Size" choice + cutter/status summary up front (what a business admin
// needs), real technical values (dots/DPI/feed) tucked under a collapsed Advanced Settings
// disclosure and shown read-only unless Custom is selected — editing them always requires
// switching to Custom first, so a preset can never be silently mutated into an inconsistent state.
export function PrinterProfilePanel({
  companyId,
  branchId,
  device,
  canManage,
}: PrinterProfilePanelProps) {
  const { t } = useI18n();
  const profile = device.printerProfile;

  const [preset, setPreset] = useState<PrinterProfilePreset>(profile?.preset ?? "Generic58mm");
  const [paperWidthMm, setPaperWidthMm] = useState(String(profile?.paperWidthMm ?? 58));
  const [printableWidthDots, setPrintableWidthDots] = useState(
    String(profile?.printableWidthDots ?? 384),
  );
  const [dpi, setDpi] = useState(String(profile?.dpi ?? 203));
  const [cutterSupported, setCutterSupported] = useState(profile?.cutterSupported ?? true);
  const [feedLinesBeforeCut, setFeedLinesBeforeCut] = useState(
    String(profile?.feedLinesBeforeCut ?? 4),
  );
  const [submitError, setSubmitError] = useState("");

  const mutation = useSetDeviceReceiptPrinterProfile(companyId, branchId, device.deviceId);
  const isCustom = preset === "Custom";
  const presetEffective = !isCustom ? PRESET_EFFECTIVE_VALUES[preset] : null;

  const save = async () => {
    setSubmitError("");
    try {
      await mutation.mutateAsync({
        preset,
        customPaperWidthMm: isCustom ? Number(paperWidthMm) : null,
        customPrintableWidthDots: isCustom ? Number(printableWidthDots) : null,
        customDpi: isCustom ? Number(dpi) : null,
        customCutterSupported: isCustom ? cutterSupported : null,
        customFeedLinesBeforeCut: isCustom ? Number(feedLinesBeforeCut) : null,
      });
      toast.success(t("devices.printerProfile.savedSuccessfully"));
    } catch (error) {
      const apiError = error as ApiError;
      const messageKey = getDeviceErrorMessageKey(apiError);
      setSubmitError(messageKey ? t(messageKey) : apiError.message || t("devices.error.generic"));
    }
  };

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0a1220] px-3 py-2 text-xs text-white outline-none focus:border-blue-400/60";

  // The effective cutter status shown in the simple summary: the real saved value while browsing
  // a preset (or Custom before any edit), the live in-progress value once editing Custom.
  const effectiveCutterSupported = isCustom ? cutterSupported : (presetEffective?.cutterSupported ?? true);
  const isExplicitlyAssigned = profile?.isExplicitlyAssigned ?? false;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1728] p-4">
      <div className="flex items-center gap-2 text-sm font-black text-white">
        <Printer size={16} className="text-blue-300" />
        {t("devices.printerProfile.title")}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        {device.name} · {t(`devices.enum.deviceType.${lowerFirst(device.deviceType)}`)}
      </div>

      {/* Simple / business view — always visible, no raw technical fields. */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-[11px] font-semibold text-slate-400">
          {t("devices.printerProfile.paperSize")}
          <select
            className={`${inputClass} mt-1`}
            value={preset}
            disabled={!canManage}
            onChange={(event) => setPreset(event.target.value as PrinterProfilePreset)}
          >
            {PRESET_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`devices.printerProfile.preset.${lowerFirst(option)}`)}
              </option>
            ))}
          </select>
        </label>

        <div>
          <div className="text-[11px] font-semibold text-slate-400">
            {t("devices.printerProfile.cutterSupported")}
          </div>
          <div
            className={`mt-1 flex h-[38px] items-center gap-1.5 rounded-lg border px-3 text-xs font-bold ${
              effectiveCutterSupported
                ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                : "border-white/10 bg-white/[0.03] text-slate-400"
            }`}
          >
            {effectiveCutterSupported ? <Check size={13} /> : <X size={13} />}
            {effectiveCutterSupported
              ? t("devices.printerProfile.cutterYes")
              : t("devices.printerProfile.cutterNo")}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-slate-500">{t("devices.printerProfile.status.label")}:</span>
        <span className={`font-bold ${isExplicitlyAssigned ? "text-blue-300" : "text-amber-300"}`}>
          {isExplicitlyAssigned
            ? t("devices.printerProfile.status.assigned")
            : t("devices.printerProfile.status.default")}
        </span>
      </div>
      {!isExplicitlyAssigned && (
        <p className="mt-1 text-[11px] text-slate-500">{t("devices.printerProfile.legacyNotice")}</p>
      )}

      {/* Read-only derived values for a selected preset — informational, never edited here. */}
      {presetEffective && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] text-slate-400">
          <div className="mb-1.5 font-semibold text-slate-300">
            {t("devices.printerProfile.derivedValuesLabel")}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {t("devices.printerProfile.paperWidthMm")}:{" "}
              <span className="font-bold text-white">{presetEffective.paperWidthMm} mm</span>
            </span>
            <span>
              {t("devices.printerProfile.printableWidthDots")}:{" "}
              <span className="font-bold text-white">{presetEffective.printableWidthDots}</span>
            </span>
            <span>
              {t("devices.printerProfile.dpi")}:{" "}
              <span className="font-bold text-white">{presetEffective.dpi}</span>
            </span>
          </div>
        </div>
      )}

      {/* Custom: paper width is a physical-size field, kept in the main view per spec, not Advanced. */}
      {isCustom && (
        <div className="mt-3">
          <label className="block text-[11px] text-slate-400">
            {t("devices.printerProfile.paperWidthMm")}
            <input
              type="number"
              className={`${inputClass} mt-1`}
              value={paperWidthMm}
              min={CUSTOM_BOUNDS.paperWidthMm.min}
              max={CUSTOM_BOUNDS.paperWidthMm.max}
              disabled={!canManage}
              onChange={(event) => setPaperWidthMm(event.target.value)}
            />
          </label>
          <p className="mt-1 text-[11px] text-slate-500">{t("devices.printerProfile.helpPaperWidth")}</p>
        </div>
      )}

      <AdvancedSettingsDisclosure label={t("devices.printerProfile.advancedSettings")}>
        <p className="text-[11px] text-slate-500">{t("devices.printerProfile.helpPrintableWidth")}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              {t("devices.printerProfile.printableWidthDots")}
            </label>
            {isCustom ? (
              <input
                type="number"
                className={inputClass}
                value={printableWidthDots}
                min={CUSTOM_BOUNDS.printableWidthDots.min}
                max={CUSTOM_BOUNDS.printableWidthDots.max}
                disabled={!canManage}
                onChange={(event) => setPrintableWidthDots(event.target.value)}
              />
            ) : (
              <div className="flex h-[34px] items-center rounded-lg border border-white/10 bg-white/[0.02] px-3 text-xs font-bold text-slate-300">
                {presetEffective?.printableWidthDots}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              {t("devices.printerProfile.dpi")}
            </label>
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
                {presetEffective?.dpi}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              {t("devices.printerProfile.feedLinesBeforeCut")}
            </label>
            {isCustom ? (
              <input
                type="number"
                className={inputClass}
                value={feedLinesBeforeCut}
                min={CUSTOM_BOUNDS.feedLinesBeforeCut.min}
                max={CUSTOM_BOUNDS.feedLinesBeforeCut.max}
                disabled={!canManage}
                onChange={(event) => setFeedLinesBeforeCut(event.target.value)}
              />
            ) : (
              <div className="flex h-[34px] items-center rounded-lg border border-white/10 bg-white/[0.02] px-3 text-xs font-bold text-slate-300">
                {presetEffective?.feedLinesBeforeCut}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">
              {t("devices.printerProfile.cutterSupported")}
            </label>
            {isCustom ? (
              <label className="flex h-[34px] items-center gap-2 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={cutterSupported}
                  disabled={!canManage}
                  onChange={(event) => setCutterSupported(event.target.checked)}
                />
                {cutterSupported ? t("devices.printerProfile.cutterYes") : t("devices.printerProfile.cutterNo")}
              </label>
            ) : (
              <div className="flex h-[34px] items-center rounded-lg border border-white/10 bg-white/[0.02] px-3 text-xs font-bold text-slate-300">
                {presetEffective?.cutterSupported
                  ? t("devices.printerProfile.cutterYes")
                  : t("devices.printerProfile.cutterNo")}
              </div>
            )}
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
          {mutation.isPending ? t("devices.printerProfile.saving") : t("devices.printerProfile.save")}
        </button>
        {!canManage && (
          <p className="text-[11px] text-slate-500">{t("devices.printerProfile.permissionRequired")}</p>
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
