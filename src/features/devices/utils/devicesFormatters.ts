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

export const PRINT_JOB_STATUS_LABEL_KEYS: Record<PrintJobStatus, string> = {
  Queued: "printing.enum.status.queued",
  Claimed: "printing.enum.status.claimed",
  Printing: "printing.enum.status.printing",
  Succeeded: "printing.enum.status.succeeded",
  Failed: "printing.enum.status.failed",
};

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
  "DeviceHardwareBinding.Conflict": "devices.error.bindingConflict",
};

export function getDeviceErrorMessageKey(error: ApiError | null | undefined) {
  if (!error?.code) return null;
  return DEVICE_ERROR_MESSAGE_KEYS[error.code] || null;
}
