import { AlertTriangle, ArrowRight, Check, CircleHelp, Link2, PlusCircle, WifiOff, X } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import type {
  DeviceConnectionType,
  DeviceResponse,
  DiscoveredDeviceCandidateResponse,
  WindowsPrinterConnectionCategory,
  WindowsPrinterCurrentStatus,
} from "../types/devices.types";
import { CertificationBadge, DeviceHealthBadge, DeviceStatusBadge } from "./DeviceStatusBadge";
import { MatchConfidenceBadge } from "./MatchConfidenceBadge";
import { MatchProposalPanel } from "./MatchProposalPanel";

const CONNECTION_CATEGORY_KEYS: Record<WindowsPrinterConnectionCategory, string> = {
  Usb: "devices.discovery.connectionCategory.usb",
  NetworkWsd: "devices.discovery.connectionCategory.networkWsd",
  NetworkTcpIp: "devices.discovery.connectionCategory.networkTcpIp",
  Serial: "devices.discovery.connectionCategory.serial",
  UnknownVendor: "devices.discovery.connectionCategory.unknownVendor",
};

// Icon + text together, never color alone (Section 7 of the closure task: discovery UI must
// visually distinguish "available now" / "offline / installed" / "unknown" without relying only
// on color).
function CurrentStatusPill({ status }: { status: WindowsPrinterCurrentStatus }) {
  const { t } = useI18n();

  if (status === "Online") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
        <Check size={11} />
        {t("devices.discovery.currentStatus.online")}
      </span>
    );
  }

  if (status === "Offline") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
        <WifiOff size={11} />
        {t("devices.discovery.currentStatus.offline")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-400">
      <CircleHelp size={11} />
      {t("devices.discovery.currentStatus.unknown")}
    </span>
  );
}

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

// A minimal lookup shape -- deliberately not the full PosTerminalResponse/KitchenStationResponse
// types, so this component doesn't need to import feature modules it otherwise has no business
// depending on. Callers already have the full lists (DeviceDiscoveryPage reuses the exact same
// hooks DeviceFormDialog uses for its own selects).
type NamedLookup = { code: string; name: string };

type DiscoveredCandidateCardProps = {
  candidate: DiscoveredDeviceCandidateResponse;
  canManage: boolean;
  // All optional and default to empty/null: this card must render safely even when the page hasn't
  // finished loading the supporting lookups yet (Section G, null-safety).
  devices?: DeviceResponse[];
  posTerminals?: (NamedLookup & { posTerminalId: string })[];
  kitchenStations?: (NamedLookup & { kitchenStationId: string })[];
  branchName?: string | null;
  edgeAgentLabel?: string | null;
  onLinkExisting: () => void;
  onRegisterNew: () => void;
  onViewDevice?: (deviceId: string) => void;
  // Only ever offered for a candidate already bound to a resolvable device -- Part D/G: "Replace
  // Hardware" starts the Rebind flow for that same logical device, never for an unbound candidate.
  onReplaceHardware?: (device: DeviceResponse) => void;
};

function BooleanFlag({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-2 py-1 text-[11px]">
      {value ? (
        <Check size={12} className="text-emerald-400" />
      ) : (
        <X size={12} className="text-slate-500" />
      )}
      <span className={value ? "text-slate-200" : "text-slate-500"}>{label}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-200">{value || "—"}</span>
    </div>
  );
}

// Only ever meaningful for a Windows-printer-queue candidate today -- the classified USB/WSD/
// TCP-IP/Serial category IS the detected connection there. For every other transport the raw
// discovery TransportType ("USB"/"Network"/"Serial"/"Bluetooth") already maps onto
// DeviceConnectionType directly, one-to-one, with nothing to classify further.
function toDetectedConnectionType(
  candidate: DiscoveredDeviceCandidateResponse,
): DeviceConnectionType | null {
  if (candidate.transportType === "WindowsPrinterQueue") {
    switch (candidate.windowsPrinterConnectionCategory) {
      case "Usb":
        return "Usb";
      case "NetworkWsd":
      case "NetworkTcpIp":
        return "NetworkEthernet";
      case "Serial":
        return "SerialCom";
      default:
        return null; // UnknownVendor / not yet classified -- nothing honest to compare against.
    }
  }

  // DiscoveredDeviceCandidateResponse.transportType is typed as
  // DeviceHardwareBindingTransportType ("Usb"/"NetworkEthernet"/"Wifi"/"Bluetooth"/"SerialCom"/
  // "WindowsPrinterQueue"), but the Edge Agent discovery providers actually emit "USB"/"Network"/
  // "Serial"/"Bluetooth"/"WindowsPrinterQueue" on the wire (see e.g.
  // WindowsUsbDiscoveryProvider/NetworkEndpointDiscoveryProvider/SerialPortDiscoveryProvider) --
  // a pre-existing type/runtime mismatch this task did not introduce and is out of scope to fix
  // project-wide (every existing render already works around it with .toLowerCase() plus both
  // sets of translation keys). Reading the raw string here, rather than narrowing against the
  // (inaccurate) declared union, is what actually matches runtime candidates.
  const rawTransportType = candidate.transportType as string;
  switch (rawTransportType) {
    case "USB":
      return "Usb";
    case "Network":
      return "NetworkEthernet";
    case "Serial":
      return "SerialCom";
    case "Bluetooth":
      return "Bluetooth";
    default:
      return null;
  }
}

