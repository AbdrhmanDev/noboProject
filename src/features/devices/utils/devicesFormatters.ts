import type { ApiError } from "../../../shared/api/apiError";
import type {
  DeviceCertificationStatus,
  DeviceHealthStatus,
  DeviceStatus,
  EdgeAgentHealthStatus,
  EdgeAgentStatus,
  MatchConfidence,
  PrintJobStatus,
} from "../types/devices.types";

// ---- Device status/health/certification ----

export const DEVICE_STATUS_LABEL_KEYS: Record<DeviceStatus, string> = {
  Active: "devices.enum.deviceStatus.active",
  Inactive: "devices.enum.deviceStatus.inactive",
};

export const DEVICE_STATUS_BADGE_CLASSES: Record<DeviceStatus, string> = {
  Active: "bg-emerald-500/15 text-emerald-300",
  Inactive: "bg-white/10 text-slate-300",
};

export const DEVICE_HEALTH_LABEL_KEYS: Record<DeviceHealthStatus, string> = {
  Unknown: "devices.enum.deviceHealth.unknown",
  Online: "devices.enum.deviceHealth.online",
  Offline: "devices.enum.deviceHealth.offline",
  Degraded: "devices.enum.deviceHealth.degraded",
  Error: "devices.enum.deviceHealth.error",
};

export const DEVICE_HEALTH_BADGE_CLASSES: Record<DeviceHealthStatus, string> = {
  Unknown: "bg-white/10 text-slate-300",
  Online: "bg-emerald-500/15 text-emerald-300",
  Offline: "bg-white/10 text-slate-400",
  Degraded: "bg-amber-500/15 text-amber-300",
  Error: "bg-rose-500/15 text-rose-300",
};

export const CERTIFICATION_LABEL_KEYS: Record<DeviceCertificationStatus, string> = {
  Unknown: "devices.enum.certification.unknown",
  Certified: "devices.enum.certification.certified",
  Compatible: "devices.enum.certification.compatible",
  AdapterRequired: "devices.enum.certification.adapterRequired",
  Unsupported: "devices.enum.certification.unsupported",
};

export const CERTIFICATION_BADGE_CLASSES: Record<DeviceCertificationStatus, string> = {
  Unknown: "bg-white/10 text-slate-300",
  Certified: "bg-emerald-500/15 text-emerald-300",
  Compatible: "bg-blue-500/15 text-blue-300",
  AdapterRequired: "bg-amber-500/15 text-amber-300",
  Unsupported: "bg-rose-500/15 text-rose-300",
};

// ---- Edge agent status/health ----

export const EDGE_AGENT_STATUS_LABEL_KEYS: Record<EdgeAgentStatus, string> = {
  PendingEnrollment: "devices.enum.edgeAgentStatus.pendingEnrollment",
  Active: "devices.enum.edgeAgentStatus.active",
  Revoked: "devices.enum.edgeAgentStatus.revoked",
  Inactive: "devices.enum.edgeAgentStatus.inactive",
};

export const EDGE_AGENT_STATUS_BADGE_CLASSES: Record<EdgeAgentStatus, string> = {
  PendingEnrollment: "bg-amber-500/15 text-amber-300",
  Active: "bg-emerald-500/15 text-emerald-300",
  Revoked: "bg-rose-500/15 text-rose-300",
  Inactive: "bg-white/10 text-slate-300",
};

export const EDGE_AGENT_HEALTH_LABEL_KEYS: Record<EdgeAgentHealthStatus, string> = {
  Unknown: "devices.enum.edgeAgentHealth.unknown",
  Online: "devices.enum.edgeAgentHealth.online",
  Offline: "devices.enum.edgeAgentHealth.offline",
  Degraded: "devices.enum.edgeAgentHealth.degraded",
  Error: "devices.enum.edgeAgentHealth.error",
};

