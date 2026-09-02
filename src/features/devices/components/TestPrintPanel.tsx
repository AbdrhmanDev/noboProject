import { useState } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../../../i18n/I18nContext";
import type { ApiError } from "../../../shared/api/apiError";
import { useTestPrintDevice } from "../hooks/useDevices";
import { usePrintJobDetails } from "../hooks/usePrintJobs";
import { getDeviceErrorMessageKey } from "../utils/devicesFormatters";
import type {
  DeviceHardwareBindingResponse,
  DeviceResponse,
  EdgeAgentResponse,
} from "../types/devices.types";
import { PrintJobErrorMessage } from "./PrintJobErrorMessage";
import { PrintJobStatusBadge } from "./PrintJobStatusBadge";

type TestPrintPanelProps = {
  companyId: string;
  branchId: string;
  device: DeviceResponse;
  hardwareBinding: DeviceHardwareBindingResponse | null | undefined;
  edgeAgent: EdgeAgentResponse | null | undefined;
  canManage: boolean;
};

const PRINTER_TYPES = new Set(["ReceiptPrinter", "KitchenPrinter"]);
const TIMELINE_STEPS = ["Queued", "Claimed", "Printing", "Succeeded"] as const;

// Mirrors the exact precondition order from the spec so the disabled-button
// reason always points at the FIRST unmet precondition, in this order:
// Active device -> printer-capable type -> agent assigned -> agent
// available -> hardware binding -> certification not Unsupported. The real
// server-side error (from ApiError.code) is still trusted and surfaced on
// top of this — this is only the client-side pre-check for the button.
function getDisabledReasonKey(
  device: DeviceResponse,
  hardwareBinding: DeviceHardwareBindingResponse | null | undefined,
  edgeAgent: EdgeAgentResponse | null | undefined,
) {
  if (device.status !== "Active") return "devices.testPrint.reason.deviceNotActive";
  if (!PRINTER_TYPES.has(device.deviceType)) return "devices.testPrint.reason.notPrinterCapable";
  if (!device.edgeAgentId) return "devices.testPrint.reason.noAgentAssigned";
  if (!edgeAgent || edgeAgent.status !== "Active" || !edgeAgent.enrolledAtUtc) {
    return "devices.testPrint.reason.agentNotAvailable";
  }
  if (!hardwareBinding) return "devices.testPrint.reason.noHardwareBinding";
  if (device.certificationStatus === "Unsupported") return "devices.testPrint.reason.unsupportedCertification";
  return null;
}

export function TestPrintPanel({
  companyId,
  branchId,
  device,
  hardwareBinding,
  edgeAgent,
  canManage,
}: TestPrintPanelProps) {
  const { t } = useI18n();
  const [printJobId, setPrintJobId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");

  const testPrintMutation = useTestPrintDevice(companyId, branchId, device.deviceId);
  const printJobQuery = usePrintJobDetails(companyId, branchId, printJobId, Boolean(printJobId));
  const printJob = printJobQuery.data;

  const disabledReasonKey = getDisabledReasonKey(device, hardwareBinding, edgeAgent);
  const disabled = !canManage || Boolean(disabledReasonKey) || testPrintMutation.isPending;

  const runTestPrint = async () => {
    setSubmitError("");
    try {
      const result = await testPrintMutation.mutateAsync();
      setPrintJobId(result.printJobId);
      toast.success(t("devices.testPrint.sentSuccessfully"));
    } catch (error) {
      const apiError = error as ApiError;
      const messageKey = getDeviceErrorMessageKey(apiError);
      setSubmitError(messageKey ? t(messageKey) : apiError.message || t("devices.error.generic"));
    }
  };

  const currentStepIndex = printJob
    ? printJob.status === "Failed"
      ? -1
      : TIMELINE_STEPS.indexOf(printJob.status as (typeof TIMELINE_STEPS)[number])
    : -1;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1728] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black text-white">
          <Printer size={16} className="text-blue-300" />
          {t("devices.testPrint.title")}
        </div>
        <button
          type="button"
          onClick={runTestPrint}
          disabled={disabled}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {testPrintMutation.isPending ? t("devices.testPrint.sending") : t("devices.testPrint.run")}
        </button>
      </div>

      {!canManage && (
        <p className="mt-2 text-[11px] text-slate-500">{t("devices.testPrint.permissionRequired")}</p>
      )}
      {canManage && disabledReasonKey && (
        <p className="mt-2 text-[11px] text-amber-300">{t(disabledReasonKey)}</p>
      )}

      {submitError && (
        <div className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {submitError}
        </div>
      )}

      {printJobId && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-400">
              {t("devices.testPrint.jobStatus")}
            </span>
            {printJob && <PrintJobStatusBadge status={printJob.status} />}
          </div>

          <div className="flex items-center gap-1">
            {TIMELINE_STEPS.map((step, index) => {
              const reached = printJob?.status === "Failed" ? false : currentStepIndex >= index;
              return (
                <div key={step} className="flex flex-1 items-center gap-1">
                  <div
                    className={`h-1.5 flex-1 rounded-full ${reached ? "bg-blue-500" : "bg-white/10"}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            {TIMELINE_STEPS.map((step) => (
              <span key={step}>{t(`printing.enum.status.${step.toLowerCase()}`)}</span>
            ))}
          </div>

          {printJob?.status === "Failed" && <PrintJobErrorMessage printJob={printJob} />}
        </div>
      )}
    </div>
  );
}
