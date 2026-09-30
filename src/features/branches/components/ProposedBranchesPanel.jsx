import { useState } from "react";
import { CircleCheck, Sparkles } from "lucide-react";
import { LoadingState } from "../../../shared/components/ui";
import { useApplyProposedBranch, useApprovedCompanyProfile } from "../hooks/useCompanyProfile";

function getErrorMessage(error) {
  return error?.message || "Request failed.";
}

// P8.5.4: the backend's OWN branch-creation-from-registration flow. A proposed branch is part of the
// company's APPROVED registration profile; "materializing" it (POST .../proposed-branches/{ordinal}/apply)
// is the ONLY way this app turns one into a real Branch through this path -- a deliberate, explicit act,
// never automatic, and this panel is the one place it happens. It is NOT a second branch-creation
// mechanism: it calls the same real branch creation the backend performs internally, just from a
// proposal instead of free-form fields.
export function ProposedBranchesPanel({ companyId, canView, canManage }) {
  const profileQuery = useApprovedCompanyProfile(companyId, canView);
  const [applyingOrdinal, setApplyingOrdinal] = useState(null);
  const [error, setError] = useState("");
  const applyMutation = useApplyProposedBranch(companyId, profileQuery.data?.version.versionNumber);

  if (!canView) return null;
  if (profileQuery.isLoading) return <LoadingState label="Checking approved registration profile..." />;
  if (profileQuery.isError) {
    // Supplementary information, not a core capability of this page -- a company with no approved
    // profile (never registered through that flow, or seeded directly) is not an error state for
    // Branches itself, so this stays quiet rather than showing a scary red box.
    return null;
  }

  const proposed = profileQuery.data?.proposedBranches || [];
  if (proposed.length === 0) return null;

  const apply = async (ordinal) => {
    setError("");
    setApplyingOrdinal(ordinal);
    try {
      await applyMutation.mutateAsync({ ordinal });
    } catch (applyError) {
      setError(getErrorMessage(applyError));
    } finally {
      setApplyingOrdinal(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1424] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-300">
        <Sparkles size={14} className="text-blue-300" />
        Proposed branches (approved profile v{profileQuery.data.version.versionNumber})
      </div>
      <p className="mb-2 text-[11px] text-slate-500">
        These came from the company's approved registration profile. Applying one creates the real
        branch; nothing here is created automatically.
      </p>
      {error && <div className="mb-2 rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">{error}</div>}
      <div className="space-y-1.5">
        {proposed.map((proposal) => (
          <div
            key={proposal.ordinal}
            className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2 text-xs"
          >
            <div className="min-w-0">
              <div className="truncate font-bold text-white">{proposal.name}</div>
              <div className="truncate text-[10px] text-slate-500">
                {proposal.city}
                {proposal.code ? ` · ${proposal.code}` : ""}
              </div>
            </div>
            {proposal.materializedBranchId ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <CircleCheck size={11} /> Applied ({proposal.materializedBranchStatus})
              </span>
            ) : canManage ? (
              <button
                type="button"
                disabled={applyingOrdinal === proposal.ordinal}
                onClick={() => apply(proposal.ordinal)}
                className="shrink-0 rounded-lg bg-blue-600 px-2 py-1 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {applyingOrdinal === proposal.ordinal ? "Applying..." : "Apply"}
              </button>
            ) : (
              <span className="shrink-0 text-[10px] text-slate-500">Not applied</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