export const EDGE_AGENT_HEALTH_BADGE_CLASSES: Record<EdgeAgentHealthStatus, string> = {
  Unknown: "bg-white/10 text-slate-300",
  Online: "bg-emerald-500/15 text-emerald-300",
  Offline: "bg-white/10 text-slate-400",
  Degraded: "bg-amber-500/15 text-amber-300",
  Error: "bg-rose-500/15 text-rose-300",
};

// ---- Match confidence ----

export const MATCH_CONFIDENCE_LABEL_KEYS: Record<MatchConfidence, string> = {
  Exact: "devices.enum.matchConfidence.exact",
  Strong: "devices.enum.matchConfidence.strong",
  Possible: "devices.enum.matchConfidence.possible",
  Ambiguous: "devices.enum.matchConfidence.ambiguous",
  None: "devices.enum.matchConfidence.none",
};

// Exact/Strong: calm green (safe to accept as-is). Possible/Ambiguous: amber
// (needs an explicit admin choice). None: neutral gray.
export const MATCH_CONFIDENCE_BADGE_CLASSES: Record<MatchConfidence, string> = {
  Exact: "bg-emerald-500/15 text-emerald-300",
  Strong: "bg-emerald-500/12 text-emerald-300",
  Possible: "bg-amber-500/15 text-amber-300",
  Ambiguous: "bg-amber-500/15 text-amber-300",
  None: "bg-white/10 text-slate-300",
};

// ---- Print job status ----

// Generic fallback labels. Succeeded's generic entry is only used when the transport is missing
// or not one NOBO currently recognizes -- see getPrintJobStatusLabelKey below for the
// transport-aware wording that is used everywhere the transport is known, which is every real
// print job (the field is always populated server-side; see PrintJobResponse.transport).
export const PRINT_JOB_STATUS_LABEL_KEYS: Record<PrintJobStatus, string> = {
  Queued: "printing.enum.status.queued",
  Claimed: "printing.enum.status.claimed",
  Printing: "printing.enum.status.printing",
  Succeeded: "printing.enum.status.succeeded.generic",
  Failed: "printing.enum.status.failed",
};

// "Succeeded" means only "the transport accepted the bytes for delivery" (see
// PrintJob.MarkSucceeded's own remarks on the backend) -- never confirmed physical output. That
// is true for every transport, but the transport-specific noun differs (a Windows print queue vs
// a raw TCP printer), so the wording is picked per transport rather than one generic phrase.
// Every other status is transport-independent and uses the generic map unchanged.
export function getPrintJobStatusLabelKey(
  status: PrintJobStatus,
  transport: string | null | undefined,
): string {
  if (status !== "Succeeded") return PRINT_JOB_STATUS_LABEL_KEYS[status];

  switch (transport) {
    case "WindowsPrinterQueue":
      return "printing.enum.status.succeeded.windowsPrinterQueue";
    case "Network":
      return "printing.enum.status.succeeded.network";
    default:
      return "printing.enum.status.succeeded.generic";
  }
}

export const PRINT_JOB_STATUS_BADGE_CLASSES: Record<PrintJobStatus, string> = {
  Queued: "bg-white/10 text-slate-300",
  Claimed: "bg-blue-500/15 text-blue-300",
  Printing: "bg-blue-500/15 text-blue-300",
  Succeeded: "bg-emerald-500/15 text-emerald-300",
  Failed: "bg-rose-500/15 text-rose-300",
};

export const PRINT_JOB_TERMINAL_STATUSES: PrintJobStatus[] = ["Succeeded", "Failed"];

