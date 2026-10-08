import { useCompany } from "../../companies/context/CompanyContext";
import { useBranch } from "../context/BranchContext";
import { useMyBranches } from "./useBranches";

export function useCurrentBranch() {
  const { currentBranchId } = useBranch();
  const { currentCompanyId } = useCompany();
  // Self-scoped (no Branches.View required) -- this hook runs inside AppLayout on every
  // authenticated page, including POS, so a cashier-only role must be able to resolve their
  // branch name here too.
  const { data: branches = [] } = useMyBranches(
    currentCompanyId,
    Boolean(currentCompanyId),
  );

  return branches.find((branch) => branch.branchId === currentBranchId) || null;
}
