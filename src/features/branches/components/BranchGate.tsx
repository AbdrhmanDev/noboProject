import type { ReactNode } from "react";
import { ErrorState, LoadingState } from "../../../shared/components/ui";
import { useCompany } from "../../companies/context/CompanyContext";
import { useBranch } from "../context/BranchContext";
import { isBranchEnterable, useMyBranches } from "../hooks/useBranches";
import { BranchOnboarding } from "./BranchOnboarding";
import { BranchSelector } from "./BranchSelector";

type BranchGateProps = {
  children: ReactNode;
};

function BranchGateShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-space grid min-h-screen place-items-center p-4 text-ink">
      <div className="bg-stars absolute inset-0 pointer-events-none" />
      <div className="relative z-10 w-full max-w-3xl">{children}</div>
    </div>
  );
}

export function BranchGate({ children }: BranchGateProps) {
  const { currentCompanyId, isCompanyContextReady } = useCompany();
  const { currentBranchId, isBranchContextReady, debug } = useBranch();
  const canLoadBranches = isCompanyContextReady && Boolean(currentCompanyId);
  // Self-scoped (no Branches.View required) -- see BranchContext.tsx for why: a cashier-only role
  // must be able to pass this gate without being granted Branches.View.
  const {
    data: branches,
    isLoading: branchesLoading,
    isError: branchesError,
  } = useMyBranches(currentCompanyId, canLoadBranches);

  if (!isBranchContextReady) {
    return (
      <BranchGateShell>
        <LoadingState label="Preparing branch context..." />
        <pre style={{ color: "white", fontSize: 11, marginTop: 12, direction: "ltr", textAlign: "left" }}>
          {JSON.stringify(
            {
              fromContext: debug,
              fromGate: {
                isCompanyContextReady,
                currentCompanyId,
                canLoadBranches,
                branchesLoading,
                branchesError,
                branchesCount: branches?.length ?? null,
              },
              isBranchContextReady,
            },
            null,
            2,
          )}
        </pre>
      </BranchGateShell>
    );
  }

  if (branchesLoading) {
    return (
      <BranchGateShell>
        <LoadingState label="Loading branches..." />
      </BranchGateShell>
    );
  }

  if (branchesError) {
    return (
      <BranchGateShell>
        <ErrorState
          title="Branch context unavailable"
          message="Unable to load company branches."
        />
      </BranchGateShell>
    );
  }

  if (!branches?.length) {
    return (
      <BranchGateShell>
        <BranchOnboarding />
      </BranchGateShell>
    );
  }

  if (!branches.some(isBranchEnterable)) {
    return (
      <BranchGateShell>
        <BranchSelector />
      </BranchGateShell>
    );
  }

  if (!currentBranchId) {
    return (
      <BranchGateShell>
        <BranchSelector />
      </BranchGateShell>
    );
  }

  return children;
}