// Discovered -> Suggested Match -> Admin Confirmation -> Registered/Bound.
// This card is the "Discovered" step for one raw candidate from the latest discovery snapshot,
// plus (Device Platform discovery-visibility hardening) enough resolved context -- registered
// device, branch, agent, POS terminal/kitchen station, and any registered-vs-detected connection
// mismatch -- for an admin to understand "where is this used" without leaving the page.
export function DiscoveredCandidateCard({
  candidate,
  canManage,
  devices = [],
  posTerminals = [],
  kitchenStations = [],
  branchName,
  edgeAgentLabel,
  onLinkExisting,
  onRegisterNew,
  onViewDevice,
  onReplaceHardware,
}: DiscoveredCandidateCardProps) {
  const { t } = useI18n();
  const isBound = Boolean(candidate.matchedDeviceId);

  // Bound devices always re-score as an Exact/Strong match against their own binding (the
  // binding's identity is exactly what discovery just re-detected), so proposal.confidence is
  // meaningful here too, not just for an unbound suggestion -- reused as-is rather than inventing
  // a parallel "match state" vocabulary.
  const matchConfidence = candidate.proposal?.confidence ?? "None";

  // Prefer the actual confirmed binding; fall back to an unbound proposal only so the card can
  // still preview "where this might belong" before an admin confirms anything.
  const resolvedDeviceId = candidate.matchedDeviceId || candidate.proposal?.proposedDeviceId || null;
  const resolvedDevice = resolvedDeviceId
    ? devices.find((device) => device.deviceId === resolvedDeviceId) || null
    : null;

  const posTerminal = resolvedDevice?.posTerminalId
    ? posTerminals.find((terminal) => terminal.posTerminalId === resolvedDevice.posTerminalId) || null
    : null;
  const kitchenStation = resolvedDevice?.kitchenStationId
    ? kitchenStations.find((station) => station.kitchenStationId === resolvedDevice.kitchenStationId) ||
      null
    : null;

  // Registered-vs-detected connection mismatch (Section F): only ever surfaced for a device that
  // is actually bound to this exact candidate, has an explicit registered connectionType, AND
  // where the currently detected connection is itself confidently classified -- three
  // preconditions, so a null-vs-null "mismatch" is never fabricated from missing data.
  const detectedConnectionType = toDetectedConnectionType(candidate);
  const hasConnectionMismatch =
    isBound &&
    Boolean(resolvedDevice?.connectionType) &&
    Boolean(detectedConnectionType) &&
    resolvedDevice!.connectionType !== detectedConnectionType;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1728] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-white">
            {candidate.displayName || t("devices.discovery.unnamedCandidate")}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            {[candidate.manufacturer, candidate.model].filter(Boolean).join(" · ") ||
              t("devices.discovery.unknownDevice")}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <CertificationBadge certification={candidate.certificationStatus} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400 sm:grid-cols-4">
        <div>
          <div className="text-slate-500">{t("devices.discovery.transportType")}</div>
          <div className="mt-0.5 font-semibold text-slate-200">
            {candidate.transportType
              ? t(`devices.enum.transportType.${candidate.transportType.toLowerCase()}`)
              : "—"}
          </div>
        </div>
        {candidate.networkAddress && (
          <div>
            <div className="text-slate-500">{t("devices.discovery.address")}</div>
            <div className="mt-0.5 font-semibold text-slate-200">
              {candidate.networkAddress}
              {candidate.networkPort ? `:${candidate.networkPort}` : ""}
            </div>
          </div>
        )}
        {candidate.comPort && (
          <div>
            <div className="text-slate-500">{t("devices.discovery.comPort")}</div>
            <div className="mt-0.5 font-semibold text-slate-200">{candidate.comPort}</div>
          </div>
        )}
        {candidate.serialNumber && (
          <div>
            <div className="text-slate-500">{t("devices.discovery.serialNumber")}</div>
            <div className="mt-0.5 font-semibold text-slate-200">{candidate.serialNumber}</div>
          </div>
        )}
        {candidate.windowsPrinterQueueName && (
          <div>
            <div className="text-slate-500">{t("devices.discovery.printerQueue")}</div>
            <div className="mt-0.5 font-semibold text-slate-200">{candidate.windowsPrinterQueueName}</div>
          </div>
        )}
        {candidate.windowsPrinterDriverName && (
          <div>
            <div className="text-slate-500">{t("devices.discovery.printerDriver")}</div>
            <div className="mt-0.5 font-semibold text-slate-200">{candidate.windowsPrinterDriverName}</div>
          </div>
        )}
        {candidate.windowsPrinterPortName && (
          <div>
            <div className="text-slate-500">{t("devices.discovery.printerPort")}</div>
            <div className="mt-0.5 font-semibold text-slate-200">{candidate.windowsPrinterPortName}</div>
          </div>
        )}
        {candidate.windowsPrinterConnectionCategory && (
          <div>
            <div className="text-slate-500">{t("devices.discovery.connection")}</div>
            <div className="mt-0.5 font-semibold text-slate-200">
              {t(CONNECTION_CATEGORY_KEYS[candidate.windowsPrinterConnectionCategory])}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
        {candidate.windowsPrinterCurrentStatus && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">{t("devices.discovery.currentStatus.label")}</span>
            <CurrentStatusPill status={candidate.windowsPrinterCurrentStatus} />
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{t("devices.discovery.match")}</span>
          <MatchConfidenceBadge confidence={matchConfidence} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <BooleanFlag label={t("devices.discovery.detected")} value={candidate.detected} />
        <BooleanFlag label={t("devices.discovery.identified")} value={candidate.identified} />
        <BooleanFlag
          label={t("devices.discovery.transportReachable")}
          value={candidate.transportReachable}
        />
        <BooleanFlag label={t("devices.discovery.adapterAvailable")} value={candidate.adapterAvailable} />
      </div>

      {!isBound && (
        <div className="mt-3">
          <MatchProposalPanel proposal={candidate.proposal} />
        </div>
      )}

      {candidate.notes && <p className="mt-2 text-[11px] text-slate-500">{candidate.notes}</p>}

      {isBound && (
        <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
          <div className="text-xs font-bold text-emerald-200">{t("devices.discovery.usedAt.title")}</div>
          {resolvedDevice ? (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-emerald-200/70">
                  {t("devices.discovery.usedAt.registeredAs")}
                </span>
                <span className="text-xs font-black text-white">
                  {resolvedDevice.code} — {resolvedDevice.name}
                </span>
              </div>
              <InfoRow label={t("devices.discovery.usedAt.branch")} value={branchName} />
              <InfoRow label={t("devices.device.edgeAgent")} value={edgeAgentLabel} />
              <InfoRow
                label={t("devices.device.posTerminal")}
                value={posTerminal ? `${posTerminal.code} — ${posTerminal.name}` : null}
              />
              <InfoRow
                label={t("devices.device.kitchenStation")}
                value={kitchenStation ? `${kitchenStation.code} — ${kitchenStation.name}` : null}
              />
              <InfoRow
                label={t("devices.device.deviceType")}
                value={
                  resolvedDevice.deviceType
                    ? t(`devices.enum.deviceType.${lowerFirst(resolvedDevice.deviceType)}`)
                    : null
                }
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-emerald-200/70">{t("devices.filters.status")}</span>
                <DeviceStatusBadge status={resolvedDevice.status} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-emerald-200/70">{t("devices.filters.health")}</span>
                <DeviceHealthBadge health={resolvedDevice.healthStatus} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {onViewDevice && (
                  <button
                    type="button"
                    onClick={() => onViewDevice(resolvedDevice.deviceId)}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-100 hover:bg-emerald-500/20"
                  >
                    {t("devices.discovery.viewDevice")}
                    <ArrowRight size={12} />
                  </button>
                )}
                {canManage && onReplaceHardware && (
                  <button
                    type="button"
                    onClick={() => onReplaceHardware(resolvedDevice)}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-400/30 bg-blue-500/10 px-2.5 py-1.5 text-[11px] font-bold text-blue-200 hover:bg-blue-500/20"
                  >
                    {t("devices.rebind.action")}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-1 text-[11px] text-emerald-200/70">{t("devices.discovery.alreadyBound")}</p>
          )}
        </div>
      )}

      {hasConnectionMismatch && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-[11px] text-amber-100">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
          <div className="space-y-1">
            <div className="font-bold">{t("devices.discovery.connectionMismatch.title")}</div>
            <div>
              {t("devices.discovery.connectionMismatch.registered")}:{" "}
              <span className="font-semibold">
                {t(`devices.enum.connectionType.${lowerFirst(resolvedDevice!.connectionType!)}`)}
              </span>
            </div>
            <div>
              {t("devices.discovery.connectionMismatch.detected")}:{" "}
              <span className="font-semibold">
                {t(`devices.enum.connectionType.${lowerFirst(detectedConnectionType!)}`)}
              </span>
            </div>
          </div>
        </div>
      )}

      {!isBound && canManage && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLinkExisting}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-100 hover:border-blue-400/40 hover:bg-blue-500/10"
          >
            <Link2 size={13} />
            {t("devices.discovery.linkExisting")}
          </button>
          <button
            type="button"
            onClick={onRegisterNew}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:brightness-110"
          >
            <PlusCircle size={13} />
            {t("devices.discovery.registerNew")}
          </button>
        </div>
      )}
    </div>
  );
}
