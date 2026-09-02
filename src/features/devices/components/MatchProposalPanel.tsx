import { useI18n } from "../../../i18n/I18nContext";
import type { DiscoveredDeviceMatchProposalResponse } from "../types/devices.types";
import { MatchConfidenceBadge } from "./MatchConfidenceBadge";

type MatchProposalPanelProps = {
  proposal: DiscoveredDeviceMatchProposalResponse | null;
};

// Discovered -> Suggested Match -> Admin Confirmation -> Registered/Bound:
// this panel renders the "Suggested Match" step for one candidate.
export function MatchProposalPanel({ proposal }: MatchProposalPanelProps) {
  const { t } = useI18n();

  if (!proposal || proposal.confidence === "None") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-400">
        {t("devices.discovery.noMatch")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-200">{t("devices.discovery.suggestedMatch")}</div>
        <MatchConfidenceBadge confidence={proposal.confidence} />
      </div>
      {proposal.proposedDeviceName && (
        <div className="mt-2 text-xs text-slate-300">
          <span className="font-bold text-white">{proposal.proposedDeviceCode}</span>
          {" — "}
          {proposal.proposedDeviceName}
        </div>
      )}
      {proposal.reasons.length > 0 && (
        <ul className="mt-2 space-y-1">
          {proposal.reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-1.5 text-[11px] text-slate-400">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-500" />
              {reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
