import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import type { DeviceHardwareBindingResponse, DeviceResponse, EdgeAgentResponse } from "../types/devices.types";

type ReadinessTone = "ok" | "warn" | "unknown";

type ReadinessRow = {
  key: string;
  labelKey: string;
  tone: ReadinessTone;
  detailKey?: string;
  detailVars?: Record<string, string | number>;
};

const TONE_ICON: Record<ReadinessTone, typeof CircleCheck> = {
  ok: CircleCheck,
  warn: CircleAlert,
  unknown: CircleDashed,
};

const TONE_CLASS: Record<ReadinessTone, string> = {
  ok: "text-emerald-400",
  warn: "text-amber-400",
  unknown: "text-slate-500",
};

type DeviceReadinessChecklistProps = {
  device: DeviceResponse;
  hardwareBinding: DeviceHardwareBindingResponse | null | undefined;
  edgeAgent: EdgeAgentResponse | null | undefined;
};

// Each readiness dimension is rendered as its own row — never collapsed
// into a single boolean — so an admin can see exactly which precondition is
// blocking Test Print (see TestPrintPanel for the same ordered checks).
export function DeviceReadinessChecklist({
  device,
  hardwareBinding,
  edgeAgent,
}: DeviceReadinessChecklistProps) {
  const { t } = useI18n();

  const certificationTone: ReadinessTone =
    device.certificationStatus === "Certified" || device.certificationStatus === "Compatible"
      ? "ok"
      : device.certificationStatus === "AdapterRequired"
        ? "warn"
        : device.certificationStatus === "Unsupported"
          ? "warn"
          : "unknown";

  const rows: ReadinessRow[] = [
    { key: "registered", labelKey: "devices.readiness.registered", tone: "ok" },
    {
      key: "matched",
      labelKey: "devices.readiness.matched",
      tone: hardwareBinding ? "ok" : "warn",
    },
    {
      key: "transport",
      labelKey: "devices.readiness.transport",
      tone: hardwareBinding ? "ok" : "unknown",
      detailKey: hardwareBinding
        ? `devices.enum.transportType.${hardwareBinding.transportType.charAt(0).toLowerCase()}${hardwareBinding.transportType.slice(1)}`
        : undefined,
    },
    {
      key: "reachability",
      labelKey: "devices.readiness.reachability",
      tone:
        device.healthStatus === "Online"
          ? "ok"
          : device.healthStatus === "Degraded" || device.healthStatus === "Error"
            ? "warn"
            : "unknown",
    },
    {
      key: "adapter",
      labelKey: "devices.readiness.adapter",
      tone:
        device.certificationStatus === "AdapterRequired"
          ? "warn"
          : device.certificationStatus === "Certified" || device.certificationStatus === "Compatible"
            ? "ok"
            : "unknown",
    },
    { key: "certification", labelKey: "devices.readiness.certification", tone: certificationTone },
    {
      key: "agentStatus",
      labelKey: "devices.readiness.agentStatus",
      tone: !device.edgeAgentId ? "warn" : edgeAgent?.status === "Active" ? "ok" : "warn",
    },
    { key: "hardwareTested", labelKey: "devices.readiness.hardwareTested", tone: "unknown" },
  ];

  return (
    <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-[#0d1728]">
      {rows.map((row) => {
        const Icon = TONE_ICON[row.tone];
        return (
          <div key={row.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <Icon size={16} className={`shrink-0 ${TONE_CLASS[row.tone]}`} />
              <span className="text-xs font-semibold text-slate-200">{t(row.labelKey)}</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {row.key === "hardwareTested"
                ? t("devices.readiness.notYet")
                : row.detailKey
                  ? t(row.detailKey)
                  : row.key === "reachability"
                    ? t("devices.readiness.lastKnown")
                    : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
