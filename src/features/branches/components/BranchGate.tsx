import type { ReactNode } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/ui";
import { useCompany } from "../../companies/context/CompanyContext";
import { useHasPermission } from "../../companies/hooks/useCompanies";
import { useBranch } from "../context/BranchContext";
import { isBranchEnterable, useBranches } from "../hooks/useBranches";
import { BranchOnboarding } from "./BranchOnboarding";
import { BranchSelector } from "./BranchSelector";

const BRANCHES_VIEW_PERMISSION = "Branches.View";

type BranchGateProps = {
  children: ReactNode;
};

function BranchGateShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-space grid min-h-screen place-items-center p-4 text-white">
      <div className="bg-stars absolute inset-0 pointer-events-none" />
      <div className="relative z-10 w-full max-w-3xl">{children}</div>
    </div>
  );
}

export function BranchGate({ children }: BranchGateProps) {
  const { currentCompanyId, isCompanyContextReady } = useCompany();
  const { currentBranchId, isBranchContextReady } = useBranch();
  const permissionQuery = useHasPermission(currentCompanyId, BRANCHES_VIEW_PERMISSION);
  const canLoadBranches =
    isCompanyContextReady &&
    Boolean(currentCompanyId) &&
    !permissionQuery.isLoading &&
    !permissionQuery.isError &&
    permissionQuery.hasPermission;
  const {
    data: branches,
    isLoading: branchesLoading,
    isError: branchesError,
  } = useBranches(currentCompanyId, canLoadBranches);

  if (permissionQuery.isLoading || !isBranchContextReady) {
    return (
      <BranchGateShell>
        <LoadingState label="Preparing branch context..." />
      </BranchGateShell>
    );
  }

  if (permissionQuery.isError) {
    return (
      <BranchGateShell>
        <ErrorState
          title="Permissions unavailable"
          message="Unable to confirm branch access."
        />
      </BranchGateShell>
    );
  }

  if (!permissionQuery.hasPermission) {
    return (
      <BranchGateShell>
        <EmptyState
          title="Branch access unavailable"
          message="Your current role cannot view branches for this company."
        />
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