// ---- Error code -> plain-language mapping ----
// Known business errors this backend can return for Test Print / Discovery
// confirmation. Anything unmapped falls back to the generic error message;
// raw codes are never shown to the user.
export const DEVICE_ERROR_MESSAGE_KEYS: Record<string, string> = {
  "Device.NotAvailable": "devices.error.deviceNotAvailable",
  "Device.NotActive": "devices.error.deviceNotActive",
  "PrintJob.DeviceNotPrinter": "devices.error.deviceNotPrinter",
  "PrintJob.EdgeAgentRequired": "devices.error.edgeAgentRequired",
  "PrintJob.EdgeAgentNotAvailable": "devices.error.edgeAgentNotAvailable",
  "PrintJob.BindingMissing": "devices.error.bindingMissing",
  "PrintJob.DeviceNotConfigured": "devices.error.deviceNotConfigured",
  "PrintJob.AdapterUnavailable": "devices.error.adapterUnavailable",
  "PrintJob.InvalidInput": "devices.error.invalidInput",
  "DeviceHardwareBinding.ConfirmationModeInvalid": "devices.error.confirmationModeInvalid",
  "DeviceHardwareBinding.ConfirmationModeRequired": "devices.error.confirmationModeRequired",
  "DeviceHardwareBinding.DeviceAlreadyBound": "devices.error.deviceAlreadyBound",
  // DeviceHardwareBinding.Conflict is deliberately NOT mapped here: the backend now names the
  // actual conflicting device in its message (Part E of the bind/unbind/rebind task -- "This
  // hardware is already bound to: Front Counter Printer"), which cannot be pre-translated as a
  // generic static string. getDeviceErrorMessageKey's caller falls back to the raw
  // apiError.message for any unmapped code, which is exactly what should happen here.
  "DeviceHardwareBinding.NotAvailable": "devices.error.hardwareBindingNotAvailable",
  "DeviceHardwareBinding.UnsafeInFlightPrintJobs": "devices.error.unsafeInFlightPrintJobs",
  "DeviceHardwareBinding.ConcurrencyConflict": "devices.error.bindingConcurrencyConflict",
  "DeviceHardwareBinding.StableIdentityRequired": "devices.error.stableIdentityRequired",
  "DeviceDiscovery.CandidateNotAvailable": "devices.error.candidateNotAvailable",
  "DeviceDiscovery.TransportUnsupported": "devices.error.transportUnsupported",
  "EdgeAgent.NotAvailable": "devices.error.edgeAgentUnavailable",
  "EdgeAgent.NotActive": "devices.error.edgeAgentNotActive",
  "Device.NotReceiptPrinter": "devices.printerProfile.error.notReceiptPrinter",
  "Device.PrinterProfilePresetInvalid": "devices.printerProfile.error.presetInvalid",
  "Device.PrinterProfileInvalid": "devices.printerProfile.error.profileInvalid",
  "Device.NotLabelPrinter": "devices.labelPrinterProfile.error.notLabelPrinter",
  "Device.LabelPrinterProfilePresetInvalid": "devices.labelPrinterProfile.error.presetInvalid",
  "Device.LabelPrinterProfileInvalid": "devices.labelPrinterProfile.error.profileInvalid",
  "PrintJob.DeviceNotLabelPrinter": "devices.printLabel.error.deviceNotLabelPrinter",
  "LabelPrinter.ProfileNotConfigured": "devices.printLabel.error.profileNotConfigured",
  "LabelPrinter.LanguageNotSupported": "devices.printLabel.error.languageNotSupported",
  "ProductVariant.NotAvailable": "devices.printLabel.error.variantNotAvailable",
  "Barcode.NotAvailable": "devices.printLabel.error.barcodeNotAvailable",
  "Barcode.Inactive": "devices.printLabel.error.barcodeInactive",
  "ProductLabel.NoBarcodeAvailable": "devices.printLabel.error.noBarcodeAvailable",
  "ProductLabel.InvalidCopies": "devices.printLabel.error.invalidCopies",
  "ProductLabel.PriceCurrencyMismatch": "devices.printLabel.error.priceCurrencyMismatch",
};

export function getDeviceErrorMessageKey(error: ApiError | null | undefined) {
  if (!error?.code) return null;
  return DEVICE_ERROR_MESSAGE_KEYS[error.code] || null;
}
