import { Check, Link2, PlusCircle, X } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext";
import type { DiscoveredDeviceCandidateResponse } from "../types/devices.types";
import { CertificationBadge } from "./DeviceStatusBadge";
import { MatchProposalPanel } from "./MatchProposalPanel";

type DiscoveredCandidateCardProps = {
  candidate: DiscoveredDeviceCandidateResponse;
  canManage: boolean;
  onLinkExisting: () => void;
  onRegisterNew: () => void;
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

// Discovered -> Suggested Match -> Admin Confirmation -> Registered/Bound.
// This card is the "Discovered" step for one raw candidate reported by an
// Edge Agent's discovery session, plus the two explicit confirmation
// actions that move it to "Admin Confirmation".
export function DiscoveredCandidateCard({
  candidate,
  canManage,
  onLinkExisting,
  onRegisterNew,
}: DiscoveredCandidateCardProps) {
  const { t } = useI18n();
  const alreadyMatched = Boolean(candidate.matchedDeviceId);

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
        <CertificationBadge certification={candidate.certificationStatus} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400 sm:grid-cols-4">
        <div>
          <div className="text-slate-500">{t("devices.discovery.transportType")}</div>
          <div className="mt-0.5 font-semibold text-slate-200">
            {t(`devices.enum.transportType.${candidate.transportType.charAt(0).toLowerCase()}${candidate.transportType.slice(1)}`)}
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

      <div className="mt-3">
        <MatchProposalPanel proposal={candidate.proposal} />
      </div>

      {candidate.notes && <p className="mt-2 text-[11px] text-slate-500">{candidate.notes}</p>}

      {alreadyMatched ? (
        <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
          {t("devices.discovery.alreadyBound")}
        </div>
      ) : (
        canManage && (
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
        )
      )}
    </div>
  );
}
