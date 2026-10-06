import { MapPin } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { useCompany } from "../../companies/context/CompanyContext";
import { useBranch } from "../context/BranchContext";
import { isBranchEnterable, useBranches } from "../hooks/useBranches";

export function BranchSelector() {
  const { currentCompanyId } = useCompany();
  const { selectBranch } = useBranch();
  const { data: branches, isLoading, isError } = useBranches(currentCompanyId);

  if (isLoading) return <LoadingState label="Loading branches..." />;
  if (isError) {
    return (
      <ErrorState
        title="Unable to load branches"
        message="Please refresh or sign in again."
      />
    );
  }

  if (!branches?.length) {
    return (
      <EmptyState
        title="No branches found"
        message="This company does not have configured branches yet."
      />
    );
  }

  const hasActiveBranch = branches.some(isBranchEnterable);

  return (
    <div className="panel w-full max-w-3xl rounded-xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
          <MapPin size={20} />
        </div>
        <div>
          <h1 className="brand-text text-xl font-black">Select Branch</h1>
          <p className="text-sm text-muted">
            {hasActiveBranch
              ? "Choose an active branch for this company."
              : "No active branch is currently available."}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {branches.map((branch) => {
          const enterable = isBranchEnterable(branch);
          const location = [branch.address.city, branch.address.district]
            .filter(Boolean)
            .join(" / ");

          return (
            <button
              key={branch.branchId}
              type="button"
              disabled={!enterable}
              onClick={() => selectBranch(branch.branchId)}
              className="rounded-xl border border-line bg-raised p-4 text-start transition hover:border-accent-line hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-55"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-ink">{branch.name}</div>
                  <div className="mt-1 text-sm text-muted">
                    {branch.code}
                    {location ? ` · ${location}` : ""}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-bold ${
                    branch.status === "Active"
                      ? "bg-success-soft text-success"
                      : "bg-warning-soft text-warning"
                  }`}
                >
                  {branch.status}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
